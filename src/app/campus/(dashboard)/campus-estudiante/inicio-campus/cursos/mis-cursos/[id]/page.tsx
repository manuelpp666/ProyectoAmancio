"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Calendar, ClipboardList,
  GraduationCap, FileText, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import { useUser } from "@/src/context/userContext";
import ModalEntregaTarea from "@/src/components/Tarea/ModalEntregaTarea";
import { toast } from "sonner";
// Interfaces para tipar la respuesta
interface Tarea {
  id_tarea: number;
  titulo: string;
  fecha_entrega: string;
  entregado: boolean;
  descripcion?: string;
  nota?: number;
  retroalimentacion_docente?: string; // Nuevo campo
  bimestre: number; // Nuevo campo
  peso: number;
}

interface ResumenNotas {
  nota_bimestre1?: number;
  nota_bimestre2?: number;
  nota_bimestre3?: number;
  nota_bimestre4?: number;
  promedio_final?: number;
}

interface DetalleCurso {
  curso_nombre: string;
  docente_nombre: string;
  tareas: Tarea[];
  notas: ResumenNotas;
}

export default function DetalleCursoPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const anio = searchParams.get("anio");
  const { id_usuario, loading: userLoading } = useUser();

  // UNIFICAMOS A UN SOLO ESTADO: data
  const [data, setData] = useState<DetalleCurso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  // 1. FUNCIÓN PARA AGRUPAR TAREAS POR BIMESTRE
  const tareasPorBimestre = data?.tareas.reduce((acc: any, tarea: Tarea) => {
    const bim = tarea.bimestre || 1;
    if (!acc[bim]) acc[bim] = [];
    acc[bim].push(tarea);
    return acc;
  }, {});

  // CALCULAR PROMEDIO DINÁMICO (Basado en tareas calificadas)
  const promedioCalculado = data?.tareas.reduce((acc, tarea) => {
    // Solo contamos tareas que tienen nota y peso
    if (tarea.nota !== undefined && tarea.nota !== null) {
      return acc + (Number(tarea.nota) * (tarea.peso / 100));
    }
    return acc;
  }, 0);

  // Determinar qué promedio mostrar (el oficial del backend o el calculado si el oficial es 0)
  const promedioAMostrar = data?.notas?.promedio_final && data.notas.promedio_final > 0
    ? data.notas.promedio_final
    : promedioCalculado;

  const fetchDetalle = useCallback(async () => {
    if (!id_usuario || !id || !anio) return;

    setLoading(true);
    setError(null); // Limpiar errores previos
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gestion/curso-detalle/${id}/${id_usuario}?anio=${anio}`
      );

      if (!res.ok) throw new Error("No se pudo obtener el detalle del curso");

      const result = await res.json();
      setData(result); // ACTUALIZAMOS EL ESTADO CORRECTO
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id_usuario, id, anio]);

  useEffect(() => {
    if (!userLoading) {
      fetchDetalle();
    }
  }, [userLoading, fetchDetalle]);

  // Pantalla de carga (Prioridad)
  if (userLoading || loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#701C32]"></div>
        <p className="text-gray-500 animate-pulse">Cargando información del curso...</p>
      </div>
    );
  }

  // Si hay error o no hay data DESPUÉS de cargar
  if (error || !data) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-gray-600 mb-4">{error || "No se encontró información del curso"}</p>
        <button
          onClick={() => router.back()}
          className="bg-[#701C32] text-white px-6 py-2 rounded-xl font-bold hover:bg-[#5a1628] transition-colors"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Botón Volver y Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-[#701C32] transition-colors font-medium"
      >
        <ArrowLeft size={20} /> Volver a mis cursos
      </button>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h1 className="text-3xl font-black text-gray-800">{data.curso_nombre}</h1>
        <p className="text-gray-500 flex items-center gap-2 mt-1"><GraduationCap size={18} /> {data.docente_nombre}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Tareas */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="text-[#701C32]" /> Tareas del Curso
            </h2>
            <span className="text-xs font-medium text-gray-400">{data.tareas.length} total</span>
          </div>

          {data.tareas.length > 0 ? (
            // Recorremos los bimestres del 1 al 4
            [1, 2, 3, 4].map((bimestreNum) => {
              const tareasDelBimestre = tareasPorBimestre[bimestreNum] || [];

              // Si no hay tareas en este bimestre, no mostramos el título del bimestre (opcional)
              if (tareasDelBimestre.length === 0) return null;

              return (
                <div key={bimestreNum} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gray-100"></div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                      Bimestre {bimestreNum}
                    </span>
                    <div className="h-px flex-1 bg-gray-100"></div>
                  </div>

                  <div className="grid gap-4">
                    {tareasDelBimestre.map((tarea: Tarea) => {
                      const idReal = tarea.id_tarea;
                      return (
                        <div
                          key={idReal}
                          onClick={async () => {
                            if (!idReal) {
                              toast.error("Error: ID de tarea no encontrado");
                              return;
                            }
                            try {
                              const url = tarea.entregado
                                ? `${process.env.NEXT_PUBLIC_API_URL}/virtual/tareas/${idReal}/${id_usuario}`
                                : `${process.env.NEXT_PUBLIC_API_URL}/virtual/tareas/${idReal}`;

                              const res = await fetch(url);
                              if (!res.ok) throw new Error("Error al obtener detalle");

                              const tareaCompleta = await res.json();
                              // Fusionamos el peso por si el endpoint de detalle no lo trae
                              setTareaSeleccionada({ ...tareaCompleta, peso: tarea.peso });
                            } catch (err) {
                              toast.error("No se pudo cargar el detalle de la tarea");
                            }
                          }}
                          className="bg-white border border-gray-100 rounded-2xl p-5 transition-all hover:shadow-md hover:border-[#701C32]/30 cursor-pointer flex flex-col gap-3"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-xl ${tarea.entregado ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                                <FileText size={24} />
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                  {tarea.titulo}
                                  <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full border border-gray-200">
                                    {tarea.peso}%
                                  </span>
                                </h3>
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                  <Calendar size={12} /> Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              {tarea.entregado ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
                                    <CheckCircle2 size={12} /> ENTREGADO
                                  </span>
                                  {tarea.nota !== undefined && tarea.nota !== null && (
                                    <span className="text-lg font-black text-[#701C32] mt-1">
                                      {Number(tarea.nota).toString().padStart(2, '0')}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1">
                                  <Clock size={12} /> PENDIENTE
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">No hay tareas publicadas aún.</p>
            </div>
          )}
        </div>
        {/* MODAL DE ENTREGA */}
        {tareaSeleccionada && (
          <ModalEntregaTarea
            tarea={tareaSeleccionada}
            idUsuario={id_usuario}
            onClose={() => setTareaSeleccionada(null)}
            onRefresh={fetchDetalle}
          />
        )}

        {/* Columna Derecha: Calificaciones Bimestrales */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-[#701C32]" /> Calificaciones
          </h2>
          <div className="bg-[#701C32] rounded-3xl p-6 text-white shadow-lg shadow-[#701C32]/20">
            <p className="text-white/60 text-sm font-medium">Promedio Actual del Curso</p>
            <div className="text-5xl font-black mt-1">
              {promedioAMostrar?.toFixed(2) || "0.00"}
            </div>

            {/* Indicador visual de progreso */}
            <div className="mt-4 w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-400 h-full transition-all duration-1000"
                style={{ width: `${(promedioAMostrar! / 20) * 100}%` }} // Asumiendo escala 0-20
              />
            </div>

            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4].map((bim) => {
                // Cálculo de promedio por bimestre
                const tareasBim = tareasPorBimestre[bim] || [];
                const promedioBim = tareasBim.reduce((acc: number, t: Tarea) => {
                  if (t.nota !== null && t.nota !== undefined) return acc + (Number(t.nota) * (t.peso / 100));
                  return acc;
                }, 0);

                const notaOficial = data.notas?.[`nota_bimestre${bim}` as keyof ResumenNotas];

                return (
                  <div key={bim} className="flex justify-between items-center border-b border-white/10 pb-2 text-sm">
                    <span className="text-white/70">Bimestre {bim}</span>
                    <span className="font-bold">
                      {/* Muestra la oficial, si no existe, muestra la calculada */}
                      {notaOficial || (promedioBim > 0 ? promedioBim.toFixed(1) : "--")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}