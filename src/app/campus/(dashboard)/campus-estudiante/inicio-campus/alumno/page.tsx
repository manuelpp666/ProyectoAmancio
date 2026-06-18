"use client";
import { useRef, useState } from "react";
import { Loader2, AlertCircle, Download, CalendarX } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { toast } from "sonner";
import { TablaHorario } from "@/src/components/Horario/TablaHorario";
import { useHorario } from "@/src/hooks/useHorario";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";

export default function HorarioAlumnoPage() {

  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    listaAnios: anios,
    loadingAnios
  } = useAnioAcademico();
  const { id_usuario, loading: userLoading } = useUser();
  const [descargando, setDescargando] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Usamos el hook para obtener el horario automáticamente
  const { data: horario, loading: horarioLoading, error } = useHorario(Number(id_usuario), anioSeleccionado);

  const tieneHorario = Array.isArray(horario) && horario.length > 0;

  // Descarga el horario en PDF capturando la tabla tal como se ve en pantalla
  const descargarPDF = async () => {
    const element = contentRef.current;
    if (!element || !tieneHorario) {
      toast.error("No hay horario para descargar");
      return;
    }
    setDescargando(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf")
      ]);

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      // Cabecera institucional
      pdf.setFillColor(112, 28, 50); // #701C32
      pdf.rect(0, 0, pageW, 20, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text(`HORARIO ESCOLAR ${anioSeleccionado}`, 10, 9);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text("I.E. Amancio Varona — Campus Virtual del Estudiante", 10, 15);
      pdf.text(`Generado el ${new Date().toLocaleDateString("es-PE")}`, pageW - 10, 15, { align: "right" });

      // Imagen del horario ajustada a la página
      const margin = 10;
      const top = 26;
      const maxW = pageW - margin * 2;
      const maxH = pageH - top - margin;
      let imgW = maxW;
      let imgH = (canvas.height * imgW) / canvas.width;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = (canvas.width * imgH) / canvas.height;
      }
      pdf.addImage(imgData, "JPEG", (pageW - imgW) / 2, top, imgW, imgH);

      pdf.save(`Horario_${anioSeleccionado}.pdf`);
      toast.success("Horario descargado correctamente");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo generar el PDF del horario");
    } finally {
      setDescargando(false);
    }
  };

  if (userLoading || loadingAnios) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500">Cargando horario...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-8 px-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32] mb-2">Mi Horario</h1>
          <p className="text-gray-500 text-sm">Consulta tus clases de la semana y descárgalas en PDF</p>
        </div>

        <div className="flex items-center gap-3">
          <AnioSelector
            value={anioSeleccionado}
            onChange={setAnioSeleccionado}
            anios={anios}
            loading={loadingAnios}
          />
          <button
            onClick={descargarPDF}
            disabled={!tieneHorario || descargando}
            className="bg-[#701C32] hover:bg-[#5a1628] disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-900/10 shrink-0"
          >
            {descargando ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Descargar PDF
          </button>
        </div>
      </div>

      {error && !horarioLoading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* TABLA DE HORARIO */}
      {horarioLoading ? (
        <div className="h-96 bg-gray-100 animate-pulse rounded-2xl"></div>
      ) : tieneHorario ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <div ref={contentRef} className="bg-white">
              <TablaHorario horario={horario} />
            </div>
          </div>
        </div>
      ) : !error ? (
        <div className="bg-white rounded-2xl p-14 text-center border-2 border-dashed border-gray-200">
          <CalendarX size={44} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Sin horario asignado</h3>
          <p className="text-gray-500 text-sm">
            Aún no se ha registrado un horario para tu sección en este año escolar.
          </p>
        </div>
      ) : null}
    </div>
  );
}
