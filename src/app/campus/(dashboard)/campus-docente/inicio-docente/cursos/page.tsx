"use client";
import { useEffect, useState, useCallback } from "react";
import { ArrowRight, Users, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { apiFetch } from "@/src/lib/api";
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
      const res = await apiFetch(`/gestion/mis-cursos-docente/${uid}?anio=${anio}`);
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
    <div className="max-w-[1600px] mx-auto space-y-6 pb-8 px-4">
      {/* HEADER CON FILTRO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32] mb-2">Mis Cursos Asignados</h1>
          <p className="text-gray-500 text-sm">Gestiona los cursos que dictas en el periodo seleccionado</p>
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
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-200">
          <AlertCircle size={20} /> <p>{error}</p>
        </div>
      )}

      {/* GRILLA */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-72 bg-gray-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cursos.length > 0 ? (
            cursos.map((curso) => (
              <Link
                key={curso.id_carga}
                href={`/campus/campus-docente/inicio-docente/cursos/${curso.id_carga}?anio=${anioSeleccionado}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-[#701C32]/20 transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Cabecera de la tarjeta */}
                <div className="relative h-28 w-full bg-[#701C32] flex items-center justify-center overflow-hidden">
                  <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10"></div>
                  <div className="absolute -left-8 -bottom-10 w-24 h-24 rounded-full bg-white/5"></div>
                  <BookOpen size={44} strokeWidth={1.5} className="text-[#FFF1E3] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute top-3 right-3 text-[9px] font-black bg-white/15 text-white px-2.5 py-1 rounded-full backdrop-blur-sm tracking-wider">
                    {curso.grado_nombre} {curso.seccion_nombre}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-black text-gray-800 text-sm mb-3 line-clamp-2 min-h-[40px] group-hover:text-[#701C32] transition-colors">
                    {curso.curso_nombre}
                  </h3>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#FFF1E3] border border-[#F8EBDD] flex items-center justify-center text-[#701C32] shrink-0">
                      <Users size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Alumnos</p>
                      <p className="text-[11px] text-gray-600 font-bold">{curso.alumnos ?? 0} matriculados</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-medium">Aula virtual</span>
                    <span className="text-[12px] font-black text-[#701C32] flex items-center gap-1 group-hover:gap-2 transition-all">
                      GESTIONAR <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
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