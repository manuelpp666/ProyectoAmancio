"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Contacto, Mensaje } from "@/src/interfaces/mensajeria";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";
import { urlWebSocket } from "@/src/lib/websocket";

/**
 * Mensajería del campus.
 *
 * TRANSPORTE: hay dos vías y se usan a la vez a propósito.
 *
 *   1. WebSocket. Es la vía rápida: el backend empuja el mensaje al receptor en
 *      el momento de guardarlo. Se usa siempre que la conexión esté abierta.
 *
 *   2. Consulta periódica por HTTP. Es el respaldo, y solo entra en marcha
 *      cuando el socket NO está abierto. Existe porque el servidor de
 *      producción sirve el backend con Apache + Phusion Passenger, que no
 *      reenvía el "upgrade" a WebSocket: la petición llega a FastAPI como un
 *      GET normal, la ruta /ws/{id} no coincide y responde 404. Ahí el socket
 *      no se abre nunca, y sin este respaldo los mensajes recibidos solo
 *      aparecían al recargar la página.
 *
 * Si algún día el hosting enruta /ws/ por WebSocket (mod_proxy_wstunnel) o el
 * backend pasa a un VPS, no hay que cambiar nada: el socket se abrirá, la
 * consulta periódica se apagará sola y la entrega volverá a ser instantánea.
 *
 * Los mensajes se identifican por su id real de base de datos, nunca por
 * Date.now(): las dos vías pueden solapar y así el mismo mensaje no se pinta
 * dos veces.
 */

/** Lo que devuelve /virtual/chat/contactos: gente a la que se puede escribir. */
interface ContactoBuscado {
  id_usuario: number;
  nombre: string;
  dni: string;
  rol: string;
}

/** Cada cuánto se pregunta por mensajes nuevos de la conversación abierta. */
const MS_SONDEO_MENSAJES = 4000;
/** Cada cuánto se refresca la lista de conversaciones (chats nuevos, orden). */
const MS_SONDEO_CONVERSACIONES = 15000;
/** Espera antes de reintentar el socket, y tope al que llega el retroceso. */
const MS_RECONEXION_INICIAL = 2000;
const MS_RECONEXION_MAXIMA = 30000;

export function useChat(miUsuarioId: number | null, userLoading: boolean) {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [chatActivoID, setChatActivoID] = useState<number | null>(null);
  const [textoMensaje, setTextoMensaje] = useState("");
  const [query, setQuery] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [estaBuscando, setEstaBuscando] = useState(false);
  // Avisa de que la lista de conversaciones ya vino del servidor. Quien quiera
  // abrir un chat automáticamente debe esperar a esto: si lo hace antes, la
  // lista está vacía y crearía una entrada repetida de una conversación que sí
  // existía.
  const [listaCargada, setListaCargada] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // El id del chat abierto, en una ref además del estado: los temporizadores
  // del sondeo se crean una sola vez y necesitan leer el valor actual, no el
  // que había cuando se montaron.
  const chatActivoRef = useRef<number | null>(null);
  useEffect(() => { chatActivoRef.current = chatActivoID; }, [chatActivoID]);

  // Evita que dos sondeos se pisen si el servidor tarda más que el intervalo.
  const sondeando = useRef(false);

  const socketAbierto = () =>
    socketRef.current?.readyState === WebSocket.OPEN;

  // ---------------------------------------------------------------- mensajes

  /**
   * Añade un mensaje al chat que le corresponde, si no estaba ya.
   *
   * Si la conversación no está en la lista el mensaje no tiene dónde ir, y se
   * ignora: de eso se encarga `conversacionConocida` antes de llamar aquí.
   *
   * No devuelve nada a propósito. React no ejecuta el actualizador de estado en
   * el momento de llamar a setContactos, así que cualquier dato que se sacara
   * de dentro llegaría siempre sin actualizar.
   */
  const agregarMensaje = useCallback((
    idConversacion: number,
    mensaje: Mensaje,
  ): void => {
    setContactos((prev) => {
      const index = prev.findIndex((c) => c.id === idConversacion);
      if (index === -1) return prev;

      const chat = prev[index];
      const anteriores = Array.isArray(chat.mensajes) ? chat.mensajes : [];
      if (anteriores.some((m) => m.id === mensaje.id)) return prev; // ya estaba

      const actualizado: Contacto = {
        ...chat,
        ultimoMensaje: mensaje.texto,
        hora: mensaje.hora,
        mensajes: [...anteriores, mensaje],
      };
      // La conversación con actividad reciente sube al principio de la lista.
      return [actualizado, ...prev.filter((c) => c.id !== idConversacion)];
    });
  }, []);

  // Copia de la lista en una ref. Los temporizadores del sondeo y el manejador
  // del socket se crean una sola vez y necesitan consultar el estado actual sin
  // volver a montarse con cada mensaje que entra.
  const contactosRef = useRef<Contacto[]>([]);
  useEffect(() => { contactosRef.current = contactos; }, [contactos]);

  /** ¿Está esta conversación en la lista que tenemos cargada? */
  const conversacionConocida = useCallback((idConversacion: number): boolean =>
    contactosRef.current.some((c) => c.id === idConversacion), []);

  /** Id más alto que ya tenemos de una conversación; null si no hay ninguno. */
  const ultimoIdDeConversacion = useCallback((idConversacion: number): number | null => {
    const chat = contactosRef.current.find((c) => c.id === idConversacion);
    if (!chat?.mensajes?.length) return null;
    return chat.mensajes.reduce((max, m) => (m.id > max ? m.id : max), 0) || null;
  }, []);

  const cargarConversaciones = useCallback(async () => {
    if (!miUsuarioId) return;
    try {
      const res = await apiFetch(`/virtual/chat/conversaciones/${miUsuarioId}`);
      if (!res.ok) return;
      const data = await res.json();
      // Se conservan los mensajes ya cargados: la lista no los trae, y sin
      // esto refrescarla vaciaría la conversación abierta.
      setContactos((prev) => data.map((nuevo: Contacto) => {
        const previo = prev.find((c) => c.id === nuevo.id);
        return previo?.mensajes?.length
          ? { ...nuevo, mensajes: previo.mensajes }
          : nuevo;
      }));
    } catch (err) {
      console.error("Error cargando chats:", err);
    }
  }, [miUsuarioId]);

  /**
   * Pide los mensajes de una conversación. Con `desdeId` solo trae los
   * posteriores a ese id, que es lo que hace el sondeo barato.
   */
  const pedirMensajes = useCallback(async (
    idConversacion: number,
    desdeId?: number,
  ) => {
    if (!miUsuarioId) return;
    const ruta = `/virtual/chat/historial/${idConversacion}`
      + (desdeId ? `?desde_id=${desdeId}` : "");
    const res = await apiFetch(ruta);
    if (!res.ok) return;
    const data = await res.json();

    const nuevos: Mensaje[] = data.map((m: any) => ({
      id: m.id,
      texto: m.texto,
      esMio: m.remitente_id === miUsuarioId,
      hora: m.hora,
    }));
    if (nuevos.length === 0) return;

    if (desdeId) {
      nuevos.forEach((m) => agregarMensaje(idConversacion, m));
    } else {
      // Carga inicial: reemplaza, no acumula.
      setContactos((prev) => prev.map((c) =>
        c.id === idConversacion ? { ...c, mensajes: nuevos } : c
      ));
    }
  }, [miUsuarioId, agregarMensaje]);

  // 1. Lista de conversaciones al entrar
  useEffect(() => {
    if (userLoading || !miUsuarioId) return;
    cargarConversaciones().finally(() => setListaCargada(true));
  }, [miUsuarioId, userLoading, cargarConversaciones]);

  // 2. Historial completo al abrir un chat
  useEffect(() => {
    if (!chatActivoID || !miUsuarioId) return;
    pedirMensajes(chatActivoID).catch((err) => console.error(err));
  }, [chatActivoID, miUsuarioId, pedirMensajes]);

  // 3. WebSocket, con reconexión
  useEffect(() => {
    if (!miUsuarioId) return;

    let cerradoPorNosotros = false;
    let esperaReconexion = MS_RECONEXION_INICIAL;
    let temporizador: ReturnType<typeof setTimeout> | null = null;
    // El último socket que abrió esta ejecución del efecto, para que la limpieza
    // cierre el suyo y no el que pueda haber puesto otra ejecución.
    let socketDeEsteEfecto: WebSocket | null = null;

    const conectar = () => {
      let socket: WebSocket;
      try {
        socket = new WebSocket(urlWebSocket(miUsuarioId));
      } catch (err) {
        // Falta NEXT_PUBLIC_API_URL o la URL es inválida. No se reintenta:
        // reintentar no lo va a arreglar y el respaldo por HTTP cubre el chat.
        console.error("Mensajería: no se pudo abrir el WebSocket.", err);
        return;
      }
      socketDeEsteEfecto = socket;
      socketRef.current = socket;

      socket.onopen = () => { esperaReconexion = MS_RECONEXION_INICIAL; };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.tipo !== "NUEVO_MENSAJE") return;
          const d = payload.data;
          // Primer mensaje de un contacto nuevo: la conversación todavía no
          // está en la lista, así que se recarga para que aparezca (y con ella
          // el mensaje). Antes se descartaba en silencio y solo salía al
          // recargar la página.
          if (!conversacionConocida(d.id_conversacion)) {
            cargarConversaciones();
            return;
          }
          agregarMensaje(d.id_conversacion, {
            id: d.id_mensaje,
            texto: d.contenido,
            esMio: d.remitente_id === miUsuarioId,
            hora: d.fecha_envio,
          });
        } catch (err) {
          console.error("Mensajería: aviso ilegible del socket.", err);
        }
      };

      socket.onclose = () => {
        // Solo se borra la referencia si sigue apuntando a ESTE socket. El
        // evento close llega con retraso, y en desarrollo React monta el efecto
        // dos veces: el close del primer socket borraba la referencia del
        // segundo, que estaba perfectamente abierto. El resultado era que la
        // mensajería creía no tener socket y sondeaba por HTTP sin necesidad.
        if (socketRef.current === socket) socketRef.current = null;
        if (cerradoPorNosotros) return;
        // Retroceso exponencial: si el servidor no admite WebSocket (el caso de
        // Passenger) no tiene sentido reintentar cada dos segundos para siempre.
        temporizador = setTimeout(conectar, esperaReconexion);
        esperaReconexion = Math.min(esperaReconexion * 2, MS_RECONEXION_MAXIMA);
      };

      // onerror siempre va seguido de onclose, que ya reprograma el reintento.
      socket.onerror = () => { /* el detalle lo da onclose */ };
    };

    conectar();

    return () => {
      cerradoPorNosotros = true;
      if (temporizador) clearTimeout(temporizador);
      // Se cierra el socket de ESTA ejecución del efecto, no el que haya en la
      // referencia: si ya lo sustituyó otro, cerrar el de la referencia dejaría
      // sin conexión al que acaba de montarse.
      socketDeEsteEfecto?.close();
      if (socketRef.current === socketDeEsteEfecto) socketRef.current = null;
    };
  }, [miUsuarioId, agregarMensaje, cargarConversaciones, conversacionConocida]);

  // 4. Respaldo por HTTP: solo mientras el socket no esté abierto.
  useEffect(() => {
    if (userLoading || !miUsuarioId) return;

    const sondear = async () => {
      // Con el socket abierto no hace falta preguntar nada.
      if (socketAbierto()) return;
      // En una pestaña de fondo tampoco: con ~500 cuentas, sondear pestañas
      // que nadie está mirando es carga pura para el servidor.
      if (typeof document !== "undefined" && document.hidden) return;
      if (sondeando.current) return;

      const idChat = chatActivoRef.current;
      if (!idChat) return;

      sondeando.current = true;
      try {
        const ultimoId = ultimoIdDeConversacion(idChat);
        await pedirMensajes(idChat, ultimoId || undefined);
      } catch {
        // Un fallo puntual de red no debe dejar rastro en la consola del
        // usuario ni cortar el sondeo: el siguiente ciclo lo reintenta.
      } finally {
        sondeando.current = false;
      }
    };

    const refrescarLista = () => {
      if (socketAbierto()) return;
      if (typeof document !== "undefined" && document.hidden) return;
      cargarConversaciones();
    };

    const t1 = setInterval(sondear, MS_SONDEO_MENSAJES);
    const t2 = setInterval(refrescarLista, MS_SONDEO_CONVERSACIONES);

    // Al volver a la pestaña se consulta ya, sin esperar el siguiente ciclo.
    const alVolver = () => {
      if (document.hidden) return;
      sondear();
      refrescarLista();
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      clearInterval(t1);
      clearInterval(t2);
      document.removeEventListener("visibilitychange", alVolver);
    };
    // `ultimoIdDeConversacion` lee el estado a través de una ref, así que este
    // efecto no necesita recrearse cuando cambian los mensajes.
  }, [miUsuarioId, userLoading, pedirMensajes, cargarConversaciones, ultimoIdDeConversacion]);

  // 5. Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [contactos, chatActivoID]);

  // 6. Búsqueda
  useEffect(() => {
    const buscar = async () => {
      if (query.trim().length < 2) { setResultadosBusqueda([]); return; }
      setEstaBuscando(true);
      try {
        const res = await apiFetch(`/virtual/chat/contactos/${miUsuarioId}?query=${query}`);
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
      const res = await apiFetch(`/virtual/chat/conversacion/`, {
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
    } catch { toast.error("No se pudo iniciar la conversación"); }
  };

  /**
   * Abre la conversación con alguien de un rol concreto, sin que el usuario
   * tenga que buscarlo en la lista.
   *
   * Lo usa el enlace de «Citas psicológicas», que manda al alumno a la
   * mensajería para hablar con el psicólogo: antes lo dejaba en la pantalla
   * vacía y tenía que dar con él por su cuenta.
   *
   * Si ya hay una conversación con esa persona se abre esa, para no partir el
   * historial en dos.
   */
  const abrirChatConRol = useCallback(async (rol: string): Promise<boolean> => {
    if (!miUsuarioId) return false;

    const yaHablada = contactosRef.current.find((c) => c.rol === rol);
    if (yaHablada) { setChatActivoID(yaHablada.id); return true; }

    try {
      // Sin `query` devuelve todos los contactos que este usuario puede escribir.
      const res = await apiFetch(`/virtual/chat/contactos/${miUsuarioId}`);
      if (!res.ok) return false;
      const data = await res.json();
      const lista: ContactoBuscado[] = Array.isArray(data) ? data : [];
      const persona = lista.find((c) => c.rol === rol);
      if (!persona) return false;
      await seleccionarContacto(persona);
      return true;
    } catch (err) {
      console.error("No se pudo abrir el chat por rol:", err);
      return false;
    }
    // `seleccionarContacto` se declara más abajo y no cambia entre renders de
    // forma relevante; incluirla obligaría a envolverla también en useCallback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [miUsuarioId]);

  const handleEnviar = async () => {
    const texto = textoMensaje.trim();
    if (!texto || !chatActivoID) return;

    // Se limpia la caja antes de la respuesta para que escribir se sienta
    // inmediato; si el envío falla, el texto se devuelve al cuadro.
    setTextoMensaje("");
    try {
      const res = await apiFetch(`/virtual/chat/mensaje/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_conversacion: chatActivoID,
          remitente_id: miUsuarioId,
          contenido: texto,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || "No se pudo enviar el mensaje");
        setTextoMensaje(texto);
        return;
      }

      // Se pinta con el id real que devuelve el servidor: así el sondeo o el
      // socket no lo vuelven a añadir como si fuese otro mensaje.
      const guardado = await res.json();
      agregarMensaje(chatActivoID, {
        id: guardado.id_mensaje,
        texto: guardado.contenido ?? texto,
        esMio: true,
        // La hora que da el servidor, para que el mensaje no quede con una hora
        // distinta a la que ve la otra persona si los relojes no coinciden.
        hora: guardado.hora
          || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } catch {
      toast.error("Error de conexión");
      setTextoMensaje(texto);
    }
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
    abrirChatConRol,
    listaCargada,
    contactoActual: contactos.find(c => c.id === chatActivoID)
  };
}
