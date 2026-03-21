"use client";

import { useState, useEffect, useCallback } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { toast } from "sonner";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { Seccion, Curso } from "@/src/interfaces/academic";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from "@/src/components/auth/RoleGuard";

export default function AsignacionDocentesPage() {
  
  const { anioPlanificacion, setAnioPlanificacion, listaAnios, loadingAnios } = useAnioAcademico();
  
  // --- ESTADO PARA PESTAÑAS (TABS) ---
  const [activeTab, setActiveTab] = useState<"carga" | "tutores">("carga");

  // --- ESTADOS DE DATOS ---
  const [vinculos, setVinculos] = useState([]);
  const [tutores, setTutores] = useState([]); 
  const [docentes, setDocentes] = useState([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);

  // --- ESTADOS DE UI ---
  const [searchTerm, setSearchTerm] = useState(""); 
  const [searchDocente, setSearchDocente] = useState(""); 
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
    const nombreDocente = v.docente ? `${v.docente.nombres} ${v.docente.apellidos}`.toLowerCase() : "";
    const nombreCurso = v.curso_nombre.toLowerCase();
    const busqueda = searchTerm.toLowerCase();
    return nombreDocente.includes(busqueda) || nombreCurso.includes(busqueda);
  });

  const tutoresFiltradosList = tutores.filter((t: any) => {
    const nombreDocente = t.docente ? `${t.docente.nombres} ${t.docente.apellidos}`.toLowerCase() : "";
    const gradoSeccion = `${t.grado_nombre} ${t.seccion_nombre}`.toLowerCase();
    const busqueda = searchTerm.toLowerCase();
    return nombreDocente.includes(busqueda) || gradoSeccion.includes(busqueda);
  });

  const docentesFiltrados = docentes.filter((d: any) =>
    `${d.nombres} ${d.apellidos}`.toLowerCase().includes(searchDocente.toLowerCase())
  );

  
  const fetchData = useCallback(async () => {
    if (!anioPlanificacion) return;

    try {
      setLoading(true);
      const [resVinculos, resDocentes, resSecciones, resTutores] = await Promise.all([
        apiFetch(`/gestion/vínculos-academicos/${anioPlanificacion}`),
        apiFetch(`/gestion/docentes-disponibles/`),
        apiFetch(`/academic/secciones/${anioPlanificacion}`),
        apiFetch(`/gestion/tutores/${anioPlanificacion}`) 
      ]);

      setVinculos(await resVinculos.json());
      setDocentes(await resDocentes.json());
      setSecciones(await resSecciones.json());
      setTutores(await resTutores.json());
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
    setFormData({ ...formData, id_seccion, id_curso: "" });
    if (!id_seccion) return;
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
    setEditingId(v.id_carga_academica);
    setFormData({
      id_seccion: v.id_seccion.toString(),
      id_curso: v.id_curso.toString(),
      id_docente: v.docente?.id_docente.toString() || ""
    });
    handleSeccionChange(v.id_seccion.toString());
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSearchDocente("");
    setFormData({ id_seccion: "", id_curso: "", id_docente: "" });
  };

  const guardarAsignacion = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/gestion/carga/${editingId}` : `/gestion/carga/`;
    const method = editingId ? "PATCH" : "POST";

    const promise = apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_anio_escolar: anioPlanificacion,
        id_seccion: parseInt(formData.id_seccion),
        id_curso: parseInt(formData.id_curso),
        id_docente: parseInt(formData.id_docente),
      }),
    });

    toast.promise(promise, {
      loading: 'Guardando asignación...',
      success: () => {
        cerrarModal();
        fetchData();
        return editingId ? "Asignación actualizada" : "Asignación creada con éxito";
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
        toast.error("No se pudo eliminar la asignación");
      }
    } catch (error) {
      toast.error("Error de conexión al eliminar");
    }
  };


  // --- NUEVOS MÉTODOS PARA TUTORES ---
  const cerrarModalTutor = () => {
    setIsTutorModalOpen(false);
    setSearchDocente("");
    setTutorFormData({ id_seccion: "", id_docente: "" });
  };

  const guardarTutor = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <HeaderPanel />

          <div className="flex-1 overflow-y-auto p-8">
            {/* TABS SUPERIORES */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">Vínculos Académicos</h3>
                <div className="flex gap-6 border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("carga")}
                    className={`pb-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'carga' ? 'border-[#093E7A] text-[#093E7A]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">menu_book</span> Carga Académica (Cursos)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("tutores")}
                    className={`pb-3 font-bold text-sm border-b-2 transition-all ${activeTab === 'tutores' ? 'border-[#093E7A] text-[#093E7A]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                  >
                    <span className="flex items-center gap-2"><span className="material-symbols-outlined text-lg">supervisor_account</span> Tutorías de Sección</span>
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
                  placeholder={activeTab === "carga" ? "Buscar por curso o docente..." : "Buscar por sección o tutor..."}
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
                  onClick={() => setIsTutorModalOpen(true)}
                  disabled={!anioPlanificacion}
                  className="flex items-center gap-2 px-6 py-3 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-bold shadow-lg"
                >
                  <span className="material-symbols-outlined">how_to_reg</span>
                  Asignar Tutor
                </button>
              )}
            </div>

            {/* TABLA PRINCIPAL DINÁMICA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                
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
                          No hay docentes asignados en carga académica.
                        </td>
                      </tr>
                    ) : (
                      vinculosFiltrados.map((v: any, i) => (
                        <tr key={v.id_carga_academica || `vinc-${i}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-800">{v.curso_nombre}</td>
                          <td className="px-6 py-4 text-gray-600">{v.grado_nombre} - {v.seccion_nombre}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-[#093E7A] font-semibold">
                              <span className="material-symbols-outlined text-sm">person</span>
                              {v.docente ? `${v.docente.nombres} ${v.docente.apellidos}` : "No definido"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {v.id_carga_academica && (
                                <>
                                  <button onClick={() => handleEditar(v)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar docente">
                                    <span className="material-symbols-outlined text-xl">edit</span>
                                  </button>
                                  <button onClick={() => setConfirmDelete({ isOpen: true, id: v.id_carga_academica })} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar asignación">
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                  </button>
                                </>
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
                            <div className="font-bold text-gray-800">{t.grado_nombre} - {t.seccion_nombre}</div>
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
              <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? "Editar Asignación Docente" : "Crear Nuevo Vínculo"}
                </h3>
                <button type="button" onClick={cerrarModal} className="text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sección</label>
                  <select
                    required
                    disabled={editingId !== null}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20"
                    value={formData.id_seccion}
                    onChange={(e) => handleSeccionChange(e.target.value)}
                  >
                    <option value="">Seleccione una sección...</option>
                    {secciones.map(s => (
                      <option key={s.id_seccion} value={s.id_seccion}>
                        {s.grado?.nombre || "Grado"} - {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Curso</label>
                  <select
                    required
                    disabled={editingId !== null || !formData.id_seccion}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20 disabled:opacity-50"
                    value={formData.id_curso}
                    onChange={(e) => setFormData({ ...formData, id_curso: e.target.value })}
                  >
                    <option value="">{formData.id_seccion ? "Seleccione el curso..." : "Primero elija una sección"}</option>
                    {cursosDisponibles.map(c => (
                      <option key={c.id_curso} value={c.id_curso}>{c.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Asignar Docente</label>
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-gray-400">person_search</span>
                      <input type="text" placeholder="Filtrar por nombre..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#093E7A]" value={searchDocente} onChange={(e) => setSearchDocente(e.target.value)} />
                    </div>
                    <select required className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20" value={formData.id_docente} onChange={(e) => setFormData({ ...formData, id_docente: e.target.value })}>
                      <option value="">Seleccione al docente...</option>
                      {docentesFiltrados.map((d: any) => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
                    </select>
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
              <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <h3 className="text-xl font-bold text-gray-900">Asignar Tutor a Sección</h3>
                <button type="button" onClick={cerrarModalTutor} className="text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sección de Tutoría</label>
                  <select
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20"
                    value={tutorFormData.id_seccion}
                    onChange={(e) => setTutorFormData({ ...tutorFormData, id_seccion: e.target.value })}
                  >
                    <option value="">Seleccione una sección...</option>
                    {secciones.map(s => (
                      <option key={s.id_seccion} value={s.id_seccion}>
                        {s.grado?.nombre || "Grado"} - {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Asignar Docente como Tutor</label>
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-gray-400">person_search</span>
                      <input type="text" placeholder="Filtrar por nombre..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#093E7A]" value={searchDocente} onChange={(e) => setSearchDocente(e.target.value)} />
                    </div>
                    <select required className="w-full p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20" value={tutorFormData.id_docente} onChange={(e) => setTutorFormData({ ...tutorFormData, id_docente: e.target.value })}>
                      <option value="">Seleccione al tutor...</option>
                      {docentesFiltrados.map((d: any) => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellidos}</option>)}
                    </select>
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