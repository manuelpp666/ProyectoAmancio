import { ArrowLeft, MoreVertical, Paperclip, Send, MessageSquare } from "lucide-react";
import { Contacto } from "@/src/interfaces/mensajeria";

interface ChatProps {
  contacto: Contacto | undefined;
  setChatActivoID: (id: number | null) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  textoMensaje: string;
  setTextoMensaje: (t: string) => void;
  onEnviar: () => void;
}

export default function VentanaChat({ 
  contacto, setChatActivoID, scrollRef, textoMensaje, setTextoMensaje, onEnviar 
}: ChatProps) {
  if (!contacto) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center text-gray-300 bg-gray-50">
        <MessageSquare size={48} className="opacity-20 mb-4" />
        <p className="text-lg font-medium text-gray-400">Selecciona un chat para comenzar</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col bg-[#F2F4F7] fixed inset-0 z-[100] md:static md:z-auto`}>
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setChatActivoID(null)} className="md:hidden text-gray-500 p-1">
            <ArrowLeft size={20} />
          </button>
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${contacto.color}`}>
            {contacto.iniciales}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm leading-tight">{contacto.nombre}</h3>
            <p className="text-[10px] text-green-600 font-medium">En línea</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={20} /></button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {contacto.mensajes?.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.esMio ? 'flex-row-reverse' : ''}`}>
            <div className={`p-3 rounded-2xl shadow-sm max-w-[80%] break-words ${msg.esMio ? 'bg-[#701C32] text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
              <p className="text-sm">{msg.texto}</p>
              <span className={`text-[9px] mt-1 block text-right ${msg.esMio ? 'text-white/70' : 'text-gray-400'}`}>{msg.hora}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full border border-gray-200">
          <button className="text-gray-400 hover:text-[#701C32]"><Paperclip size={20} /></button>
          <input 
            type="text" 
            value={textoMensaje}
            onChange={(e) => setTextoMensaje(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onEnviar()}
            placeholder="Escribe un mensaje..." 
            className="flex-1 bg-transparent border-none text-sm text-gray-700 outline-none" 
          />
          <button onClick={onEnviar} className="text-[#701C32] p-1.5 hover:bg-[#701C32]/10 rounded-full transition-colors">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}