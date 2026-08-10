"use client";
import { useState, useEffect } from "react";
import { X, ClipboardCheck, CheckCircle, Loader2, User } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";

// Los mismos límites que valida el backend en CitaResultado.
const RESULTADO_MIN = 10;
const RESULTADO_MAX = 1000;

/**
 * Cierra una cita ya atendida y guarda lo ocurrido en la reunión.
 *
 * El texto queda en el expediente del alumno, debajo del motivo de la cita, y
 * la cita pasa a estado COMPLETADA (que es lo que cuenta el indicador
 * "Atenciones del Mes" del panel de inicio).
 */
export function ModalRegistrarAtencion({ isOpen, onClose, onSuccess, cita }: any) {
  const [resultado, setResultado] = useState("");
  const [loading, setLoading] = useState(false);

  // Cada cita empieza con el campo vacío
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
        toast.success("Atención registrada. La cita quedó cerrada.");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-registrar-atencion"
        className="bg-white w-full max-w-lg max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
      >
        {/* CABECERA */}
        <div className="bg-emerald-700 px-6 py-5 text-white flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h2 id="titulo-registrar-atencion" className="font-black text-lg leading-tight">
                Registrar Atención
              </h2>
              <p className="text-[11px] text-white/70 mt-0.5">
                Anota lo tratado en la sesión y cierra la cita.
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
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-4">
            <div className="bg-emerald-700/10 p-3 rounded-xl text-emerald-800 shrink-0">
              <User size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Estudiante</p>
              <p className="text-[#2C3E50] font-bold truncate">{cita.alumno_nombre}</p>
              <p className="text-xs text-gray-600 mt-1">Motivo: {cita.motivo}</p>
            </div>
          </div>

          {/* RESULTADO DE LA REUNIÓN */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <label
                htmlFor="resultado-reunion"
                className="text-xs font-black text-[#2C3E50] uppercase tracking-wider block"
              >
                Resultado de la reunión
              </label>
              <span className="text-[11px] font-bold tabular-nums text-gray-400">
                {resultado.length}/{RESULTADO_MAX}
              </span>
            </div>
            <textarea
              id="resultado-reunion"
              required
              rows={6}
              maxLength={RESULTADO_MAX}
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              placeholder="Resume lo tratado, los acuerdos y las acciones de seguimiento."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 transition-colors resize-none"
            />
            {resultado.length > 0 && !textoValido && (
              <p className="text-xs text-amber-700 mt-1.5" aria-live="polite">
                Escribe al menos {RESULTADO_MIN} caracteres.
              </p>
            )}
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              Este texto queda en el expediente del alumno, debajo del motivo de la cita. Lo verá
              quien consulte su seguimiento.
            </p>
          </div>

          {/* ACCIONES */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!textoValido || loading}
              className="flex-[2] bg-emerald-700 text-white py-3 rounded-xl font-bold hover:bg-emerald-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
              {loading ? "Guardando..." : "Cerrar la cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
