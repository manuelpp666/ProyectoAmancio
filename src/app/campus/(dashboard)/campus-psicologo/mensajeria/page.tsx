"use client";
import { useUser } from "@/src/context/userContext";
import { useChat } from "@/src/hooks/useChat"; // Tu hook
import ListaContactos from "@/src/components/Chat/ListaContactos";
import VentanaChat from "@/src/components/Chat/VentanaChat";
import { Loader2 } from "lucide-react";

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
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex relative">
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
  );
}