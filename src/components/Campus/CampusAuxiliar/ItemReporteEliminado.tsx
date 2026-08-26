"use client";

import { RotateCcw, UserRound } from "lucide-react";
import { ReporteEliminado } from "@/src/interfaces/conducta";

interface Props {
  reporte: ReporteEliminado;
  mostrarDni?: boolean;
}

/**
 * Fila del historial de reportes eliminados.
 *
 * Se parece a ItemReporte a propósito, pero sin botones: un reporte borrado ya
 * no se edita ni se vuelve a borrar, solo se consulta. Los puntos van en verde
 * y con signo "+" porque al borrar el reporte el alumno los recuperó.
 */
export function ItemReporteEliminado({ reporte, mostrarDni = false }: Props) {
  return (
    <li className="p-5 hover:bg-gray-50/70 transition-colors duration-150">
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
          <p className="text-sm font-semibold text-gray-600 mt-0.5 line-through decoration-gray-300">
            {reporte.falta}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {reporte.tipo_falta && (
              <span className="font-bold uppercase tracking-wider text-gray-600">
                {reporte.tipo_falta}
              </span>
            )}
            {reporte.tipo_falta && " · "}
            <span>Reportado el {reporte.fecha}</span>
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-lg font-black text-emerald-700 tabular-nums">
            +{reporte.puntos}
          </span>
          <p className="text-[9px] text-gray-400 font-bold uppercase">Restituidos</p>
        </div>
      </div>

      {/* MOTIVO: es el dato por el que existe esta lista, así que va destacado */}
      <div className="mt-3 p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
        <p className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
          <RotateCcw size={12} aria-hidden="true" /> Motivo del borrado
        </p>
        <p className="text-xs text-gray-700 mt-1 leading-relaxed break-words">{reporte.motivo}</p>
      </div>

      <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5 flex-wrap">
        <UserRound size={12} aria-hidden="true" className="shrink-0" />
        <span>
          Eliminado por <span className="font-bold text-gray-700">{reporte.eliminado_por}</span>
          {reporte.rol_elimina && (
            <span className="text-gray-400"> ({reporte.rol_elimina.toLowerCase()})</span>
          )}
          {reporte.fecha_eliminacion && <span> el {reporte.fecha_eliminacion}</span>}
        </span>
      </p>

      {reporte.descripcion && (
        <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2 italic">
          {reporte.descripcion}
        </p>
      )}
    </li>
  );
}
