"use client";

import { useState, useEffect } from "react";
import { X, ClipboardCheck, CheckCircle, Loader2, User, FileText } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";

const RESULTADO_MIN = 10;
const RESULTADO_MAX = 1000;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cita: any;
}

export function ModalRegistrarAtencion({ isOpen, onClose, onSuccess, cita }: Props) {
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setResultado("");
  }, [isOpen, cita?.id_cita]);

  if (!isOpen || !cita) return null;

  const textoValido = resultado.trim().length >= RESULTADO_MIN;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoValido || loading) return;
    setLoading(true);

    try {
      const res = await apiFetch(`/conducta/citas/${cita.id_cita}/completar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultado: resultado.trim() }),
      });

      if (res.ok) {
        toast.success("Atención registrada correctamente. La cita quedó cerrada.");
        onSuccess();
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.detail || "No se pudo registrar la atención");
      }
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-registrar-atencion"
        className="bg-white w-full max-w-lg max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col scale-in"
      >
        {/* CABECERA */}
        <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h2 id="titulo-registrar-atencion" className="font-black text-lg leading-tight">
                Registrar Atención Psicológica
              </h2>
              <p className="text-[11px] text-white/70 mt-0.5">
                Anota los acuerdos tratados en la sesión y cierra la cita.
              </p>
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

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* DATOS DE LA CITA */}
          <div className="bg-blue-50/60 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
            <div className="bg-[#093E7A] text-white p-3 rounded-xl shrink-0">
              <User size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-[#093E7A] uppercase tracking-wider">Estudiante</p>
              <p className="text-gray-900 font-bold truncate text-sm">{cita.alumno_nombre}</p>
              <p className="text-xs text-gray-600 mt-1">
                <span className="font-semibold text-gray-700">Motivo:</span> {cita.motivo}
              </p>
            </div>
          </div>

          {/* RESULTADO DE LA REUNIÓN */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <label
                htmlFor="resultado-reunion"
                className="text-xs font-black text-gray-800 uppercase tracking-wider block"
              >
                Resultado / Acuerdos de la reunión
              </label>
              <span className="text-[11px] font-bold tabular-nums text-gray-400">
                {resultado.length}/{RESULTADO_MAX}
              </span>
            </div>
            <textarea
              id="resultado-reunion"
              required
              rows={5}
              maxLength={RESULTADO_MAX}
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              placeholder="Describa los aspectos tratados, acuerdos con el estudiante/apoderado y pautas de seguimiento..."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors resize-none"
            />
            {resultado.length > 0 && !textoValido && (
              <p className="text-xs text-red-600 font-medium mt-1.5" aria-live="polite">
                Escriba al menos {RESULTADO_MIN} caracteres para registrar la atención.
              </p>
            )}
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              Este resultado quedará archivado en el expediente psicológico del alumno para su consulta futura.
            </p>
          </div>

          {/* ACCIONES */}
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
              disabled={!textoValido || loading}
              className="flex-[2] bg-[#701C32] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#5a1628] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-[#701C32]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
              {loading ? "Guardando..." : "Completar y Cerrar Cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
