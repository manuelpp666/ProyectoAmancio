"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, GraduationCap, Users, Loader2, FileText, Calendar,
  FolderOpen, Plus, Pencil, Trash2, Eye, Check, CalendarOff,
  BarChart3, Search, Edit2, Presentation, Download, ClipboardList
} from "lucide-react";
import ModalCrearTarea from "@/src/components/Tarea/ModalCrearTarea";
import ModalCrearMaterial from "@/src/components/Tarea/ModalCrearMaterial";
import ModalVerEntregas from "@/src/components/Tarea/ModalVerEntregas";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";

const NOMBRES_BIMESTRE = ["I Bimestre", "II Bimestre", "III Bimestre", "IV Bimestre"];
const ROMANOS = ["I", "II", "III", "IV"];

const TIPO_LABEL: Record<string, string> = {
  TAREA: "Tarea",
  EXAMEN_PARCIAL: "Examen Parcial",
  EXAMEN_BIMESTRAL: "Examen Bimestral"
};

export default function DetalleCursoDocente() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const idCarga = params.id;
  const anio = searchParams.get("anio");

  const [activeTab, setActiveTab] = useState<"contenido" | "notas">("contenido");

  // --- Datos del curso (header + tareas de los 4 bimestres) ---
  const [info, setInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  // --- Edición por bimestre ---
  const [bimestresEnEdicion, setBimestresEnEdicion] = useState<number[]>([]);

  // --- Modales ---
  const [showModal, setShowModal] = useState(false);
  const [modalBimestre, setModalBimestre] = useState(1);
  const [tareaAEditar, setTareaAEditar] = useState<any>(null);
  const [tareaVerEntregas, setTareaVerEntregas] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [tareaAEliminar, setTareaAEliminar] = useState<any>(null);

  // --- Materiales (contenido de clase) ---
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialBimestre, setMaterialBimestre] = useState(1);
  const [isConfirmMatOpen, setIsConfirmMatOpen] = useState(false);
  const [materialAEliminar, setMaterialAEliminar] = useState<any>(null);

  // --- Registro de notas (sábana) ---
  const [datos, setDatos] = useState<any>(null);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [bimestre, setBimestre] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [editandoNotas, setEditandoNotas] = useState(false);
  const [notasTemporales, setNotasTemporales] = useState<any>({});
  const [isCerrarBimestreOpen, setIsCerrarBimestreOpen] = useState(false);

  const fetchInfo = useCallback(async () => {
    setLoadingInfo(true);
    try {
      const res = await apiFetch(`/virtual/curso-docente-detalle/${idCarga}`);
      if (!res.ok) throw new Error("No se pudo cargar el curso");
      const data = await res.json();
      setInfo(data);
    } catch (err) {
      console.error("Error al cargar curso:", err);
    } finally {
      setLoadingInfo(false);
    }
  }, [idCarga]);

  const fetchSabana = useCallback(async () => {
    setLoadingNotas(true);
    try {
      const res = await apiFetch(`/virtual/sabana-notas/${idCarga}/${bimestre}`);
      const data = await res.json();
      setDatos(data);
    } catch (error) {
      console.error("Error al cargar notas:", error);
    } finally {
      setLoadingNotas(false);
    }
  }, [idCarga, bimestre]);

  useEffect(() => {
    if (idCarga) fetchInfo();
  }, [idCarga, fetchInfo]);

  useEffect(() => {
    if (idCarga && activeTab === "notas") fetchSabana();
  }, [idCarga, bimestre, activeTab, fetchSabana]);

  // Agrupar tareas por bimestre
  const tareasPorBimestre: Record<number, any[]> = (info?.tareas || []).reduce((acc: any, t: any) => {
    const b = t.bimestre || 1;
    if (!acc[b]) acc[b] = [];
    acc[b].push(t);
    return acc;
  }, {});

  const materialesPorBimestre: Record<number, any[]> = (info?.materiales || []).reduce((acc: any, m: any) => {
    const b = m.bimestre || 1;
    if (!acc[b]) acc[b] = [];
    acc[b].push(m);
    return acc;
  }, {});

  const abrirNuevoMaterial = (bim: number) => {
    setMaterialBimestre(bim);
    setShowMaterialModal(true);
  };

  const openDeleteMaterial = (material: any) => {
    setMaterialAEliminar(material);
    setIsConfirmMatOpen(true);
  };

  const executeDeleteMaterial = async () => {
    if (!materialAEliminar) return;
    const toastId = toast.loading("Eliminando material...");
    try {
      const res = await apiFetch(`/virtual/materiales/${materialAEliminar.id_material}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Error al eliminar");
      }
      toast.success("Material eliminado", { id: toastId });
      fetchInfo();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setMaterialAEliminar(null);
    }
  };

  const pesoUsado = (bim: number, excluirIdTarea?: number) =>
    (tareasPorBimestre[bim] || []).reduce(
      (acc, t) => acc + (t.id_tarea === excluirIdTarea ? 0 : (t.peso || 0)),
      0
    );

  const toggleEdicion = (bim: number) => {
    setBimestresEnEdicion((prev) =>
      prev.includes(bim) ? prev.filter((b) => b !== bim) : [...prev, bim]
    );
  };

  const abrirNuevaTarea = (bim: number) => {
    setTareaAEditar(null);
    setModalBimestre(bim);
    setShowModal(true);
  };

  const abrirEditarTarea = (tarea: any) => {
    setTareaAEditar(tarea);
    setModalBimestre(tarea.bimestre);
    setShowModal(true);
  };

  const openDeleteConfirm = (tarea: any) => {
    if (tarea.total_entregas > 0) {
      toast.error("No se puede eliminar: ya hay alumnos que subieron archivos.");
      return;
    }
    setTareaAEliminar(tarea);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!tareaAEliminar) return;
    const toastId = toast.loading("Eliminando...");
    try {
      const res = await apiFetch(`/virtual/tareas/${tareaAEliminar.id_tarea}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Error al eliminar");
      }
      toast.success("Actividad eliminada", { id: toastId });
      fetchInfo();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setTareaAEliminar(null);
    }
  };

  // --- Lógica de notas ---
  const pesoTotal = datos?.evaluaciones?.reduce((acc: number, t: any) => acc + (t.peso || 0), 0) || 0;
  const esPesoValido = pesoTotal === 100;

  const handleNotaChange = (idAlumno: number, idTarea: number, valor: string) => {
    setNotasTemporales({ ...notasTemporales, [`${idAlumno}_${idTarea}`]: valor });
  };

  const guardarNotas = async (idTarea: number) => {
    const notasParaEnviar: any = {};
    Object.keys(notasTemporales).forEach((key) => {
      const [alId, tarId] = key.split("_");
      if (Number(tarId) === idTarea) notasParaEnviar[alId] = Number(notasTemporales[key]);
    });
    if (Object.keys(notasParaEnviar).length === 0) {
      setEditandoNotas(false);
      return;
    }
    const toastId = toast.loading("Publicando notas...");
    try {
      const res = await apiFetch(`/virtual/guardar-notas-masivo/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_tarea: idTarea, notas: notasParaEnviar })
      });
      if (!res.ok) throw new Error("Error al guardar");
      toast.success("Notas publicadas", { id: toastId });
      setEditandoNotas(false);
      fetchSabana();
    } catch (error) {
      toast.error("No se pudieron guardar las notas", { id: toastId });
    }
  };

  const cerrarBimestre = async () => {
    const toastId = toast.loading("Cerrando bimestre...");
    try {
      const res = await apiFetch(`/gestion/cerrar-bimestre/${idCarga}/${bimestre}`, { method: "POST" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Error al cerrar bimestre");
      }
      toast.success(`¡Bimestre ${bimestre} cerrado!`, { id: toastId });
      fetchSabana();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  const alumnosFiltrados = datos?.alumnos_notas?.filter((a: any) =>
    a.nombres_completos.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingInfo && !info) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500 animate-pulse">Cargando información del curso...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Botón volver */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-[#701C32] transition-colors font-medium"
      >
        <ArrowLeft size={20} /> Volver a mis cursos
      </button>

      {/* HEADER DEL CURSO */}
      <div className="bg-[#701C32] rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute right-20 -bottom-16 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-[10px] font-bold tracking-widest mb-4 uppercase backdrop-blur-sm">
              <BookOpen size={12} /> Curso · {anio}
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">{info?.curso_nombre}</h1>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm md:text-base">
              <span className="text-white/85 flex items-center gap-2">
                <GraduationCap size={18} className="text-[#FFF1E3]" />
                <span className="font-bold">{info?.grado_nombre} {info?.seccion_nombre}</span>
              </span>
              <span className="text-white/85 flex items-center gap-2">
                <Users size={16} className="text-[#FFF1E3]" />
                <span className="font-bold">{info?.num_alumnos ?? 0} alumnos</span>
              </span>
            </div>
          </div>
          <div className="hidden md:flex w-20 h-20 rounded-2xl bg-white/10 border border-white/15 items-center justify-center shrink-0">
            <BookOpen size={36} className="text-[#FFF1E3]" />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200 flex gap-6">
        <button
          onClick={() => setActiveTab("contenido")}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === "contenido" ? "border-b-2 border-[#701C32] text-[#701C32]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Contenido del curso
        </button>
        <button
          onClick={() => setActiveTab("notas")}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === "notas" ? "border-b-2 border-[#701C32] text-[#701C32]" : "text-gray-500 hover:text-gray-700"}`}
        >
          Registro de Notas
        </button>
      </div>

      {activeTab === "contenido" ? (
        /* --- CONTENIDO: 4 BIMESTRES --- */
        <div className="space-y-8">
          {[1, 2, 3, 4].map((bimestreNum) => {
            const tareas = tareasPorBimestre[bimestreNum] || [];
            const materiales = materialesPorBimestre[bimestreNum] || [];
            const enEdicion = bimestresEnEdicion.includes(bimestreNum);
            const usado = pesoUsado(bimestreNum);

            return (
              <div key={bimestreNum} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Cabecera del bimestre */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50/70 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#701C32] text-white flex items-center justify-center text-xs font-black">
                      {ROMANOS[bimestreNum - 1]}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        {NOMBRES_BIMESTRE[bimestreNum - 1]}
                      </h3>
                      <p className="text-[11px] text-gray-400 font-semibold">
                        {materiales.length} material{materiales.length === 1 ? "" : "es"} · {tareas.length} actividad{tareas.length === 1 ? "" : "es"} · {usado}% de 100% asignado
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleEdicion(bimestreNum)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${enEdicion
                      ? "bg-[#701C32] text-white hover:bg-[#5a1628]"
                      : "bg-white text-[#701C32] border border-[#701C32]/30 hover:bg-[#701C32]/5"}`}
                  >
                    {enEdicion ? <><Check size={14} /> Listo</> : <><Pencil size={14} /> Editar</>}
                  </button>
                </div>

                {/* Cuerpo del bimestre: 2 secciones */}
                <div className="p-5 space-y-6">

                  {/* ---- SECCIÓN 1: CONTENIDO DE CLASE ---- */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#093E7A]">
                      <Presentation size={16} />
                      <h4 className="text-xs font-black uppercase tracking-wide">Contenido de clase</h4>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{materiales.length}</span>
                    </div>

                    {materiales.length === 0 && !enEdicion ? (
                      <div className="text-center py-6 bg-gray-50/60 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 text-xs font-medium">Aún no hay contenido de clase publicado.</p>
                      </div>
                    ) : (
                      materiales.map((material: any) => (
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
                          <div className="flex items-center gap-1 shrink-0">
                            {material.archivo_url && (
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_URL}${material.archivo_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-[#093E7A] hover:bg-blue-50 rounded-lg transition"
                                title="Ver / descargar"
                              >
                                <Download size={16} />
                              </a>
                            )}
                            {enEdicion && (
                              <button
                                onClick={() => openDeleteMaterial(material)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}

                    {enEdicion && (
                      <button
                        onClick={() => abrirNuevoMaterial(bimestreNum)}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#093E7A] hover:text-[#093E7A] hover:bg-[#093E7A]/5 transition-all font-bold text-sm"
                      >
                        <Plus size={18} /> Agregar contenido de clase
                      </button>
                    )}
                  </div>

                  {/* ---- SECCIÓN 2: TAREAS Y EXÁMENES ---- */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[#701C32]">
                      <ClipboardList size={16} />
                      <h4 className="text-xs font-black uppercase tracking-wide">Tareas y exámenes</h4>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tareas.length}</span>
                    </div>

                  {tareas.length === 0 && !enEdicion ? (
                    <div className="text-center py-6 bg-gray-50/60 rounded-xl border-2 border-dashed border-gray-200">
                      <FolderOpen size={28} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-400 text-xs font-medium">Aún no hay tareas ni exámenes en este bimestre.</p>
                    </div>
                  ) : (
                    tareas.map((tarea: any) => (
                      <div
                        key={tarea.id_tarea}
                        className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#701C32]/30 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 rounded-xl bg-[#FFF1E3] text-[#701C32] shrink-0">
                            <FileText size={22} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-gray-800 truncate">{tarea.titulo}</h4>
                              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                                {TIPO_LABEL[tarea.tipo] || tarea.tipo}
                              </span>
                              {tarea.peso > 0 && (
                                <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                                  {tarea.peso}%
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              {tarea.fecha_entrega ? (
                                <><Calendar size={12} /> Límite: {new Date(tarea.fecha_entrega).toLocaleString("es-PE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</>
                              ) : (
                                <><CalendarOff size={12} /> Sin fecha límite</>
                              )}
                              <span className="mx-1 text-gray-300">•</span>
                              {tarea.total_entregas} / {info?.num_alumnos ?? 0} entregas
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setTareaVerEntregas(tarea)}
                            className="p-2 text-gray-400 hover:text-[#701C32] hover:bg-[#701C32]/5 rounded-lg transition"
                            title="Ver entregas"
                          >
                            <Eye size={16} />
                          </button>
                          {enEdicion && (
                            <>
                              <button
                                onClick={() => abrirEditarTarea(tarea)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Editar"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(tarea)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                    {/* Fila "+" para agregar (solo en edición) */}
                    {enEdicion && (
                      <button
                        onClick={() => abrirNuevaTarea(bimestreNum)}
                        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#701C32] hover:text-[#701C32] hover:bg-[#701C32]/5 transition-all font-bold text-sm"
                      >
                        <Plus size={18} /> Agregar tarea / examen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- REGISTRO DE NOTAS --- */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar alumno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#701C32]"
              />
            </div>
            <select
              value={bimestre}
              onChange={(e) => setBimestre(Number(e.target.value))}
              className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg p-2 font-bold outline-none"
            >
              {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b} Bimestre</option>)}
            </select>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => esPesoValido && setIsCerrarBimestreOpen(true)}
                disabled={!esPesoValido}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${esPesoValido ? "bg-[#701C32] text-white hover:bg-[#8a223d]" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                title={!esPesoValido ? "El peso total de las tareas debe ser 100% para cerrar" : ""}
              >
                <BarChart3 size={16} /> Cerrar Bimestre
              </button>
              {!editandoNotas ? (
                <button
                  onClick={() => setEditandoNotas(true)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                >
                  <Edit2 size={16} /> Calificar
                </button>
              ) : (
                <>
                  <button onClick={() => setEditandoNotas(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold">
                    Cancelar
                  </button>
                  {datos?.evaluaciones.map((ev: any) => (
                    <button
                      key={ev.id_tarea}
                      onClick={() => guardarNotas(ev.id_tarea)}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition"
                    >
                      Publicar {ev.titulo}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {loadingNotas && !datos ? (
            <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[#701C32]" size={36} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 w-10">#</th>
                    <th className="px-6 py-4 min-w-[250px]">Apellidos y Nombres</th>
                    {datos?.evaluaciones.map((evalu: any) => (
                      <th key={evalu.id_tarea} className="px-4 py-4 text-center w-24 border-x border-gray-100">
                        <div className="text-blue-800 font-bold">{evalu.titulo}</div>
                        <div className="text-[10px] text-gray-400 font-normal">{evalu.peso}% del total</div>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-center w-24 font-bold text-gray-900 bg-gray-50">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alumnosFiltrados?.map((alumno: any, index: number) => (
                    <tr key={alumno.id_alumno} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">{index + 1}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{alumno.nombres_completos}</td>
                      {datos?.evaluaciones.map((evalu: any) => (
                        <td key={evalu.id_tarea} className="px-4 py-4 text-center">
                          {editandoNotas ? (
                            <input
                              type="number"
                              min="0"
                              max="20"
                              className="w-12 text-center border border-blue-300 rounded p-1 focus:ring-2 ring-[#701C32] outline-none"
                              defaultValue={alumno.notas[evalu.id_tarea] ?? ""}
                              onChange={(e) => handleNotaChange(alumno.id_alumno, evalu.id_tarea, e.target.value)}
                            />
                          ) : (
                            <span className={`px-2 py-1 rounded font-mono ${alumno.notas[evalu.id_tarea] < 11 ? "bg-red-50 text-red-600" : "bg-gray-100"}`}>
                              {alumno.notas[evalu.id_tarea] ?? "-"}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-center font-bold text-[#701C32] bg-gray-50/30">
                        {alumno.promedio.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  {(!alumnosFiltrados || alumnosFiltrados.length === 0) && (
                    <tr>
                      <td colSpan={(datos?.evaluaciones?.length || 0) + 3} className="text-center py-10 text-gray-400 text-sm">
                        No hay alumnos para mostrar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODALES */}
      {showModal && (
        <ModalCrearTarea
          idCarga={Number(idCarga)}
          bimestre={modalBimestre}
          tareaExistente={tareaAEditar}
          pesoUsadoBimestre={pesoUsado(modalBimestre, tareaAEditar?.id_tarea)}
          onClose={() => {
            setShowModal(false);
            setTareaAEditar(null);
          }}
          onRefresh={() => {
            fetchInfo();
            if (activeTab === "notas") fetchSabana();
          }}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setTareaAEliminar(null);
        }}
        onConfirm={executeDelete}
        title="¿Eliminar Actividad?"
        message={`¿Estás seguro de que deseas eliminar "${tareaAEliminar?.titulo}"? Esta acción no se puede deshacer y borrará todas las notas asociadas.`}
        confirmText="Sí, eliminar tarea"
        type="danger"
      />

      <ConfirmModal
        isOpen={isCerrarBimestreOpen}
        onClose={() => setIsCerrarBimestreOpen(false)}
        onConfirm={cerrarBimestre}
        title={`¿Cerrar Bimestre ${bimestre}?`}
        message="Al cerrar el bimestre se calcularán los promedios finales. Asegúrate de que todas las notas hayan sido publicadas correctamente."
        confirmText="Sí, cerrar bimestre"
        type="warning"
      />

      {showMaterialModal && (
        <ModalCrearMaterial
          idCarga={Number(idCarga)}
          bimestre={materialBimestre}
          onClose={() => setShowMaterialModal(false)}
          onRefresh={fetchInfo}
        />
      )}

      <ConfirmModal
        isOpen={isConfirmMatOpen}
        onClose={() => {
          setIsConfirmMatOpen(false);
          setMaterialAEliminar(null);
        }}
        onConfirm={executeDeleteMaterial}
        title="¿Eliminar contenido de clase?"
        message={`¿Estás seguro de que deseas eliminar "${materialAEliminar?.titulo}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        type="danger"
      />

      {tareaVerEntregas && (
        <ModalVerEntregas tarea={tareaVerEntregas} onClose={() => setTareaVerEntregas(null)} />
      )}
    </div>
  );
}
