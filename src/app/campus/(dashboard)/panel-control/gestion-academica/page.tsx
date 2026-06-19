"use client";
import { useEffect, useState } from "react";
import { Nivel, Seccion, AnioEscolar, Grado } from "@/src/interfaces/academic";
import GradoCard from "@/src/components/Academic/GradoCard";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { toast } from "sonner";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';

export default function GestionAcademicaPage() {

  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    anioObj,
    listaAnios: anios,
    loadingAnios,
    refreshAnios
  } = useAnioAcademico();
  
  // --- ESTADOS GLOBALES ---
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- MODAL CREAR AÑO (NUEVO) ---
  const [isCrearAnioModalOpen, setIsCrearAnioModalOpen] = useState(false);
  const [nuevoAnioData, setNuevoAnioData] = useState({
    id_anio_escolar: "",
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "REGULAR"
  });

  // --- MODAL EDITAR AÑO (MODIFICADO) ---
  const [isEditarAnioModalOpen, setIsEditarAnioModalOpen] = useState(false);
  const [editarAnioData, setEditarAnioData] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "REGULAR"
  });

  // --- MODAL INSCRIPCIONES ---
  const [isInscripcionModalOpen, setIsInscripcionModalOpen] = useState(false);
  const [inscripcionData, setInscripcionData] = useState({
    inicio_inscripcion: "",
    fin_inscripcion: ""
  });

  // --- MODAL SECCIÓN ---
  const [isSeccionModalOpen, setIsSeccionModalOpen] = useState(false);
  const [selectedGradoId, setSelectedGradoId] = useState<number | null>(null);
  const [seccionEnEdicion, setSeccionEnEdicion] = useState<Seccion | null>(null);
  const [nuevaSeccion, setNuevaSeccion] = useState({ nombre: "", vacantes: 30 });

  // --- MODAL COPIAR ---
  const [isCopiarModalOpen, setIsCopiarModalOpen] = useState(false);
  const [anioOrigenCopiar, setAnioOrigenCopiar] = useState("");

  // --- ACORDEÓN DE NIVELES (colapsar/expandir) ---
  const [nivelesColapsados, setNivelesColapsados] = useState<Set<number>>(new Set());
  const toggleNivel = (idNivel: number) => {
    setNivelesColapsados(prev => {
      const next = new Set(prev);
      if (next.has(idNivel)) next.delete(idNivel); else next.add(idNivel);
      return next;
    });
  };

  // Formatea "2026-03-01" -> "01 mar 2026"
  const formatearFecha = (iso?: string) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
    if (!y || !m || !d) return iso;
    return `${d} ${meses[parseInt(m, 10) - 1] || ""} ${y}`;
  };

  // Validaciones
  const fechasCrearValidas = nuevoAnioData.fecha_inicio && nuevoAnioData.fecha_fin
    ? new Date(nuevoAnioData.fecha_fin) > new Date(nuevoAnioData.fecha_inicio) : false;

  const fechasEditarValidas = editarAnioData.fecha_inicio && editarAnioData.fecha_fin
    ? new Date(editarAnioData.fecha_fin) > new Date(editarAnioData.fecha_inicio) : false;

  const fechasInscripcionValidas = inscripcionData.inicio_inscripcion && inscripcionData.fin_inscripcion
    ? new Date(inscripcionData.fin_inscripcion) > new Date(inscripcionData.inicio_inscripcion) : false;

  // =========================================================
  // 1. CARGA DE DATOS
  // =========================================================
  const fetchDatosMaestros = async () => {
    try {
      setIsLoading(true);
      const [resNiveles, resGrados] = await Promise.all([
        apiFetch(`/academic/niveles/`),
        apiFetch(`/academic/grados/`)
      ]);
      setNiveles(await resNiveles.json());
      setGrados(await resGrados.json());
    } catch (error) { toast.error("Error de conexión"); } finally { setIsLoading(false); }
  };

  const fetchSeccionesDelAnio = async (idAnio: string) => {
    try {
      const res = await apiFetch(`/academic/secciones/?anio_id=${idAnio}`);
      if (res.ok) setSecciones(await res.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    fetchDatosMaestros();
  }, []);

  useEffect(() => {
    if (anioSeleccionado) {
      fetchSeccionesDelAnio(anioSeleccionado);
      if (anioObj) {
        setInscripcionData({
          inicio_inscripcion: anioObj.inicio_inscripcion || "",
          fin_inscripcion: anioObj.fin_inscripcion || ""
        });
        setEditarAnioData({
          fecha_inicio: anioObj.fecha_inicio || "",
          fecha_fin: anioObj.fecha_fin || "",
          tipo: anioObj.tipo || "REGULAR"
        });
      }
    } else {
      setSecciones([]);
    }
  }, [anioSeleccionado, anioObj]);

  // =========================================================
  // 2. LÓGICA DE FILTROS
  // =========================================================
  const isAnioSinComenzar = () => {
    if (!anioObj) return false;
    const hoy = new Date();
    const fechaInicio = new Date(anioObj.fecha_inicio);
    return hoy < fechaInicio;
  };

  // ¿Las inscripciones del año seleccionado están abiertas hoy?
  const inscripcionesAbiertas = () => {
    if (!anioObj?.inicio_inscripcion || !anioObj?.fin_inscripcion) return false;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const inicio = new Date(anioObj.inicio_inscripcion);
    const fin = new Date(anioObj.fin_inscripcion);
    return hoy >= inicio && hoy <= fin;
  };

  // Días que faltan para que cierren las inscripciones (incluye hoy)
  const diasRestantesInscripcion = () => {
    if (!anioObj?.fin_inscripcion) return 0;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fin = new Date(anioObj.fin_inscripcion); fin.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((fin.getTime() - hoy.getTime()) / 86400000) + 1);
  };

  const getNivelesVisibles = () => {
    if (loadingAnios || !anioObj) return niveles;
    const esVerano = anioObj.tipo === "VERANO";
    return niveles.filter(n => {
      const nombre = n.nombre.toLowerCase();
      if (esVerano) return true;
      return !nombre.includes("pre") && !nombre.includes("academia");
    });
  };

  const getOpcionesSeccion = (gradoId: number) => {
    const grado = grados.find(g => g.id_grado === gradoId);
    if (!grado) return ["A", "B", "C"];
    const nivel = niveles.find(n => n.id_nivel === grado.id_nivel);
    const nombreNivel = nivel?.nombre.toLowerCase() || "";
    if (nombreNivel.includes("primaria")) return ["Azul", "Amarillo", "Rojo", "Verde", "Naranja"];
    return ["A", "B", "C", "D", "E", "F"];
  };

  // Totales para la tira de resumen (basados en los niveles visibles)
  const getResumen = () => {
    const idsNivelesVisibles = new Set(getNivelesVisibles().map(n => n.id_nivel));
    const gradosVisibles = grados.filter(g => idsNivelesVisibles.has(g.id_nivel));
    const idsGradosVisibles = new Set(gradosVisibles.map(g => g.id_grado));
    const seccionesVisibles = secciones.filter(s => idsGradosVisibles.has(s.id_grado));
    const totalVacantes = seccionesVisibles.reduce((acc, s) => acc + (s.vacantes ?? 0), 0);
    const totalOcupadas = seccionesVisibles.reduce((acc, s) => acc + (s.ocupadas ?? 0), 0);
    return {
      niveles: idsNivelesVisibles.size,
      grados: gradosVisibles.length,
      secciones: seccionesVisibles.length,
      vacantes: totalVacantes,
      ocupadas: totalOcupadas,
    };
  };

  // =========================================================
  // 3. HANDLERS
  // =========================================================
  const handleCrearAnio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/academic/anios/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevoAnioData }),
      });
      if (res.ok) {
        toast.success(`Año ${nuevoAnioData.id_anio_escolar} creado exitosamente`);
        setIsCrearAnioModalOpen(false);
        refreshAnios();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Error al crear el año");
      }
    } catch (error) { toast.error("Error de conexión"); }
  };

  const handleEditarAnio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anioSeleccionado) return;
    try {
      const res = await apiFetch(`/academic/anios/${anioSeleccionado}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editarAnioData)
      });
      if (res.ok) {
        toast.success("Fechas del año académico actualizadas");
        setIsEditarAnioModalOpen(false);
        refreshAnios();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Error al actualizar fechas");
      }
    } catch (error) { toast.error("Error de conexión"); }
  };

  const handleGuardarInscripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anioSeleccionado) return;
    try {
      const res = await apiFetch(`/academic/anios/${anioSeleccionado}/inscripciones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inscripcionData)
      });
      if (res.ok) {
        toast.success("Fechas de inscripción actualizadas");
        setIsInscripcionModalOpen(false);
        refreshAnios();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Error al guardar fechas");
      }
    } catch (error) { toast.error("Error de conexión"); }
  };

  // --- SECCIONES Y COPIAR ---
  const handleGuardarSeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradoId || !anioSeleccionado) return toast.error("Falta seleccionar año o grado");
    const esEdicion = !!seccionEnEdicion;
    const url = esEdicion ? `/academic/secciones/${seccionEnEdicion.id_seccion}` : `/academic/secciones/`;
    try {
      const response = await apiFetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevaSeccion, id_grado: selectedGradoId, id_anio_escolar: anioSeleccionado }),
      });
      if (response.ok) {
        toast.success("Sección guardada correctamente");
        setIsSeccionModalOpen(false);
        fetchSeccionesDelAnio(anioSeleccionado);
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Error al guardar sección");
      }
    } catch (error) { toast.error("Error al guardar sección"); }
  };

  const handleEliminarSeccion = async (id: number) => {
    toast("¿Eliminar sección?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            const res = await apiFetch(`/academic/secciones/${id}`, { method: "DELETE" });
            if (res.ok) { toast.success("Sección eliminada"); fetchSeccionesDelAnio(anioSeleccionado); }
          } catch (e) { toast.error("Error al eliminar"); }
        },
      },
    });
  };

  const handleCopiarEstructura = async () => {
    if (!anioOrigenCopiar) return toast.error("Selecciona un año origen");
    if (!anioSeleccionado) return toast.error("Selecciona un año destino");
    try {
      const res = await apiFetch(`/academic/anios/copiar-estructura`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anio_origen: anioOrigenCopiar, anio_destino: anioSeleccionado })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        setIsCopiarModalOpen(false);
        fetchSeccionesDelAnio(anioSeleccionado);
      } else { toast.error("Error al copiar estructura"); }
    } catch (error) { toast.error("Error de conexión"); }
  };

  const prepararNuevaSeccion = (gradoId: number) => { setSeccionEnEdicion(null); setSelectedGradoId(gradoId); setNuevaSeccion({ nombre: "", vacantes: 30 }); setIsSeccionModalOpen(true); };
  const prepararEditarSeccion = (seccion: Seccion) => { setSeccionEnEdicion(seccion); setSelectedGradoId(seccion.id_grado); setNuevaSeccion({ nombre: seccion.nombre, vacantes: seccion.vacantes ?? 30 }); setIsSeccionModalOpen(true); };
  
  return (
    <RoleGuard modulo="academico" subModulo="estructura">
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        body { font-family: 'Lato', sans-serif; background-color: #F8FAFC; color: #1e293b; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .fill-icon { font-variation-settings: 'FILL' 1; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />

      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">

          <HeaderPanel />

          {/* BARRA SUPERIOR */}
          <div className="min-h-16 border-b bg-white flex flex-wrap items-center justify-between gap-y-3 px-8 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">account_tree</span>
                <h2 className="text-xl font-bold text-gray-800">Estructura Escolar</h2>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-200 mx-2"></div>

              {/* SELECTOR DE AÑOS Y BOTÓN DE NUEVO AÑO */}
              <div className="flex items-center gap-3">
                <AnioSelector
                  value={anioSeleccionado}
                  onChange={setAnioSeleccionado}
                  anios={anios}
                  loading={loadingAnios}
                />
                <button
                  onClick={() => setIsCrearAnioModalOpen(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d5a] transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Nuevo Año
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {anioObj && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${anioObj.tipo === "VERANO" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                  <span className="material-symbols-outlined text-sm">{anioObj.tipo === "VERANO" ? "sunny" : "school"}</span>
                  {anioObj.tipo === "VERANO" ? "Ciclo Verano" : "Año Regular"}
                </span>
              )}
              {anioObj && (
                <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${anioObj.activo ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`size-2 rounded-full ${anioObj.activo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {anioObj.activo ? "Año en Curso (Vigente)" : "Año Finalizado / Inactivo"}
                </span>
              )}
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">

            {!anioSeleccionado ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">calendar_add_on</span>
                <h3 className="text-lg font-black text-gray-700">Selecciona un año académico</h3>
                <p className="text-sm text-gray-500 max-w-md mt-1">
                  Elige un año en el selector superior para administrar su estructura, o crea uno nuevo para empezar.
                </p>
                <button
                  onClick={() => setIsCrearAnioModalOpen(true)}
                  className="mt-5 flex items-center gap-1 px-5 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d5a] transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Crear Nuevo Año
                </button>
              </div>
            ) : (
            <>
            {/* Gestión Año */}
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Gestión del Año Académico</h3>
                <p className="text-sm text-gray-500">Administre el estado del periodo lectivo y las fechas de admisión.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* EDITAR FECHAS DE CLASES */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#093E7A]">event_available</span>
                      Periodo Académico
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Fechas de inicio y fin de clases.</p>
                    {anioObj && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 font-medium space-y-1">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="font-bold">{formatearFecha(anioObj.fecha_inicio)}</span></div>
                        <div className="flex justify-between"><span>Fin:</span> <span className="font-bold">{formatearFecha(anioObj.fecha_fin)}</span></div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setIsEditarAnioModalOpen(true)} 
                    disabled={!anioSeleccionado}
                    className="w-full py-2.5 bg-white border-2 border-[#093E7A] text-[#093E7A] font-bold rounded-lg text-sm hover:bg-[#093E7A] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">edit_calendar</span>
                    Editar Fechas
                  </button>
                </div>

                {/* INSCRIPCIONES */}
                <div className={`bg-white p-6 rounded-xl shadow-sm border flex flex-col justify-between transition-colors ${inscripcionesAbiertas() ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'}`}>
                  <div className="mb-4">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#093E7A]">how_to_reg</span>
                        Inscripciones / Matrícula
                      </h4>
                      {inscripcionesAbiertas() && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[11px] font-bold whitespace-nowrap">
                          <span className="relative flex size-2">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping"></span>
                            <span className="relative inline-flex size-2 rounded-full bg-green-500"></span>
                          </span>
                          Abiertas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Periodo habilitado para nuevas matrículas.</p>
                    {anioObj && anioObj.inicio_inscripcion && anioObj.fin_inscripcion ? (
                      <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg text-xs text-green-800 font-medium space-y-1">
                        <div className="flex justify-between"><span>Inicio:</span> <span className="font-bold">{formatearFecha(anioObj.inicio_inscripcion)}</span></div>
                        <div className="flex justify-between"><span>Fin:</span> <span className="font-bold">{formatearFecha(anioObj.fin_inscripcion)}</span></div>
                        {inscripcionesAbiertas() && (
                          <div className="flex justify-between pt-1 border-t border-green-100 text-green-700">
                            <span>Estado:</span>
                            <span className="font-bold">Cierran en {diasRestantesInscripcion()} día(s)</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 italic text-center">
                        Sin fechas configuradas
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setIsInscripcionModalOpen(true)}
                    disabled={!anioSeleccionado}
                    className="w-full py-2.5 bg-white border-2 border-[#093E7A] text-[#093E7A] font-bold rounded-lg text-sm hover:bg-[#093E7A] hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">date_range</span>
                    Configurar Fechas
                  </button>
                </div>

                {/* COPIAR ESTRUCTURA */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">content_copy</span>
                      Herramienta Especial
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Clone la estructura de grados y secciones del año anterior.</p>
                  </div>
                  <button
                    onClick={() => setIsCopiarModalOpen(true)}
                    disabled={!isAnioSinComenzar()}
                    className="w-full py-2.5 bg-gray-100 text-gray-700 border border-gray-200 font-bold rounded-lg text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm text-gray-500">auto_awesome_motion</span>
                    Copiar Estructura
                  </button>
                  {!isAnioSinComenzar() && anioObj && (
                    <p className="text-[10px] text-red-400 mt-1 text-center">
                      Solo antes del inicio de clases
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Tira de resumen */}
            {!isLoading && getNivelesVisibles().length > 0 && (() => {
              const r = getResumen();
              const pct = r.vacantes > 0 ? Math.round((r.ocupadas / r.vacantes) * 100) : 0;
              const items = [
                { label: "Niveles", valor: r.niveles, icon: "domain" },
                { label: "Grados", valor: r.grados, icon: "stairs" },
                { label: "Secciones", valor: r.secciones, icon: "groups" },
                { label: "Vacantes", valor: r.vacantes, icon: "event_seat" },
                { label: "Ocupación", valor: `${r.ocupadas}/${r.vacantes} (${pct}%)`, icon: "person_check" },
              ];
              return (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {items.map((it) => (
                    <div key={it.label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                      <span className="material-symbols-outlined text-[#093E7A] bg-blue-50 rounded-lg p-2">{it.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase font-bold text-gray-400 tracking-wide">{it.label}</p>
                        <p className="text-base font-black text-gray-800 truncate">{it.valor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Listado de Niveles */}
            <section className="space-y-4">
              <h3 className="text-xl font-black text-gray-900">Niveles Educativos ({anioObj?.tipo || '...'})</h3>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#093E7A] mb-4"></div>
                  <p className="font-bold">Cargando estructura escolar...</p>
                </div>
              ) : getNivelesVisibles().length === 0 ? (
                <div className="bg-white p-10 text-center rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">No hay niveles configurados para este tipo de año.</p>
                </div>
              ) : (
                getNivelesVisibles().map((nivel) => {
                  const gradosNivel = grados.filter(g => g.id_nivel === nivel.id_nivel);
                  const idsGrados = new Set(gradosNivel.map(g => g.id_grado));
                  const seccionesNivel = secciones.filter(s => idsGrados.has(s.id_grado));
                  const colapsado = nivelesColapsados.has(nivel.id_nivel);

                  return (
                  <div key={nivel.id_nivel} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
                    <button
                      onClick={() => toggleNivel(nivel.id_nivel)}
                      className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#093E7A] fill-icon">domain</span>
                        <h4 className="font-black text-gray-800 uppercase tracking-wide">{nivel.nombre}</h4>
                        <span className="text-xs font-semibold text-gray-400 normal-case">
                          {gradosNivel.length} grados · {seccionesNivel.length} secciones
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-gray-400 transition-transform ${colapsado ? "" : "rotate-180"}`}>
                        expand_more
                      </span>
                    </button>
                    {!colapsado && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gradosNivel.map((grado) => {
                          const seccionesDelGrado = secciones.filter(s => s.id_grado === grado.id_grado);
                          const gradoConSecciones = { ...grado, secciones: seccionesDelGrado };

                          return (
                            <GradoCard
                              key={grado.id_grado}
                              grado={gradoConSecciones}
                              onAddSeccion={() => prepararNuevaSeccion(grado.id_grado as number)} // <-- Soluciona el Error 3
                              onEditSeccion={prepararEditarSeccion}
                              onDeleteSeccion={handleEliminarSeccion}
                            />
                          );
                        })}
                      </div>
                    </div>
                    )}
                  </div>
                  );
                })
              )}
            </section>
            </>
            )}
          </div>
        </div>
      </div>

      {/* --- MODAL CREAR AÑO (NUEVO BOTÓN) --- */}
      {isCrearAnioModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">calendar_add_on</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Nuevo Año Académico</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">El año se creará en el sistema y aparecerá en el selector.</p>
                </div>
              </div>
              <button onClick={() => setIsCrearAnioModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleCrearAnio} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Identificador del Año</label>
                <input required maxLength={6} placeholder="Ej: 2026-1" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]" onChange={(e) => setNuevoAnioData({ ...nuevoAnioData, id_anio_escolar: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Ciclo</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                  value={nuevoAnioData.tipo}
                  onChange={(e) => setNuevoAnioData({ ...nuevoAnioData, tipo: e.target.value })}
                >
                  <option value="REGULAR">Año Regular (Marzo-Dic)</option>
                  <option value="VERANO">Ciclo Verano (Ene-Feb)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio Clases</label>
                  <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setNuevoAnioData({ ...nuevoAnioData, fecha_inicio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin Clases</label>
                  <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setNuevoAnioData({ ...nuevoAnioData, fecha_fin: e.target.value })} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCrearAnioModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                <button
                  type="submit"
                  disabled={!fechasCrearValidas}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${fechasCrearValidas ? "bg-[#093E7A] text-white hover:bg-[#072d5a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  Crear Año
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR AÑO (MODIFICADO) --- */}
      {isEditarAnioModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">edit_calendar</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Editar Año Académico</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">Modificando el año {anioSeleccionado}</p>
                </div>
              </div>
              <button onClick={() => setIsEditarAnioModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleEditarAnio} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Ciclo</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                  value={editarAnioData.tipo}
                  onChange={(e) => setEditarAnioData({ ...editarAnioData, tipo: e.target.value })}
                >
                  <option value="REGULAR">Año Regular (Marzo-Dic)</option>
                  <option value="VERANO">Ciclo Verano (Ene-Feb)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio Clases</label>
                  <input required type="date" value={editarAnioData.fecha_inicio} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setEditarAnioData({ ...editarAnioData, fecha_inicio: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin Clases</label>
                  <input required type="date" value={editarAnioData.fecha_fin} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setEditarAnioData({ ...editarAnioData, fecha_fin: e.target.value })} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsEditarAnioModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                <button
                  type="submit"
                  disabled={!fechasEditarValidas}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${fechasEditarValidas ? "bg-[#093E7A] text-white hover:bg-[#072d5a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  Actualizar Año
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL INSCRIPCIONES --- */}
      {isInscripcionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">how_to_reg</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Configurar Inscripciones</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">Periodo de matrícula para {anioSeleccionado}</p>
                </div>
              </div>
              <button onClick={() => setIsInscripcionModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleGuardarInscripcion} className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-4">
                <p>Las matrículas automáticas solo se procesarán si la fecha actual está dentro de este rango.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio de Inscripciones</label>
                <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]" value={inscripcionData.inicio_inscripcion} onChange={(e) => setInscripcionData({ ...inscripcionData, inicio_inscripcion: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin de Inscripciones</label>
                <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]" value={inscripcionData.fin_inscripcion} onChange={(e) => setInscripcionData({ ...inscripcionData, fin_inscripcion: e.target.value })} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsInscripcionModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" disabled={!fechasInscripcionValidas} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${fechasInscripcionValidas ? "bg-[#093E7A] text-white hover:bg-[#072d5a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>Guardar Fechas</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE SECCIÓN --- */}
      {isSeccionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">groups</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">{seccionEnEdicion ? "Editar Sección" : "Nueva Sección"}</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">Define el nombre de la sección y sus vacantes.</p>
                </div>
              </div>
              <button onClick={() => setIsSeccionModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleGuardarSeccion} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                  <select required className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none" value={nuevaSeccion.nombre} onChange={(e) => setNuevaSeccion({ ...nuevaSeccion, nombre: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {selectedGradoId && getOpcionesSeccion(selectedGradoId).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vacantes</label>
                  <input required type="number" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none" value={nuevaSeccion.vacantes} onChange={(e) => setNuevaSeccion({ ...nuevaSeccion, vacantes: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsSeccionModalOpen(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-[#093E7A] rounded-lg">{seccionEnEdicion ? "Actualizar" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL COPIAR --- */}
      {isCopiarModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><span className="material-symbols-outlined">content_copy</span></div>
                <div>
                  <h3 className="font-black text-lg leading-tight">Copiar Estructura</h3>
                  <p className="text-[11px] text-white/70 mt-0.5">Replica las secciones de un año anterior.</p>
                </div>
              </div>
              <button onClick={() => setIsCopiarModalOpen(false)} className="text-white/70 hover:text-white transition-colors mt-0.5"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-xs border border-yellow-100">
                Se copiarán todas las secciones al año actual <strong>{anioSeleccionado}</strong>.
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Año Origen</label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                  value={anioOrigenCopiar}
                  onChange={(e) => setAnioOrigenCopiar(e.target.value)}
                >
                  <option value="">Selecciona...</option>
                  {anios.filter(a => a.id_anio_escolar !== anioSeleccionado).map(a => (
                    <option key={a.id_anio_escolar} value={a.id_anio_escolar}>{a.id_anio_escolar}</option>
                  ))}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setIsCopiarModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                <button onClick={handleCopiarEstructura} className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm">Copiar Todo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
    </RoleGuard>
  );
}