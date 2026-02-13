"use client";
import { useState, useEffect, useRef } from "react";
import { Search, MoreVertical, Paperclip, Send, ArrowLeft, MessageSquare, Loader2 } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import { Contacto,Mensaje } from "@/src/interfaces/mensajeria";
import { toast } from "sonner";


export default function MensajeriaPage() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [chatActivoID, setChatActivoID] = useState<number | null>(null);
  const [textoMensaje, setTextoMensaje] = useState("");
  const [query, setQuery] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [estaBuscando, setEstaBuscando] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { id_usuario, loading: userLoading } = useUser();
  const miUsuarioId = id_usuario ? Number(id_usuario) : null;

  // 1. Cargar lista de conversaciones iniciales
  useEffect(() => {
    if (userLoading || !miUsuarioId) return;

    const cargarConversaciones = async () => {
      try {
        const res = await fetch(`http://localhost:8000/virtual/chat/conversaciones/${miUsuarioId}`);
        const data = await res.json();
        setContactos(data);
      } catch (err) {
        console.error("Error cargando chats:", err);
      }
    };
    cargarConversaciones();
  }, [miUsuarioId, userLoading]);

  // 2. Conexión WebSocket Única
  useEffect(() => {
    if (!miUsuarioId || socketRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//localhost:8000/ws/${miUsuarioId}`);
    
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.tipo === "NUEVO_MENSAJE") {
        manejarNuevoMensaje(payload.data, false);
      }
    };

    socket.onclose = () => { socketRef.current = null; };
    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [miUsuarioId]);

  // 3. Cargar Historial al cambiar de chat
  useEffect(() => {
  if (!chatActivoID || !miUsuarioId) return; // miUsuarioId es necesario aquí

  const cargarHistorial = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/chat/historial/${chatActivoID}`);
      const data = await res.json();
      
      // Formateamos los mensajes comparando IDs
      const mensajesFormateados = data.map((m: any) => ({
        id: m.id,
        texto: m.texto,
        esMio: m.remitente_id === miUsuarioId, // <--- LA MAGIA ESTÁ AQUÍ
        hora: m.hora
      }));

      setContactos(prev => prev.map(c => 
        c.id === chatActivoID ? { ...c, mensajes: mensajesFormateados } : c
      ));
    } catch (err) {
      console.error("Error cargando historial:", err);
    }
  };

  cargarHistorial();
}, [chatActivoID, miUsuarioId]);

  // 4. Auto-Scroll suave
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [contactos, chatActivoID]);

  // 5. Función unificada para actualizar lista y mensajes (Mueve el chat al principio)
  const manejarNuevoMensaje = (data: any, esEnviadoPorMi: boolean) => {
  const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  // Determinamos si es mío: 
  // Si viene de handleEnviar, es true. 
  // Si viene del WebSocket, comparamos IDs.
  const esMioReal = esEnviadoPorMi || data.remitente_id === miUsuarioId;

  setContactos((prev) => {
    const index = prev.findIndex(c => c.id === data.id_conversacion);
    if (index === -1) return prev; 

    const chatActualizado = {
      ...prev[index],
      ultimoMensaje: data.contenido,
      hora: horaActual,
      mensajes: [
        ...prev[index].mensajes,
        { 
          id: Date.now(), 
          texto: data.contenido, 
          esMio: esMioReal, // <--- Usamos la lógica corregida
          hora: data.fecha_envio || horaActual 
        }
      ]
    };

    const resto = prev.filter(c => c.id !== data.id_conversacion);
    return [chatActualizado, ...resto];
  });
};

  // 6. Búsqueda con Debounce
  useEffect(() => {
    const buscar = async () => {
      if (query.trim().length < 2) {
        setResultadosBusqueda([]);
        return;
      }
      setEstaBuscando(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/chat/contactos/${miUsuarioId}?query=${query}`);
        const data = await res.json();
        setResultadosBusqueda(data);
      } catch (err) { console.error(err); } 
      finally { setEstaBuscando(false); }
    };
    const timeoutId = setTimeout(buscar, 400);
    return () => clearTimeout(timeoutId);
  }, [query, miUsuarioId]);

  const seleccionarContacto = async (contacto: any) => {
    const chatExistente = contactos.find(c => c.receptor_id === contacto.id_usuario);
    if (chatExistente) {
      setChatActivoID(chatExistente.id);
      setQuery("");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/chat/conversacion/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario1_id: miUsuarioId, usuario2_id: contacto.id_usuario })
      });
      const nuevaConv = await res.json();
      const nuevoChat: Contacto = {
        id: nuevaConv.id_conversacion,
        receptor_id: contacto.id_usuario,
        nombre: contacto.nombre,
        rol: contacto.rol,
        ultimoMensaje: "",
        hora: "Ahora",
        iniciales: contacto.nombre.substring(0, 2).toUpperCase(),
        color: contacto.rol === "DOCENTE" ? "bg-[#701C32]" : "bg-blue-600",
        mensajes: []
      };
      setContactos([nuevoChat, ...contactos]);
      setChatActivoID(nuevaConv.id_conversacion);
      setQuery("");
    } catch (err) { toast.error((err as any).detail || "No se pudo iniciar la conversación"); }
  };

  const handleEnviar = async () => {
    if (!textoMensaje.trim() || !chatActivoID) return;
    const body = { id_conversacion: chatActivoID, remitente_id: miUsuarioId, contenido: textoMensaje };
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/chat/mensaje/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        manejarNuevoMensaje({ id_conversacion: chatActivoID, contenido: textoMensaje }, true);
        setTextoMensaje("");
      } else {
        const error = await res.json();
        toast.error(error.detail || "No se pudo enviar el mensaje");
      }
    } catch (err) { console.error(err);
    toast.error("Error de conexión con el servidor"); }
  };

  if (userLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500 font-medium">Cargando mensajería...</p>
      </div>
    );
  }

  const contactoActual = contactos.find(c => c.id === chatActivoID);

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex relative">
      
      {/* --- LISTA DE CONTACTOS --- */}
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

      {/* --- ÁREA DE CHAT --- */}
      <div className={`flex-1 flex-col bg-[#F2F4F7] ${chatActivoID ? 'flex fixed inset-0 z-[100] md:static md:z-auto' : 'hidden md:flex'}`}>
        {contactoActual ? (
          <>
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setChatActivoID(null)} className="md:hidden text-gray-500 p-1">
                  <ArrowLeft size={20} />
                </button>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${contactoActual.color}`}>
                  {contactoActual.iniciales}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm leading-tight">{contactoActual.nombre}</h3>
                  <p className="text-[10px] text-green-600 font-medium">En línea</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={20} /></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
               {contactoActual.mensajes.map((msg, idx) => (
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
                    onKeyDown={(e) => e.key === "Enter" && handleEnviar()}
                    placeholder="Escribe un mensaje..." 
                    className="flex-1 bg-transparent border-none text-sm text-gray-700 outline-none" 
                  />
                  <button onClick={handleEnviar} className="text-[#701C32] p-1.5 hover:bg-[#701C32]/10 rounded-full transition-colors">
                    <Send size={18} />
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50">
             <MessageSquare size={48} className="opacity-20 mb-4" />
             <p className="text-lg font-medium text-gray-400">Selecciona un chat para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}