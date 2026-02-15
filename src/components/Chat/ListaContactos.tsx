import { Search, Loader2 } from "lucide-react";
import { Contacto } from "@/src/interfaces/mensajeria";

interface ListaProps {
  contactos: Contacto[];
  chatActivoID: number | null;
  setChatActivoID: (id: number | null) => void;
  query: string;
  setQuery: (q: string) => void;
  resultadosBusqueda: any[];
  estaBuscando: boolean;
  seleccionarContacto: (contacto: any) => void;
}

export default function ListaContactos({
  contactos, chatActivoID, setChatActivoID, query, 
  setQuery, resultadosBusqueda, estaBuscando, seleccionarContacto
}: ListaProps) {
  return (
    <div className={`w-full md:w-80 lg:w-96 flex-col bg-white border-r border-gray-100 ${chatActivoID ? 'hidden md:flex' : 'flex'}`}>
      <div className="p-4 border-b border-gray-100 shrink-0">
        <h2 className="text-xl font-bold text-[#701C32] mb-4">Mensajería</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar contacto..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#701C32]" 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {query.length > 0 ? (
          <div className="animate-in fade-in duration-300">
            <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Resultados globales</p>
            {estaBuscando && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-[#701C32]" /></div>}
            {resultadosBusqueda.map((res) => (
              <div key={res.id_usuario} onClick={() => seleccionarContacto(res)} className="p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 flex gap-3 items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${res.rol === 'DOCENTE' ? 'bg-[#701C32]' : 'bg-blue-600'}`}>
                  {res.nombre.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">{res.nombre}</h4>
                  <p className="text-[10px] text-gray-400">{res.rol} • DNI {res.dni}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          contactos.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setChatActivoID(c.id)}
              className={`p-4 border-b border-gray-50 cursor-pointer flex gap-3 transition-colors ${chatActivoID === c.id ? 'bg-[#FFF1E3] border-l-4 border-l-[#701C32]' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${c.color}`}>
                {c.iniciales}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="text-sm font-bold truncate text-gray-800">{c.nombre}</h4>
                  <span className="text-[10px] text-gray-400">{c.hora}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.ultimoMensaje || "Sin mensajes aún"}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}