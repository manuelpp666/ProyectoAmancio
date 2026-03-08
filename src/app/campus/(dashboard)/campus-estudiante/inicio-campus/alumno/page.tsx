"use client";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { toast } from "sonner";
import { HoraLectiva } from "@/src/interfaces/academic";
import { TablaHorario } from "@/src/components/Horario/TablaHorario";
import { useHorario } from "@/src/hooks/useHorario";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch } from "@/src/lib/api";

export default function HorarioAlumnoPage() {

  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    listaAnios: anios,
    loadingAnios
  } = useAnioAcademico();
  const { id_usuario, loading: userLoading } = useUser();
  const [bloquesHoras, setBloquesHoras] = useState<HoraLectiva[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Usamos el hook para obtener el horario automáticamente
  const { data: horario, loading: horarioLoading } = useHorario(Number(id_usuario), anioSeleccionado);
  // 1. Cargar Configuración Inicial (Años y Bloques de Horas)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // 1. Solo pedimos las horas, los años ya vienen del hook
        const resHoras = await apiFetch(`/horarios/horas`);
        const dataHoras = await resHoras.json();
        setBloquesHoras(dataHoras);
      } catch (err) {
        toast.error("Error al cargar la estructura del horario");
      }
    };
    fetchConfig();
  }, []);

  if (userLoading || loadingAnios || (horarioLoading && bloquesHoras.length === 0)) {
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

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* TABLA DE HORARIO */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <TablaHorario horario={horario} bloques={bloquesHoras} />
        </div>
      </div>
    </div>
  );
}