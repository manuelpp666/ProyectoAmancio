"use client";
import { useState, useEffect, useCallback } from 'react';
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import { Plus, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import EventForm from '@/src/components/Evento/EventForm';
import { Evento } from '@/src/interfaces/evento';
import { AnioEscolar } from "@/src/interfaces/academic"; // Asegúrate de que esta interfaz exista
import { ConfirmModal } from '@/src/components/utils/ConfirmModal';
import { useRouter } from 'next/navigation';
import { EventRow } from '@/src/components/Evento/EventRow';
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";


export default function CalendarioPage() {
  const router = useRouter();
  const { 
  anioPlanificacion: anioSeleccionado, 
  setAnioPlanificacion: setAnioSeleccionado, 
  listaAnios: anios, 
  loadingAnios 
} = useAnioAcademico();
  
  // --- ESTADOS PARA EVENTOS ---
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("");
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventoActivo, setEventoActivo] = useState<Evento | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);

  
  // 2. Cargar Eventos por Año (Memorizado)
  const fetchEventos = useCallback(async (anioId: string) => {
    if (!anioId) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/eventos/por-anio/${anioId}`);
      if (!res.ok) throw new Error("Error al cargar eventos");
      const data = await res.json();
      setEventos(data);
    } catch (error) {
      toast.error("Error al obtener eventos del periodo");
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Disparar carga cuando cambie el año
  useEffect(() => {
    fetchEventos(anioSeleccionado);
  }, [anioSeleccionado, fetchEventos]);

  const confirmDelete = async () => {
    if (!idToDelete) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/eventos/${idToDelete}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success("Evento eliminado");
        fetchEventos(anioSeleccionado); // Refetch manual
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    } finally {
      setIsDeleteModalOpen(false);
      setIdToDelete(null);
    }
  };

  const eventosFiltrados = eventos.filter(ev =>
    ev.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
    ev.tipo_evento?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] antialiased">
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        <HeaderPanel />

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          <section className="max-w-6xl mx-auto w-full">
            
            {/* HEADER DE SECCIÓN CON SELECTOR */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">
                  Gestión de Eventos
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  
                  <AnioSelector 
    value={anioSeleccionado}
    onChange={setAnioSeleccionado}
    anios={anios}
    loading={loadingAnios}
  />
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Buscar evento..."
                  className="px-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 outline-none"
                  onChange={(e) => setFiltro(e.target.value)}
                />
                <button
                  onClick={() => { setEventoActivo(null); setIsModalOpen(true); }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-xl hover:bg-[#072d5a] transition-colors"
                >
                  <Plus size={18} /> Agregar Evento
                </button>
              </div>
            </div>

            {/* TABLA DE EVENTOS */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Evento / Actividad</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Fecha</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Categoría</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center">
                          <Loader2 className="animate-spin mx-auto text-[#093E7A]" size={32} />
                          <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">Cargando eventos...</p>
                        </td>
                      </tr>
                    ) : eventosFiltrados.length > 0 ? (
                      eventosFiltrados.slice(0, 10).map((evento) => (
                        <EventRow
                          key={evento.id_evento}
                          evento={evento}
                          onEdit={() => { setEventoActivo(evento); setIsModalOpen(true); }}
                          onDelete={() => { setIdToDelete(evento.id_evento); setIsDeleteModalOpen(true); }}
                        />
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-gray-400 text-sm">
                          No se encontraron eventos para el año {anioSeleccionado}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="p-5 bg-gray-50/50 flex justify-center">
                <button 
                  onClick={() => router.push(`/campus/panel-control/pagina-web/calendario-anual/todos?anio=${anioSeleccionado}`)} 
                  className="flex items-center gap-2 text-[11px] font-black text-[#093E7A] uppercase tracking-widest hover:gap-4 transition-all"
                >
                  Ver todos los eventos de este periodo
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* MODAL DE CREACIÓN/EDICIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h2 className="mb-6 text-lg font-black text-[#093E7A] uppercase">
              {eventoActivo ? "Editar Evento" : "Nuevo Evento"}
            </h2>
            <EventForm
              evento={eventoActivo}
              // IMPORTANTE: Pasar el año seleccionado al formulario para que se guarde correctamente
              defaultAnio={anioSeleccionado} 
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => {
                toast.success(eventoActivo ? "Evento actualizado" : "Evento creado");
                fetchEventos(anioSeleccionado);
                setIsModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Eliminar evento"
        message="¿Estás seguro? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
      />
    </div>
  );
}