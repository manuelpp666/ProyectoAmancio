"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, BookOpen, Calendar, ClipboardList, 
  GraduationCap, FileText, CheckCircle2, Clock, AlertCircle 
} from "lucide-react";
import { useUser } from "@/src/context/userContext";

// Interfaces para tipar la respuesta
interface Tarea {
  id: number;
  titulo: string;
  fecha_entrega: string;
  entregado: boolean;
  nota?: number;
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
  const { id_curso } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const anio = searchParams.get("anio");
  const { id_usuario, loading: userLoading } = useUser();

  // UNIFICAMOS A UN SOLO ESTADO: data
  const [data, setData] = useState<DetalleCurso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetalle = useCallback(async () => {
    if (!id_usuario || !id_curso || !anio) return;
    
    setLoading(true);
    setError(null); // Limpiar errores previos
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/gestion/curso-detalle/${id_curso}/${id_usuario}?anio=${anio}`
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
  }, [id_usuario, id_curso, anio]);

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

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#701C32] bg-[#701C32]/10 px-3 py-1 rounded-full">
            Curso Académico {anio}
          </span>
          <h1 className="text-3xl font-black text-gray-800 mt-2">{data.curso_nombre}</h1>
          <p className="text-gray-500 flex items-center gap-2 mt-1">
            <GraduationCap size={18} /> {data.docente_nombre}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Tareas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ClipboardList className="text-[#701C32]" /> Tareas del Curso
            </h2>
            <span className="text-xs font-medium text-gray-400">{data.tareas.length} total</span>
          </div>

          <div className="grid gap-4">
            {data.tareas.length > 0 ? (
              data.tareas.map((tarea) => (
                <div key={tarea.id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${tarea.entregado ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                      <FileText size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{tarea.titulo}</h3>
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
                        {tarea.nota && <span className="text-lg font-black text-gray-800 mt-1">{tarea.nota}</span>}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1">
                        <Clock size={12} /> PENDIENTE
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-sm">No hay tareas publicadas aún.</p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Calificaciones Bimestrales */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="text-[#701C32]" /> Calificaciones
          </h2>
          <div className="bg-[#701C32] rounded-3xl p-6 text-white shadow-lg shadow-[#701C32]/20">
            <p className="text-[#white/60] text-sm font-medium">Promedio Final</p>
            <div className="text-5xl font-black mt-1">
              {data.notas?.promedio_final?.toFixed(2) || "0.00"}
            </div>
            
            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4].map((bim) => {
                const nota = data.notas?.[`nota_bimestre${bim}` as keyof ResumenNotas];
                return (
                  <div key={bim} className="flex justify-between items-center border-b border-white/10 pb-2 text-sm">
                    <span className="text-white/70">Bimestre {bim}</span>
                    <span className="font-bold">{nota || "--"}</span>
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