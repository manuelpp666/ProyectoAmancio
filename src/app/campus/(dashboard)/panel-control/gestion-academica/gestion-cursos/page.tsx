"use client";
import { useEffect, useState } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { NivelConCursos, AnioEscolar, Area } from "@/src/interfaces/academic"; // Ajusta la ruta
import { toast } from "sonner";

export default function GestionCursosPage() {
  const [niveles, setNiveles] = useState<NivelConCursos[]>([]);
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);


  // Estados para Modales
  const [showModal, setShowModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Formulario Nuevo Curso
  const [nuevoCurso, setNuevoCurso] = useState({ nombre: "", id_area: "" });
  const [gradosSeleccionados, setGradosSeleccionados] = useState<number[]>([]);
  const [nuevaAreaNombre, setNuevaAreaNombre] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);


  const cerrarModalPrincipal = () => {
    setShowModal(false);
    setEditingId(null);
    setNuevoCurso({ nombre: "", id_area: "" });
    setGradosSeleccionados([]);
  };
  // Función para abrir modal en modo edición
  const prepararEdicion = (cursoAgrupado: any) => {
    setEditingId(cursoAgrupado.id_curso);
    setNuevoCurso({
      nombre: cursoAgrupado.nombre,
      id_area: cursoAgrupado.id_area.toString()
    });
    setGradosSeleccionados(cursoAgrupado.id_grados); // Necesitarás guardar los IDs en el mapeo
    setShowModal(true);
  };

  const handleEliminarCurso = async (cursoId: number, nombre: string, gradosIds: number[]) => {
  toast(`¿Estás seguro de quitar ${nombre} de este nivel?`, {
    action: {
      label: "Eliminar",
      onClick: async () => {
        try {
          // Construimos la URL con los IDs de los grados como parámetros: ?grados_ids=1&grados_ids=2...
          const params = new URLSearchParams();
          gradosIds.forEach(id => params.append('grados_ids', id.toString()));

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/academic/cursos/${cursoId}?${params.toString()}`, 
            { method: "DELETE" }
          );

          if (res.ok) {
            toast.success("Curso quitado de este nivel");
            fetchData();
          }
        } catch (error) {
          toast.error("No se pudo procesar la solicitud");
        }
      },
    },
  });
};

  const fetchData = async () => {
    try {
      const [resNiveles, resAnios, resAreas] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/niveles-cursos/`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/anios/`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/areas/`)
      ]);

      if (resNiveles.ok && resAnios.ok && resAreas.ok) {
        setNiveles(await resNiveles.json());
        setAnios(await resAnios.json());
        setAreas(await resAreas.json());
      }
    } catch (error) {
      console.error("Error al conectar con la API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Lógica de Guardado ---

  const handleCrearArea = async () => {
    if (!nuevaAreaNombre.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/areas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevaAreaNombre })
      });
      if (res.ok) {
        const areaCreada = await res.json();
        setAreas([...areas, areaCreada]);
        setNuevoCurso({ ...nuevoCurso, id_area: areaCreada.id_area.toString() });
        setShowAreaModal(false);
        setNuevaAreaNombre("");
      }
    } catch (error) {
      console.error("Error al crear área", error);
    }
  };

  const handleGuardarCurso = async () => {

    if (!nuevoCurso.nombre.trim() || !nuevoCurso.id_area || gradosSeleccionados.length === 0) {
      toast.error("Por favor, completa el nombre, el área y selecciona al menos un grado.");
      return;
    }

    const isEditing = editingId !== null;
    const url = isEditing
      ? `${process.env.NEXT_PUBLIC_API_URL}/academic/cursos/${editingId}`
      : `${process.env.NEXT_PUBLIC_API_URL}/academic/cursos/`;

    try {
      // 1. Guardar/Actualizar Curso
      const resCurso = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoCurso.nombre,
          id_area: parseInt(nuevoCurso.id_area)
        })
      });
      const cursoData = await resCurso.json();

      // 2. Actualizar Plan de Estudio
      // Si editamos, usamos el batch endpoint que creamos arriba
      const planUrl = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/academic/plan-estudio/batch/${editingId}`
        : null;

      if (isEditing) {
        await fetch(planUrl!, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gradosSeleccionados)
        });
      } else {
        // Lógica de creación (la que ya tenías con Promise.all)
        await Promise.all(
          gradosSeleccionados.map(gradoId =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/plan-estudio/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_curso: cursoData.id_curso, id_grado: gradoId })
            })
          )
        );
      }

      toast.success(isEditing ? "Curso actualizado" : "Curso creado");
      cerrarModalPrincipal();
      setEditingId(null);
      fetchData();
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    }
  };

  // 2. Función para agrupar cursos por Nivel (para la tabla)
  const obtenerCursosAgrupados = (grados: any[]) => {
    const mapaCursos = new Map();
    grados.forEach(grado => {
      grado.planes_estudio?.forEach((plan: any) => {
        const cursoId = plan.curso.id_curso;
        if (!mapaCursos.has(cursoId)) {
          mapaCursos.set(cursoId, {
            id_curso: cursoId,
            id_area: plan.curso.id_area,
            nombre: plan.curso.nombre,
            grados: [grado.nombre],
            id_grados: [grado.id_grado] // Importante para el check del modal
          });
        } else {
          if (!mapaCursos.get(cursoId).grados.includes(grado.nombre)) {
            mapaCursos.get(cursoId).grados.push(grado.nombre);
            mapaCursos.get(cursoId).id_grados.push(grado.id_grado);
          }
        }
      });
    });
    return Array.from(mapaCursos.values());
  };

  if (loading) return <div className="p-10 text-center font-bold text-[#093E7A]">Cargando Carga Horaria...</div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `... tus estilos ...` }} />

      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
          <HeaderPanel />

          {/* Sub-Header Dinámico */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">menu_book</span>
                <h2 className="text-xl font-bold text-gray-800">Cursos y Carga Horaria</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Año Académico:</label>
                <select className="bg-gray-50 border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] py-1">
                  {anios.map(anio => (
                    <option key={anio.id_anio_escolar} value={anio.id_anio_escolar}>
                      {anio.id_anio_escolar} {anio.activo ? '(Activo)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d5a] transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span> Nuevo Curso
            </button>
          </div>

          {/* Renderizado Dinámico por Niveles */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12">
            {niveles.map((nivel) => {
              const cursos = obtenerCursosAgrupados(nivel.grados);

              return (
                <section key={nivel.id_nivel} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                    <span className="material-symbols-outlined text-[#093E7A] fill-icon">
                      {nivel.nombre.toLowerCase().includes("primaria") ? "child_care" : "school"}
                    </span>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">
                      {nivel.nombre}
                    </h3>
                    <span className="bg-[#093E7A]/10 text-[#093E7A] px-2 py-0.5 rounded text-[10px] font-bold">
                      {cursos.length} CURSOS ACTIVOS
                    </span>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Curso / Asignatura</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Grados Asignados</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cursos.length > 0 ? cursos.map((curso, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                                  <span className="material-symbols-outlined text-sm">auto_stories</span>
                                </div>
                                <span className="font-bold text-gray-800">{curso.nombre}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {curso.grados.map((g: string) => (
                                  <span key={g} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">{g}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {/* BOTÓN EDITAR */}
                                <button
                                  onClick={() => prepararEdicion(curso)}
                                  className="p-2 text-[#093E7A] hover:bg-[#093E7A]/10 rounded-lg transition-colors"
                                  title="Editar curso"
                                >
                                  <span className="material-symbols-outlined text-xl">edit_note</span>
                                </button>

                                {/* BOTÓN ELIMINAR */}
                                <button
                                  onClick={() => handleEliminarCurso(curso.id_curso, curso.nombre, curso.id_grados)}
                                  className="p-2 text-[#701C32] hover:bg-[#701C32]/10 rounded-lg transition-colors"
                                  title="Eliminar curso"
                                >
                                  <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">No hay cursos asignados en este nivel.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
      {/* --- MODAL PRINCIPAL CURSO --- */}
      {showModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-black text-[#093E7A]">{editingId ? `Editando: ${nuevoCurso.nombre}` : "Configurar Nuevo Curso"}</h3>
              <button onClick={cerrarModalPrincipal}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase">Nombre del Curso</label>
                  <input
                    type="text"
                    className="w-full p-3 border rounded-xl outline-none focus:ring-2 ring-blue-100"
                    value={nuevoCurso.nombre}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase">Área Académica</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-3 border rounded-xl"
                      value={nuevoCurso.id_area}
                      onChange={(e) => setNuevoCurso({ ...nuevoCurso, id_area: e.target.value })}
                    >
                      <option value="">Seleccione...</option>
                      {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre}</option>)}
                    </select>
                    <button onClick={() => setShowAreaModal(true)} className="p-3 bg-gray-100 rounded-xl text-[#093E7A]"><span className="material-symbols-outlined">add</span></button>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-500 uppercase border-b w-full block pb-1">Seleccionar Grados</label>
                <div className="grid grid-cols-3 gap-6">
                  {niveles.map(nivel => (
                    <div key={nivel.id_nivel} className="space-y-2">
                      <p className="text-[10px] font-black text-[#093E7A] uppercase">{nivel.nombre}</p>
                      {nivel.grados.map(grado => (
                        <label key={grado.id_grado} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={gradosSeleccionados.includes(grado.id_grado)}
                            onChange={(e) => {
                              if (e.target.checked) setGradosSeleccionados([...gradosSeleccionados, grado.id_grado]);
                              else setGradosSeleccionados(gradosSeleccionados.filter(id => id !== grado.id_grado));
                            }}
                          />
                          <span className="text-sm font-bold text-gray-600">{grado.nombre}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button onClick={cerrarModalPrincipal} className="px-6 py-2 font-bold text-gray-400">Cancelar</button>
              <button
                onClick={handleGuardarCurso}
                className="px-8 py-2.5 bg-[#093E7A] text-white rounded-xl font-bold shadow-lg"
              >
                {editingId ? "Actualizar Cambios" : "Guardar Configuración"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MINI MODAL ÁREA --- */}
      {showAreaModal && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-80 space-y-4 shadow-2xl border">
            <h4 className="font-black text-[#093E7A]">Nueva Área</h4>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Ej: Matemáticas"
              value={nuevaAreaNombre}
              onChange={(e) => setNuevaAreaNombre(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAreaModal(false)} className="text-xs font-bold text-gray-400">Cerrar</button>
              <button onClick={handleCrearArea} className="bg-[#093E7A] text-white px-4 py-2 rounded text-xs font-bold">Crear</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}