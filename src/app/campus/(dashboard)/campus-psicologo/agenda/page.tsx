"use client";
import { useState, useEffect } from "react";
import {
    Plus,
    Calendar as CalendarIcon,
    Clock,
    User,
    MoreVertical,
    Filter,
    Loader2,
    CalendarDays,
    Trash2, Edit3, Eye
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ModalRegistrarCita } from "@/src/components/Citas/ModalRegistrarCitas";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { ModalModificarCita } from "@/src/components/Citas/ModalModificarCita";
import { ModalDetalleSeguimiento } from "@/src/components/Citas/ModalDetalleSeguimiento";
import { toast } from "sonner";

export default function AgendaCitasPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroFecha, setFiltroFecha] = useState("");
    const [selectedCita, setSelectedCita] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    useEffect(() => {
        setFiltroFecha(new Date().toISOString().split('T')[0]);
    }, []);
    const handleEliminarCita = (id: number) => {
        setSelectedDeleteId(id);
        setIsConfirmOpen(true);
    };
    const handleConfirmEliminarCita = async () => {
        if (!selectedDeleteId) return;

        try {
            const res = await apiFetch(`/conducta/citas/${selectedDeleteId}/cancelar`, { method: "PATCH" });
            if (res.ok) {
                toast.success("Cita cancelada");
                fetchCitas();
            } else {
                toast.error("Error al cancelar");
            }
        } catch (error) {
            toast.error("Error al cancelar");
        } finally {
            setSelectedDeleteId(null);
        }
    };
    const fetchCitas = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/conducta/citas/agenda-diaria?fecha=${filtroFecha}`);
            if (res.ok) setCitas(await res.json());
        } catch (error) {
            console.error("Error al cargar citas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCitas();
    }, [filtroFecha]);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#2C3E50]">Agenda de Citas</h1>
                    <p className="text-gray-500 text-sm">Gestiona las atenciones psicológicas programadas.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-[#701C32] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#5a1628] transition-all shadow-lg shadow-[#701C32]/20"
                >
                    <Plus size={20} /> Programar Cita
                </button>
            </div>

            {/* FILTROS RÁPIDOS */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Filter size={16} /> Filtrar por día:
                </div>
                <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => setFiltroFecha(e.target.value)}
                    className="border-none focus:ring-0 text-[#701C32] font-bold cursor-pointer"
                />
            </div>

            {/* CUERPO DE LA AGENDA (Cards) */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#701C32]" size={40} />
                </div>
            ) : citas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {citas.map((cita: any) => (
                        <div
                            key={cita.id_cita}
                            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#701C32]" />

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2 text-[#701C32] bg-[#701C32]/5 px-3 py-1 rounded-full">
                                    <Clock size={14} className="font-bold" />
                                    <span className="text-xs font-bold">
                                        {new Date(cita.fecha_cita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <button className="text-gray-300 hover:text-gray-600 transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                        <User size={20} className="text-[#2C3E50]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#2C3E50] leading-tight">
                                            {cita.alumno_nombre || "Estudiante"}
                                        </h3>

                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        <span className="font-semibold block text-[10px] uppercase text-gray-400 mb-1">Motivo:</span>
                                        {cita.motivo}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${cita.estado === 'PROGRAMADA' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                    }`}>
                                    {cita.estado}
                                </span>
                                <button
                onClick={() => { 
                    setSelectedCita(cita); 
                    setIsDetailModalOpen(true); 
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Ver detalles"
            >
                <Eye size={18} />
            </button>
                                <button
                                    onClick={() => { setSelectedCita(cita); setIsEditModalOpen(true); }}
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Modificar"
                                >
                                    <Edit3 size={18} />
                                </button>
                                <button
                                    onClick={() => handleEliminarCita(cita.id_cita)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <CalendarDays className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-gray-500 font-medium">No hay citas para este día</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 text-[#701C32] font-bold text-sm hover:underline"
                    >
                        Programar la primera cita
                    </button>
                </div>
            )}
            <ModalModificarCita
                isOpen={isEditModalOpen}
                cita={selectedCita}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedCita(null);
                }}
                onSuccess={() => {
                    setIsEditModalOpen(false);
                    setSelectedCita(null);
                    fetchCitas(); // Refresca la lista
                }}
            />
            <ModalDetalleSeguimiento
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedCita(null);
                }}
                idAlumno={selectedCita?.id_alumno ?? selectedCita?.alumno?.id_alumno ?? selectedCita?.idAlumno}
                nombreAlumno={selectedCita?.alumno_nombre ?? selectedCita?.alumno?.nombres ?? selectedCita?.alumno?.nombre}
            />
            {/* MODAL COMPONENTE */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => {
                    setIsConfirmOpen(false);
                    setSelectedDeleteId(null);
                }}
                onConfirm={handleConfirmEliminarCita}
                title="Confirmar cancelación"
                message="¿Estás seguro de cancelar esta cita? Esta acción no se puede deshacer."
                confirmText="Sí, cancelar"
                type="danger"
            />
            <ModalRegistrarCita
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false);
                    fetchCitas();
                }}
            />
        </div>
    );
}