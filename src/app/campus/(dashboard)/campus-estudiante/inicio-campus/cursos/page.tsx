"use client";
import { useEffect, useState, useCallback } from "react"; // 1. Agregamos useCallback
import { ArrowRight, ChevronDown, Loader2, BookOpen, AlertCircle } from "lucide-react";
import { Curso, AnioEscolar } from "@/src/interfaces/academic";
import { useUser } from "@/src/context/userContext";
import Link from "next/link";

interface CursoCards extends Curso {
  docente_nombres: string;
  docente_apellidos: string;
  url_perfil_docente?: string;
  curso_nombre?: string;
}

export default function CursosPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [cursos, setCursos] = useState<CursoCards[]>([]);
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar Años (Solo al montar el componente)
  useEffect(() => {
    const fetchAnios = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/anios/`);
        if (!res.ok) throw new Error("Error al obtener años escolares");
        const data: AnioEscolar[] = await res.json();
        setAnios(data);

        // Priorizar el año activo
        const actual = data.find(a => a.activo);
        if (actual) {
          setAnioSeleccionado(String(actual.id_anio_escolar));
        } else if (data.length > 0) {
          setAnioSeleccionado(String(data[0].id_anio_escolar));
        }
      } catch (error) {
        console.error("Error cargando años:", error);
        setError("No se pudieron cargar los periodos académicos");
      }
    };
    fetchAnios();
  }, []);

  // 2. Función de carga de cursos (Memorizada para evitar renders infinitos)
  const fetchMisCursos = useCallback(async (uid: number, anio: string) => {
    setLoadingCursos(true);
    setError(null);
    try {

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/mis-cursos/${uid}?anio=${anio}`);

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
  if (userLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500 animate-pulse">Cargando perfil...</p>
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
          <span className="text-sm font-medium text-gray-600">Periodo:</span>
          <div className="relative">
            <select
              value={anioSeleccionado}
              onChange={(e) => {
                setCursos([]); // Limpiamos cursos actuales para feedback visual
                setAnioSeleccionado(e.target.value);
              }}
              className="appearance-none bg-white border-2 border-gray-200 hover:border-[#701C32] text-gray-700 text-sm py-2 pl-4 pr-10 rounded-xl focus:outline-none transition-all cursor-pointer font-bold"
            >
              {anios.map(a => (
                <option key={a.id_anio_escolar} value={a.id_anio_escolar}>
                  Año Académico {a.id_anio_escolar}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
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
                key={curso.id_curso}
                className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
              >
                <div className="h-32 w-full flex items-center justify-center mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-gray-400 group-hover:text-[#701C32] transition-colors">
                  <BookOpen size={48} strokeWidth={1.5} />
                </div>

                <div className="flex flex-col flex-1">
                  <h3 className="font-black text-gray-800 text-sm mb-2 line-clamp-2 min-h-[40px]">
                    {curso.nombre || curso.curso_nombre}
                  </h3>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-[#701C32]/10 flex items-center justify-center text-[10px] font-bold text-[#701C32]">
                      {curso.docente_nombres[0]}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      {curso.docente_nombres} {curso.docente_apellidos}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-50 flex justify-end">
                    <Link
                      href={`/campus/campus-estudiante/inicio-campus/cursos/mis-cursos/${curso.id_curso}?anio=${anioSeleccionado}`}
                      className="text-[12px] font-black text-[#701C32] flex items-center gap-1 group-hover:gap-2 transition-all"
                    >
                      ENTRAR <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
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