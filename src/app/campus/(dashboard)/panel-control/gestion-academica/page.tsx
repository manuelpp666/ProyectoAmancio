"use client";
import { useEffect, useState } from "react";
import { Nivel, Seccion } from "@/src/interfaces/academic";
import { GradoCard } from "@/src/components/Academic/GradoCard";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { toast } from "sonner";
import { isDateRangeValid } from "@/src/components/utils/ValidarFechas";

export default function GestionAcademicaPage() {

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Estados para Año Escolar
const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
const [anioParaCerrar, setAnioParaCerrar] = useState("2025"); // El que esté seleccionado en el select superior
const [nuevoAnioData, setNuevoAnioData] = useState({
  id_anio_escolar: "", // Ej: "2026"
  fecha_inicio: "",
  fecha_fin: ""
});
const fechasValidas = isDateRangeValid(nuevoAnioData.fecha_inicio, nuevoAnioData.fecha_fin);
const handleAperturaAnio = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/anios/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...nuevoAnioData, activo: 1 }),
    });

    if (res.ok) {
      toast.success(`Año Académico ${nuevoAnioData.id_anio_escolar} abierto con éxito`);
      setIsAperturaModalOpen(false);
      // Aquí podrías recargar la lista de años si tuvieras un fetchAnios
    } else {
      const err = await res.json();
      toast.error(err.detail || "Error al abrir el año");
    }
  } catch (error) {
    toast.error("Error de conexión");
  }
};

const handleCierreAnio = async () => {
  toast(`¿Estás seguro de cerrar el año ${anioParaCerrar}?`, {
    description: "Esto desactivará todos los registros del periodo actual.",
    action: {
      label: "Confirmar Cierre",
      onClick: async () => {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/anios/${anioParaCerrar}/cerrar`, {
            method: "PATCH"
          });
          if (res.ok) {
            toast.success("Año académico cerrado");
            // Aquí podrías refrescar el estado global
          }
        } catch (e) {
          toast.error("No se pudo cerrar el año");
        }
      }
    }
  });
};
  // Estados para el Modal de Nuevo Grado
  const [gradoEnEdicion, setGradoEnEdicion] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNivelId, setSelectedNivelId] = useState<number | null>(null);
  const [nuevoGrado, setNuevoGrado] = useState({ nombre: "", orden: 1 });
  // --- ESTADOS PARA SECCIÓN (Editado) ---
  const [isSeccionModalOpen, setIsSeccionModalOpen] = useState(false);
  const [selectedGradoId, setSelectedGradoId] = useState<number | null>(null);
  const [seccionEnEdicion, setSeccionEnEdicion] = useState<Seccion | null>(null);
  const [nuevaSeccion, setNuevaSeccion] = useState({
    nombre: "",
    aula: "",
    vacantes: 30
  });



  // --- CONEXIÓN CON EL BACKEND ---
  const fetchEstructura = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/niveles/`);
      if (!response.ok) throw new Error("Error al obtener datos");
      const data = await response.json();
      setNiveles(data);
    } catch (error) {
      console.error("Error cargando niveles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEstructura();
  }, []);

  // Función para guardar el grado
  const handleGuardarGrado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNivelId) return;

    const esEdicion = !!gradoEnEdicion;
    const url = esEdicion
      ? `${process.env.NEXT_PUBLIC_API_URL}/academic/grados/${gradoEnEdicion.id_grado}`
      : `${process.env.NEXT_PUBLIC_API_URL}/academic/grados/`;

    try {
      const response = await fetch(url, {
        method: esEdicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoGrado.nombre,
          orden: nuevoGrado.orden,
          id_nivel: selectedNivelId
        }),
      });

      if (response.ok) {
        toast.success(esEdicion ? "Grado actualizado" : "Grado creado");
        setIsModalOpen(false);
        setNuevoGrado({ nombre: "", orden: 1 });
        fetchEstructura();
      }
    } catch (error) {
      toast.error("Error al guardar el grado");
    }
  };
  const prepararNuevoGrado = (nivelId: number) => {
    setGradoEnEdicion(null); // Modo creación
    setSelectedNivelId(nivelId);
    setNuevoGrado({ nombre: "", orden: 1 });
    setIsModalOpen(true);
  };

  const prepararEditarGrado = (grado: any) => {
    setGradoEnEdicion(grado); // Modo edición
    setSelectedNivelId(grado.id_nivel);
    setNuevoGrado({ nombre: grado.nombre, orden: grado.orden });
    setIsModalOpen(true);
  };

  const handleEliminarGrado = async (grado: any) => {
    // 1. Validación de seguridad en el Frontend
    if (grado.secciones && grado.secciones.length > 0) {
      toast.error(`No se puede eliminar "${grado.nombre}" porque contiene secciones activas.`);
      return;
    }

    // 2. Confirmación con Sonner
    toast(`¿Eliminar grado ${grado.nombre}?`, {
      action: {
        label: "Confirmar",
        onClick: async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/grados/${grado.id_grado}`, {
              method: "DELETE",
            });

            if (res.ok) {
              toast.success("Grado eliminado correctamente");
              fetchEstructura();
            } else {
              const errorData = await res.json();
              toast.error(errorData.detail || "Error al eliminar");
            }
          } catch (e) {
            toast.error("Error de conexión con el servidor");
          }
        },
      },
    });
  };
  // --- FUNCIONES DE SECCIÓN ---

  // Abrir modal para crear
  const prepararNuevaSeccion = (gradoId: number) => {
    setSeccionEnEdicion(null);
    setSelectedGradoId(gradoId);
    setNuevaSeccion({ nombre: "", aula: "", vacantes: 30 });
    setIsSeccionModalOpen(true);
  };

  // Abrir modal para editar (REUTILIZACIÓN)
  const prepararEditarSeccion = (seccion: Seccion) => {
    setSeccionEnEdicion(seccion);
    setSelectedGradoId(seccion.id_grado);
    setNuevaSeccion({
      nombre: seccion.nombre,
      aula: seccion.aula || "",
      vacantes: seccion.vacantes
    });
    setIsSeccionModalOpen(true);
  };

  const handleGuardarSeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGradoId) return;

    const esEdicion = !!seccionEnEdicion;
    const url = esEdicion
      ? `${process.env.NEXT_PUBLIC_API_URL}/academic/secciones/${seccionEnEdicion.id_seccion}`
      : `${process.env.NEXT_PUBLIC_API_URL}/academic/secciones/`;

    const metodo = esEdicion ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevaSeccion,
          id_grado: selectedGradoId
        }),
      });

      if (response.ok) {
        toast.success(esEdicion ? "Sección actualizada" : "Sección creada correctamente");
        setIsSeccionModalOpen(false);
        fetchEstructura();
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    }
  };

  const handleEliminarSeccion = async (id: number) => {
    toast("¿Eliminar sección permanentemente?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/secciones/${id}`, {
              method: "DELETE"
            });
            if (res.ok) {
              toast.success("Sección eliminada físicamente");
              fetchEstructura();
            }
          } catch (e) {
            toast.error("No se pudo eliminar");
          }
        },
      },
    });
  };
  return (
    <>


      <style dangerouslySetInnerHTML={{
        __html: `
        body { 
            font-family: 'Lato', sans-serif; 
            background-color: #F8FAFC;
            color: #1e293b; 
        }
        .sidebar-maroon { background-color: #701C32; }
        .active-tab { 
            border-bottom: 3px solid #093E7A; 
            color: #093E7A; 
        }
        .material-symbols-outlined { 
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
        }
        .fill-icon { 
            font-variation-settings: 'FILL' 1; 
        }
        /* Estilos de scrollbar personalizados del original */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
      `}} />

      <div className="flex h-screen overflow-hidden">

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">



          {/* Tabs */}
          <HeaderPanel></HeaderPanel>

          <div className="h-16 border-b bg-white flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">account_tree</span>
                <h2 className="text-xl font-bold text-gray-800">Estructura Escolar</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Año Académico:</label>
                <select className="bg-gray-50 border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 pr-8">
                  <option>2025</option>
                  <option>2024</option>
                  <option>2023</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500"></span> Año en curso</span>
              </div>

            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Gestión Año */}
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Gestión del Año Académico</h3>
                <p className="text-sm text-gray-500">Administre el estado del periodo lectivo y herramientas de migración.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#701C32]">event_busy</span>
                      Cierre de Año
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Finalice los registros académicos y bloquee modificaciones.</p>
                  </div>
                  <button onClick={handleCierreAnio} className="w-full py-2.5 bg-[#701C32] text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Cierre de Año
                  </button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">content_copy</span>
                      Herramienta Especial
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Clone la estructura de grados y secciones del año anterior.</p>
                  </div>
                  <button className="w-full py-2.5 bg-gray-100 text-gray-700 border border-gray-200 font-bold rounded-lg text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm text-gray-500">auto_awesome_motion</span>
                    Copiar Estructura Anterior
                  </button>
                </div>
              </div>
            </section>

            {/* Grados y Secciones */}
            <section className="space-y-4">
              <h3 className="text-xl font-black text-gray-900">Niveles Educativos</h3>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#093E7A] mb-4"></div>
                  <p className="font-bold">Cargando estructura escolar...</p>
                </div>
              ) : niveles.length === 0 ? (
                <div className="bg-white p-10 text-center rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-500">No se encontraron niveles configurados.</p>
                </div>
              ) : (
                niveles.map((nivel) => (
                  <div key={nivel.id_nivel} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
                    <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[#093E7A] fill-icon">domain</span>
                        <h4 className="font-black text-gray-800 uppercase tracking-wide">{nivel.nombre}</h4>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nivel.grados.map((grado) => (
                          <GradoCard
                            key={grado.id_grado}
                            grado={grado}
                            onAddSeccion={() => prepararNuevaSeccion(grado.id_grado)}
                            onEditSeccion={prepararEditarSeccion}
                            onDeleteSeccion={handleEliminarSeccion}
                            onEditGrado={prepararEditarGrado}      // <-- AGREGAR ESTO
                            onDeleteGrado={handleEliminarGrado}    // <-- AGREGAR ESTO
                          />
                        ))}
                        <button
                          onClick={() => prepararNuevoGrado(nivel.id_nivel)}
                          className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 hover:border-[#093E7A] hover:text-[#093E7A] hover:bg-[#093E7A]/5 transition-all"
                        >
                          <span className="material-symbols-outlined text-2xl mb-1">add_circle</span>
                          <span className="text-xs font-bold uppercase">Añadir Grado</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>


        </div>
      </div>

      {/* --- MODAL DE REGISTRO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-black text-lg text-gray-800">
                {gradoEnEdicion ? `Editar: ${gradoEnEdicion.nombre}` : "Nuevo Grado"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleGuardarGrado} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Grado</label>
                <input
                  required
                  type="text"
                  placeholder="Ej: 1° de Primaria"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none"
                  value={nuevoGrado.nombre}
                  onChange={(e) => setNuevoGrado({ ...nuevoGrado, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Orden de Visualización</label>
                <input
                  required
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none"
                  value={nuevoGrado.orden}
                  onChange={(e) => setNuevoGrado({ ...nuevoGrado, orden: parseInt(e.target.value) })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-[#093E7A] rounded-lg hover:opacity-90"
                >
                  {gradoEnEdicion ? "Actualizar Cambios" : "Guardar Grado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE NUEVA SECCIÓN --- */}
      {isSeccionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-black text-lg text-[#093E7A]">
                {seccionEnEdicion ? `Editar Sección: ${seccionEnEdicion.nombre}` : "Nueva Sección"}
              </h3>
              <button onClick={() => setIsSeccionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleGuardarSeccion} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre (Letra/Número)</label>
                  <input
                    required
                    type="text"
                    placeholder="Ej: A"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none"
                    value={nuevaSeccion.nombre}
                    onChange={(e) => setNuevaSeccion({ ...nuevaSeccion, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vacantes</label>
                  <input
                    required
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none"
                    value={nuevaSeccion.vacantes}
                    onChange={(e) => setNuevaSeccion({ ...nuevaSeccion, vacantes: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aula / Ubicación</label>
                <input
                  type="text"
                  placeholder="Ej: Pabellón A - 102"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#093E7A] outline-none"
                  value={nuevaSeccion.aula}
                  onChange={(e) => setNuevaSeccion({ ...nuevaSeccion, aula: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsSeccionModalOpen(false)} className="flex-1 py-2.5 text-sm font-bold text-gray-500 bg-gray-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 text-sm font-bold text-white bg-[#093E7A] rounded-lg">
                  {seccionEnEdicion ? "Actualizar Cambios" : "Guardar Sección"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAperturaModalOpen && (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
      <div className="p-6 border-b bg-[#093E7A] text-white">
        <h3 className="font-black text-lg">Configurar Nuevo Año</h3>
        <p className="text-xs opacity-80">Al abrir un nuevo año, el anterior se desactivará.</p>
      </div>
      <form onSubmit={handleAperturaAnio} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Identificador del Año</label>
          <input
            required
            maxLength={6}
            placeholder="Ej: 2026"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
            onChange={(e) => setNuevoAnioData({...nuevoAnioData, id_anio_escolar: e.target.value})}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Inicio</label>
            <input
              required
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none"
              onChange={(e) => setNuevoAnioData({...nuevoAnioData, fecha_inicio: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Fin</label>
            <input
              type="date"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none"
              onChange={(e) => setNuevoAnioData({...nuevoAnioData, fecha_fin: e.target.value})}
            />
          </div>
        </div>
        <div className="pt-4 flex gap-3">
          <button type="button" onClick={() => setIsAperturaModalOpen(false)} className="flex-1 py-2 text-sm font-bold text-gray-500">Cancelar</button>
          <button 
  type="submit" 
  disabled={!fechasValidas}
  className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
    fechasValidas 
      ? "bg-[#093E7A] text-white hover:bg-[#072d5a]" 
      : "bg-gray-200 text-gray-400 cursor-not-allowed"
  }`}
>Iniciar Año</button>
        </div>
      </form>
    </div>
  </div>
)}
    </>
  );
}