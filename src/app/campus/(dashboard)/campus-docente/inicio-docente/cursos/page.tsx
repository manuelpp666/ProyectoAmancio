"use client";
import { useEffect, useState, useCallback } from "react";
import { ArrowRight, Users, Loader2, BookOpen, AlertCircle, ChevronDown } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { AnioEscolar } from "@/src/interfaces/academic";
import Link from "next/link";
import { CursoDocente } from "@/src/interfaces/academic";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";

export default function MisCursosDocente() {

  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    listaAnios: anios,
    loadingAnios
  } = useAnioAcademico();
  const { id_usuario, loading: userLoading } = useUser();
  const [cursos, setCursos] = useState<CursoDocente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Cargar Cursos del Docente
  const fetchCursos = useCallback(async (uid: number, anio: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/mis-cursos-docente/${uid}?anio=${anio}`);
      if (!res.ok) throw new Error("No se pudieron obtener los cursos");
      const data = await res.json();
      setCursos(data);
    } catch (err) {
      setError("Error conectando con el servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && id_usuario && anioSeleccionado) {
      fetchCursos(Number(id_usuario), anioSeleccionado);
    }
  }, [id_usuario, anioSeleccionado, userLoading, fetchCursos]);

  if (userLoading || loadingAnios) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* HEADER CON FILTRO */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-6">
        <h1 className="text-3xl font-bold text-[#701C32]">Mis Cursos Asignados</h1>

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
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-200">
          <AlertCircle size={20} /> <p>{error}</p>
        </div>
      )}

      {/* GRILLA */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {cursos.length > 0 ? (
            cursos.map((curso) => (
              <div
                key={curso.id_carga}
                className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                {/* ICONO EN LUGAR DE IMAGEN */}
                <div className="h-32 w-full flex items-center justify-center mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-gray-400 group-hover:text-[#701C32] transition-colors">
                  <BookOpen size={48} strokeWidth={1.5} />
                </div>

                <div className="flex flex-col flex-1">
                  {/* GRADO Y SECCIÓN - REUBICADO PARA ESTÉTICA */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                      {curso.grado_nombre} - {curso.seccion_nombre}
                    </span>
                    <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                      <Users size={12} /> {curso.alumnos}
                    </div>
                  </div>

                  <h3 className="font-black text-gray-800 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {curso.curso_nombre}
                  </h3>

                  {/* BOTÓN DE ACCIÓN ESTILO ESTUDIANTE */}
                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-end">
                    <Link
                      href={`/campus/campus-docente/inicio-docente/cursos/${curso.id_carga}?anio=${anioSeleccionado}`}
                      className="text-[12px] font-black text-[#701C32] flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      GESTIONAR <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
              <BookOpen size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No tienes cursos asignados para este año.</p>
              <p className="text-sm">Consulta con el administrador si esto es un error.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}