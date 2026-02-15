"use client";
import { useState, useEffect, useRef } from "react";
import { Contacto } from "@/src/interfaces/mensajeria";
import { toast } from "sonner";

export function useChat(miUsuarioId: number | null, userLoading: boolean) {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [chatActivoID, setChatActivoID] = useState<number | null>(null);
  const [textoMensaje, setTextoMensaje] = useState("");
  const [query, setQuery] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [estaBuscando, setEstaBuscando] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Cargar lista de conversaciones
  useEffect(() => {
    if (userLoading || !miUsuarioId) return;
    const cargarConversaciones = async () => {
      try {
        const res = await fetch(`http://localhost:8000/virtual/chat/conversaciones/${miUsuarioId}`);
        const data = await res.json();
        setContactos(data);
      } catch (err) { console.error("Error cargando chats:", err); }
    };
    cargarConversaciones();
  }, [miUsuarioId, userLoading]);

  // 2. WebSocket
  useEffect(() => {
    if (!miUsuarioId || socketRef.current) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//localhost:8000/ws/${miUsuarioId}`);
    
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.tipo === "NUEVO_MENSAJE") manejarNuevoMensaje(payload.data, false);
    };
    socket.onclose = () => { socketRef.current = null; };
    socketRef.current = socket;
    return () => { socket.close(); socketRef.current = null; };
  }, [miUsuarioId]);

  // 3. Historial
  useEffect(() => {
    if (!chatActivoID || !miUsuarioId) return;
    const cargarHistorial = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/chat/historial/${chatActivoID}`);
        const data = await res.json();
        const mensajesFormateados = data.map((m: any) => ({
          id: m.id,
          texto: m.texto,
          esMio: m.remitente_id === miUsuarioId,
          hora: m.hora
        }));
        setContactos(prev => prev.map(c => 
          c.id === chatActivoID ? { ...c, mensajes: mensajesFormateados } : c
        ));
      } catch (err) { console.error(err); }
    };
    cargarHistorial();
  }, [chatActivoID, miUsuarioId]);

  // 4. Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [contactos, chatActivoID]);

  // 5. Manejar mensajes
  const manejarNuevoMensaje = (data: any, esEnviadoPorMi: boolean) => {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const esMioReal = esEnviadoPorMi || data.remitente_id === miUsuarioId;

    setContactos((prev) => {
      const index = prev.findIndex(c => c.id === data.id_conversacion);
      if (index === -1) return prev; 
      const chatPrevio = prev[index];
      const mensajesAnteriores = Array.isArray(chatPrevio.mensajes) ? chatPrevio.mensajes : [];

      const chatActualizado = {
        ...chatPrevio,
        ultimoMensaje: data.contenido,
        hora: horaActual,
        mensajes: [...mensajesAnteriores, { 
          id: Date.now(), 
          texto: data.contenido, 
          esMio: esMioReal, 
          hora: data.fecha_envio || horaActual 
        }]
      };
      return [chatActualizado, ...prev.filter(c => c.id !== data.id_conversacion)];
    });
  };

  // 6. Búsqueda
  useEffect(() => {
    const buscar = async () => {
      if (query.trim().length < 2) { setResultadosBusqueda([]); return; }
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
    if (chatExistente) { setChatActivoID(chatExistente.id); setQuery(""); return; }
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
        ultimoMensaje: "Empieza a chatear",
        hora: "Ahora",
        iniciales: contacto.nombre.substring(0, 2).toUpperCase(),
        color: contacto.rol === "DOCENTE" ? "bg-[#701C32]" : "bg-blue-600",
        mensajes: []
      };
      setContactos(prev => [nuevoChat, ...prev]);
      setChatActivoID(nuevaConv.id_conversacion);
      setQuery("");
    } catch (err) { toast.error("No se pudo iniciar la conversación"); }
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
      }
    } catch (err) { toast.error("Error de conexión"); }
  };

  // RETORNO COMPLETO PARA LA UI
  return {
    contactos,
    chatActivoID,
    setChatActivoID,
    textoMensaje,
    setTextoMensaje,
    query,
    setQuery,
    resultadosBusqueda,
    estaBuscando,
    scrollRef,
    handleEnviar,
    seleccionarContacto,
    contactoActual: contactos.find(c => c.id === chatActivoID)
  };
}