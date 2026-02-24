"use client";
import { useEffect, useState } from "react";
import { ChevronDown, Loader2, AlertCircle} from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { toast } from "sonner";
import { HoraLectiva, AnioEscolar } from "@/src/interfaces/academic";
import { TablaHorario } from "@/src/components/Horario/TablaHorario";
import { useHorario } from "@/src/hooks/useHorario";


export default function HorarioAlumnoPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [bloquesHoras, setBloquesHoras] = useState<HoraLectiva[]>([]);
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Usamos el hook para obtener el horario automáticamente
  const { data: horario, loading: horarioLoading } = useHorario(Number(id_usuario), anioSeleccionado);
  // 1. Cargar Configuración Inicial (Años y Bloques de Horas)
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [resAnios, resHoras] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/anios/`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/horarios/horas`)
        ]);

        const dataAnios = await resAnios.json();
        const dataHoras = await resHoras.json();

        setAnios(dataAnios);
        setBloquesHoras(dataHoras);

        const actual = dataAnios.find((a: any) => a.activo) || dataAnios[0];
        if (actual) setAnioSeleccionado(actual.id_anio_escolar);
      } catch (err) {
        toast.error("Error al cargar la configuración inicial");
      }
    };
    fetchConfig();
  }, []);

  if (userLoading || (horarioLoading && bloquesHoras.length === 0)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500">Cargando...</p>
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
          <div className="relative">
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(e.target.value)}
              className="appearance-none bg-white border-2 border-gray-200 text-gray-700 text-sm py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:border-[#701C32] transition-all cursor-pointer font-bold"
            >
              {anios.map(a => (
                <option key={a.id_anio_escolar} value={a.id_anio_escolar}>
                  Año {a.id_anio_escolar}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
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