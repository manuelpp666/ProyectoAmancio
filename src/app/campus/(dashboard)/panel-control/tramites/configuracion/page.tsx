"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";

// Ajusta la ruta si tu componente HeaderPanel está en otro lugar o usa uno genérico
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica"; 

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Grado { id_grado: number; nombre: string; }
interface Tramite {
  id_tipo_tramite: number;
  nombre: string;
  costo: number;
  requisitos: string;
  alcance: "TODOS" | "GRADOS";
  grados_permitidos: string | null;
  activo: boolean;
}

export default function GestionTramitesPage() {
  // Estados
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Formulario
  const [formData, setFormData] = useState({
    nombre: "",
    costo: 0,
    requisitos: "",
    alcance: "TODOS",
    grados_seleccionados: [] as number[] // Array temporal para manejar los checks
  });

  // --- CARGA INICIAL ---
  useEffect(() => {
    fetchTramites();
    fetchGrados();
  }, []);

  const fetchTramites = async () => {
    try {
      setIsLoading(true);
      // CORRECCIÓN: Ruta actualizada a /finance/tramites-tipos/
      const res = await fetch(`${API_URL}/finance/tramites-tipos/`);
      if (res.ok) setTramites(await res.json());
    } catch (e) { 
      toast.error("Error cargando trámites"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const fetchGrados = async () => {
    try {
      const res = await fetch(`${API_URL}/academic/grados/`);
      if (res.ok) setGrados(await res.json());
    } catch (e) { console.error(e); }
  };

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Preparar payload
    const payload = {
      nombre: formData.nombre,
      costo: formData.costo,
      requisitos: formData.requisitos,
      alcance: formData.alcance,
      grados_permitidos: formData.alcance === "GRADOS" 
        ? formData.grados_seleccionados.join(",") 
        : null,
      activo: true // Por defecto activo al crear/editar
    };

    try {
      // CORRECCIÓN: Rutas actualizadas a /finance/tramites-tipos/
      const url = isEditing 
        ? `${API_URL}/finance/tramites-tipos/${currentId}` 
        : `${API_URL}/finance/tramites-tipos/`;
      
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEditing ? "Trámite actualizado" : "Trámite creado");
        closeModal();
        fetchTramites();
      } else {
        toast.error("Error al guardar");
      }
    } catch (e) { toast.error("Error de conexión"); }
  };

  const handleEstado = async (id: number, nuevoEstado: boolean) => {
    try {
      // CORRECCIÓN: Ruta actualizada a /finance/tramites-tipos/
      await fetch(`${API_URL}/finance/tramites-tipos/${id}/estado?activo=${nuevoEstado}`, { method: "PATCH" });
      setTramites(prev => prev.map(t => t.id_tipo_tramite === id ? {...t, activo: nuevoEstado} : t));
      toast.success(nuevoEstado ? "Trámite activado" : "Trámite dado de baja");
    } catch (e) { toast.error("Error al cambiar estado"); }
  };

  const openNew = () => {
    setFormData({ nombre: "", costo: 0, requisitos: "", alcance: "TODOS", grados_seleccionados: [] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (t: Tramite) => {
    setFormData({
      nombre: t.nombre,
      costo: t.costo,
      requisitos: t.requisitos || "",
      alcance: t.alcance as "TODOS" | "GRADOS",
      grados_seleccionados: t.grados_permitidos ? t.grados_permitidos.split(",").map(Number) : []
    });
    setCurrentId(t.id_tipo_tramite);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const toggleGrado = (id: number) => {
    setFormData(prev => {
      const exists = prev.grados_seleccionados.includes(id);
      return {
        ...prev,
        grados_seleccionados: exists 
          ? prev.grados_seleccionados.filter(g => g !== id)
          : [...prev.grados_seleccionados, id]
      };
    });
  };

  // Filtros
  const tramitesFiltrados = tramites.filter(t => t.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <div className="flex-1 flex flex-col">
        
        {/* HEADER SIMPLE - Puedes reemplazarlo con tu <HeaderPanel /> si prefieres */}
        <div className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#093E7A]">settings_applications</span>
              <h2 className="text-xl font-bold text-gray-800">Configuración de Trámites</h2>
           </div>
           
           <div className="flex gap-4">
              <Link href="/campus/panel-control/tramites/configuracion" className="px-4 py-2 bg-[#093E7A]/10 text-[#093E7A] font-bold rounded-lg text-sm">
                Configuración
              </Link>
              {/* Aquí podrías poner un link a "Solicitudes Recibidas" en el futuro */}
              <Link href="#" className="px-4 py-2 text-gray-500 font-bold rounded-lg text-sm hover:bg-gray-50 cursor-not-allowed">
                Solicitudes (Pronto)
              </Link>
           </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          
          {/* BARRA DE ACCIONES */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-96">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input 
                    type="text" 
                    placeholder="Buscar trámite por nombre..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-[#093E7A]/20"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                />
            </div>
            <button onClick={openNew} className="bg-[#093E7A] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 flex items-center gap-2">
                <span className="material-symbols-outlined">add</span>
                Agregar Nuevo Trámite
            </button>
          </div>

          {/* LISTA DE TRÁMITES */}
          {isLoading ? (
            <div className="text-center py-20 text-gray-400">Cargando trámites...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tramitesFiltrados.map(t => (
                  <div key={t.id_tipo_tramite} className={`bg-white p-6 rounded-xl border shadow-sm relative transition-all ${!t.activo ? 'opacity-60 grayscale bg-gray-50' : 'hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-4">
                          <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-[#093E7A]">
                              <span className="material-symbols-outlined">description</span>
                          </div>
                          <div className="flex gap-1">
                              <button onClick={() => openEdit(t)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                  <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button onClick={() => handleEstado(t.id_tipo_tramite, !t.activo)} className={`p-2 hover:bg-gray-100 rounded-full ${t.activo ? 'text-red-500' : 'text-green-500'}`}>
                                  <span className="material-symbols-outlined text-sm">{t.activo ? 'block' : 'check_circle'}</span>
                              </button>
                          </div>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg mb-1">{t.nombre}</h3>
                      <p className="text-[#093E7A] font-black text-xl mb-4">S/ {Number(t.costo).toFixed(2)}</p>
                      
                      <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="material-symbols-outlined text-sm">group</span>
                              <span>{t.alcance === 'TODOS' ? 'Para todos los grados' : 'Grados específicos'}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-gray-500">
                              <span className="material-symbols-outlined text-sm shrink-0">list</span>
                              <span className="line-clamp-2">{t.requisitos || 'Sin requisitos'}</span>
                          </div>
                      </div>

                      {!t.activo && (
                          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                              <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">DADO DE BAJA</span>
                          </div>
                      )}
                  </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="bg-[#093E7A] p-4 flex justify-between items-center text-white shrink-0">
                    <h3 className="font-bold">{isEditing ? 'Editar Trámite' : 'Nuevo Trámite'}</h3>
                    <button onClick={closeModal}><span className="material-symbols-outlined">close</span></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Trámite</label>
                        <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                            value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo (S/)</label>
                            <input required type="number" step="0.01" min="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                                value={formData.costo} onChange={e => setFormData({...formData, costo: parseFloat(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alcance</label>
                            <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                                value={formData.alcance} onChange={e => setFormData({...formData, alcance: e.target.value as "TODOS" | "GRADOS"})}
                            >
                                <option value="TODOS">Todos los grados</option>
                                <option value="GRADOS">Grados específicos</option>
                            </select>
                        </div>
                    </div>

                    {formData.alcance === "GRADOS" && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Grados Permitidos</label>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
                                {grados.map(g => (
                                    <label key={g.id_grado} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-100 p-1 rounded select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.grados_seleccionados.includes(g.id_grado)}
                                            onChange={() => toggleGrado(g.id_grado)}
                                            className="accent-[#093E7A] size-4"
                                        />
                                        <span className="text-gray-700">{g.nombre}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Requisitos</label>
                        <textarea rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                            placeholder="Ej: - DNI Copia&#10;- Recibo de pago&#10;- Foto tamaño carnet"
                            value={formData.requisitos} onChange={e => setFormData({...formData, requisitos: e.target.value})}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Escriba los requisitos necesarios para el trámite (uno por línea).</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-gray-100 text-gray-500 font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors">Cancelar</button>
                        <button type="submit" className="flex-1 py-2.5 bg-[#093E7A] text-white font-bold rounded-lg text-sm hover:bg-[#072d5a] transition-colors">Guardar Trámite</button>
                    </div>

                </form>
            </div>
        </div>
      )}

    </div>
  );
}