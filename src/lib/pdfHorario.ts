/**
 * Genera el PDF del horario de una sección.
 *
 * Antes se hacía una captura de pantalla con html2canvas y se pegaba como
 * imagen: salía borrosa, arrastraba los colores y los bordes de la interfaz,
 * incluía toda la rejilla aunque estuviera vacía y el archivo se llamaba
 * siempre igual. Aquí se dibuja el documento con las primitivas de jsPDF, así
 * que el texto es texto de verdad (nítido a cualquier zoom y se puede buscar),
 * y solo salen los bloques que la sección tiene asignados.
 */

import jsPDF from "jspdf";
import { BloqueHorario } from "@/src/interfaces/academic";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

/** Paleta suave, pensada para que se lea bien impresa en blanco y negro. */
const PALETA: Array<{ fondo: [number, number, number]; texto: [number, number, number] }> = [
  { fondo: [232, 240, 251], texto: [30, 64, 124] },
  { fondo: [230, 246, 238], texto: [22, 101, 72] },
  { fondo: [253, 243, 224], texto: [133, 77, 14] },
  { fondo: [240, 235, 252], texto: [88, 46, 145] },
  { fondo: [252, 232, 238], texto: [143, 33, 68] },
  { fondo: [227, 244, 248], texto: [21, 94, 117] },
];

const AZUL: [number, number, number] = [9, 62, 122];
const GRIS_LINEA: [number, number, number] = [203, 213, 225];
const GRIS_TEXTO: [number, number, number] = [100, 116, 139];

function colorDe(nombre: string) {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return PALETA[h % PALETA.length];
}

/** "5to Amarillo" -> "5to_Amarillo", apto para nombre de archivo. */
function paraArchivo(texto: string) {
  return texto
    .normalize("NFD")
    // Quita las tildes por separado (̀-ͯ son los signos diacríticos
    // que NFD deja sueltos), y luego cualquier cosa que no sea letra o número.
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export interface AsignacionPDF {
  dia_semana: string;
  hora_inicio: string;
  curso_nombre: string;
  docente_nombre: string;
}

export interface DatosPDFHorario {
  bloques: BloqueHorario[];
  asignaciones: AsignacionPDF[];
  grado: string;
  seccion: string;
  anio: string;
}

/**
 * Deja solo las filas que aportan algo: los bloques con al menos una clase, y
 * los recesos que caen entre medias (sin ellos el horario se lee mal, porque
 * parecería que las clases van seguidas).
 */
function filasUtiles(bloques: BloqueHorario[], asignaciones: AsignacionPDF[]) {
  const conClase = new Set(
    asignaciones.map((a) => a.hora_inicio.substring(0, 5))
  );

  const indices = bloques
    .map((b, i) => (b.tipo === "clase" && conClase.has(b.hora_inicio) ? i : -1))
    .filter((i) => i >= 0);

  if (indices.length === 0) return [];

  const primero = indices[0];
  const ultimo = indices[indices.length - 1];

  return bloques.filter((b, i) => {
    if (i < primero || i > ultimo) return false;
    if (b.tipo === "receso") return true;
    return conClase.has(b.hora_inicio);
  });
}

export function generarPDFHorario(datos: DatosPDFHorario): {
  nombreArchivo: string;
  filas: number;
} {
  const { bloques, asignaciones, grado, seccion, anio } = datos;
  const filas = filasUtiles(bloques, asignaciones);

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const anchoPag = pdf.internal.pageSize.getWidth();
  const altoPag = pdf.internal.pageSize.getHeight();
  const margen = 12;

  const seccionTexto = `${grado} - ${seccion}`.trim();
  const nombreArchivo = `Horario_${paraArchivo(seccionTexto)}_${paraArchivo(anio)}.pdf`;

  // ------------------------------------------------------------------
  // Encabezado
  // ------------------------------------------------------------------
  const dibujarEncabezado = () => {
    pdf.setFillColor(...AZUL);
    pdf.rect(0, 0, anchoPag, 22, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text("I.E.P. AMANCIO VARONA", margen, 9.5);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Horario escolar ${anio}`, margen, 15.5);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(seccionTexto.toUpperCase(), anchoPag - margen, 12, { align: "right" });

    pdf.setTextColor(...GRIS_TEXTO);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    const hoy = new Date().toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    pdf.text(`Generado el ${hoy}`, anchoPag - margen, altoPag - 6, { align: "right" });
  };

  dibujarEncabezado();

  if (filas.length === 0) {
    pdf.setTextColor(...GRIS_TEXTO);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(
      "Esta sección todavía no tiene ningún bloque asignado en el horario.",
      anchoPag / 2,
      altoPag / 2,
      { align: "center" }
    );
    pdf.save(nombreArchivo);
    return { nombreArchivo, filas: 0 };
  }

  // ------------------------------------------------------------------
  // Medidas de la tabla
  // ------------------------------------------------------------------
  const anchoHora = 24;
  const anchoDia = (anchoPag - margen * 2 - anchoHora) / DIAS.length;
  const altoCabecera = 9;
  const arriba = 30;

  const disponible = altoPag - arriba - altoCabecera - 14;
  // Las filas se reparten el alto de la página. Los recesos ocupan menos, así
  // que se cuentan como media fila al repartir; si no, un horario corto dejaba
  // media hoja en blanco. El mínimo mantiene el texto legible y el máximo evita
  // celdas desproporcionadas cuando hay muy pocas filas.
  const pesoFilas = filas.reduce((t, b) => t + (b.tipo === "receso" ? 0.45 : 1), 0);
  const altoFila = Math.max(12, Math.min(30, disponible / pesoFilas));

  // Cabecera de la tabla
  let y = arriba;
  pdf.setFillColor(241, 245, 249);
  pdf.rect(margen, y, anchoHora + anchoDia * DIAS.length, altoCabecera, "F");

  pdf.setDrawColor(...GRIS_LINEA);
  pdf.setLineWidth(0.2);

  pdf.setTextColor(...AZUL);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.text("HORA", margen + anchoHora / 2, y + altoCabecera / 2 + 1, { align: "center" });
  DIAS.forEach((d, i) => {
    const x = margen + anchoHora + anchoDia * i;
    pdf.text(d.toUpperCase(), x + anchoDia / 2, y + altoCabecera / 2 + 1, { align: "center" });
    pdf.line(x, y, x, y + altoCabecera);
  });
  pdf.rect(margen, y, anchoHora + anchoDia * DIAS.length, altoCabecera);

  y += altoCabecera;

  // ------------------------------------------------------------------
  // Filas
  // ------------------------------------------------------------------
  const buscar = (hora: string, dia: string) =>
    asignaciones.find(
      (a) =>
        a.hora_inicio.substring(0, 5) === hora &&
        a.dia_semana.toLowerCase() === dia.toLowerCase()
    );

  filas.forEach((bloque) => {
    const esReceso = bloque.tipo === "receso";
    const altoEste = esReceso ? Math.min(altoFila, 8) : altoFila;

    // Columna de la hora
    pdf.setFillColor(esReceso ? 254 : 248, esReceso ? 249 : 250, esReceso ? 235 : 252);
    pdf.rect(margen, y, anchoHora, altoEste, "F");
    pdf.setTextColor(...(esReceso ? ([133, 77, 14] as [number, number, number]) : GRIS_TEXTO));
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.text(bloque.hora_inicio, margen + anchoHora / 2, y + altoEste / 2 - 0.4, {
      align: "center",
    });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.text(bloque.hora_fin, margen + anchoHora / 2, y + altoEste / 2 + 2.8, {
      align: "center",
    });

    if (esReceso) {
      // El receso ocupa toda la franja, sin dividir por días
      pdf.setFillColor(254, 249, 235);
      pdf.rect(margen + anchoHora, y, anchoDia * DIAS.length, altoEste, "F");
      pdf.setTextColor(133, 77, 14);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7);
      pdf.text(
        (bloque.nombre || "Receso").toUpperCase(),
        margen + anchoHora + (anchoDia * DIAS.length) / 2,
        y + altoEste / 2 + 1,
        { align: "center" }
      );
      pdf.setDrawColor(...GRIS_LINEA);
      pdf.rect(margen, y, anchoHora + anchoDia * DIAS.length, altoEste);
      y += altoEste;
      return;
    }

    DIAS.forEach((dia, i) => {
      const x = margen + anchoHora + anchoDia * i;
      const clase = buscar(bloque.hora_inicio, dia);

      if (clase) {
        const c = colorDe(clase.curso_nombre);
        pdf.setFillColor(...c.fondo);
        pdf.rect(x + 0.6, y + 0.6, anchoDia - 1.2, altoEste - 1.2, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        const curso = (pdf.splitTextToSize(clase.curso_nombre, anchoDia - 4) as string[]).slice(0, 2);

        const conDocente = altoEste >= 14;
        // El curso y el docente se centran como un solo bloque; si cada uno se
        // ancla a su borde, en las celdas altas quedan separadísimos.
        const altoTexto = curso.length * 3.2 + (conDocente ? 3.6 : 0);
        let cursor = y + (altoEste - altoTexto) / 2 + 2.6;

        pdf.setTextColor(...c.texto);
        curso.forEach((linea) => {
          pdf.text(linea, x + anchoDia / 2, cursor, { align: "center" });
          cursor += 3.2;
        });

        if (conDocente) {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(6);
          const docente = pdf.splitTextToSize(clase.docente_nombre, anchoDia - 4) as string[];
          pdf.text(docente[0] ?? "", x + anchoDia / 2, cursor + 0.8, { align: "center" });
        }
      }

      pdf.setDrawColor(...GRIS_LINEA);
      pdf.rect(x, y, anchoDia, altoEste);
    });

    pdf.setDrawColor(...GRIS_LINEA);
    pdf.rect(margen, y, anchoHora, altoEste);
    y += altoEste;
  });

  // Pie con el conteo, útil para comprobar de un vistazo
  const totalClases = asignaciones.length;
  pdf.setTextColor(...GRIS_TEXTO);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.text(
    `${totalClases} ${totalClases === 1 ? "clase asignada" : "clases asignadas"}`,
    margen,
    altoPag - 6
  );

  pdf.save(nombreArchivo);
  return { nombreArchivo, filas: filas.length };
}
