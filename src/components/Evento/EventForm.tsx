"use client";
import React, { useState } from 'react';
import { Evento } from '@/src/interfaces/evento';
import { toast } from "sonner";

export default function EventForm({ evento, onClose, onSuccess }: { evento?: Evento | null, onClose: () => void, onSuccess: () => void }) {
    // Inicializamos el estado con los datos del evento si estamos editando
    const [formData, setFormData] = useState({
        titulo: evento?.titulo || "",
        fecha_inicio: evento?.fecha_inicio?.split('T')[0] || "",
        fecha_fin: evento?.fecha_fin?.split('T')[0] || "", // Nuevo
        tipo_evento: evento?.tipo_evento || "",
        descripcion: evento?.descripcion || "",
        color: evento?.color || "#093E7A"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validación simple para evitar errores como el de tu BD (fin < inicio)
        if (formData.fecha_fin && formData.fecha_fin < formData.fecha_inicio) {
            toast.error("La fecha de fin no puede ser anterior a la de inicio.");
            return;
        }

        // 2. Construir objeto con formato correcto para datetime (YYYY-MM-DDTHH:MM:SS)
        const payload = {
            ...formData,
            fecha_inicio: `${formData.fecha_inicio}T00:00:00`,
            fecha_fin: formData.fecha_fin ? `${formData.fecha_fin}T00:00:00` : null,
        };

        const url = evento
            ? `${process.env.NEXT_PUBLIC_API_URL}/web/eventos/${evento.id_evento}`
            : `${process.env.NEXT_PUBLIC_API_URL}/web/eventos/`;

        try {
            const response = await fetch(url, {
                method: evento ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(evento ? "Evento actualizado con éxito" : "Evento creado correctamente");
                onSuccess();
                onClose();
            } else {
                // Manejo de errores de servidor (ej. 400, 500)
                const errorData = await response.json().catch(() => ({}));
                toast.error(errorData.message || "Error al guardar el evento. Intenta de nuevo.");
            }
        } catch (error) {
            // Manejo de errores de red
            toast.error("Error de conexión. Verifica tu internet o intenta más tarde.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input
                required
                placeholder="Título"
                className="w-full p-2 border rounded"
                value={formData.titulo}
                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Inicio</label>
                    <input
                        type="date"
                        required
                        className="w-full p-2 border rounded"
                        value={formData.fecha_inicio}
                        onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-black uppercase text-gray-400">Fin</label>
                    <input
                        type="date"
                        className="w-full p-2 border rounded"
                        value={formData.fecha_fin}
                        onChange={e => setFormData({ ...formData, fecha_fin: e.target.value })}
                    />
                </div>
            </div>
            <input
                placeholder="Tipo de evento (ej: Académico)"
                className="w-full p-2 border rounded"
                value={formData.tipo_evento}
                onChange={e => setFormData({ ...formData, tipo_evento: e.target.value })}
            />
            <textarea
                placeholder="Descripción"
                className="w-full p-2 border rounded"
                value={formData.descripcion}
                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
            />
            <div className="flex items-center gap-2">
                <label>Color:</label>
                <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                />
            </div>
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex-[2] px-4 py-2 text-sm font-bold text-white bg-[#093E7A] rounded-xl hover:bg-[#062d59] transition-all shadow-md shadow-[#093E7A]/20"
                >
                    {evento ? "Actualizar Evento" : "Guardar Evento"}
                </button>
            </div>
        </form>
    );
}