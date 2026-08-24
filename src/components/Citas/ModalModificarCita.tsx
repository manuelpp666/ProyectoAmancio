"use client";

import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle, Loader2, User } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";
import { SelectorFechaHora } from "@/src/components/utils/SelectorHora";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cita: any;
}

export function ModalModificarCita({ isOpen, onClose, onSuccess, cita }: Props) {
  const [loading, setLoading] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");

  // Sincronizar la fecha cuando se abre el modal con la cita seleccionada
  useEffect(() => {
    if (cita && cita.fecha_cita) {
      const date = new Date(cita.fecha_cita);
      const formattedDate = date.toISOString().slice(0, 16);
      setNuevaFecha(formattedDate);
    }
  }, [cita, isOpen]);

  if (!isOpen || !cita) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaFecha) return;
    setLoading(true);

    try {
      const res = await apiFetch(
        `/conducta/citas/${cita.id_cita}/reprogramar?nueva_fecha=${encodeURIComponent(nuevaFecha)}`,
        { method: "PATCH" }
      );

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success("Cita reprogramada correctamente");
        onSuccess();
      } else {
        toast.error(data?.detail || "Error al reprogramar la cita");
      }
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* CABECERA */}
        <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="font-black text-lg leading-tight">Reprogramar Cita Psicológica</h2>
              <p className="text-[11px] text-white/70 mt-0.5">Ajusta la nueva fecha y hora para la atención.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-white/10 rounded-full transition-colors mt-0.5"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          {/* INFORMACIÓN DE LA CITA ACTUAL */}
          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
            <div className="bg-[#093E7A] text-white p-3 rounded-xl shrink-0">
              <User size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#093E7A] uppercase tracking-wider">Estudiante</p>
              <p className="text-gray-900 font-bold text-sm truncate">{cita.alumno_nombre}</p>
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-semibold text-gray-700">Motivo:</span> {cita.motivo}
              </p>
            </div>
          </div>

          {/* SELECCIÓN DE NUEVA FECHA */}
          <div>
            <label className="text-xs font-black text-gray-800 uppercase mb-2 block tracking-wider">
              Nueva Fecha y Hora
            </label>
            <SelectorFechaHora
              required
              etiqueta="Nueva fecha y hora de la cita"
              value={nuevaFecha}
              onChange={setNuevaFecha}
            />
            <p className="text-[11px] text-gray-400 mt-2 px-1">
              La cita pasará a estado REPROGRAMADA y mantendrá su registro en el expediente.
            </p>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl text-xs transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nuevaFecha}
              className="flex-[2] bg-[#701C32] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#5a1628] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#701C32]/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
              {loading ? "Guardando..." : "Guardar Nueva Fecha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}