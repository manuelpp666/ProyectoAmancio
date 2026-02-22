import { Edit3, Trash2 } from "lucide-react";
import { Evento } from "@/src/interfaces/evento";

export const EventRow = ({ evento, onEdit, onDelete }: { evento: Evento, onEdit: () => void, onDelete: () => void }) => {
  return (
    <tr className="group hover:bg-gray-50/50">
      <td className="px-8 py-6">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: evento.color ?? "#093E7A" }}
          />
          <div>
            <p className="font-black text-sm">{evento.titulo}</p>
            <p className="text-xs text-gray-400 truncate max-w-[200px]">{evento.descripcion}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-6 text-xs font-bold text-gray-600">
        {new Date(evento.fecha_inicio).toLocaleDateString()} -
        {evento.fecha_fin ? new Date(evento.fecha_fin).toLocaleDateString() : "N/A"}
      </td>
      <td className="px-8 py-6">
        <span className="px-2 py-1 bg-gray-100 rounded-md text-[10px] font-bold uppercase">
          {evento.tipo_evento}
        </span>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex justify-end gap-2">
          <button onClick={onEdit} className="text-gray-400 hover:text-[#093E7A]"><Edit3 size={16} /></button>
          <button onClick={onDelete} className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  );
}