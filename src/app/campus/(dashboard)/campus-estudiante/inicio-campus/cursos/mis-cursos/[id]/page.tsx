"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Calendar, ClipboardList,
  GraduationCap, FileText, CheckCircle2, Clock, AlertCircle, FolderOpen,
  Presentation, Download
} from "lucide-react";
import { useUser } from "@/src/context/userContext";
import ModalEntregaTarea from "@/src/components/Tarea/ModalEntregaTarea";
import { toast } from "sonner";
import { DetalleCurso, Tarea } from "@/src/interfaces/academic";
import { apiFetch } from "@/src/lib/api";
import { registrarCursoVisitado } from "@/src/lib/cursosRecientes";

const NOMBRES_BIMESTRE = ["I Bimestre", "II Bimestre", "III Bimestre", "IV Bimestre"];

export default function DetalleCursoPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const anio = searchParams.get("anio");
  const { id_usuario, loading: userLoading } = useUser();

  const [data, setData] = useState<DetalleCurso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(null);

  // Agrupar tareas por bimestre (1 al 4)
  const tareasPorBimestre: Record<number, Tarea[]> = (data?.tareas || []).reduce((acc: any, tarea: Tarea) => {
    const bim = tarea.bimestre || 1;
    if (!acc[bim]) acc[bim] = [];
    acc[bim].push(tarea);
    return acc;
  }, {});

  // Agrupar materiales (contenido de clase) por bimestre
  const materialesPorBimestre: Record<number, any[]> = (data?.materiales || []).reduce((acc: any, mat: any) => {
    const bim = mat.bimestre || 1;
    if (!acc[bim]) acc[bim] = [];
    acc[bim].push(mat);
    return acc;
  }, {});

  const fetchDetalle = useCallback(async () => {
    if (!id_usuario || !id || !anio) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/gestion/curso-detalle/${id}/${id_usuario}?anio=${anio}`);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "No se pudo obtener el detalle del curso");
      }

      const result = await res.json();
      setData(result);

      // Registrar visita para "Visitados recientemente" del inicio
      if (result?.curso_nombre) {
        registrarCursoVisitado(id_usuario, {
          id_curso: Number(id),
          nombre: result.curso_nombre,
          docente: result.docente_nombre || "",
          anio: anio
        });
      }
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
      {/* Botón Volver */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-[#701C32] transition-colors font-medium"
      >
        <ArrowLeft size={20} /> Volver a mis cursos
      </button>

      {/* HEADER DEL CURSO: nombre + docente */}
      <div className="bg-[#701C32] rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute right-20 -bottom-16 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-[10px] font-bold tracking-widest mb-4 uppercase backdrop-blur-sm">
              <BookOpen size={12} /> Curso · {anio}
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">{data.curso_nombre}</h1>
            <p className="text-white/85 flex items-center gap-2 mt-3 text-sm md:text-base">
              <GraduationCap size={18} className="text-[#FFF1E3]" />
              <span className="font-bold">{data.docente_nombre || "Docente por asignar"}</span>
            </p>
          </div>
          <div className="hidden md:flex w-20 h-20 rounded-2xl bg-white/10 border border-white/15 items-center justify-center shrink-0">
            <BookOpen size={36} className="text-[#FFF1E3]" />
          </div>
        </div>
      </div>

      {/* CONTENIDO DEL CURSO: dividido en 4 bimestres */}
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="text-[#701C32]" /> Contenido del curso
          </h2>
          <span className="text-xs font-medium text-gray-400">
            {data.tareas.length} actividad{data.tareas.length === 1 ? "" : "es"} en total
          </span>
        </div>

        {[1, 2, 3, 4].map((bimestreNum) => {
          const tareasDelBimestre = tareasPorBimestre[bimestreNum] || [];
          const materialesDelBimestre = materialesPorBimestre[bimestreNum] || [];

          return (
            <div key={bimestreNum} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Cabecera del bimestre */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50/70 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#701C32] text-white flex items-center justify-center text-xs font-black">
                    {["I", "II", "III", "IV"][bimestreNum - 1]}
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                    {NOMBRES_BIMESTRE[bimestreNum - 1]}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                  {materialesDelBimestre.length} material{materialesDelBimestre.length === 1 ? "" : "es"} · {tareasDelBimestre.length} actividad{tareasDelBimestre.length === 1 ? "" : "es"}
                </span>
              </div>

              {/* Cuerpo del bimestre: 2 secciones */}
              <div className="p-5 space-y-6">

                {/* SECCIÓN 1: CONTENIDO DE CLASE */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#093E7A]">
                    <Presentation size={16} />
                    <h4 className="text-xs font-black uppercase tracking-wide">Contenido de clase</h4>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{materialesDelBimestre.length}</span>
                  </div>

                  {materialesDelBimestre.length > 0 ? (
                    <div className="grid gap-3">
                      {materialesDelBimestre.map((material: any) => (
                        <div
                          key={material.id_material}
                          className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#093E7A]/30 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="p-3 rounded-xl bg-blue-50 text-[#093E7A] shrink-0">
                              <Presentation size={22} />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-gray-800 truncate">{material.titulo}</h5>
                              {material.descripcion && (
                                <p className="text-xs text-gray-400 truncate mt-0.5">{material.descripcion}</p>
                              )}
                            </div>
                          </div>
                          {material.archivo_url && (
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL}${material.archivo_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs font-bold text-[#093E7A] bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition shrink-0"
                            >
                              <Download size={14} /> Ver
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50/60 rounded-xl border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 text-xs font-medium">Aún no hay contenido de clase publicado.</p>
                    </div>
                  )}
                </div>

                {/* SECCIÓN 2: TAREAS Y EXÁMENES */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[#701C32]">
                    <ClipboardList size={16} />
                    <h4 className="text-xs font-black uppercase tracking-wide">Tareas y exámenes</h4>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tareasDelBimestre.length}</span>
                  </div>

                {tareasDelBimestre.length > 0 ? (
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
                              const endpoint = tarea.entregado
                                ? `/virtual/tareas/${idReal}/${id_usuario}`
                                : `/virtual/tareas/${idReal}`;

                              const res = await apiFetch(endpoint);
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
                                  <Calendar size={12} /> {tarea.fecha_entrega ? `Entrega: ${new Date(tarea.fecha_entrega).toLocaleDateString()}` : "Sin fecha límite"}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              {tarea.entregado ? (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md flex items-center gap-1">
                                  <CheckCircle2 size={12} /> ENTREGADO
                                </span>
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
                ) : (
                  <div className="text-center py-6 bg-gray-50/60 rounded-xl border-2 border-dashed border-gray-200">
                    <FolderOpen size={28} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-xs font-medium">
                      Aún no hay tareas ni exámenes en este bimestre.
                    </p>
                  </div>
                )}
                </div>
              </div>
            </div>
          );
        })}
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
    </div>
  );
}
