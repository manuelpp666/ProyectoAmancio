"use client";
import React, { useState } from 'react';
import { Evento } from '@/src/interfaces/evento';
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";

// Agregamos defaultAnio a las props
interface EventFormProps {
    evento?: Evento | null;
    defaultAnio?: string; // ID del año seleccionado en el selector del padre
    onClose: () => void;
    onSuccess: () => void;
}

export default function EventForm({ evento, defaultAnio, onClose, onSuccess }: EventFormProps) {
    // 1. Incluimos id_anio_escolar en el estado inicial
    const [formData, setFormData] = useState({
        titulo: evento?.titulo || "",
        id_anio_escolar: evento?.id_anio_escolar || defaultAnio || "", // Mantenemos el del evento o usamos el default
        fecha_inicio: evento?.fecha_inicio?.split('T')[0] || "",
        fecha_fin: evento?.fecha_fin?.split('T')[0] || "",
        tipo_evento: evento?.tipo_evento || "",
        descripcion: evento?.descripcion || "",
        color: evento?.color || "#093E7A"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación de año escolar (obligatorio)
        if (!formData.id_anio_escolar) {
            toast.error("Debes seleccionar un año académico.");
            return;
        }

        if (formData.fecha_fin && formData.fecha_fin < formData.fecha_inicio) {
            toast.error("La fecha de fin no puede ser anterior a la de inicio.");
            return;
        }

        // 2. Construir el payload incluyendo el id_anio_escolar
        const payload = {
            ...formData,
            fecha_inicio: `${formData.fecha_inicio}T00:00:00`,
            fecha_fin: formData.fecha_fin ? `${formData.fecha_fin}T00:00:00` : null,
        };

        const url = evento
            ? `/web/eventos/${evento.id_evento}`
            : `/web/eventos/`;

        try {
            const response = await apiFetch(url, {
                method: evento ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(evento ? "Evento actualizado con éxito" : "Evento creado correctamente");
                onSuccess();
                onClose();
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.error(errorData.detail || "Error al guardar el evento.");
            }
        } catch (error) {
            toast.error("Error de conexión con el servidor.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Visualizamos el año al que se asignará (Solo lectura para evitar errores) */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-2">
                <p className="text-[10px] font-black text-blue-500 uppercase">Año Académico Asignado</p>
                <p className="text-sm font-bold text-[#093E7A]">{formData.id_anio_escolar || "No seleccionado"}</p>
            </div>

            <input
                required
                placeholder="Título del evento"
                className="w-full p-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 outline-none"
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Fecha Inicio</label>
                    <input
                        type="date"
                        required
                        className="w-full p-2 border rounded-xl text-sm"
                        value={formData.fecha_inicio}
                        onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Fecha Fin (Opcional)</label>
                    <input
                        type="date"
                        className="w-full p-2 border rounded-xl text-sm"
                        value={formData.fecha_fin}
                        onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                    />
                </div>
            </div>

            <input
                placeholder="Tipo (ej: Examen, Ceremonia, Feriado)"
                className="w-full p-2 border rounded-xl text-sm"
                value={formData.tipo_evento}
                onChange={e => setFormData({ ...formData, tipo_evento: e.target.value })}
            />

            <textarea
                placeholder="Descripción breve..."
                rows={3}
                className="w-full p-2 border rounded-xl text-sm"
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
            />

            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-xl">
                <label className="text-sm font-medium text-gray-600">Color de etiqueta:</label>
                <input
                    type="color"
                    className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                />
            </div>

            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex-[2] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white bg-[#093E7A] rounded-xl hover:bg-[#062d59] transition-all shadow-lg shadow-[#093E7A]/20"
                >
                    {evento ? "Actualizar Evento" : "Crear Evento"}
                </button>
            </div>
        </form>
    );
}