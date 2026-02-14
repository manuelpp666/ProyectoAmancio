"use client";

import { useState, useEffect } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { toast } from "sonner";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { Seccion, Curso } from "@/src/interfaces/academic";

export default function AsignacionDocentesPage() {
  // --- ESTADOS DE DATOS ---
  const [vinculos, setVinculos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);
  const [anioPlanificacion, setAnioPlanificacion] = useState<string>("");
  const [listaAnios, setListaAnios] = useState<any[]>([]);
  // --- ESTADOS DE UI ---
  const [searchTerm, setSearchTerm] = useState(""); // Buscador tabla
  const [searchDocente, setSearchDocente] = useState(""); // Buscador modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    id_seccion: "",
    id_curso: "",
    id_docente: ""
  });
  // --- ESTADOS PARA MODAL DE CONFIRMACIÓN ---
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({
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

  const docentesFiltrados = docentes.filter((d: any) =>
    `${d.nombres} ${d.apellidos}`.toLowerCase().includes(searchDocente.toLowerCase())
  );

  useEffect(() => {
    const cargarAnios = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/anios/`);
        const data = await res.json();
        setListaAnios(data);

        // Seleccionar el año activo por defecto si existe
        const activo = data.find((a: any) => a.estado === "activo") || data[0];
        if (activo) setAnioPlanificacion(activo.id_anio_escolar.toString());
      } catch (error) {
        toast.error("Error al cargar años académicos");
      }
    };
    cargarAnios();
  }, []);
  useEffect(() => {
    if (anioPlanificacion) {
      fetchData(anioPlanificacion);
    }
  }, [anioPlanificacion]);

  const fetchData = async (idAnioExterno?: string) => {
    // Usamos el ID que viene por parámetro o el del estado
    const idAnio = idAnioExterno || anioPlanificacion;
    if (!idAnio) return;

    try {
      setLoading(true);
      // Ya no llamamos a /anios/ultimo porque ya tenemos el ID del Select
      const [resVinculos, resDocentes, resSecciones] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/vínculos-academicos/${idAnio}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/docentes-disponibles/`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/secciones/${idAnio}`)
      ]);

      setVinculos(await resVinculos.json());
      setDocentes(await resDocentes.json());
      setSecciones(await resSecciones.json());
    } catch (error) {
      toast.error("Error al actualizar la vista");
    } finally {
      setLoading(false);
    }
  };

  const handleSeccionChange = async (id_seccion: string) => {
    setFormData({ ...formData, id_seccion, id_curso: "" });
    if (!id_seccion) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/cursos-por-seccion/${id_seccion}`);
      const data = await res.json();
      setCursosDisponibles(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar cursos de la sección");
    }
  };

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
    const url = editingId ? `${process.env.NEXT_PUBLIC_API_URL}/gestion/carga/${editingId}` : `${process.env.NEXT_PUBLIC_API_URL}/gestion/carga/`;
    const method = editingId ? "PATCH" : "POST";

    const promise = fetch(url, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/carga/${id}`, { method: "DELETE" });
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

  return (
    <>
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <HeaderPanel />

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Vínculos Académicos</h3>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">Año de Planificación:</label>
                  <select
                    value={anioPlanificacion}
                    onChange={(e) => setAnioPlanificacion(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 px-3 outline-none cursor-pointer min-w-[140px]"
                  >
                    {listaAnios.length === 0 && <option value="">Cargando...</option>}

                    {listaAnios.map((anio) => (
                      <option key={anio.id_anio_escolar} value={anio.id_anio_escolar} className="text-gray-800">
                        {anio.id_anio_escolar} ({anio.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="relative w-full max-w-md">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400">search</span>
                <input
                  type="text"
                  placeholder="Buscar por curso o docente..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#093E7A]/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => {
                  setEditingId(null); // MUY IMPORTANTE
                  setFormData({ id_seccion: "", id_curso: "", id_docente: "" });
                  setIsModalOpen(true);
                }}
                disabled={!anioPlanificacion}
                className="flex items-center gap-2 px-6 py-3 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-bold shadow-lg"
              >
                <span className="material-symbols-outlined">add_link</span>
                Nueva Asignación
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Curso</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Grado/Sección</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Docente</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400 animate-pulse">Cargando...</td></tr>
                  ) : vinculosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400">
                        <span className="material-symbols-outlined text-4xl block mb-2">info</span>
                        No hay docentes asignados. Inicia uno nuevo.
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
                                <button
                                  onClick={() => handleEditar(v)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar docente"
                                >
                                  <span className="material-symbols-outlined text-xl">edit</span>
                                </button>
                                <button
                                  onClick={() => setConfirmDelete({ isOpen: true, id: v.id_carga_academica })}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar asignación"
                                >
                                  <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
            <form onSubmit={guardarAsignacion}>
              <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingId ? "Editar Asignación Docente" : "Crear Nuevo Vínculo"}
                </h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* 1. Selección de Sección */}
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

                {/* 2. Selección de Curso */}
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
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#093E7A] text-white rounded-xl font-bold hover:bg-[#062d59] transition-all shadow-md"
                >
                  Guardar Vínculo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: null })}
        onConfirm={() => confirmDelete.id && handleEliminar(confirmDelete.id)}
        title="¿Eliminar Asignación?"
        message="Esta acción desvinculará al docente del curso y sección seleccionados. No se pueden deshacer los cambios."
        confirmText="Sí, eliminar"
        type="danger"
      />
    </>
  );
}