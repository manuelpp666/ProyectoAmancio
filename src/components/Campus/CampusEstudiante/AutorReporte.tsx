import { UserRound } from "lucide-react";
import { HistorialConducta, autorDelReporte } from "@/src/interfaces/datos_alumno";

/** "Auxiliar: Nombre" bajo una incidencia del alumno. Los reportes antiguos no
 *  guardaban quién los registró: se dice así en vez de dejar el hueco vacío. */
export function AutorReporte({ reporte }: { reporte: HistorialConducta }) {
  const { etiqueta, nombre } = autorDelReporte(reporte);
  return (
    <p className="mt-1 flex items-start gap-1.5 text-xs text-gray-600 min-w-0">
      <UserRound size={14} className="text-[#701C32] shrink-0 mt-px" aria-hidden="true" />
      <span className="min-w-0 break-words">
        <span className="font-semibold">{etiqueta}:</span>{" "}
        {nombre ?? <span className="italic text-gray-400">no registrado</span>}
      </span>
    </p>
  );
}
