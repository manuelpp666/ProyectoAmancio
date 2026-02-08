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
      <div className="flex flex-wrap gap-2">
        {grado.secciones && grado.secciones.length > 0 ? (
          grado.secciones.map((sec) => (
            <div 
              key={sec.id_seccion} 
              className="group/badge relative px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition pr-8 cursor-pointer"
              onClick={() => onEditSeccion(sec)} // Click en todo el badge para editar
            >
              {/* Indicador de Color (Opcional, decorativo) */}
              <span className={`w-2 h-2 rounded-full ${
                  sec.nombre === 'Rojo' ? 'bg-red-500' :
                  sec.nombre === 'Azul' ? 'bg-blue-500' :
                  sec.nombre === 'Amarillo' ? 'bg-yellow-400' :
                  sec.nombre === 'Verde' ? 'bg-green-500' :
                  'bg-gray-800'
              }`}></span>
              
              {sec.nombre} 
              <span className="text-[10px] text-gray-400">({sec.vacantes})</span>

              {/* Botón Eliminar Sección (Aparece al pasar el mouse - hover) */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Evitar abrir el modal de editar
                  onDeleteSeccion(sec.id_seccion);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 opacity-0 group-hover/badge:opacity-100 transition p-1"
                title="Eliminar Sección"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          ))
        ) : (
          <span className="text-xs text-gray-400 italic py-2">Sin secciones asignadas</span>
        )}
      </div>
    </div>
  );
}