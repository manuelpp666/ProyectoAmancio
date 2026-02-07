import { Grado } from "@/src/interfaces/academic";
import { SeccionBadge } from "./SeccionBadge";

// 1. Agregamos onAddSeccion a la interfaz de Props
interface GradoCardProps {
  grado: Grado;
  onAddSeccion: () => void; // Esta función viene desde el padre (page.tsx)
}

export const GradoCard = ({ grado, onAddSeccion, onEditSeccion, onDeleteSeccion, onEditGrado, onDeleteGrado }: any) => (
      <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all group/card">
    <div className="flex justify-between items-start mb-3">
      <span className="text-sm font-black text-gray-700">{grado.nombre}</span>
      <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
        <button onClick={() => onEditGrado(grado)} className="text-gray-400 hover:text-[#093E7A]">
          <span className="material-symbols-outlined text-lg">edit</span>
        </button>
        <button onClick={() => onDeleteGrado(grado)} className="text-gray-400 hover:text-red-600">
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
    
    <div className="flex flex-wrap gap-2 mb-4">
      {grado.secciones.map((sec) => (
        <SeccionBadge 
    key={sec.id_seccion} 
    seccion={sec} 
    onEdit={() => onEditSeccion(sec)} // Pásala desde page.tsx
    onDelete={onDeleteSeccion}       // Pásala desde page.tsx
  />
      ))}
      
      {/* 2. Asignamos la función al evento onClick */}
      <button 
        onClick={onAddSeccion}
        className="size-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#093E7A] hover:text-[#093E7A] transition-colors"
      >
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
    </div>
    
    <p className="text-[10px] font-bold text-gray-400 uppercase">
       {grado.secciones.length} Secciones activas
    </p>
  </div>
);