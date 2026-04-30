"use client";
import { useState, useEffect } from "react";
import { X, Calendar, Clock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";

export function ModalModificarCita({ isOpen, onClose, onSuccess, cita }: any) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estado para la nueva fecha (input datetime-local)
  const [nuevaFecha, setNuevaFecha] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sincronizar la fecha cuando se abre el modal con la cita seleccionada
  useEffect(() => {
    if (cita && cita.fecha_cita) {
      // Convertimos el formato de la DB al formato que entiende el input datetime-local
      const date = new Date(cita.fecha_cita);
      const formattedDate = date.toISOString().slice(0, 16); 
      setNuevaFecha(formattedDate);
    }
  }, [cita, isOpen]);

  if (!mounted || !isOpen || !cita) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Según tu router: PATCH /citas/{id_cita}/reprogramar?nueva_fecha=...
      // Enviamos la fecha como query parameter tal como lo espera FastAPI
      const res = await apiFetch(
        `/conducta/citas/${cita.id_cita}/reprogramar?nueva_fecha=${nuevaFecha}`, 
        { method: "PATCH" }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success("Cita reprogramada correctamente");
        onSuccess();
      } else {
        toast.error(data.detail || "Error al reprogramar la cita");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* MODAL HEADER */}
        <div className="bg-amber-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Calendar size={22} /> Reprogramar Cita
            </h2>
            <p className="text-white/70 text-xs">Ajuste la fecha y hora de la atención.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {/* INFORMACIÓN DE LA CITA ACTUAL */}
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-4">
            <div className="bg-amber-600/10 p-3 rounded-xl text-amber-700">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Estudiante</p>
              <p className="text-[#2C3E50] font-bold">{cita.alumno_nombre}</p>
              <p className="text-xs text-gray-500 mt-1">Motivo: {cita.motivo}</p>
            </div>
          </div>

          {/* SELECCIÓN DE NUEVA FECHA */}
          <div>
            <label className="text-xs font-black text-[#2C3E50] uppercase mb-2 block tracking-wider">
              Nueva Fecha y Hora
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="datetime-local"
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl outline-none focus:border-amber-600 transition-all font-medium text-[#2C3E50]"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 px-1">
              * El sistema verificará si el psicólogo tiene disponibilidad en el horario elegido.
            </p>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !nuevaFecha}
              className="flex-[2] bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}