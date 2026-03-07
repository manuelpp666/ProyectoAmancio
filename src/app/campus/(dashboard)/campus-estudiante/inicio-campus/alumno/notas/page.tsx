"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/src/context/userContext";
import { BookOpen, ChevronRight, Loader2, ChevronDown, AlertCircle } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, Cell } from "recharts";
import Link from "next/link";
import { AnioEscolar } from "@/src/interfaces/academic";
import { ResumenNota } from "@/src/interfaces/datos_alumno";
import { toast } from "sonner";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";

export default function MisCalificacionesPage() {
  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    listaAnios: anios,
    loadingAnios
  } = useAnioAcademico();

  const { id_usuario, loading: userLoading } = useUser();
  const [resumen, setResumen] = useState<ResumenNota[]>([]);
  const [loading, setLoading] = useState(true);


  // 2. Carga de Resumen (Memorizada)
  const fetchResumen = useCallback(async (uid: number, anio: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/resumen-notas/${uid}?anio=${anio}`);
      if (!res.ok) throw new Error("Error al cargar notas");
      const data = await res.json();
      setResumen(data);
      toast.success(`Notas actualizadas para el año ${anio}`);
    } catch (err) {
      toast.error("Error al obtener tus calificaciones", {
        description: "Por favor, intenta recargar la página.",
        icon: <AlertCircle className="text-red-500" size={16} />,
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Disparar carga cuando cambie el año o el usuario
  useEffect(() => {
    if (!userLoading && id_usuario && anioSeleccionado) {
      fetchResumen(id_usuario, anioSeleccionado);
    }
  }, [id_usuario, userLoading, anioSeleccionado, fetchResumen]);

  if (userLoading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-800">Mi Rendimiento</h1>
          <p className="text-gray-500">Visualiza tu progreso académico</p>
        </div>

        {/* SELECTOR DE AÑO */}
        <div className="flex items-center gap-3">
          <AnioSelector
            value={anioSeleccionado}
            onChange={setAnioSeleccionado}
            anios={anios}
            loading={loadingAnios}
          />
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando notas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumen.map((curso) => (
            <div key={curso.id_curso} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#701C32]/5 text-[#701C32] rounded-2xl"><BookOpen size={24} /></div>
                <span className="text-3xl font-black text-gray-800">{curso.promedio_final?.toFixed(1) || "0.0"}</span>
              </div>

              <h3 className="font-bold text-gray-700 mb-4 h-12 line-clamp-2">{curso.curso_nombre}</h3>

              <div className="h-20 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[{ val: curso.nota_bimestre1 }, { val: curso.nota_bimestre2 }, { val: curso.nota_bimestre3 }, { val: curso.nota_bimestre4 }]}>
                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                      <Cell fill={curso.promedio_final >= 11 ? "#22c55e" : "#ef4444"} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Link
                href={`/campus/campus-estudiante/inicio-campus/cursos/mis-cursos/${curso.id_curso}?anio=${anioSeleccionado}`}
                className="mt-auto w-full flex items-center justify-center gap-2 text-sm font-black text-[#701C32] bg-gray-50 hover:bg-[#701C32] hover:text-white py-3 rounded-xl transition-all"
              >
                Ver detalle <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}