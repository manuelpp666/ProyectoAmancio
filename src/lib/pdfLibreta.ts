/**
 * Genera el PDF de la libreta de notas de un alumno, calcada de la libreta
 * oficial del colegio (cabecera de datos, tabla de áreas/cursos con las
 * cuatro columnas de bimestre, y el pie con puntaje acumulado, ponderado y
 * conducta).
 *
 * Igual que `pdfHorario.ts` (léelo si algo aquí no se entiende: comparte el
 * mismo enfoque), se dibuja con las primitivas de jsPDF y NO con
 * html2canvas: así el texto sale nítido y el archivo pesa poco.
 */

import jsPDF from "jspdf";

// ---------------------------------------------------------------------
// Tipos: calcados de la respuesta de GET /academic/libreta/{id_matricula}
// ---------------------------------------------------------------------

export interface CursoLibreta {
  id_curso: number;
  nombre: string;
  exonerado: boolean;
  notas: Record<string, number | null>;
}

export interface AreaLibreta {
  id_area: number | null;
  nombre: string;
  cursos: CursoLibreta[];
  promedio_por_bimestre: Record<string, number | null>;
  promedio_anual: number | null;
  exonerada: boolean;
}

export interface ResumenBimestreLibreta {
  puntaje_acumulado: number | null;
  num_areas: number;
  ponderado: number | null;
}

export interface ResumenLibreta {
  por_bimestre: Record<string, ResumenBimestreLibreta>;
  conducta_por_bimestre: Record<string, number | null>;
  ponderado_final_anual: number | null;
}

export interface AlumnoLibreta {
  id_matricula: number;
  dni: string;
  nombres: string;
  apellidos: string;
  nivel: string | null;
  grado: string | null;
  seccion: string | null;
  anio_escolar: string;
}

export interface DatosLibreta {
  alumno: AlumnoLibreta;
  bimestre_cabecera: number | null;
  areas: AreaLibreta[];
  resumen: ResumenLibreta;
}

// ---------------------------------------------------------------------
// Constantes de estilo
// ---------------------------------------------------------------------

const GRANATE: [number, number, number] = [112, 28, 50];
const GRIS_CLARO: [number, number, number] = [232, 226, 228];
const GRIS_LINEA: [number, number, number] = [190, 190, 190];
const AZUL_LETRA: [number, number, number] = [21, 60, 140];
const ROJO_NOTA: [number, number, number] = [178, 30, 30];
const NEGRO: [number, number, number] = [30, 30, 30];
const GRIS_TEXTO: [number, number, number] = [100, 100, 100];

const BIMESTRES = [1, 2, 3, 4];
const ROMANOS: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };

/** Alto mínimo y máximo de una fila del cuerpo de la tabla, en mm. Entre
 *  ambos se reparte el espacio disponible para que quepan todas las filas
 *  sin partir la tabla; si ni el mínimo alcanza, se pasa de página. */
const ALTO_FILA_MIN = 3.6;
const ALTO_FILA_MAX = 6.4;

/** "CAMBILLO CARHUA GINO ANCEL" -> "CAMBILLO_CARHUA_GINO_ANCEL", igual que
 *  hace pdfHorario.ts con el nombre de la sección. */
function paraArchivo(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Escala oficial: 18-20 AD, 14-17 A, 11-13 B, 0-10 C. */
function letra(n: number): string {
  if (n >= 18) return "AD";
  if (n >= 14) return "A";
  if (n >= 11) return "B";
  return "C";
}

/** Intenta traer el escudo del colegio desde /public para pegarlo en la
 *  cabecera. Si no existe, tarda demasiado, o el navegador lo rechaza, se
 *  sigue sin él: la libreta no puede depender de un archivo de imagen. */
async function cargarEscudo(): Promise<string | null> {
  try {
    const controlador = new AbortController();
    const tope = setTimeout(() => controlador.abort(), 3000);
    const res = await fetch("/logo.png", { signal: controlador.signal });
    clearTimeout(tope);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const lector = new FileReader();
      lector.onload = () => resolve(typeof lector.result === "string" ? lector.result : null);
      lector.onerror = () => resolve(null);
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generarPDFLibreta(
  datos: DatosLibreta
): Promise<{ nombreArchivo: string }> {
  const { alumno, areas, resumen } = datos;

  const nombreCompleto = `${alumno.apellidos || ""} ${alumno.nombres || ""}`.trim();
  const gradoSeccion = `${alumno.grado || ""} ${alumno.seccion || ""}`.trim();
  const bimestreTexto = datos.bimestre_cabecera
    ? `${ROMANOS[datos.bimestre_cabecera] || datos.bimestre_cabecera}_Bimestre`
    : "Anual";
  const nombreArchivo =
    `Libreta_${paraArchivo(nombreCompleto)}_${paraArchivo(gradoSeccion)}_${bimestreTexto}.pdf`;

  const escudo = await cargarEscudo();

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const anchoPag = pdf.internal.pageSize.getWidth();
  const altoPag = pdf.internal.pageSize.getHeight();
  const margen = 10;
  const anchoUtil = anchoPag - margen * 2;

  // -------------------------------------------------------------
  // 1. Cabecera de datos del alumno (rectángulo centrado, mitad del ancho)
  // -------------------------------------------------------------
  const anchoCab = anchoUtil * 0.9;
  const xCab = margen + (anchoUtil - anchoCab) / 2;
  const anchoEscudo = 20;
  const altoCab = 24;
  let y = margen;

  pdf.setDrawColor(...NEGRO);
  pdf.setLineWidth(0.25);
  pdf.rect(xCab, y, anchoCab, altoCab);

  // Celda del escudo, a la izquierda, ocupando las tres filas.
  pdf.rect(xCab, y, anchoEscudo, altoCab);
  if (escudo) {
    try {
      pdf.addImage(escudo, "PNG", xCab + 2, y + 2, anchoEscudo - 4, altoCab - 4, undefined, "FAST");
    } catch {
      // Una imagen corrupta no puede tumbar la descarga de la libreta.
    }
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.5);
    pdf.setTextColor(...GRIS_TEXTO);
    const lineas = pdf.splitTextToSize("AMANCIO VARONA", anchoEscudo - 3) as string[];
    let ly = y + altoCab / 2 - (lineas.length - 1) * 1.6;
    lineas.forEach((l) => {
      pdf.text(l, xCab + anchoEscudo / 2, ly, { align: "center" });
      ly += 3.2;
    });
  }

  const xDatos = xCab + anchoEscudo;
  const anchoDatos = anchoCab - anchoEscudo;
  const altoFilaCab = altoCab / 3;

  // Fila 1: UGEL / IE
  pdf.line(xDatos, y + altoFilaCab, xCab + anchoCab, y + altoFilaCab);
  pdf.line(xDatos, y + altoFilaCab * 2, xCab + anchoCab, y + altoFilaCab * 2);
  {
    const cols = [0.13, 0.42, 0.1, 0.35].map((p) => p * anchoDatos);
    let cx = xDatos;
    pdf.setDrawColor(...GRIS_LINEA);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...NEGRO);
    pdf.text("UGEL:", cx + 1.5, y + altoFilaCab / 2 + 1);
    cx += cols[0];
    pdf.setFont("helvetica", "bold");
    pdf.text("UGEL LAMBAYEQUE", cx + cols[1] / 2, y + altoFilaCab / 2 + 1, { align: "center" });
    cx += cols[1];
    pdf.line(cx, y, cx, y + altoFilaCab);
    pdf.setFont("helvetica", "normal");
    pdf.text("IE:", cx + 1.5, y + altoFilaCab / 2 + 1);
    cx += cols[2];
    pdf.line(cx, y, cx, y + altoFilaCab);
    pdf.setFont("helvetica", "bold");
    pdf.text("AMANCIO VARONA", cx + cols[3] / 2, y + altoFilaCab / 2 + 1, { align: "center" });
  }

  // Fila 2: NIVEL / GRADO / SECCIÓN
  {
    const y2 = y + altoFilaCab;
    const cols = [0.16, 0.22, 0.14, 0.1, 0.14, 0.24].map((p) => p * anchoDatos);
    let cx = xDatos;
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text("NIVEL :", cx + 1.5, y2 + altoFilaCab / 2 + 1);
    cx += cols[0];
    pdf.setFont("helvetica", "bold");
    pdf.text((alumno.nivel || "").toUpperCase(), cx + cols[1] / 2, y2 + altoFilaCab / 2 + 1, { align: "center" });
    cx += cols[1];
    pdf.line(cx, y2, cx, y2 + altoFilaCab);
    pdf.setFont("helvetica", "normal");
    pdf.text("GRADO", cx + cols[2] / 2, y2 + altoFilaCab / 2 + 1, { align: "center" });
    cx += cols[2];
    pdf.line(cx, y2, cx, y2 + altoFilaCab);
    pdf.setFont("helvetica", "bold");
    pdf.text((alumno.grado || "").toUpperCase(), cx + cols[3] / 2, y2 + altoFilaCab / 2 + 1, { align: "center" });
    cx += cols[3];
    pdf.line(cx, y2, cx, y2 + altoFilaCab);
    pdf.setFont("helvetica", "normal");
    pdf.text("SECCIÓN", cx + cols[4] / 2, y2 + altoFilaCab / 2 + 1, { align: "center" });
    cx += cols[4];
    pdf.line(cx, y2, cx, y2 + altoFilaCab);
    pdf.setFont("helvetica", "bold");
    pdf.text(gradoSeccion.toUpperCase(), cx + cols[5] / 2, y2 + altoFilaCab / 2 + 1, { align: "center" });
  }

  // Fila 3: ALUMNO (nombre centrado)
  {
    const y3 = y + altoFilaCab * 2;
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.text("ALUMNO", xDatos + 1.5, y3 + altoFilaCab / 2 + 1);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text(nombreCompleto.toUpperCase(), xDatos + anchoDatos / 2 + 5, y3 + altoFilaCab / 2 + 1, {
      align: "center",
    });
  }

  y += altoCab + 6;

  // -------------------------------------------------------------
  // 2. Tabla principal: áreas / cursos / notas por bimestre
  // -------------------------------------------------------------
  const colArea = 24;
  const colProm = 22;
  const colNota = 10;
  const colCurso = anchoUtil - colArea - colProm - colNota * 4;

  const xArea = margen;
  const xCurso = xArea + colArea;
  const xNota = (b: number) => xCurso + colCurso + colNota * (b - 1);
  const xProm = xCurso + colCurso + colNota * 4;

  const altoCabTabla1 = 6;
  const altoCabTabla2 = 5;

  const dibujarCabeceraTabla = (yc: number): number => {
    pdf.setDrawColor(...GRIS_LINEA);
    pdf.setLineWidth(0.2);

    // Fila superior: ÁREA / ASIGNATURAS ACADÉMICAS / NOTAS / PROM. AREA
    pdf.setFillColor(245, 240, 241);
    pdf.rect(xArea, yc, colArea + colCurso, altoCabTabla1, "F");
    pdf.rect(xNota(1), yc, colNota * 4, altoCabTabla1, "F");
    pdf.setFillColor(...GRIS_CLARO);
    pdf.rect(xProm, yc, colProm, altoCabTabla1 + altoCabTabla2, "F");

    pdf.setTextColor(...GRANATE);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.text("ÁREA", xArea + colArea / 2, yc + altoCabTabla1 / 2 + 1.2, { align: "center" });
    pdf.text("ASIGNATURAS ACADÉMICAS", xCurso + colCurso / 2, yc + altoCabTabla1 / 2 + 1.2, {
      align: "center",
    });
    pdf.text("NOTAS", xNota(1) + colNota * 2, yc + altoCabTabla1 / 2 + 1.2, { align: "center" });
    pdf.setFontSize(7);
    pdf.text("PROM.", xProm + colProm / 2, yc + (altoCabTabla1 + altoCabTabla2) / 2 - 0.3, {
      align: "center",
    });
    pdf.text("AREA", xProm + colProm / 2, yc + (altoCabTabla1 + altoCabTabla2) / 2 + 3, {
      align: "center",
    });

    // Fila inferior de la cabecera: 1BI 2BI 3BI 4BI
    const y2 = yc + altoCabTabla1;
    pdf.setFillColor(250, 246, 247);
    pdf.rect(xNota(1), y2, colNota * 4, altoCabTabla2, "F");
    pdf.setFontSize(6.5);
    BIMESTRES.forEach((b) => {
      pdf.text(`${b}BI`, xNota(b) + colNota / 2, y2 + altoCabTabla2 / 2 + 1, { align: "center" });
      pdf.setDrawColor(...GRIS_LINEA);
      pdf.line(xNota(b), yc, xNota(b), y2 + altoCabTabla2);
    });

    pdf.setDrawColor(...GRANATE);
    pdf.setLineWidth(0.5);
    pdf.rect(xArea, yc, anchoUtil, altoCabTabla1 + altoCabTabla2);
    pdf.setLineWidth(0.2);
    pdf.setDrawColor(...GRIS_LINEA);
    pdf.line(xCurso, yc, xCurso, y2 + altoCabTabla2);
    pdf.line(xProm, yc, xProm, y2 + altoCabTabla2);
    pdf.line(xArea, y2, xNota(1), y2);

    return yc + altoCabTabla1 + altoCabTabla2;
  };

  // Cuántas filas de cuerpo hay en total (un curso = una fila, más una fila
  // "PROMEDIO ÁREA" por cada bloque), para repartir el alto disponible.
  const totalFilasCuerpo = areas.reduce((t, a) => t + a.cursos.length + 1, 0) || 1;

  // Reserva de espacio para el pie, que va dentro del mismo borde de tabla.
  const altoPie = 30;
  const margenInferior = 10;

  let inicioTablaPagina = y;
  y = dibujarCabeceraTabla(y);

  const espacioPrimeraPagina = altoPag - y - altoPie - margenInferior;
  const espacioOtrasPaginas = altoPag - (margen + 4) - altoCabTabla1 - altoCabTabla2 - altoPie - margenInferior;
  const espacioRef = Math.max(espacioPrimeraPagina, espacioOtrasPaginas, 20);
  const altoFila = Math.max(ALTO_FILA_MIN, Math.min(ALTO_FILA_MAX, espacioRef / totalFilasCuerpo));

  const saltarPagina = () => {
    // Antes de irse, se cierra el borde grueso de lo dibujado en esta página.
    pdf.setDrawColor(...GRANATE);
    pdf.setLineWidth(0.6);
    pdf.rect(xArea, inicioTablaPagina, anchoUtil, y - inicioTablaPagina);

    pdf.addPage();
    y = margen + 4;
    inicioTablaPagina = y;
    y = dibujarCabeceraTabla(y);
  };

  const colorNota = (v: number) => (v < 11 ? ROJO_NOTA : NEGRO);

  const dibujarValorCentrado = (
    texto: string,
    cx: number,
    cy: number,
    ancho: number,
    color: [number, number, number],
    negrita = false,
    tam = 7
  ) => {
    pdf.setFont("helvetica", negrita ? "bold" : "normal");
    pdf.setFontSize(tam);
    pdf.setTextColor(...color);
    pdf.text(texto, cx + ancho / 2, cy, { align: "center" });
  };

  areas.forEach((area) => {
    const filasBloque = area.cursos.length + 1;
    const altoBloque = filasBloque * altoFila;

    // Si el bloque no cabe entero en lo que queda de página, se pasa de
    // página completa (no se parte un área a la mitad).
    if (y + altoBloque > altoPag - altoPie - margenInferior && y > inicioTablaPagina + 1) {
      saltarPagina();
    }

    const yBloqueInicio = y;

    // --- filas de cursos ---
    area.cursos.forEach((curso) => {
      const cy = y + altoFila / 2 + 1.1;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.8);
      pdf.setTextColor(...NEGRO);
      const nombreCurso = pdf.splitTextToSize(curso.nombre.toUpperCase(), colCurso - 3) as string[];
      pdf.text(nombreCurso[0] || "", xCurso + 1.5, cy);

      BIMESTRES.forEach((b) => {
        const v = curso.notas[String(b)];
        if (v !== null && v !== undefined) {
          dibujarValorCentrado(String(v), xNota(b), cy, colNota, colorNota(v));
        }
        pdf.setDrawColor(...GRIS_LINEA);
        pdf.setLineWidth(0.15);
        pdf.line(xNota(b), y, xNota(b), y + altoFila);
      });

      pdf.setDrawColor(...GRIS_LINEA);
      pdf.line(xCurso, y, xCurso + colCurso, y);
      pdf.line(xArea, y + altoFila, xProm, y + altoFila);
      y += altoFila;
    });

    // --- fila PROMEDIO ÁREA, cierra el bloque ---
    {
      const cy = y + altoFila / 2 + 1.1;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.8);
      pdf.setTextColor(...NEGRO);
      pdf.text("PROMEDIO ÁREA", xCurso + 1.5, cy);

      BIMESTRES.forEach((b) => {
        const v = area.promedio_por_bimestre[String(b)];
        if (v !== null && v !== undefined) {
          dibujarValorCentrado(String(v), xNota(b), cy, colNota, colorNota(v), true);
        }
        pdf.setDrawColor(...GRIS_LINEA);
        pdf.line(xNota(b), y, xNota(b), y + altoFila);
      });
      pdf.line(xCurso, y, xCurso + colCurso, y);
      y += altoFila;
    }

    // --- celda ÁREA (combinada verticalmente, nombre en negrita) ---
    pdf.setDrawColor(...GRIS_LINEA);
    pdf.setLineWidth(0.2);
    pdf.rect(xArea, yBloqueInicio, colArea, altoBloque);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.6);
    pdf.setTextColor(...GRANATE);
    const nombreArea = pdf.splitTextToSize(area.nombre, colArea - 3) as string[];
    let ay = yBloqueInicio + altoBloque / 2 - ((nombreArea.length - 1) * 2.4) / 2 + 1;
    nombreArea.slice(0, 4).forEach((l) => {
      pdf.text(l, xArea + colArea / 2, ay, { align: "center" });
      ay += 2.6;
    });

    // --- celda PROM. AREA (combinada, promedio anual con letra, o EXO) ---
    pdf.rect(xProm, yBloqueInicio, colProm, altoBloque);
    const cyProm = yBloqueInicio + altoBloque / 2 + 1.2;
    if (area.exonerada || area.promedio_anual === null) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...GRIS_TEXTO);
      pdf.text("EXO", xProm + colProm / 2, cyProm, { align: "center" });
    } else {
      const n = area.promedio_anual;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.setTextColor(...(n < 11 ? ROJO_NOTA : NEGRO));
      const numeroTxt = `${n} `;
      const anchoNumero = pdf.getTextWidth(numeroTxt);
      const letraTxt = `[${letra(n)}]`;
      const anchoLetra = pdf.getTextWidth(letraTxt);
      const inicioX = xProm + colProm / 2 - (anchoNumero + anchoLetra) / 2;
      pdf.text(numeroTxt, inicioX, cyProm);
      pdf.setTextColor(...AZUL_LETRA);
      pdf.text(letraTxt, inicioX + anchoNumero, cyProm);
    }

    // Línea que separa este bloque del siguiente.
    pdf.setDrawColor(...GRIS_LINEA);
    pdf.line(xArea, y, xArea + anchoUtil, y);
  });

  // Borde grueso granate alrededor de lo dibujado en esta página (hasta acá).
  pdf.setDrawColor(...GRANATE);
  pdf.setLineWidth(0.6);
  pdf.rect(xArea, inicioTablaPagina, anchoUtil, y - inicioTablaPagina);

  // -------------------------------------------------------------
  // 3. Pie: puntaje acumulado, ponderado y conducta
  // -------------------------------------------------------------
  // Si no queda sitio para el pie en esta página, se abre una nueva: el pie
  // tiene que verse dentro del mismo borde de tabla, no cortado a la mitad.
  if (y + altoPie > altoPag - margenInferior) {
    pdf.addPage();
    y = margen + 6;
    inicioTablaPagina = y;
  } else {
    y += 3;
  }

  const bCabecera = datos.bimestre_cabecera;
  const resumenCabecera = bCabecera ? resumen.por_bimestre[String(bCabecera)] : null;
  const puntajeTxt =
    resumenCabecera && resumenCabecera.puntaje_acumulado !== null
      ? `PUNTAJE ACUMULADO : ${resumenCabecera.puntaje_acumulado} Pts`
      : "PUNTAJE ACUMULADO : — Pts";

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(...GRANATE);
  pdf.text(puntajeTxt, anchoPag / 2, y + 4, { align: "center" });
  y += 8;

  // Tabla de tres filas: BIMESTRE (1 2 3 4 FINAL) / PONDERADO / CONDUCTA
  const colEtiqueta = 70;
  const colValor = (anchoUtil - colEtiqueta) / 5;
  const altoFilaPie = 6.5;
  const xEtiqueta = xArea;
  const xValor = (i: number) => xEtiqueta + colEtiqueta + colValor * i;

  pdf.setDrawColor(...GRANATE);
  pdf.setLineWidth(0.5);
  pdf.rect(xEtiqueta, y, anchoUtil, altoFilaPie * 3);
  pdf.setDrawColor(...GRIS_LINEA);
  pdf.setLineWidth(0.2);
  pdf.line(xEtiqueta + colEtiqueta, y, xEtiqueta + colEtiqueta, y + altoFilaPie * 3);
  for (let i = 1; i < 5; i++) {
    pdf.line(xValor(i), y, xValor(i), y + altoFilaPie * 3);
  }
  pdf.line(xEtiqueta, y + altoFilaPie, xEtiqueta + anchoUtil, y + altoFilaPie);
  pdf.line(xEtiqueta, y + altoFilaPie * 2, xEtiqueta + anchoUtil, y + altoFilaPie * 2);

  // Fila 1: cabecera BIMESTRE
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.setTextColor(...NEGRO);
  pdf.text("BIMESTRE", xEtiqueta + 2, y + altoFilaPie / 2 + 1.2);
  ["I", "II", "III", "IV", "FINAL"].forEach((t, i) => {
    pdf.text(t, xValor(i) + colValor / 2, y + altoFilaPie / 2 + 1.2, { align: "center" });
  });

  // Fila 2: PONDERADO FINAL ANUAL (DEFINE EL PUESTO)
  const yPond = y + altoFilaPie;
  pdf.setFontSize(6);
  pdf.text("PONDERADO FINAL ANUAL", xEtiqueta + 2, yPond + altoFilaPie / 2);
  pdf.text("(DEFINE EL PUESTO)", xEtiqueta + 2, yPond + altoFilaPie / 2 + 2.6);
  BIMESTRES.forEach((b, i) => {
    const p = resumen.por_bimestre[String(b)]?.ponderado;
    if (p !== null && p !== undefined) {
      dibujarValorCentrado(p.toFixed(2), xValor(i), yPond + altoFilaPie / 2 + 1.2, colValor, NEGRO, true, 7);
    }
  });
  if (resumen.ponderado_final_anual !== null && resumen.ponderado_final_anual !== undefined) {
    dibujarValorCentrado(
      resumen.ponderado_final_anual.toFixed(2),
      xValor(4),
      yPond + altoFilaPie / 2 + 1.2,
      colValor,
      GRANATE,
      true,
      7.5
    );
  }

  // Fila 3: CONDUCTA
  const yCond = y + altoFilaPie * 2;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.text("CONDUCTA", xEtiqueta + 2, yCond + altoFilaPie / 2 + 1.2);
  BIMESTRES.forEach((b, i) => {
    const c = resumen.conducta_por_bimestre[String(b)];
    if (c !== null && c !== undefined) {
      dibujarValorCentrado(String(c), xValor(i), yCond + altoFilaPie / 2 + 1.2, colValor, colorNota(c), true, 7);
    }
  });

  y += altoFilaPie * 3;

  // Pie de página con la fecha de generación, útil para saber si está al día.
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(...GRIS_TEXTO);
  const hoy = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  pdf.text(`Generado el ${hoy}`, anchoPag - margen, altoPag - 6, { align: "right" });

  pdf.save(nombreArchivo);
  return { nombreArchivo };
}
