"use client";
import { Loader2, AlertCircle, CalendarX } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { TablaHorario } from "@/src/components/Horario/TablaHorario";
import { useHorario } from "@/src/hooks/useHorario";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";

export default function HorarioDocentePage() {

  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    listaAnios: anios,
    loadingAnios
  } = useAnioAcademico();
  const { id_usuario, loading: userLoading } = useUser();

  // Usamos el hook para obtener el horario automáticamente
  const { data: horario, loading: horarioLoading, error } = useHorario(Number(id_usuario), anioSeleccionado);

  const tieneHorario = Array.isArray(horario) && horario.length > 0;

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
          <p className="text-gray-500 text-sm">Gestiona tus tiempos y clases para este año</p>
        </div>

        <div className="flex items-center gap-3">
          <AnioSelector
            value={anioSeleccionado}
            onChange={setAnioSeleccionado}
            anios={anios}
            loading={loadingAnios}
          />
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
            <TablaHorario horario={horario} />
          </div>
        </div>
      ) : !error ? (
        <div className="bg-white rounded-2xl p-14 text-center border-2 border-dashed border-gray-200">
          <CalendarX size={44} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Sin horario asignado</h3>
          <p className="text-gray-500 text-sm">
            Aún no se han registrado clases en tu horario para este año escolar.
          </p>
        </div>
      ) : null}
    </div>
  );
}
