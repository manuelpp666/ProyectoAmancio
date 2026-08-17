"use client";

import { Edit, Trash2 } from "lucide-react";
import { ReporteReciente } from "@/src/interfaces/conducta";

interface Props {
  reporte: ReporteReciente;
  mostrarDni?: boolean;
  onEditar?: (reporte: ReporteReciente) => void;
  onEliminar?: (reporte: ReporteReciente) => void;
}

/** Fila de un reporte de conducta. La comparten la bandeja y el historial. */
export function ItemReporte({
  reporte,
  mostrarDni = false,
  onEditar,
  onEliminar,
}: Props) {
  return (
    <li className="p-5 hover:bg-gray-50/70 transition-colors duration-150 group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-gray-800 truncate">
            {reporte.alumno}
            {mostrarDni && reporte.dni && (
              <span className="ml-2 text-xs font-medium text-gray-500 tabular-nums">
                DNI {reporte.dni}
              </span>
            )}
          </p>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">{reporte.falta}</p>
          <p className="text-xs text-gray-500 mt-1">
            {reporte.tipo_falta && (
              <span className="font-bold uppercase tracking-wider text-gray-600">
                {reporte.tipo_falta}
              </span>
            )}
            {reporte.tipo_falta && " · "}
            <span>{reporte.fecha}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-lg font-black text-red-600 tabular-nums">
              -{reporte.puntos}
            </span>
            <p className="text-[9px] text-gray-400 font-bold uppercase">Puntos</p>
          </div>

          {(onEditar || onEliminar) && (
            <div className="flex items-center gap-1 pl-2 border-l border-gray-100">
              {onEditar && (
                <button
                  type="button"
                  onClick={() => onEditar(reporte)}
                  title="Editar reporte"
                  aria-label={`Editar reporte de ${reporte.alumno}`}
                  className="p-1.5 text-gray-400 hover:text-[#093E7A] hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit size={16} aria-hidden="true" />
                </button>
              )}
              {onEliminar && (
                <button
                  type="button"
                  onClick={() => onEliminar(reporte)}
                  title="Eliminar reporte"
                  aria-label={`Eliminar reporte de ${reporte.alumno}`}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {reporte.descripcion && (
        <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-2">
          {reporte.descripcion}
        </p>
      )}

      {reporte.medida && (
        <span
          className={`inline-block mt-2.5 text-[11px] font-bold rounded-lg px-2.5 py-1 ${
            reporte.cambio_ie
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {reporte.medida}
        </span>
      )}
    </li>
  );
}
