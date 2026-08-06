"use client";
import { useEffect, useState, useCallback } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { NivelConCursos, Area } from "@/src/interfaces/academic";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";
import { RoleGuard } from "@/src/components/auth/RoleGuard";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";

const GRUPOS_VERANO = [
  { clave: "PRIM_1_2", etiqueta: "1ro y 2do de Primaria" },
  { clave: "PRIM_3_4", etiqueta: "3ro y 4to de Primaria" },
  { clave: "PRIM_5_6", etiqueta: "5to y 6to de Primaria" },
  { clave: "SEC_1", etiqueta: "1ro de Secundaria" },
  { clave: "SEC_2", etiqueta: "2do de Secundaria" },
  { clave: "SEC_3", etiqueta: "3ro de Secundaria" },
  { clave: "PRE_ACADEMIA", etiqueta: "Pre Academia" },
];

function VeranoSeccion({ titulo, icono, cursos, tipoBadge, onEditar, onEliminar }: {
  titulo: string; icono: string; cursos: any[]; tipoBadge: string;
  onEditar: (c: any) => void; onEliminar: (c: any) => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <span className="material-symbols-outlined text-[#701C32] fill-icon">{icono}</span>
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">{titulo}</h3>
        <span className="bg-[#701C32]/10 text-[#701C32] px-2 py-0.5 rounded text-[10px] font-bold">
          {cursos.length} CURSOS
        </span>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Curso</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Duración (Min/Sem)</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cursos.length > 0 ? cursos.map((curso: any) => (
              <tr key={curso.id_curso} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 bg-[#701C32]/10 text-[#701C32] rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">auto_stories</span>
                    </div>
                    <span className="font-bold text-gray-800">{curso.nombre}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#701C32]/10 text-[#701C32]">{tipoBadge}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-bold text-[#093E7A]">{curso.minutos_semanales} min</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEditar(curso)} className="p-2 text-[#093E7A] hover:bg-[#093E7A]/10 rounded-lg transition-colors" title="Editar curso">
                      <span className="material-symbols-outlined text-xl">edit_note</span>
                    </button>
                    <button onClick={() => onEliminar(curso)} className="p-2 text-[#701C32] hover:bg-[#701C32]/10 rounded-lg transition-colors" title="Eliminar curso">
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400 italic">Sin cursos en este grupo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function GestionCursosPage() {
  const [tipoAnio, setTipoAnio] = useState<"REGULAR" | "VERANO">("REGULAR");
  const [niveles, setNiveles] = useState<NivelConCursos[]>([]);
  const [cursosVerano, setCursosVerano] = useState<{ grupos: any[]; talleres: any[] }>({ grupos: [], talleres: [] });
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);


  // Estados para Modales
  const [showModal, setShowModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);

  // Formulario Nuevo Curso
  const [nuevoCurso, setNuevoCurso] = useState({ nombre: "", id_area: "", minutos_semanales: 0, es_verano: false, tipo_verano: "FIJO", grupo_verano: "PRIM_1_2" });
  const [gradosSeleccionados, setGradosSeleccionados] = useState<number[]>([]);
  const [nuevaAreaNombre, setNuevaAreaNombre] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);


  const cerrarModalPrincipal = () => {
    setShowModal(false);
    setEditingId(null);
    setNuevoCurso({ nombre: "", id_area: "", minutos_semanales: 0, es_verano: tipoAnio === "VERANO", tipo_verano: "FIJO", grupo_verano: "PRIM_1_2" });
    setGradosSeleccionados([]);
  };
  const abrirNuevoCurso = () => {
    setEditingId(null);
    setNuevoCurso({ nombre: "", id_area: "", minutos_semanales: 0, es_verano: tipoAnio === "VERANO", tipo_verano: "FIJO", grupo_verano: "PRIM_1_2" });
    setGradosSeleccionados([]);
    setShowModal(true);
  };
  // Función para abrir modal en modo edición
  const prepararEdicion = (cursoAgrupado: any) => {
    setEditingId(cursoAgrupado.id_curso);
    setNuevoCurso({
      nombre: cursoAgrupado.nombre,
      id_area: (cursoAgrupado.id_area ?? "").toString(),
      minutos_semanales: cursoAgrupado.minutos_semanales || 0,
      es_verano: !!cursoAgrupado.es_verano,
      tipo_verano: cursoAgrupado.tipo_verano || "FIJO",
      grupo_verano: cursoAgrupado.grupo_verano || "PRIM_1_2"
    });
    setGradosSeleccionados(cursoAgrupado.id_grados || []);
    setShowModal(true);
  };

  const [confirmCurso, setConfirmCurso] = useState<{ abierto: boolean; id: number; nombre: string; grados: number[] }>(
    { abierto: false, id: 0, nombre: "", grados: [] }
  );

  const handleEliminarCurso = (cursoId: number, nombre: string, gradosIds: number[]) => {
    setConfirmCurso({ abierto: true, id: cursoId, nombre, grados: gradosIds || [] });
  };

  const ejecutarEliminarCurso = async () => {
    const { id, grados } = confirmCurso;
    try {
      const params = new URLSearchParams();
      grados.forEach(g => params.append('grados_ids', g.toString()));
      const res = await apiFetch(`/academic/cursos/${id}?${params.toString()}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Curso eliminado correctamente");
        fetchData();
      } else {
        toast.error("No se pudo eliminar el curso");
      }
    } catch (error) {
      toast.error("No se pudo procesar la solicitud");
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resAreas = await apiFetch(`/academic/areas/`);
      if (resAreas.ok) setAreas(await resAreas.json());

      if (tipoAnio === "VERANO") {
        const resVer = await apiFetch(`/academic/cursos-verano/`);
        if (resVer.ok) setCursosVerano(await resVer.json());
        // Los niveles se usan igualmente para el selector de área/grados regulares
        const resNiv = await apiFetch(`/academic/niveles-cursos/`);
        if (resNiv.ok) setNiveles(await resNiv.json());
      } else {
        const resNiveles = await apiFetch(`/academic/niveles-cursos/`);
        if (resNiveles.ok) setNiveles(await resNiveles.json());
      }
    } catch (error) {
      toast.error("Error al conectar con la API");
    } finally {
      setLoading(false);
    }
  }, [tipoAnio]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Lógica de Guardado ---

  const handleCrearArea = async () => {
    if (!nuevaAreaNombre.trim()) return;
    try {
      const res = await apiFetch(`/academic/areas/`, {
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
    const esVerano = nuevoCurso.es_verano;
    const esFijo = esVerano && nuevoCurso.tipo_verano === "FIJO";

    // Validaciones
    if (!nuevoCurso.nombre.trim() || !nuevoCurso.id_area || nuevoCurso.minutos_semanales <= 0) {
      toast.error("Completa el nombre, el área y los minutos semanales.");
      return;
    }
    if (!esVerano && gradosSeleccionados.length === 0) {
      toast.error("Selecciona al menos un grado.");
      return;
    }
    if (esFijo && !nuevoCurso.grupo_verano) {
      toast.error("Selecciona el grupo de verano al que pertenece el curso fijo.");
      return;
    }

    const isEditing = editingId !== null;
    const url = isEditing ? `/academic/cursos/${editingId}` : `/academic/cursos/`;

    try {
      // 1. Guardar/Actualizar Curso
      const resCurso = await apiFetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoCurso.nombre,
          id_area: parseInt(nuevoCurso.id_area),
          minutos_semanales: nuevoCurso.minutos_semanales,
          es_verano: esVerano,
          tipo_verano: esVerano ? nuevoCurso.tipo_verano : null,
          grupo_verano: esFijo ? nuevoCurso.grupo_verano : null,
        })
      });
      const cursoData = await resCurso.json();

      // 2. Plan de estudio SOLO para cursos regulares (los de verano se agrupan por grupo)
      if (!esVerano) {
        if (isEditing) {
          await apiFetch(`/academic/plan-estudio/batch/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(gradosSeleccionados)
          });
        } else {
          await Promise.all(
            gradosSeleccionados.map(gradoId =>
              apiFetch(`/academic/plan-estudio/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id_curso: cursoData.id_curso, id_grado: gradoId })
              })
            )
          );
        }
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
        // La vista Regular no muestra cursos de verano
        if (plan.curso.es_verano) return;
        const cursoId = plan.curso.id_curso;
        if (!mapaCursos.has(cursoId)) {
          mapaCursos.set(cursoId, {
            id_curso: cursoId,
            id_area: plan.curso.id_area,
            nombre: plan.curso.nombre,
            minutos_semanales: plan.curso.minutos_semanales,
            es_verano: plan.curso.es_verano,
            tipo_verano: plan.curso.tipo_verano,
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
    <RoleGuard modulo="academico" subModulo="cursos">
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: 'Lato', sans-serif; background-color: #F8FAFC; color: #1e293b; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .fill-icon { font-variation-settings: 'FILL' 1; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .modal-overlay { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px); }
      ` }} />

      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
          <HeaderPanel />

          {/* Sub-Header Dinámico */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-4 md:px-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">menu_book</span>
                <h2 className="text-xl font-bold text-gray-800">Cursos y Carga Horaria</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              {/* Toggle Tipo de año */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {(["REGULAR", "VERANO"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipoAnio(t)}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                      tipoAnio === t ? (t === "VERANO" ? "bg-[#701C32] text-white" : "bg-[#093E7A] text-white") : "text-gray-500"
                    }`}
                  >
                    {t === "REGULAR" ? "Año Regular" : "Verano"}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={abrirNuevoCurso}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d5a] transition-all"
            >
              <span className="material-symbols-outlined text-sm">add</span> Nuevo Curso
            </button>
          </div>

          {/* Renderizado Dinámico por Niveles (REGULAR) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12">
            {tipoAnio === "REGULAR" && niveles.map((nivel) => {
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

                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Curso / Asignatura</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Grados Asignados</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Duración (Min/Sem)</th> {/* NUEVO CAMPO */}
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
                                {curso.es_verano && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                    curso.tipo_verano === 'TALLER' ? 'bg-[#093E7A]/10 text-[#093E7A]' : 'bg-[#701C32]/10 text-[#701C32]'
                                  }`}>
                                    Verano · {curso.tipo_verano === 'TALLER' ? 'Taller' : 'Fijo'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {curso.grados.map((g: string) => (
                                  <span key={g} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">{g}</span>
                                ))}
                              </div>
                            </td>
                            
                            {/* NUEVO CAMPO RENDERIZADO */}
                            <td className="px-6 py-4 text-center font-bold text-[#093E7A]">
                              {curso.minutos_semanales} min
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
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No hay cursos asignados en este nivel.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}

            {/* VERANO: cursos fijos por grupo + talleres */}
            {tipoAnio === "VERANO" && (
              <>
                {cursosVerano.grupos.map((grupo: any) => (
                  <VeranoSeccion
                    key={grupo.clave}
                    titulo={grupo.etiqueta}
                    icono={grupo.clave === "PRE_ACADEMIA" ? "workspace_premium" : grupo.clave.startsWith("PRIM") ? "child_care" : "school"}
                    cursos={grupo.cursos}
                    tipoBadge="Fijo"
                    onEditar={(c: any) => prepararEdicion({ ...c, es_verano: true, tipo_verano: "FIJO", grupo_verano: grupo.clave })}
                    onEliminar={(c: any) => handleEliminarCurso(c.id_curso, c.nombre, [])}
                  />
                ))}
                <VeranoSeccion
                  titulo="Talleres"
                  icono="sports_esports"
                  cursos={cursosVerano.talleres}
                  tipoBadge="Taller"
                  onEditar={(c: any) => prepararEdicion({ ...c, es_verano: true, tipo_verano: "TALLER" })}
                  onEliminar={(c: any) => handleEliminarCurso(c.id_curso, c.nombre, [])}
                />
              </>
            )}
          </div>
        </div>
      </div>
      {/* --- MODAL PRINCIPAL CURSO --- */}
      {showModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Cabecera dedicada */}
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{editingId ? "Editar Curso" : "Nuevo Curso"}</h3>
                  <p className="text-[11px] text-white/70 mt-0.5 max-w-sm leading-snug">
                    Define el curso, su carga horaria y los grados en los que se dictará.
                  </p>
                </div>
              </div>
              <button onClick={cerrarModalPrincipal} className="hover:text-gray-300 mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">

              {/* SECCIÓN: DATOS DEL CURSO */}
              <section className="space-y-3">
                <h4 className="text-[11px] font-black text-[#093E7A] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">auto_stories</span> Datos del curso
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Curso</label>
                    <input
                      type="text"
                      placeholder="Ej. Matemática"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A]"
                      value={nuevoCurso.nombre}
                      onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Minutos Semanales</label>
                    <input
                      type="number"
                      min="0"
                      step="15"
                      placeholder="Ej. 180"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A]"
                      value={nuevoCurso.minutos_semanales}
                      onChange={(e) => setNuevoCurso({ ...nuevoCurso, minutos_semanales: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Área Académica</label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] bg-white"
                        value={nuevoCurso.id_area}
                        onChange={(e) => setNuevoCurso({ ...nuevoCurso, id_area: e.target.value })}
                      >
                        <option value="">Seleccione...</option>
                        {areas.map(a => <option key={a.id_area} value={a.id_area}>{a.nombre}</option>)}
                      </select>
                      <button onClick={() => setShowAreaModal(true)} title="Nueva área" className="px-3 bg-[#093E7A]/10 rounded-lg text-[#093E7A] hover:bg-[#093E7A]/20 transition-colors"><span className="material-symbols-outlined">add</span></button>
                    </div>
                  </div>
                  {/* Curso de verano: tipo (Fijo/Taller) + grupo */}
                  {nuevoCurso.es_verano && (
                    <div className="col-span-2 bg-[#FFF1E3] border border-[#701C32]/20 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Tipo en verano</label>
                        <select
                          className="w-full border border-[#701C32]/20 rounded-lg px-4 py-2.5 outline-none bg-white"
                          value={nuevoCurso.tipo_verano}
                          onChange={(e) => setNuevoCurso({ ...nuevoCurso, tipo_verano: e.target.value })}
                        >
                          <option value="FIJO">Curso fijo</option>
                          <option value="TALLER">Taller (electivo)</option>
                        </select>
                      </div>
                      {nuevoCurso.tipo_verano === "FIJO" && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase">Grupo / Aula</label>
                          <select
                            className="w-full border border-[#701C32]/20 rounded-lg px-4 py-2.5 outline-none bg-white"
                            value={nuevoCurso.grupo_verano}
                            onChange={(e) => setNuevoCurso({ ...nuevoCurso, grupo_verano: e.target.value })}
                          >
                            {GRUPOS_VERANO.map(g => <option key={g.clave} value={g.clave}>{g.etiqueta}</option>)}
                          </select>
                        </div>
                      )}
                      <p className="col-span-full text-[10px] text-gray-500">
                        Los <strong>cursos fijos</strong> (por grupo) y <strong>talleres</strong> son para externos o internos sin cursos desaprobados.
                        La <strong>nivelación</strong> no se configura aquí: son los cursos reales que el alumno desaprobó y retoma en verano.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* SECCIÓN: GRADOS (solo cursos regulares) */}
              {!nuevoCurso.es_verano && (
              <section className="space-y-3">
                <h4 className="text-[11px] font-black text-[#093E7A] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">school</span> Grados donde se dicta
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                  {niveles.map(nivel => (
                    <div key={nivel.id_nivel} className="space-y-2">
                      <p className="text-[10px] font-black text-[#093E7A] uppercase">{nivel.nombre}</p>
                      {nivel.grados.map(grado => (
                        <label key={grado.id_grado} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 accent-[#093E7A]"
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
              </section>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-3 shrink-0">
              <button onClick={cerrarModalPrincipal} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
              <button
                onClick={handleGuardarCurso}
                className="flex-1 py-3 bg-[#093E7A] text-white rounded-xl font-bold hover:bg-[#072d5a] transition-all"
              >
                {editingId ? "Guardar cambios" : "Registrar Curso"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MINI MODAL ÁREA --- */}
      {showAreaModal && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-[#093E7A] px-5 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">category</span>
                <h4 className="font-bold">Nueva Área Académica</h4>
              </div>
              <button onClick={() => setShowAreaModal(false)} className="hover:text-gray-300"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Nombre del área</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A]"
                  placeholder="Ej. Matemáticas"
                  value={nuevaAreaNombre}
                  onChange={(e) => setNuevaAreaNombre(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAreaModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 text-sm">Cancelar</button>
                <button onClick={handleCrearArea} className="flex-1 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold hover:bg-[#072d5a] text-sm">Crear área</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmCurso.abierto}
        onClose={() => setConfirmCurso({ abierto: false, id: 0, nombre: "", grados: [] })}
        onConfirm={ejecutarEliminarCurso}
        type="danger"
        title="Eliminar curso"
        message={`¿Seguro que deseas eliminar el curso "${confirmCurso.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
      />
    </>
    </RoleGuard>
  );
}