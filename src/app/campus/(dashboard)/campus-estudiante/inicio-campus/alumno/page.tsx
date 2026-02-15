"use client";
import { useEffect, useState, useCallback } from "react";
import { Calendar, ChevronDown, Loader2, AlertCircle, Clock } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { toast } from "sonner";
import { HorarioAsignado, HoraLectiva, AnioEscolar } from "@/src/interfaces/academic";


const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export default function HorarioAlumnoPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [horario, setHorario] = useState<HorarioAsignado[]>([]);
  const [bloquesHoras, setBloquesHoras] = useState<HoraLectiva[]>([]);
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // 2. Cargar Horario del Alumno
  const fetchHorario = useCallback(async (uid: number, anio: string) => {
    setLoading(true);
    setHorario([]); 

    try {
      // Ajustado para coincidir con el nombre de parámetro del backend 'anio'
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/horarios/alumno/usuario/${uid}?id_anio_escolar=${anio}`
      );
      
      if (res.status === 404) {
        toast.warning("No tienes un horario asignado para este periodo.");
        setLoading(false);
        return; // Salimos de la función pacíficamente
      }

      if (!res.ok) {
        toast.error("Ocurrió un error al obtener el horario.");
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      
      if (!data || data.length === 0) {
        toast.info("El horario para este periodo está vacío.");
      } else {
        setHorario(data);
        toast.success("Horario cargado");
      }
    } catch (err) {
      console.error("Error fetching horario:", err);
      toast.error("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && id_usuario && anioSeleccionado) {
      fetchHorario(Number(id_usuario), anioSeleccionado);
    }
  }, [id_usuario, anioSeleccionado, userLoading, fetchHorario]);

  // Helper para buscar qué curso va en qué celda
  const obtenerCelda = (id_hora: number, dia: string) => {
    return horario.find(h => h.id_hora === id_hora && h.dia_semana.toLowerCase() === dia.toLowerCase());
  };

  if (userLoading || (loading && bloquesHoras.length === 0)) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500">Cargando tu horario escolar...</p>
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
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 border-b border-r text-gray-500 font-bold text-xs uppercase w-32">
                  <div className="flex items-center gap-2 justify-center">
                    <Clock size={14} /> Hora
                  </div>
                </th>
                {DIAS.map(dia => (
                  <th key={dia} className="p-4 border-b border-r text-[#701C32] font-black text-sm uppercase">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloquesHoras.map((bloque) => (
                <tr key={bloque.id_hora} className="group">
                  {/* Columna de Hora */}
                  <td className="p-4 border-b border-r bg-gray-50/50 text-center">
                    <span className="text-sm font-bold text-gray-700 block">
                      {bloque.hora_inicio.substring(0, 5)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {bloque.hora_fin.substring(0, 5)}
                    </span>
                  </td>

                  {/* Columnas de Días */}
                  {DIAS.map(dia => {
                    const celda = obtenerCelda(bloque.id_hora, dia);
                    const esReceso = bloque.tipo.toLowerCase() === "receso";

                    if (esReceso) {
                      return (
                        <td key={dia} className="p-2 border-b border-r bg-slate-50 text-center">
                          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                            Receso
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={dia} className="p-2 border-b border-r min-w-[150px] transition-colors group-hover:bg-gray-50/30">
                        {celda ? (
                          <div className="bg-[#701C32]/5 border-l-4 border-[#701C32] p-3 rounded-r-lg h-full">
                            <p className="text-xs font-black text-[#701C32] leading-tight mb-1">
                              {celda.curso_nombre}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium truncate">
                              {celda.docente_nombre}
                            </p>
                          </div>
                        ) : (
                          <div className="h-full min-h-[50px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-gray-300 italic">Libre</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}