"use client";
import { useEffect, useState, useCallback } from "react"; // 1. Agregamos useCallback
import { ArrowRight, ChevronDown, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { Curso} from "@/src/interfaces/academic";
import { useUser } from "@/src/context/userContext";
import Link from "next/link";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch } from "@/src/lib/api";

interface CursoCards extends Curso {
  docente_nombres: string;
  docente_apellidos: string;
  url_perfil_docente?: string;
  curso_nombre?: string;
}

export default function CursosPage() {

  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    listaAnios: anios,
    loadingAnios
  } = useAnioAcademico();
  const { id_usuario, loading: userLoading } = useUser();
  const [cursos, setCursos] = useState<CursoCards[]>([]);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // 2. Función de carga de cursos (Memorizada para evitar renders infinitos)
  const fetchMisCursos = useCallback(async (uid: number, anio: string) => {
    setLoadingCursos(true);
    setError(null);
    try {

      const res = await apiFetch(`/gestion/mis-cursos/${uid}?anio=${anio}`);

      if (!res.ok) throw new Error("Error en la respuesta del servidor");

      const data = await res.json();
      setCursos(data);
    } catch (err) {
      console.error("Error en la petición de cursos:", err);
      setError("No pudimos obtener tus cursos en este momento");
    } finally {
      setLoadingCursos(false);
    }
  }, []);

  // 3. Efecto disparador: Se activa cuando el ID o el AÑO cambian
  useEffect(() => {

    // Si el context aún está cargando, esperamos
    if (userLoading) return;

    if (id_usuario && anioSeleccionado) {
      fetchMisCursos(Number(id_usuario), anioSeleccionado);
    }
  }, [id_usuario, anioSeleccionado, userLoading, fetchMisCursos]);

  // Pantalla de carga inicial (Mientras se recupera la sesión)
  if (userLoading || loadingAnios) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500 animate-pulse">Cargando periodo académico...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-8 px-4">
      {/* HEADER Y FILTRO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32] mb-2">Mis Cursos</h1>
          <p className="text-gray-500 text-sm">Visualiza tus materias del periodo seleccionado</p>
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

      {/* MANEJO DE ERRORES */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* GRILLA DE CURSOS */}
      {loadingCursos ? (
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
                key={curso.id_curso}
                href={`/campus/campus-estudiante/inicio-campus/cursos/mis-cursos/${curso.id_curso}?anio=${anioSeleccionado}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 hover:border-[#701C32]/20 transition-all duration-300 flex flex-col h-full overflow-hidden"
              >
                {/* Cabecera de la tarjeta */}
                <div className="relative h-28 w-full bg-[#701C32] flex items-center justify-center overflow-hidden">
                  <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10"></div>
                  <div className="absolute -left-8 -bottom-10 w-24 h-24 rounded-full bg-white/5"></div>
                  <BookOpen size={44} strokeWidth={1.5} className="text-[#FFF1E3] relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  <span className="absolute top-3 right-3 text-[9px] font-black bg-white/15 text-white px-2.5 py-1 rounded-full backdrop-blur-sm tracking-wider">
                    {anioSeleccionado}
                  </span>
                </div>

                <div className="flex flex-col flex-1 p-5">
                  <h3 className="font-black text-gray-800 text-sm mb-3 line-clamp-2 min-h-[40px] group-hover:text-[#701C32] transition-colors">
                    {curso.nombre || curso.curso_nombre}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#FFF1E3] border border-[#F8EBDD] flex items-center justify-center text-[10px] font-black text-[#701C32] shrink-0">
                      {(curso.docente_nombres?.[0] || "?")}{(curso.docente_apellidos?.[0] || "")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Docente</p>
                      <p className="text-[11px] text-gray-600 font-bold truncate">
                        {curso.docente_nombres} {curso.docente_apellidos}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-medium">Aula virtual</span>
                    <span className="text-[12px] font-black text-[#701C32] flex items-center gap-1 group-hover:gap-2 transition-all">
                      ENTRAR <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
              <BookOpen size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">No tienes cursos asignados para este año.</p>
              <p className="text-sm">Si crees que es un error, contacta a secretaría.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}