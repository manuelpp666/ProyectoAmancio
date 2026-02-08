"use client";
import { useEffect, useState } from "react";
import { Nivel, Seccion, AnioEscolar, Grado } from "../../../../../interfaces/academic"; 
import GradoCard from "@/src/components/Academic/GradoCard"; 
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { toast } from "sonner";

// URL Base
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GestionAcademicaPage() {
  // --- ESTADOS GLOBALES ---
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADO DEL AÑO ACTUAL ---
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");
  const [anioObj, setAnioObj] = useState<AnioEscolar | null>(null);

  // --- MODAL APERTURA AÑO ---
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [nuevoAnioData, setNuevoAnioData] = useState({
    id_anio_escolar: "", 
    fecha_inicio: "",
    fecha_fin: "",
    tipo: "REGULAR"
  });

  // Validar fechas apertura
  const fechasValidas = nuevoAnioData.fecha_inicio && nuevoAnioData.fecha_fin 
    ? new Date(nuevoAnioData.fecha_fin) > new Date(nuevoAnioData.fecha_inicio) 
    : false;

  // --- MODAL SECCIÓN ---
  const [isSeccionModalOpen, setIsSeccionModalOpen] = useState(false);
  const [selectedGradoId, setSelectedGradoId] = useState<number | null>(null);
  const [seccionEnEdicion, setSeccionEnEdicion] = useState<Seccion | null>(null);
  const [nuevaSeccion, setNuevaSeccion] = useState({
    nombre: "",
    vacantes: 30
    // Eliminado: aula
  });

  // --- MODAL COPIAR ---
  const [isCopiarModalOpen, setIsCopiarModalOpen] = useState(false);
  const [anioOrigenCopiar, setAnioOrigenCopiar] = useState("");

  // =========================================================
  // 1. CARGA DE DATOS
  // =========================================================
  
  const fetchDatosMaestros = async () => {
    try {
      setIsLoading(true);
      const [resAnios, resNiveles, resGrados] = await Promise.all([
        fetch(`${API_URL}/academic/anios/`),
        fetch(`${API_URL}/academic/niveles/`),
        fetch(`${API_URL}/academic/grados/`)
      ]);

      const dataAnios = await resAnios.json();
      setAnios(dataAnios);
      setNiveles(await resNiveles.json());
      setGrados(await resGrados.json());

      if (!anioSeleccionado) {
        const activo = dataAnios.find((a: AnioEscolar) => a.activo);
        if (activo) setAnioSeleccionado(activo.id_anio_escolar);
        else if (dataAnios.length > 0) setAnioSeleccionado(dataAnios[0].id_anio_escolar);
      }

    } catch (error) {
      console.error("Error cargando datos:", error);
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeccionesDelAnio = async (idAnio: string) => {
    try {
      const res = await fetch(`${API_URL}/academic/secciones/?anio_id=${idAnio}`);
      if (res.ok) {
        setSecciones(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDatosMaestros();
  }, []);

  useEffect(() => {
    if (anioSeleccionado) {
      const obj = anios.find(a => a.id_anio_escolar === anioSeleccionado) || null;
      setAnioObj(obj);
      fetchSeccionesDelAnio(anioSeleccionado);
    } else {
      setAnioObj(null);
      setSecciones([]);
    }
  }, [anioSeleccionado, anios]);


  // =========================================================
  // 2. LÓGICA DE NEGOCIO Y FILTROS
  // =========================================================

  // Verificar si el año aún no ha comenzado (para habilitar copiar estructura)
  const isAnioSinComenzar = () => {
    if (!anioObj) return false;
    const hoy = new Date();
    // Ajustamos la fecha de inicio para comparar correctamente (ignorando horas si es necesario)
    const fechaInicio = new Date(anioObj.fecha_inicio);
    // Agregamos un día al inicio para que el mismo día de inicio ya cuente como "comenzado" o ajustamos según lógica estricta
    return hoy < fechaInicio; 
  };

  const getNivelesVisibles = () => {
    if (!anioObj) return [];
    const esVerano = anioObj.tipo === "VERANO";
    
    return niveles.filter(n => {
      const nombre = n.nombre.toLowerCase();
      if (esVerano) {
        return true; // Verano ve todo (incluyendo pre academia)
      } else {
        return !nombre.includes("pre") && !nombre.includes("academia");
      }
    });
  };

  const getOpcionesSeccion = (gradoId: number) => {
    const grado = grados.find(g => g.id_grado === gradoId);
    if (!grado) return ["A", "B", "C"];

    const nivel = niveles.find(n => n.id_nivel === grado.id_nivel);
    const nombreNivel = nivel?.nombre.toLowerCase() || "";

    if (nombreNivel.includes("primaria")) {
        return ["Azul", "Amarillo", "Rojo", "Verde", "Naranja"];
    } else {
        return ["A", "B", "C", "D", "E", "F"];
    }
  };

  // =========================================================
  // 3. HANDLERS
  // =========================================================

  const handleAperturaAnio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/academic/anios/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...nuevoAnioData }), // El backend calcula 'activo'
      });

      if (res.ok) {
        toast.success(`Año Académico ${nuevoAnioData.id_anio_escolar} configurado`);
        setIsAperturaModalOpen(false);
        setNuevoAnioData({ id_anio_escolar: "", fecha_inicio: "", fecha_fin: "", tipo: "REGULAR" });
        fetchDatosMaestros(); 
      } else {
        const err = await res.json();
        toast.error(err.detail || "Error al abrir el año");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleCierreAnio = async () => {
    if (!anioSeleccionado) return;
    toast(`¿Forzar cierre del año ${anioSeleccionado}?`, {
      description: "Esto bloqueará inmediatamente a los docentes.",
      action: {
        label: "Confirmar",
        onClick: async () => {
          try {
            const res = await fetch(`${API_URL}/academic/anios/${anioSeleccionado}/cerrar`, {
              method: "PATCH"
            });
            if (res.ok) {
              toast.success("Año cerrado manualmente");
              fetchDatosMaestros();
            }
          } catch (e) {
            toast.error("Error de conexión");
          }
        }
      }
    });
  };

  // --- SECCIONES ---
  const handleGuardarSeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradoId || !anioSeleccionado) return toast.error("Falta seleccionar año o grado");

    const esEdicion = !!seccionEnEdicion;
    const url = esEdicion
      ? `${API_URL}/academic/secciones/${seccionEnEdicion.id_seccion}`
      : `${API_URL}/academic/secciones/`;

    try {
      const response = await fetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevaSeccion,
          id_grado: selectedGradoId,
          id_anio_escolar: anioSeleccionado
        }),
      });

      if (response.ok) {
        toast.success("Sección guardada correctamente");
        setIsSeccionModalOpen(false);
        fetchSeccionesDelAnio(anioSeleccionado);
      } else {
        toast.error("Error al guardar sección");
      }
    } catch (error) {
      toast.error("Error al guardar sección");
    }
  };

  const handleEliminarSeccion = async (id: number) => {
    toast("¿Eliminar sección?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            const res = await fetch(`${API_URL}/academic/secciones/${id}`, { method: "DELETE" });
            if (res.ok) {
              toast.success("Sección eliminada");
              fetchSeccionesDelAnio(anioSeleccionado);
            }
          } catch (e) { toast.error("Error al eliminar"); }
        },
      },
    });
  };

  const handleCopiarEstructura = async () => {
    if(!anioOrigenCopiar) return toast.error("Selecciona un año origen");
    if(!anioSeleccionado) return toast.error("Selecciona un año destino");
    
    try {
        const res = await fetch(`${API_URL}/academic/anios/copiar-estructura`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                anio_origen: anioOrigenCopiar,
                anio_destino: anioSeleccionado
            })
        });

        if (res.ok) {
            const data = await res.json();
            toast.success(data.message);
            setIsCopiarModalOpen(false);
            fetchSeccionesDelAnio(anioSeleccionado);
        } else {
            toast.error("Error al copiar estructura");
        }
    } catch (error) {
        toast.error("Error de conexión");
    }
  };

  // Helpers de apertura de modales
  const prepararNuevaSeccion = (gradoId: number) => {
    setSeccionEnEdicion(null);
    setSelectedGradoId(gradoId);
    setNuevaSeccion({ nombre: "", vacantes: 30 }); // Sin aula
    setIsSeccionModalOpen(true);
  };
  const prepararEditarSeccion = (seccion: Seccion) => {
    setSeccionEnEdicion(seccion);
    setSelectedGradoId(seccion.id_grado);
    setNuevaSeccion({ nombre: seccion.nombre, vacantes: seccion.vacantes }); // Sin aula
    setIsSeccionModalOpen(true);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        body { font-family: 'Lato', sans-serif; background-color: #F8FAFC; color: #1e293b; }
        .sidebar-maroon { background-color: #701C32; }
        .active-tab { border-bottom: 3px solid #093E7A; color: #093E7A; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .fill-icon { font-variation-settings: 'FILL' 1; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />

      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
          
          <HeaderPanel />

          {/* BARRA SUPERIOR */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">account_tree</span>
                <h2 className="text-xl font-bold text-gray-800">Estructura Escolar</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Año Académico:</label>
                <select 
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                  className="bg-gray-50 border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 pr-8"
                >
                  {anios.map(a => (
                    <option key={a.id_anio_escolar} value={a.id_anio_escolar}>
                        {a.id_anio_escolar} ({a.tipo})
                    </option>
                  ))}
                  {anios.length === 0 && <option>Cargando...</option>}
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {anioObj && (
                <div className={`flex items-center gap-3 text-sm font-medium ${anioObj.activo ? 'text-green-600' : 'text-red-500'}`}>
                  <span className={`flex items-center gap-1`}>
                    <span className={`size-2 rounded-full ${anioObj.activo ? 'bg-green-500' : 'bg-red-500'}`}></span> 
                    {anioObj.activo ? "Año en Curso (Vigente)" : "Año Finalizado / Inactivo"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL SCROLLABLE */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            
            {/* Gestión Año */}
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Gestión del Año Académico</h3>
                <p className="text-sm text-gray-500">Administre el estado del periodo lectivo y herramientas de migración.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Apertura */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#093E7A]">event_available</span>
                      Apertura de Año
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Configure los parámetros iniciales para el nuevo ciclo escolar.</p>
                  </div>
                  <button onClick={() => setIsAperturaModalOpen(true)} className="w-full py-2.5 bg-[#093E7A] text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    Apertura de Año
                  </button>
                </div>

                {/* Cierre */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#701C32]">event_busy</span>
                      Cierre de Año
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Finalice los registros académicos y bloquee modificaciones.</p>
                  </div>
                  <button 
                    onClick={handleCierreAnio}
                    disabled={!anioObj?.activo} 
                    className="w-full py-2.5 bg-[#701C32] text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Cierre de Año
                  </button>
                </div>

                {/* Copiar (MODIFICADO: Solo si no ha comenzado) */}
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
                    // Se deshabilita si el año YA comenzó o si no hay año seleccionado
                    disabled={!isAnioSinComenzar()} 
                    className="w-full py-2.5 bg-gray-100 text-gray-700 border border-gray-200 font-bold rounded-lg text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm text-gray-500">auto_awesome_motion</span>
                    Copiar Estructura Anterior
                  </button>
                  {!isAnioSinComenzar() && anioObj && (
                      <p className="text-[10px] text-red-400 mt-1 text-center">
                          Solo disponible antes del inicio de clases ({anioObj.fecha_inicio})
                      </p>
                  )}
                </div>
              </div>
            </section>

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
                getNivelesVisibles().map((nivel) => (
                  <div key={nivel.id_nivel} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#093E7A] fill-icon">domain</span>
                        <h4 className="font-black text-gray-800 uppercase tracking-wide">{nivel.nombre}</h4>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {grados.filter(g => g.id_nivel === nivel.id_nivel).map((grado) => {
                            const seccionesDelGrado = secciones.filter(s => s.id_grado === grado.id_grado);
                            const gradoConSecciones = { ...grado, secciones: seccionesDelGrado };

                            return (
                              <GradoCard
                                key={grado.id_grado}
                                grado={gradoConSecciones}
                                // Se pasan las funciones de SECCIÓN, pero NO las de GRADO (eliminar/editar)
                                onAddSeccion={() => prepararNuevaSeccion(grado.id_grado)}
                                onEditSeccion={prepararEditarSeccion}
                                onDeleteSeccion={handleEliminarSeccion}
                                // onEditGrado={prepararEditarGrado} <--- ELIMINADO
                                // onDeleteGrado={handleEliminarGrado} <--- ELIMINADO
                              />
                            );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        </div>
      </div>

      {/* --- MODAL DE SECCIÓN (SIN AULA) --- */}
      {isSeccionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-lg text-[#093E7A]">{seccionEnEdicion ? `Editar Sección` : "Nueva Sección"}</h3>
              <button onClick={() => setIsSeccionModalOpen(false)} className="text-gray-400 hover:text-gray-600"><span className="material-symbols-outlined">close</span></button>
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
              
              {/* CAMPO AULA ELIMINADO */}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsSeccionModalOpen(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-[#093E7A] rounded-lg">{seccionEnEdicion ? "Actualizar" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL APERTURA AÑO --- */}
      {isAperturaModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 border-b bg-[#093E7A] text-white">
              <h3 className="font-black text-lg">Configurar Nuevo Año</h3>
              <p className="text-xs opacity-80">El año iniciará activo automáticamente cuando llegue la fecha.</p>
            </div>
            <form onSubmit={handleAperturaAnio} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Identificador del Año</label>
                <input required maxLength={6} placeholder="Ej: 2026-1" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]" onChange={(e) => setNuevoAnioData({...nuevoAnioData, id_anio_escolar: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Ciclo</label>
                <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={nuevoAnioData.tipo}
                    onChange={(e) => setNuevoAnioData({...nuevoAnioData, tipo: e.target.value})}
                >
                    <option value="REGULAR">Año Regular (Marzo-Dic)</option>
                    <option value="VERANO">Ciclo Verano (Ene-Feb)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio</label>
                  <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setNuevoAnioData({...nuevoAnioData, fecha_inicio: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fin</label>
                  <input required type="date" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" onChange={(e) => setNuevoAnioData({...nuevoAnioData, fecha_fin: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAperturaModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={!fechasValidas}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
                    fechasValidas ? "bg-[#093E7A] text-white hover:bg-[#072d5a]" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Iniciar Año
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL COPIAR --- */}
      {isCopiarModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="font-black text-lg text-gray-800">Copiar Estructura</h3>
                    <p className="text-xs text-gray-500">Replica secciones de un año anterior.</p>
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
  );
}