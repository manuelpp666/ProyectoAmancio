"use client";
import { useState } from 'react';
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import {
  FileUp,
  FileText,
  Download,
  Eye,
  Plus,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import EventForm from '@/src/components/Evento/EventForm';
import { useEventos } from '@/src/hooks/useEvento';
import { Evento } from '@/src/interfaces/evento';
import { ConfirmModal } from '@/src/components/utils/ConfirmModal';
import { useRouter } from 'next/navigation';
import { EventRow } from '@/src/components/Evento/EventRow';

export default function CalendarioPage() {
  const router = useRouter();
  // Llamamos al endpoint "actual" solamente
  const { eventos, loading, refetch } = useEventos('actual');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventoActivo, setEventoActivo] = useState<Evento | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<number | null>(null);
  const handleDelete = (id: number) => {
    setIdToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const confirmDelete = async () => {
    if (!idToDelete) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/eventos/${idToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success("Evento eliminado correctamente");
        refetch();
      } else {
        toast.error("Error al eliminar el evento");
      }
    } catch (error) {
      toast.error("Ocurrió un error al conectar con el servidor");
    } finally {
      setIdToDelete(null);
    }
  };
  const [filtro, setFiltro] = useState("");

  // Lógica de filtrado
  const eventosFiltrados = eventos.filter(ev =>
    ev.titulo.toLowerCase().includes(filtro.toLowerCase()) ||
    ev.tipo_evento?.toLowerCase().includes(filtro.toLowerCase())
  );
  // Limitamos a los primeros 5 directamente en el renderizado
  const eventosRecientes = eventosFiltrados.slice(0, 5);
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] antialiased">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">

        <HeaderPanel />

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">

          

          {/* SECCIÓN 02: GESTIÓN DE EVENTOS */}
          <section className="max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Gestión de Eventos del Año</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Administra fechas clave, exámenes y ceremonias institucionales.</p>
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Buscar evento o categoría..."
                  className="px-4 py-2 border rounded-xl text-sm"
                  onChange={(e) => setFiltro(e.target.value)}
                />
                <button
                  onClick={() => { setEventoActivo(null); setIsModalOpen(true); }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-xl"
                >
                  <Plus size={18} /> Agregar Evento
                </button>
              </div>
            </div>

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
                    {eventosRecientes.map((evento) => (
                      <EventRow
                        key={evento.id_evento}
                        evento={evento}
                        onEdit={() => { setEventoActivo(evento); setIsModalOpen(true); }}
                        onDelete={() => handleDelete(evento.id_evento)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-5 bg-gray-50/50 flex justify-center">
                <button onClick={() => router.push('/campus/panel-control/pagina-web/calendario-anual/todos')} className="flex items-center gap-2 text-[11px] font-black text-[#093E7A] uppercase tracking-widest hover:gap-4 transition-all">
                  Ver todos los eventos del año
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl w-96">
            <h2 className="mb-4 font-black">{eventoActivo ? "Editar Evento" : "Nuevo Evento"}</h2>
            <EventForm
              evento={eventoActivo}
              onClose={() => setIsModalOpen(false)}
              onSuccess={() => {
                toast.success(eventoActivo ? "Evento actualizado" : "Evento creado con éxito");
                refetch();
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
        message="¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        type="danger"
      />
    </div>

  );
}

