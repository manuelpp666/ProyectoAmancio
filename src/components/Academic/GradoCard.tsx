import React from "react";
import { Grado, Seccion } from "@/src/interfaces/academic"; // Ajusta la ruta si es necesario

interface GradoCardProps {
  grado: Grado & { secciones?: Seccion[] };
  onAddSeccion: () => void;
  onEditSeccion: (seccion: Seccion) => void;
  onDeleteSeccion: (id: number) => void;
  // Eliminamos las props de edición de grado ya que no se usarán
  onEditGrado?: (grado: Grado) => void;
  onDeleteGrado?: (grado: Grado) => void;
}

// Mapa de color del punto indicador por nombre de sección
const COLOR_SECCION: Record<string, string> = {
  Rojo: "bg-red-500",
  Azul: "bg-blue-500",
  Amarillo: "bg-yellow-400",
  Verde: "bg-green-500",
  Naranja: "bg-orange-500",
};

export default function GradoCard({
  grado,
  onAddSeccion,
  onEditSeccion,
  onDeleteSeccion,
}: GradoCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-blue-300 transition h-full flex flex-col justify-between group">

      {/* --- ENCABEZADO DEL GRADO --- */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">{grado.nombre}</h3>
          <span className="text-xs text-gray-400">Orden: {grado.orden}</span>
        </div>

        {/* BOTÓN AGREGAR SECCIÓN (Único botón visible en la cabecera) */}
        <button
            onClick={onAddSeccion}
            title="Agregar Sección"
            className="bg-blue-50 text-blue-600 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition"
        >
            <span className="material-symbols-outlined text-sm">add</span>
        </button>
      </div>

      {/* --- LISTA DE SECCIONES --- */}
      <div className="flex flex-col gap-2">
        {grado.secciones && grado.secciones.length > 0 ? (
          grado.secciones.map((sec) => {
            const ocupadas = sec.ocupadas ?? 0;
            const vacantes = sec.vacantes ?? 0;
            const ratio = vacantes > 0 ? ocupadas / vacantes : 0;
            // Color del contador según el nivel de ocupación
            const colorOcupacion =
              ratio >= 1 ? "text-red-600" :
              ratio >= 0.8 ? "text-amber-600" :
              "text-green-600";
            const colorBarra =
              ratio >= 1 ? "bg-red-500" :
              ratio >= 0.8 ? "bg-amber-500" :
              "bg-green-500";

            return (
              <div
                key={sec.id_seccion}
                className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-200 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLOR_SECCION[sec.nombre] || "bg-gray-800"}`}></span>
                    <span className="text-sm font-semibold text-gray-700 truncate">{sec.nombre}</span>
                    <span className={`text-xs font-bold ${colorOcupacion}`}>
                      {ocupadas}/{vacantes}
                    </span>
                  </div>

                  {/* ACCIONES VISIBLES */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onEditSeccion(sec)}
                      title="Editar Sección"
                      className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md p-1 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      onClick={() => onDeleteSeccion(sec.id_seccion || 0)}
                      title="Eliminar Sección"
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1 transition"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* BARRA DE OCUPACIÓN */}
                <div className="mt-1.5 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${colorBarra}`}
                    style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        ) : (
          <span className="text-xs text-gray-400 italic py-2">Sin secciones asignadas</span>
        )}
      </div>
    </div>
  );
}
