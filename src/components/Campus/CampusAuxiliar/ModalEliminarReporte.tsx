"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { ReporteReciente } from "@/src/interfaces/conducta";

interface Props {
  isOpen: boolean;
  reporte: ReporteReciente | null;
  onClose: () => void;
  onSuccess: (idReporte: number) => void;
}

/** Lo mismo que exige el servidor, para avisar antes de gastar una petición. */
const MOTIVO_MINIMO = 10;
const MOTIVO_MAXIMO = 300;

export function ModalEliminarReporte({ isOpen, reporte, onClose, onSuccess }: Props) {
  const [eliminando, setEliminando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [intentado, setIntentado] = useState(false);

  // El motivo se limpia al cerrar y al cambiar de reporte: si no, el texto
  // escrito para uno se quedaría puesto en el borrado del siguiente.
  useEffect(() => {
    setMotivo("");
    setIntentado(false);
  }, [reporte?.id_reporte, isOpen]);

  if (!isOpen || !reporte) return null;

  const motivoLimpio = motivo.trim();
  const motivoCorto = motivoLimpio.length < MOTIVO_MINIMO;

  const cerrar = () => {
    if (eliminando) return;
    onClose();
  };

  const handleEliminar = async () => {
    setIntentado(true);
    if (motivoCorto) return;

    setEliminando(true);
    try {
      const res = await apiFetch(`/conducta/reportes/${reporte.id_reporte}/eliminar`, {
        method: "POST",
        body: JSON.stringify({ motivo: motivoLimpio }),
      });

      if (res.ok) {
        onSuccess(reporte.id_reporte);
      } else {
        toast.error(await mensajeDeError(res, "No se pudo eliminar el reporte"));
      }
    } catch {
      toast.error("Error de conexión al eliminar el reporte");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col scale-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-eliminar-reporte"
      >
        <div className="flex items-start justify-between pb-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
            <AlertTriangle size={24} aria-hidden="true" />
          </div>
          <button
            onClick={cerrar}
            disabled={eliminando}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-2">
          <h3 id="titulo-modal-eliminar-reporte" className="text-lg font-black text-gray-900">
            ¿Eliminar este reporte de conducta?
          </h3>
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
            Se eliminará el registro de falta para el estudiante{" "}
            <span className="font-bold text-gray-800">{reporte.alumno}</span> y la nota de conducta
            del bimestre se <span className="font-bold text-[#093E7A]">recalculará automáticamente</span>.
          </p>

          <div className="mt-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span className="font-bold">Falta:</span>
              <span className="font-medium text-right text-gray-800">{reporte.falta}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="font-bold">Puntos a restituir:</span>
              <span className="font-black text-emerald-700">+{reporte.puntos} pts</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span className="font-bold">Fecha:</span>
              <span className="text-gray-700">{reporte.fecha}</span>
            </div>
          </div>

          {/* MOTIVO: obligatorio. Borrar un reporte le devuelve puntos de
              conducta al alumno, así que tiene que quedar dicho por qué. */}
          <div className="mt-4">
            <label htmlFor="motivo-eliminar-reporte" className="block text-[11px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
              Motivo del borrado <span className="text-red-600">*</span>
            </label>
            <textarea
              id="motivo-eliminar-reporte"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={eliminando}
              maxLength={MOTIVO_MAXIMO}
              autoFocus
              placeholder="Ej.: El parte se registró al alumno equivocado, la falta fue de su compañero de aula."
              aria-invalid={intentado && motivoCorto}
              aria-describedby="ayuda-motivo-eliminar"
              className={`w-full bg-gray-50 border rounded-2xl px-4 py-2.5 text-sm text-gray-800 outline-none transition-colors resize-none disabled:opacity-60 ${
                intentado && motivoCorto
                  ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                  : "border-gray-200 focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15"
              }`}
            />
            <div id="ayuda-motivo-eliminar" className="flex items-start justify-between gap-3 mt-1.5">
              <p className={`text-xs ${intentado && motivoCorto ? "text-red-600 font-bold" : "text-gray-500"}`}>
                {intentado && motivoCorto
                  ? `Explique el motivo con al menos ${MOTIVO_MINIMO} caracteres.`
                  : "Quedará guardado en el historial de reportes eliminados."}
              </p>
              <span className="text-[11px] text-gray-400 tabular-nums shrink-0">
                {motivoLimpio.length}/{MOTIVO_MAXIMO}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={cerrar}
            disabled={eliminando}
            className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEliminar}
            disabled={eliminando || (intentado && motivoCorto)}
            title={motivoCorto ? "Escriba el motivo del borrado" : undefined}
            className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-red-700 disabled:opacity-50 transition-all shadow-md shadow-red-600/20"
          >
            {eliminando ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} aria-hidden="true" />
                <span>Eliminar Reporte</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
