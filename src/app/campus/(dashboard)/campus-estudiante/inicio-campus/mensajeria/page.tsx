"use client";
import { useUser } from "@/src/context/userContext";
import { useChat } from "@/src/hooks/useChat";
import ListaContactos from "@/src/components/Chat/ListaContactos";
import VentanaChat from "@/src/components/Chat/VentanaChat";
import { Loader2, MessageSquare } from "lucide-react";

export default function MensajeriaPage() {
  const { id_usuario, loading } = useUser();
  const chat = useChat(id_usuario ? Number(id_usuario) : null, loading);

  if (loading) return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-[#701C32]" size={48} />
      <p className="text-gray-500 font-medium">Cargando...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      <div className="h-16 border-b bg-white flex items-center gap-2 px-8 shrink-0">
        <MessageSquare className="text-[#701C32]" size={22} />
        <div>
          <h2 className="text-xl font-bold text-gray-800 leading-tight">Mensajería</h2>
          <p className="text-[11px] text-gray-400">Conversa con tus docentes, compañeros y el área de psicología</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-white border-t border-gray-100 flex relative">
        <ListaContactos
          contactos={chat.contactos}
          chatActivoID={chat.chatActivoID}
          setChatActivoID={chat.setChatActivoID}
          query={chat.query}
          setQuery={chat.setQuery}
          resultadosBusqueda={chat.resultadosBusqueda}
          estaBuscando={chat.estaBuscando}
          seleccionarContacto={chat.seleccionarContacto}
        />

        <VentanaChat
          contacto={chat.contactoActual}
          setChatActivoID={chat.setChatActivoID}
          scrollRef={chat.scrollRef}
          textoMensaje={chat.textoMensaje}
          setTextoMensaje={chat.setTextoMensaje}
          onEnviar={chat.handleEnviar}
        />
      </div>
    </div>
  );
}
