"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import { Plus, ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import EventForm from '@/src/components/Evento/EventForm';
import { Evento } from '@/src/interfaces/evento';
import { RoleGuard } from '@/src/components/auth/RoleGuard';
import { ConfirmModal } from '@/src/components/utils/ConfirmModal';
import { useRouter } from 'next/navigation';
import { EventRow } from '@/src/components/Evento/EventRow';
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch } from "@/src/lib/api";

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

  const leyenda = useMemo(() => {
    const seen = new Map<string, string>();
    for (const ev of eventos) {
      if (ev.tipo_evento && !seen.has(ev.tipo_evento)) {
        seen.set(ev.tipo_evento, ev.color || '#093E7A');
      }
    }
    return Array.from(seen.entries()).map(([nombre, color]) => ({ nombre, color }));
  }, [eventos]);

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
      const res = await apiFetch(`/web/eventos/por-anio/${anioId}`);
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
      const response = await apiFetch(`/web/eventos/${idToDelete}`, {
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
    <RoleGuard modulo="contenido_web" subModulo="calendario">
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] antialiased">
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        <HeaderPanel />

        {/* BARRA SUPERIOR ESTÁNDAR */}
        <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#093E7A]">calendar_month</span>
              <h2 className="text-xl font-bold text-gray-800">Calendario Anual</h2>
            </div>
            <div className="h-6 w-px bg-gray-200 mx-2"></div>
            <AnioSelector
              value={anioSeleccionado}
              onChange={setAnioSeleccionado}
              anios={anios}
              loading={loadingAnios}
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Buscar evento..."
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#093E7A]/20 outline-none"
              onChange={(e) => setFiltro(e.target.value)}
            />
            <button
              onClick={() => { setEventoActivo(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d5a] transition-colors"
            >
              <Plus size={18} /> Agregar Evento
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          <section className="max-w-6xl mx-auto w-full">

            {/* TABLA DE EVENTOS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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

            </div>

            {leyenda.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-5 items-center bg-[#FFF1E3]/40 p-5 rounded-2xl border border-[#FFF1E3]">
                <span className="text-xs font-black text-[#701C32] uppercase tracking-widest">Leyenda:</span>
                {leyenda.map(item => (
                  <div key={item.nombre} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-xs font-bold text-gray-700">{item.nombre}</span>
                  </div>
                ))}
              </div>
            )}
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
    </RoleGuard>
  );
}