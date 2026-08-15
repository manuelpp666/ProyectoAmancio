"use client";

import { useState, useEffect, useCallback } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { toast } from "sonner";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { Seccion, Curso } from "@/src/interfaces/academic";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { RoleGuard } from "@/src/components/auth/RoleGuard";

export default function AsignacionDocentesPage() {
  
  const { anioPlanificacion, setAnioPlanificacion, listaAnios, loadingAnios } = useAnioAcademico();
  
  // --- ESTADO PARA PESTAÑAS (TABS) ---
  const [activeTab, setActiveTab] = useState<"carga" | "tutores">("carga");

  // --- ESTADOS DE DATOS ---
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [tutores, setTutores] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);

  // --- ESTADOS DE UI ---
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchDocente, setSearchDocente] = useState(""); 
  const [isDocenteDropdownOpen, setIsDocenteDropdownOpen] = useState(false);
  const [isTutorDocenteDropdownOpen, setIsTutorDocenteDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    id_seccion: "",
    id_curso: "",
    id_docente: ""
  });

  const [tutorFormData, setTutorFormData] = useState({
    id_seccion: "",
    id_docente: ""
  });

  // --- ESTADOS PARA MODALES DE CONFIRMACIÓN ---
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null
  });
  const [confirmDeleteTutor, setConfirmDeleteTutor] = useState<{ isOpen: boolean; id: number | null }>({
    isOpen: false,
    id: null
  });

  // --- LÓGICA DE FILTRADO ---
  const vinculosFiltrados = vinculos.filter((v: any) => {
    const nombreDocente = v.docente ? `${v.docente.nombres} ${v.docente.apellidos}`.toLowerCase() : "no definido";
    const nombreCurso = (v.curso_nombre ?? "").toLowerCase();
    const gradoSeccion = `${v.grado_nombre ?? ""} ${v.seccion_nombre ?? ""}`.toLowerCase();
    const busqueda = searchTerm.toLowerCase();
    return nombreDocente.includes(busqueda) || nombreCurso.includes(busqueda) || gradoSeccion.includes(busqueda);
  });

  const tutoresFiltradosList = tutores.filter((t: any) => {
    const nombreDocente = t.docente ? `${t.docente.nombres} ${t.docente.apellidos}`.toLowerCase() : "no definido";
    const gradoSeccion = `${t.grado_nombre ?? ""} ${t.seccion_nombre ?? ""}`.toLowerCase();
    const busqueda = searchTerm.toLowerCase();
    return nombreDocente.includes(busqueda) || gradoSeccion.includes(busqueda);
  });

  const docentesFiltrados = docentes.filter((d: any) =>
    `${d.nombres ?? ""} ${d.apellidos ?? ""}`.toLowerCase().includes(searchDocente.toLowerCase())
  );

  const docenteSeleccionado = docentes.find(d => String(d.id_docente) === String(formData.id_docente));
  const tutorDocenteSeleccionado = docentes.find(d => String(d.id_docente) === String(tutorFormData.id_docente));

  /**
   * Lee una respuesta que debe ser una lista.
   */
  const leerLista = async (res: Response, queEs: string): Promise<any[] | null> => {
    if (!res.ok) {
      toast.error(await mensajeDeError(res, `No se pudieron cargar ${queEs} (error ${res.status})`));
      return null;
    }
    try {
      const datos = await res.json();
      if (Array.isArray(datos)) return datos;
    } catch {
      // Respuesta sin JSON válido
    }
    toast.error(`La respuesta de ${queEs} no tiene el formato esperado`);
    return null;
  };

  const fetchData = useCallback(async () => {
    if (!anioPlanificacion) return;

    try {
      setLoading(true);
      const [resVinculos, resDocentes, resSecciones, resTutores] = await Promise.all([
        apiFetch(`/gestion/vinculos-academicos/${anioPlanificacion}`),
        apiFetch(`/gestion/docentes-disponibles/`),
        apiFetch(`/academic/secciones/${anioPlanificacion}`),
        apiFetch(`/gestion/tutores/${anioPlanificacion}`)
      ]);

      const [datosVinculos, datosDocentes, datosSecciones, datosTutores] = await Promise.all([
        leerLista(resVinculos, "los vínculos académicos"),
        leerLista(resDocentes, "los docentes"),
        leerLista(resSecciones, "las secciones"),
        leerLista(resTutores, "los tutores"),
      ]);

      setVinculos(datosVinculos ?? []);
      setDocentes(datosDocentes ?? []);
      setSecciones(datosSecciones ?? []);
      setTutores(datosTutores ?? []);
    } catch (error) {
      toast.error("Error al actualizar la vista");
    } finally {
      setLoading(false);
    }
  }, [anioPlanificacion]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const handleSeccionChange = async (id_seccion: string) => {
    setFormData(prev => ({ ...prev, id_seccion, id_curso: prev.id_seccion === id_seccion ? prev.id_curso : "" }));
    if (!id_seccion) {
      setCursosDisponibles([]);
      return;
    }
    try {
      const res = await apiFetch(`/academic/cursos-por-seccion/${id_seccion}`);
      const data = await res.json();
      setCursosDisponibles(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar cursos de la sección");
    }
  };

  // --- MÉTODOS PARA CARGA ACADÉMICA ---
  const handleEditar = (v: any) => {
    setEditingId(v.id_carga_academica || null);
    setFormData({
      id_seccion: v.id_seccion?.toString() || "",
      id_curso: v.id_curso?.toString() || "",
      id_docente: v.docente?.id_docente ? v.docente.id_docente.toString() : ""
    });
    setSearchDocente(v.docente ? `${v.docente.nombres} ${v.docente.apellidos}` : "");
    setIsDocenteDropdownOpen(false);
    if (v.id_seccion) {
      handleSeccionChange(v.id_seccion.toString());
    }
    setIsModalOpen(true);
  };

  const handleAsignarFila = (v: any) => {
    setEditingId(v.id_carga_academica || null);
    setFormData({
      id_seccion: v.id_seccion?.toString() || "",
      id_curso: v.id_curso?.toString() || "",
      id_docente: ""
    });
    setSearchDocente("");
    setIsDocenteDropdownOpen(true);
    if (v.id_seccion) {
      handleSeccionChange(v.id_seccion.toString());
    }
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSearchDocente("");
    setIsDocenteDropdownOpen(false);
    setFormData({ id_seccion: "", id_curso: "", id_docente: "" });
  };

  const guardarAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id_seccion) {
      toast.error("Debe seleccionar una sección");
      return;
    }
    if (!formData.id_curso) {
      toast.error("Debe seleccionar un curso");
      return;
    }
    if (!formData.id_docente) {
      toast.error("Debe seleccionar a un docente de la lista");
      setIsDocenteDropdownOpen(true);
      return;
    }

    const url = editingId ? `/gestion/carga/${editingId}` : `/gestion/carga/`;
    const method = editingId ? "PATCH" : "POST";
    const body = editingId
      ? JSON.stringify({ id_docente: parseInt(formData.id_docente) })
      : JSON.stringify({
          id_anio_escolar: anioPlanificacion,
          id_seccion: parseInt(formData.id_seccion),
          id_curso: parseInt(formData.id_curso),
          id_docente: parseInt(formData.id_docente),
        });

    const promise = apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    toast.promise(promise, {
      loading: 'Guardando asignación...',
      success: () => {
        cerrarModal();
        fetchData();
        return editingId ? "Asignación actualizada con éxito" : "Asignación creada con éxito";
      },
      error: (err) => `Error: ${err.message || 'No se pudo guardar'}`
    });
  };

  const handleEliminar = async (id: number) => {
    try {
      const res = await apiFetch(`/gestion/carga/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Asignación eliminada correctamente");
        fetchData();
      } else {
        const errorData = await res.json().catch(() => null);
        toast.error(errorData?.detail || "Una asignación que tiene notas o registros no se puede borrar, solo actualizar.", { duration: 6000 });
      }
    } catch (error) {
      toast.error("Error de conexión al eliminar");
    }
  };


  // --- NUEVOS MÉTODOS PARA TUTORES ---
  const cerrarModalTutor = () => {
    setIsTutorModalOpen(false);
    setSearchDocente("");
    setIsTutorDocenteDropdownOpen(false);
    setTutorFormData({ id_seccion: "", id_docente: "" });
  };

  const guardarTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorFormData.id_seccion) {
      toast.error("Debe seleccionar una sección");
      return;
    }
    if (!tutorFormData.id_docente) {
      toast.error("Debe seleccionar a un docente para la tutoría");
      setIsTutorDocenteDropdownOpen(true);
      return;
    }

    const promise = apiFetch(`/gestion/tutores/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_anio_escolar: anioPlanificacion,
        id_seccion: parseInt(tutorFormData.id_seccion),
        id_docente: parseInt(tutorFormData.id_docente),
      }),
    });

    toast.promise(promise, {
      loading: 'Asignando tutor...',
      success: () => {
        cerrarModalTutor();
        fetchData();
        return "Tutor asignado con éxito";
      },
      error: (err) => `Error: ${err.message || 'No se pudo asignar el tutor'}`
    });
  };

  const handleEliminarTutor = async (id: number) => {
    try {
      const res = await apiFetch(`/gestion/tutores/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Tutor removido correctamente");
        fetchData();
      } else {
        toast.error("No se pudo remover al tutor");
      }
    } catch (error) {
      toast.error("Error de conexión al remover");
    }
  };


  return (
    
    <RoleGuard modulo="academico" subModulo="docentes">
      <div className="flex h-full overflow-hidden bg-[#F8FAFC]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <HeaderPanel />

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            {/* TABS SUPERIORES */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Vínculos Académicos</h3>
                <div className="flex gap-4 sm:gap-6 border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("carga")}
                    className={`pb-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'carga' ? 'border-[#093E7A] text-[#093E7A]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">menu_book</span> Carga Académica <span className="hidden sm:inline">(Cursos)</span></span>
                  </button>
                  <button
                    onClick={() => setActiveTab("tutores")}
                    className={`pb-3 font-bold text-sm border-b-2 transition-all whitespace-nowrap ${activeTab === 'tutores' ? 'border-[#093E7A] text-[#093E7A]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">supervisor_account</span> Tutorías <span className="hidden sm:inline">de Sección</span></span>
                  </button>
                </div>
              </div>
              <AnioSelector 
                  value={anioPlanificacion}
                  onChange={setAnioPlanificacion}
                  anios={listaAnios}
                  loading={loadingAnios}
              />
            </div>

            {/* BARRA DE BÚSQUEDA Y BOTÓN NUEVO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-4">
              <div className="relative w-full max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                <input
                  type="text"
                  placeholder={activeTab === "carga" ? "Buscar por curso, grado o docente..." : "Buscar por sección o tutor..."}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* BOTONES DINÁMICOS SEGÚN EL TAB */}
              {activeTab === "carga" ? (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setSearchDocente("");
                    setIsDocenteDropdownOpen(false);
                    setFormData({ id_seccion: "", id_curso: "", id_docente: "" });
                    setIsModalOpen(true);
                  }}
                  disabled={!anioPlanificacion}
                  className="flex items-center gap-2 px-6 py-3 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-bold shadow-lg"
                >
                  <span className="material-symbols-outlined">add_link</span>
                  Nueva Asignación
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSearchDocente("");
                    setIsTutorDocenteDropdownOpen(false);
                    setTutorFormData({ id_seccion: "", id_docente: "" });
                    setIsTutorModalOpen(true);
                  }}
                  disabled={!anioPlanificacion}
                  className="flex items-center gap-2 px-6 py-3 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-bold shadow-lg"
                >
                  <span className="material-symbols-outlined">how_to_reg</span>
                  Asignar Tutor
                </button>
              )}
            </div>

            {/* TABLA PRINCIPAL DINÁMICA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                
                <thead className="bg-gray-50/80">
                  {activeTab === "carga" ? (
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Curso</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Grado/Sección</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Docente</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right">Acciones</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Grado/Sección</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Docente (Tutor)</th>
                      <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right">Acciones</th>
                    </tr>
                  )}
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 animate-pulse">Cargando...</td></tr>
                  ) : activeTab === "carga" ? (
                    // --- RENDERIZADO TABLA CARGA ACADÉMICA ---
                    vinculosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          <span className="material-symbols-outlined text-4xl block mb-2">info</span>
                          No hay cursos ni asignaciones que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      vinculosFiltrados.map((v: any, i) => (
                        <tr key={v.id_carga_academica || `vinc-${i}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800">{v.curso_nombre}</td>
                          <td className="px-6 py-4 text-gray-600 font-medium">{v.grado_nombre} - Sección {v.seccion_nombre}</td>
                          <td className="px-6 py-4">
                            {v.docente ? (
                              <div className="flex items-center gap-2 text-[#093E7A] font-semibold">
                                <span className="material-symbols-outlined text-sm">person</span>
                                <span>{v.docente.nombres} {v.docente.apellidos}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full w-fit border border-amber-200 text-xs">
                                <span className="material-symbols-outlined text-sm text-amber-500">person_off</span>
                                <span>No definido</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 items-center">
                              {v.docente ? (
                                <>
                                  <button
                                    onClick={() => handleEditar(v)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar / Reasignar docente"
                                  >
                                    <span className="material-symbols-outlined text-xl">edit</span>
                                  </button>
                                  {v.id_carga_academica && (
                                    <button
                                      onClick={() => setConfirmDelete({ isOpen: true, id: v.id_carga_academica })}
                                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Eliminar asignación"
                                    >
                                      <span className="material-symbols-outlined text-xl">delete</span>
                                    </button>
                                  )}
                                </>
                              ) : (
                                <button
                                  onClick={() => handleAsignarFila(v)}
                                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#093E7A] text-white hover:bg-[#062d59] rounded-xl transition-all text-xs font-bold shadow-sm"
                                  title="Asignar docente a este curso"
                                >
                                  <span className="material-symbols-outlined text-sm">person_add</span>
                                  <span>Asignar</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    // --- RENDERIZADO TABLA TUTORES ---
                    tutoresFiltradosList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                          <span className="material-symbols-outlined text-4xl block mb-2">supervisor_account</span>
                          No hay tutores asignados a las secciones en este año.
                        </td>
                      </tr>
                    ) : (
                      tutoresFiltradosList.map((t: any) => (
                        <tr key={t.id_tutor_seccion} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-800">{t.grado_nombre} - Sección {t.seccion_nombre}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-[#093E7A] font-bold bg-blue-50 px-3 py-1 rounded-full w-fit border border-blue-100">
                              <span className="material-symbols-outlined text-sm">person</span>
                              {t.docente ? `${t.docente.nombres} ${t.docente.apellidos}` : "No definido"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setConfirmDeleteTutor({ isOpen: true, id: t.id_tutor_seccion })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Remover Tutor">
                                <span className="material-symbols-outlined text-xl">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL FORMULARIO CARGA ACADÉMICA --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
            <form onSubmit={guardarAsignacion}>
              <div className="bg-[#093E7A] px-6 py-5 flex justify-between items-start text-white rounded-t-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">link</span></div>
                  <div>
                    <h3 className="font-black text-lg leading-tight">{editingId ? "Editar Asignación" : "Asignar Docente al Curso"}</h3>
                    <p className="text-[11px] text-white/70 mt-0.5">Vincula un docente a un curso de una sección.</p>
                  </div>
                </div>
                <button type="button" onClick={cerrarModal} className="hover:text-gray-300 mt-0.5">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sección</label>
                  <select
                    required
                    disabled={editingId !== null || (formData.id_seccion !== "" && formData.id_curso !== "" && !editingId && Boolean(cursosDisponibles.length))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20 font-medium text-gray-800 disabled:opacity-80"
                    value={formData.id_seccion}
                    onChange={(e) => handleSeccionChange(e.target.value)}
                  >
                    <option value="">Seleccione una sección...</option>
                    {secciones.map(s => {
                      const nivel = s.grado?.nivel?.nombre ? `${s.grado.nivel.nombre} · ` : "";
                      const grado = s.grado?.nombre || "Grado";
                      return (
                        <option key={s.id_seccion} value={s.id_seccion}>
                          {nivel}{grado} - Sección {s.nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
                  <select
                    required
                    disabled={editingId !== null || !formData.id_seccion || (formData.id_curso !== "" && !editingId && Boolean(cursosDisponibles.length))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20 disabled:opacity-80 font-medium text-gray-800"
                    value={formData.id_curso}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_curso: e.target.value }))}
                  >
                    <option value="">{formData.id_seccion ? "Seleccione el curso..." : "Primero elija una sección"}</option>
                    {cursosDisponibles.map(c => (
                      <option key={c.id_curso} value={c.id_curso}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* BUSCADOR DE DOCENTE EN TIEMPO REAL */}
                <div className="pt-2 border-t relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Asignar Docente</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">person_search</span>
                      <input
                        type="text"
                        placeholder="Escriba el nombre del docente..."
                        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20 font-medium text-gray-800 text-sm"
                        value={searchDocente}
                        onFocus={() => setIsDocenteDropdownOpen(true)}
                        onChange={(e) => {
                          setSearchDocente(e.target.value);
                          setIsDocenteDropdownOpen(true);
                          if (!e.target.value.trim()) {
                            setFormData(prev => ({ ...prev, id_docente: "" }));
                          }
                        }}
                      />
                      {searchDocente && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchDocente("");
                            setFormData(prev => ({ ...prev, id_docente: "" }));
                            setIsDocenteDropdownOpen(true);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>

                    {/* LISTA FLOTANTE DE DOCENTES FILTRADOS EN VIVO */}
                    {isDocenteDropdownOpen && (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-50 animate-in fade-in zoom-in-95 duration-100">
                        {docentesFiltrados.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400 font-medium">
                            <span className="material-symbols-outlined text-base block mb-1 text-gray-300">person_off</span>
                            No se encontraron docentes con ese nombre
                          </div>
                        ) : (
                          docentesFiltrados.map((d: any) => {
                            const isSelected = String(formData.id_docente) === String(d.id_docente);
                            return (
                              <button
                                key={d.id_docente}
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, id_docente: String(d.id_docente) }));
                                  setSearchDocente(`${d.nombres} ${d.apellidos}`);
                                  setIsDocenteDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-blue-50/70 transition-colors ${isSelected ? 'bg-blue-50 font-bold text-[#093E7A]' : 'text-gray-700'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isSelected ? 'bg-[#093E7A] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {(d.nombres?.[0] || 'D').toUpperCase()}{(d.apellidos?.[0] || '').toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold leading-tight">{d.nombres} {d.apellidos}</p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-lg text-[#093E7A]">check_circle</span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* INDICADOR VISUAL DEL DOCENTE SELECCIONADO */}
                    {docenteSeleccionado && (
                      <div className="flex items-center justify-between bg-blue-50/80 border border-blue-100 rounded-xl px-3.5 py-2">
                        <div className="flex items-center gap-2.5 text-xs text-[#093E7A] font-bold">
                          <span className="material-symbols-outlined text-base text-green-600">verified</span>
                          <span>Docente seleccionado: {docenteSeleccionado.nombres} {docenteSeleccionado.apellidos}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, id_docente: "" }));
                            setSearchDocente("");
                            setIsDocenteDropdownOpen(true);
                          }}
                          className="text-[11px] font-bold text-blue-700 hover:underline"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 rounded-b-2xl">
                <button type="button" onClick={cerrarModal} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-[#093E7A] text-white rounded-xl font-bold hover:bg-[#062d59] transition-all shadow-md">Guardar Vínculo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL FORMULARIO TUTORES --- */}
      {isTutorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
            <form onSubmit={guardarTutor}>
              <div className="bg-[#093E7A] px-6 py-5 flex justify-between items-start text-white rounded-t-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">supervisor_account</span></div>
                  <div>
                    <h3 className="font-black text-lg leading-tight">Asignar Tutor</h3>
                    <p className="text-[11px] text-white/70 mt-0.5">Designa al docente tutor de una sección.</p>
                  </div>
                </div>
                <button type="button" onClick={cerrarModalTutor} className="hover:text-gray-300 mt-0.5">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sección de Tutoría</label>
                  <select
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20 font-medium text-gray-800"
                    value={tutorFormData.id_seccion}
                    onChange={(e) => setTutorFormData(prev => ({ ...prev, id_seccion: e.target.value }))}
                  >
                    <option value="">Seleccione una sección...</option>
                    {secciones.map(s => {
                      const nivel = s.grado?.nivel?.nombre ? `${s.grado.nivel.nombre} · ` : "";
                      const grado = s.grado?.nombre || "Grado";
                      return (
                        <option key={s.id_seccion} value={s.id_seccion}>
                          {nivel}{grado} - Sección {s.nombre}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* BUSCADOR DE TUTOR EN TIEMPO REAL */}
                <div className="pt-2 border-t relative">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Asignar Docente como Tutor</label>
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">person_search</span>
                      <input
                        type="text"
                        placeholder="Escriba el nombre del docente..."
                        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20 font-medium text-gray-800 text-sm"
                        value={searchDocente}
                        onFocus={() => setIsTutorDocenteDropdownOpen(true)}
                        onChange={(e) => {
                          setSearchDocente(e.target.value);
                          setIsTutorDocenteDropdownOpen(true);
                          if (!e.target.value.trim()) {
                            setTutorFormData(prev => ({ ...prev, id_docente: "" }));
                          }
                        }}
                      />
                      {searchDocente && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchDocente("");
                            setTutorFormData(prev => ({ ...prev, id_docente: "" }));
                            setIsTutorDocenteDropdownOpen(true);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      )}
                    </div>

                    {/* LISTA FLOTANTE DE DOCENTES FILTRADOS */}
                    {isTutorDocenteDropdownOpen && (
                      <div className="bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-50 animate-in fade-in zoom-in-95 duration-100">
                        {docentesFiltrados.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-400 font-medium">
                            <span className="material-symbols-outlined text-base block mb-1 text-gray-300">person_off</span>
                            No se encontraron docentes con ese nombre
                          </div>
                        ) : (
                          docentesFiltrados.map((d: any) => {
                            const isSelected = String(tutorFormData.id_docente) === String(d.id_docente);
                            return (
                              <button
                                key={d.id_docente}
                                type="button"
                                onClick={() => {
                                  setTutorFormData(prev => ({ ...prev, id_docente: String(d.id_docente) }));
                                  setSearchDocente(`${d.nombres} ${d.apellidos}`);
                                  setIsTutorDocenteDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-blue-50/70 transition-colors ${isSelected ? 'bg-blue-50 font-bold text-[#093E7A]' : 'text-gray-700'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${isSelected ? 'bg-[#093E7A] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {(d.nombres?.[0] || 'D').toUpperCase()}{(d.apellidos?.[0] || '').toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold leading-tight">{d.nombres} {d.apellidos}</p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="material-symbols-outlined text-lg text-[#093E7A]">check_circle</span>
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}

                    {/* INDICADOR VISUAL DEL TUTOR SELECCIONADO */}
                    {tutorDocenteSeleccionado && (
                      <div className="flex items-center justify-between bg-blue-50/80 border border-blue-100 rounded-xl px-3.5 py-2">
                        <div className="flex items-center gap-2.5 text-xs text-[#093E7A] font-bold">
                          <span className="material-symbols-outlined text-base text-green-600">verified</span>
                          <span>Tutor seleccionado: {tutorDocenteSeleccionado.nombres} {tutorDocenteSeleccionado.apellidos}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTutorFormData(prev => ({ ...prev, id_docente: "" }));
                            setSearchDocente("");
                            setIsTutorDocenteDropdownOpen(true);
                          }}
                          className="text-[11px] font-bold text-blue-700 hover:underline"
                        >
                          Cambiar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 rounded-b-2xl">
                <button type="button" onClick={cerrarModalTutor} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-[#093E7A] text-white rounded-xl font-bold hover:bg-[#062d59] transition-all shadow-md">Asignar Tutor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALES DE CONFIRMACIÓN DE BORRADO --- */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={() => confirmDelete.id && handleEliminar(confirmDelete.id)}
        title="¿Eliminar Asignación?"
        message="Esta acción desvinculará al docente del curso y sección seleccionados. No se pueden deshacer los cambios."
        confirmText="Sí, eliminar"
        type="danger"
      />

      <ConfirmModal
        isOpen={confirmDeleteTutor.isOpen}
        onClose={() => setConfirmDeleteTutor({ isOpen: false, id: null })}
        onConfirm={() => confirmDeleteTutor.id && handleEliminarTutor(confirmDeleteTutor.id)}
        title="¿Remover Tutor?"
        message="El docente dejará de ser el tutor asignado a esta sección. Esta acción no se puede deshacer."
        confirmText="Sí, remover"
        type="danger"
      />
    </RoleGuard>
  );
}