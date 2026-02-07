import { Seccion } from "@/src/interfaces/academic";

export const SeccionBadge = ({ seccion, onEdit, onDelete }: { 
  seccion: Seccion, 
  onEdit: () => void,
  onDelete: (id: number) => void 
}) => (
  <div className="group relative">
    <button 
      onClick={onEdit}
      className="h-8 w-auto min-w-[2.5rem] px-3 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] border border-blue-200 transition-all hover:bg-blue-200"
    >
      <span className="whitespace-nowrap">{seccion.nombre}</span>
    </button>
    
    {/* Botón flotante para eliminar (físico) */}
    <button 
      onClick={(e) => { e.stopPropagation(); onDelete(seccion.id_seccion); }}
      className="absolute -top-2 -right-2 size-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:bg-red-600 z-10"
    >
      <span className="material-symbols-outlined text-[12px]">close</span>
    </button>
  </div>
);