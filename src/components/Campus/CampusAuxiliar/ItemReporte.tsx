"use client";

import { ReporteReciente } from "@/src/interfaces/conducta";

/** Fila de un reporte de conducta. La comparten la bandeja y el historial. */
export function ItemReporte({ reporte, mostrarDni = false }: { reporte: ReporteReciente; mostrarDni?: boolean }) {
  return (
    <li className="p-5 hover:bg-gray-50/50 transition-colors duration-150">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate">
            {reporte.alumno}
            {mostrarDni && reporte.dni && (
              <span className="ml-2 text-xs font-medium text-gray-500 tabular-nums">DNI {reporte.dni}</span>
            )}
          </p>
          <p className="text-sm text-gray-700 mt-0.5">{reporte.falta}</p>
          <p className="text-xs text-gray-500 mt-1">
            {reporte.tipo_falta && <span className="font-bold uppercase tracking-wider">{reporte.tipo_falta}</span>}
            {reporte.tipo_falta && " · "}
            {reporte.fecha}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-black text-red-600 tabular-nums">-{reporte.puntos}</span>
          <p className="text-[9px] text-gray-400 font-bold uppercase">Puntos</p>
        </div>
      </div>
      {reporte.descripcion && (
        <p className="text-xs text-gray-600 mt-2 leading-relaxed line-clamp-2">{reporte.descripcion}</p>
      )}
      {reporte.medida && (
        <span className={`inline-block mt-2.5 text-[11px] font-bold rounded-lg px-2.5 py-1 ${reporte.cambio_ie ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-100 text-slate-700"}`}>
          {reporte.medida}
        </span>
      )}
    </li>
  );
}
