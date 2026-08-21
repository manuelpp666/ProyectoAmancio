"use client";
import { useState } from "react";
import { Loader2, AlertCircle, Download, CalendarX } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { toast } from "sonner";
import { TablaHorario } from "@/src/components/Horario/TablaHorario";
import { useHorario } from "@/src/hooks/useHorario";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { generarPDFHorario } from "@/src/lib/pdfHorario";

export default function HorarioAlumnoPage() {

  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    listaAnios: anios,
    loadingAnios
  } = useAnioAcademico();
  const { id_usuario, username, loading: userLoading } = useUser();
  const [descargando, setDescargando] = useState(false);

  // Usamos el hook para obtener el horario automáticamente
  const { data: horario, bloques: bloquesHorario, loading: horarioLoading, error } = useHorario(Number(id_usuario), anioSeleccionado);

  const tieneHorario = Array.isArray(horario) && horario.length > 0;

  /**
   * Descarga el horario en PDF.
   *
   * Lo dibuja el mismo generador que usa el panel para las secciones, en vez
   * de fotografiar la tabla de la pantalla con html2canvas. La captura salía
   * borrosa, se encogía hasta lo ilegible cuando el horario tenía muchas
   * horas y arrastraba media librería extra a la descarga de esta página.
   */
  const descargarPDF = async () => {
    if (!tieneHorario) {
      toast.error("No hay horario para descargar");
      return;
    }
    setDescargando(true);
    try {
      const { nombreArchivo, filas } = generarPDFHorario({
        bloques: bloquesHorario,
        asignaciones: horario.map((h) => ({
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          curso_nombre: h.curso_nombre,
          docente_nombre: h.docente_nombre,
        })),
        anio: anioSeleccionado,
        titulo: "MI HORARIO",
        subtitulo: username
          ? `Campus del estudiante · ${username} · ${anioSeleccionado}`
          : `Campus del estudiante · ${anioSeleccionado}`,
      });

      if (filas === 0) {
        toast.warning("Todavía no tienes clases asignadas en el horario");
        return;
      }
      toast.success(`Descargado ${nombreArchivo}`);
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
    <div className="max-w-[1600px] mx-auto space-y-6 pb-8">
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
            <TablaHorario horario={horario} bloques={bloquesHorario} />
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
