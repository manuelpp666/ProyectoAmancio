"use client";
import { useState } from "react";
import { Search, MoreVertical, Paperclip, Send, ArrowLeft, MessageSquare, Phone, Video } from "lucide-react";

export default function MensajeriaDocentePage() {
  // Estado para saber qué chat está abierto (ID del contacto)
  const [chatActivoID, setChatActivoID] = useState<number | null>(null);
  // Estado para el input del mensaje
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  // Datos simulados de los contactos del DOCENTE
  // Nota: En un caso real, esto vendría de tu Base de Datos
  const [contactos, setContactos] = useState([
    { 
      id: 1, 
      nombre: "Alvarado, Juan", 
      rol: "Alumno - 5to A", 
      ultimoMensaje: "Profesor, ya subí la tarea.", 
      hora: "10:30 AM", 
      iniciales: "JA", 
      color: "bg-blue-600",
      mensajes: [
        { id: 1, texto: "Buenos días profesor, ¿la tarea es para hoy?", esMio: false, hora: "09:00 AM" },
        { id: 2, texto: "Hola Juan, sí, tienen hasta la medianoche.", esMio: true, hora: "09:15 AM" },
        { id: 3, texto: "Profesor, ya subí la tarea.", esMio: false, hora: "10:30 AM" }
      ]
    },
    { 
      id: 2, 
      nombre: "Sra. Benavides", 
      rol: "Madre de Familia", 
      ultimoMensaje: "¿Podría justificar la falta de María?", 
      hora: "Ayer", 
      iniciales: "MB", 
      color: "bg-purple-600",
      mensajes: [
         { id: 1, texto: "Buenas tardes profesor Pérez.", esMio: false, hora: "Ayer 4:00 PM" },
         { id: 2, texto: "¿Podría justificar la falta de María? Está enferma.", esMio: false, hora: "Ayer 4:01 PM" }
      ]
    },
    { 
      id: 3, 
      nombre: "Coord. Académica", 
      rol: "Administrativo", 
      ultimoMensaje: "Recordatorio: Subir notas bimestrales.", 
      hora: "Lun", 
      iniciales: "CA", 
      color: "bg-[#701C32]",
      mensajes: [
        { id: 1, texto: "Profesor, recuerde que el registro cierra el viernes.", esMio: false, hora: "Lun 08:00 AM" }
      ]
    },
    { 
      id: 4, 
      nombre: "Grupo: 5to Sec. A", 
      rol: "Aula", 
      ultimoMensaje: "Juan: ¿Alguien tiene el link?", 
      hora: "Lun", 
      iniciales: "5A", 
      color: "bg-green-600",
      mensajes: []
    },
  ]);

  // Buscamos la información del contacto seleccionado
  const contactoActual = contactos.find(c => c.id === chatActivoID);

  // Función para enviar un mensaje simple
  const enviarMensaje = () => {
    if (!nuevoMensaje.trim() || !contactoActual) return;

    const nuevoMsgObj = {
      id: Date.now(), // ID temporal único
      texto: nuevoMensaje,
      esMio: true,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Actualizamos el estado de contactos para agregar el mensaje y actualizar el "último mensaje"
    setContactos(prevContactos => 
      prevContactos.map(c => {
        if (c.id === chatActivoID) {
          return {
            ...c,
            ultimoMensaje: "Tú: " + nuevoMensaje,
            hora: "Ahora",
            mensajes: [...c.mensajes, nuevoMsgObj]
          };
        }
        return c;
      })
    );

    setNuevoMensaje(""); // Limpiar input
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') enviarMensaje();
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex relative">
      
      {/* --- LISTA DE CONTACTOS (IZQUIERDA) --- */}
      {/* Móvil: Se oculta si hay chat activo. Desktop: Siempre visible */}
      <div className={`w-full md:w-80 lg:w-96 flex-col bg-white border-r border-gray-100 ${chatActivoID ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Buscador */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-[#701C32]">Mensajes</h2>
             <button className="text-gray-400 hover:text-[#701C32]">
               <MoreVertical size={20} />
             </button>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar alumno o padre..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#701C32] transition-colors" 
            />
          </div>
        </div>

        {/* Lista Scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {contactos.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setChatActivoID(c.id)}
              className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${chatActivoID === c.id ? 'bg-[#FFF1E3] border-l-4 border-l-[#701C32]' : 'border-l-4 border-l-transparent'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${c.color}`}>
                {c.iniciales}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={`text-sm font-bold truncate ${chatActivoID === c.id ? 'text-[#701C32]' : 'text-gray-800'}`}>
                    {c.nombre}
                  </h4>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{c.hora}</span>
                </div>
                <div className="flex justify-between items-end">
                   <p className="text-xs text-gray-500 truncate max-w-[80%]">{c.ultimoMensaje}</p>
                   {/* Indicador de no leído simulado */}
                   {c.id === 2 && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{c.rol}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- ÁREA DE CHAT (DERECHA) --- */}
      {/* Móvil: Ocupa toda la pantalla (z-50) si activo. Desktop: Ocupa el espacio restante */}
      <div className={`flex-1 flex-col bg-[#F8F9FA] ${chatActivoID ? 'flex fixed inset-0 z-[60] md:static md:z-auto' : 'hidden md:flex'}`}>
        
        {contactoActual ? (
          <>
            {/* Header del Chat */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                 {/* Botón Volver (Solo móvil) */}
                 <button onClick={() => setChatActivoID(null)} className="md:hidden text-gray-500 p-1 hover:bg-gray-100 rounded-full mr-1">
                    <ArrowLeft size={20} />
                 </button>
                 
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${contactoActual.color}`}>
                    {contactoActual.iniciales}
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-800 text-sm leading-tight">{contactoActual.nombre}</h3>
                   <p className="text-[10px] text-gray-500">{contactoActual.rol}</p>
                 </div>
              </div>
              
              {/* Acciones del chat */}
              <div className="flex items-center gap-3 text-gray-400">
                 <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                    <Phone size={20} />
                 </button>
                 <button className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                    <Video size={20} />
                 </button>
                 <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreVertical size={20} />
                 </button>
              </div>
            </div>

            {/* Cuerpo de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]/10">
               {/* Fecha simulada */}
               <div className="flex justify-center my-4">
                 <span className="text-[10px] bg-gray-200 text-gray-500 px-3 py-1 rounded-full shadow-sm">Hoy</span>
               </div>
               
               {/* Mensajes dinámicos */}
               {contactoActual.mensajes.length > 0 ? (
                 contactoActual.mensajes.map((msg) => (
                   <div key={msg.id} className={`flex gap-2 ${msg.esMio ? 'flex-row-reverse' : ''}`}>
                     {!msg.esMio && (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-1 ${contactoActual.color}`}>
                            {contactoActual.iniciales}
                        </div>
                     )}
                     
                     <div className={`px-4 py-2 rounded-2xl shadow-sm max-w-[75%] break-words relative group ${msg.esMio ? 'bg-[#701C32] text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                        <p className="text-sm leading-relaxed">{msg.texto}</p>
                        <span className={`text-[9px] mt-1 block text-right opacity-70 ${msg.esMio ? 'text-white' : 'text-gray-400'}`}>
                            {msg.hora}
                        </span>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <MessageSquare size={30} className="opacity-40"/>
                   </div>
                   <div className="text-center">
                     <p className="text-sm font-medium">No hay mensajes previos.</p>
                     <p className="text-xs">Comienza la conversación con {contactoActual.nombre}.</p>
                   </div>
                 </div>
               )}
            </div>

            {/* Input de Envío */}
            <div className="p-3 bg-white border-t border-gray-200 shrink-0 safe-area-bottom">
               <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-200 focus-within:border-[#701C32] focus-within:ring-1 focus-within:ring-[#701C32]/20 transition-all shadow-sm">
                  <button className="text-gray-400 hover:text-[#701C32] transition-colors">
                    <Paperclip size={20} />
                  </button>
                  <input 
                    type="text" 
                    placeholder="Escribe un mensaje..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 outline-none placeholder:text-gray-400" 
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    onKeyDown={handleKeyPress}
                  />
                  <button 
                    onClick={enviarMensaje}
                    className={`p-2 rounded-full transition-all ${nuevoMensaje.trim() ? 'bg-[#701C32] text-white hover:bg-[#8a223d] shadow-md' : 'text-gray-300 bg-gray-100 cursor-not-allowed'}`}
                    disabled={!nuevoMensaje.trim()}
                  >
                    <Send size={18} />
                  </button>
               </div>
            </div>
          </>
        ) : (
          /* Estado Vacío (Solo Desktop) */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/50">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                <MessageSquare size={48} className="text-gray-200" />
             </div>
             <h3 className="text-xl font-bold text-gray-400 mb-2">Mensajería Docente</h3>
             <p className="text-sm text-gray-400 max-w-xs text-center">Selecciona un alumno, padre de familia o colega de la lista para comenzar a chatear.</p>
          </div>
        )}

      </div>
    </div>
  );
}