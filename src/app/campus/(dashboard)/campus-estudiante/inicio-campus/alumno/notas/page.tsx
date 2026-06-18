"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/src/context/userContext";
import {
  BookOpen, Loader2, AlertCircle, GraduationCap, ClipboardList,
  Star, FileText, ChevronDown
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ResumenNota } from "@/src/interfaces/datos_alumno";
import { toast } from "sonner";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";

interface TareaNota {
  id_tarea: number;
  titulo: string;
  fecha_entrega: string;
  entregado: boolean;
  nota?: number | null;
  peso: number;
  bimestre: number;
}

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

  // Curso seleccionado en el combobox
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>("");
  const [tareas, setTareas] = useState<TareaNota[]>([]);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // 1. Cargar la lista de cursos con su resumen de notas
  const fetchResumen = useCallback(async (uid: number, anio: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/gestion/resumen-notas/${uid}?anio=${anio}`);
      if (!res.ok) throw new Error("Error al cargar notas");
      const data = await res.json();
      setResumen(Array.isArray(data) ? data : []);
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

  useEffect(() => {
    if (!userLoading && id_usuario && anioSeleccionado) {
      setCursoSeleccionado("");
      setTareas([]);
      fetchResumen(id_usuario, anioSeleccionado);
    }
  }, [id_usuario, userLoading, anioSeleccionado, fetchResumen]);

  // 2. Al elegir un curso, cargar el detalle de sus evaluaciones
  useEffect(() => {
    const fetchDetalleCurso = async () => {
      if (!cursoSeleccionado || !id_usuario || !anioSeleccionado) {
        setTareas([]);
        return;
      }
      setLoadingDetalle(true);
      try {
        const res = await apiFetch(`/gestion/curso-detalle/${cursoSeleccionado}/${id_usuario}?anio=${anioSeleccionado}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setTareas(Array.isArray(data?.tareas) ? data.tareas : []);
      } catch {
        setTareas([]);
      } finally {
        setLoadingDetalle(false);
      }
    };
    fetchDetalleCurso();
  }, [cursoSeleccionado, id_usuario, anioSeleccionado]);

  if (userLoading) {
    return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#701C32]" /></div>;
  }

  const curso = resumen.find(c => c.id_curso.toString() === cursoSeleccionado);

  const notasBimestre = curso ? [
    { label: "Bimestre I", valor: curso.nota_bimestre1 },
    { label: "Bimestre II", valor: curso.nota_bimestre2 },
    { label: "Bimestre III", valor: curso.nota_bimestre3 },
    { label: "Bimestre IV", valor: curso.nota_bimestre4 },
  ] : [];

  const colorNota = (valor?: number | null) => {
    const n = Number(valor || 0);
    if (n === 0) return "text-gray-300";
    if (n < 11) return "text-red-600";
    if (n < 14) return "text-amber-600";
    return "text-green-600";
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32] mb-2">Mis Notas</h1>
          <p className="text-gray-500 text-sm">Selecciona un curso para consultar tus calificaciones</p>
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

      {/* COMBOBOX DE CURSO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
          <BookOpen size={14} className="text-[#701C32]" /> Curso a consultar
        </label>
        <div className="relative">
          <select
            value={cursoSeleccionado}
            onChange={(e) => setCursoSeleccionado(e.target.value)}
            disabled={loading || resumen.length === 0}
            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#701C32]/20 focus:border-[#701C32]/40 disabled:opacity-60 cursor-pointer"
          >
            <option value="">
              {loading ? "Cargando cursos..." : resumen.length === 0 ? "No tienes cursos este año" : "-- Selecciona un curso --"}
            </option>
            {resumen.map((c) => (
              <option key={c.id_curso} value={c.id_curso}>
                {c.curso_nombre}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* ESTADO INICIAL: SIN CURSO SELECCIONADO */}
      {!cursoSeleccionado && !loading && (
        <div className="bg-white rounded-2xl p-14 text-center border-2 border-dashed border-gray-200">
          <div className="bg-[#FFF1E3] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#701C32]">
            <GraduationCap size={36} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Consulta tus calificaciones</h3>
          <p className="text-gray-500 text-sm">
            Elige un curso en el selector de arriba para ver tus notas por bimestre y evaluaciones.
          </p>
        </div>
      )}

      {/* RESULTADOS DEL CURSO SELECCIONADO */}
      {curso && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* CABECERA DEL CURSO + PROMEDIO */}
          <div className="bg-[#701C32] rounded-3xl p-7 text-white shadow-lg flex items-center justify-between relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Curso seleccionado</p>
              <h2 className="text-2xl font-black">{curso.curso_nombre}</h2>
            </div>
            <div className="relative z-10 text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Promedio final</p>
              <span className="text-5xl font-black">
                {Number(curso.promedio_final || 0) > 0 ? Number(curso.promedio_final).toFixed(1) : "--"}
              </span>
            </div>
          </div>

          {/* LISTA DE NOTAS POR BIMESTRE */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2">
              <Star size={16} className="text-[#701C32]" />
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Notas por bimestre</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {notasBimestre.map((b) => (
                <div key={b.label} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <span className="text-sm font-bold text-gray-600">{b.label}</span>
                  <span className={`text-xl font-black ${colorNota(b.valor)}`}>
                    {Number(b.valor || 0) > 0 ? Number(b.valor).toFixed(1) : "--"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* LISTA DE EVALUACIONES CALIFICADAS */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-[#701C32]" />
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Detalle de evaluaciones</h3>
              </div>
              {loadingDetalle && <Loader2 size={16} className="animate-spin text-[#701C32]" />}
            </div>

            {loadingDetalle ? (
              <div className="p-10 text-center text-gray-400 text-sm">Cargando evaluaciones...</div>
            ) : tareas.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {tareas
                  .sort((a, b) => a.bimestre - b.bimestre)
                  .map((t) => (
                    <div key={t.id_tarea} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#FFF1E3] border border-[#F8EBDD] flex items-center justify-center text-[#701C32] shrink-0">
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-700 truncate">{t.titulo}</p>
                          <p className="text-[11px] text-gray-400">
                            Bimestre {t.bimestre} · Peso {t.peso}%
                          </p>
                        </div>
                      </div>
                      <span className={`text-lg font-black shrink-0 ${t.nota !== null && t.nota !== undefined ? colorNota(t.nota) : "text-gray-300"}`}>
                        {t.nota !== null && t.nota !== undefined ? Number(t.nota).toFixed(1) : "Sin calificar"}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-400 text-sm">
                Este curso aún no tiene evaluaciones registradas.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
