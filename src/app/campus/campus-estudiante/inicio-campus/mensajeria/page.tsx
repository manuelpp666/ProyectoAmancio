"use client";
import { useState } from "react";
import { Search, MoreVertical, Paperclip, Send, ArrowLeft, MessageSquare } from "lucide-react";

export default function MensajeriaPage() {
  // Estado para saber qué chat está abierto
  const [chatActivoID, setChatActivoID] = useState<number | null>(null);

  // Datos simulados de tus contactos
  const contactos = [
    { 
      id: 1, 
      nombre: "Prof. José Puicon", 
      rol: "Docente", 
      ultimoMensaje: "No olvides enviar la tarea...", 
      hora: "10:30 AM", 
      iniciales: "JP", 
      color: "bg-[#701C32]",
      mensajes: [
        { id: 1, texto: "Buenos días Gabriela, recuerda la tarea.", esMio: false, hora: "10:30 AM" },
        { id: 2, texto: "¡Sí profesor! Ya la estoy subiendo.", esMio: true, hora: "10:31 AM" }
      ]
    },
    { 
      id: 2, 
      nombre: "Secretaría", 
      rol: "Admin", 
      ultimoMensaje: "Matrícula confirmada.", 
      hora: "Ayer", 
      iniciales: "SC", 
      color: "bg-blue-600",
      mensajes: [
         { id: 1, texto: "Su matrícula ha sido procesada correctamente.", esMio: false, hora: "Ayer" }
      ]
    },
    { 
      id: 3, 
      nombre: "Auxiliar Carlos", 
      rol: "Personal", 
      ultimoMensaje: "¿Justificaste tu falta?", 
      hora: "Lun", 
      iniciales: "AC", 
      color: "bg-green-600",
      mensajes: []
    },
    { 
      id: 4, 
      nombre: "Grupo 5to B", 
      rol: "Grupo", 
      ultimoMensaje: "Examen el viernes.", 
      hora: "Lun", 
      iniciales: "5B", 
      color: "bg-purple-600",
      mensajes: []
    },
  ];

  // Buscamos la información del contacto seleccionado
  const contactoActual = contactos.find(c => c.id === chatActivoID);

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex relative">
      
      {/* --- LISTA DE CONTACTOS (IZQUIERDA) --- */}
      {/* Móvil: Se oculta si hay chat activo. Desktop: Siempre visible */}
      <div className={`w-full md:w-80 lg:w-96 flex-col bg-white border-r border-gray-100 ${chatActivoID ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Buscador */}
        <div className="p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-[#701C32] mb-4">Mensajería</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar conversación..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#701C32] transition-colors" 
            />
          </div>
        </div>

        {/* Lista Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {contactos.map((c) => (
            <div 
              key={c.id} 
              onClick={() => setChatActivoID(c.id)}
              className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${chatActivoID === c.id ? 'bg-[#FFF1E3] border-l-4 border-l-[#701C32]' : 'border-l-4 border-l-transparent'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${c.color}`}>
                {c.iniciales}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={`text-sm font-bold truncate ${chatActivoID === c.id ? 'text-[#701C32]' : 'text-gray-800'}`}>
                    {c.nombre}
                  </h4>
                  <span className="text-[10px] text-gray-400">{c.hora}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{c.ultimoMensaje}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- ÁREA DE CHAT (DERECHA) --- */}
      {/* Móvil: Ocupa toda la pantalla (z-50) si activo. Desktop: Ocupa el espacio restante */}
      <div className={`flex-1 flex-col bg-[#F2F4F7] ${chatActivoID ? 'flex fixed inset-0 z-[100] md:static md:z-auto' : 'hidden md:flex'}`}>
        
        {contactoActual ? (
          <>
            {/* Header del Chat */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                 {/* Botón Volver (Solo móvil) */}
                 <button onClick={() => setChatActivoID(null)} className="md:hidden text-gray-500 p-1 hover:bg-gray-100 rounded-full">
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
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical size={20} />
              </button>
            </div>

            {/* Cuerpo de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {/* Fecha simulada */}
               <div className="flex justify-center my-2">
                 <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-1 rounded-full">Hoy</span>
               </div>
               
               {/* Mensajes dinámicos */}
               {contactoActual.mensajes.length > 0 ? (
                 contactoActual.mensajes.map((msg) => (
                   <div key={msg.id} className={`flex gap-2 ${msg.esMio ? 'flex-row-reverse' : ''}`}>
                     <div className={`p-3 rounded-2xl shadow-sm max-w-[80%] break-words ${msg.esMio ? 'bg-[#701C32] text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                        <p className="text-sm">{msg.texto}</p>
                        <span className={`text-[9px] mt-1 block text-right ${msg.esMio ? 'text-white/70' : 'text-gray-400'}`}>{msg.hora}</span>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center text-gray-400 mt-10 text-sm">
                   <p>No hay mensajes previos.</p>
                   <p>Comienza la conversación.</p>
                 </div>
               )}
            </div>

            {/* Input de Envío */}
            <div className="p-3 bg-white border-t border-gray-200 shrink-0 safe-area-bottom">
               <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full border border-gray-200 focus-within:border-[#701C32] focus-within:ring-1 focus-within:ring-[#701C32]/20 transition-all">
                  <button className="text-gray-400 hover:text-[#701C32]">
                    <Paperclip size={20} />
                  </button>
                  <input 
                    type="text" 
                    placeholder="Escribe un mensaje..." 
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 outline-none" 
                  />
                  <button className="text-[#701C32] p-1.5 hover:bg-[#701C32]/10 rounded-full">
                    <Send size={18} />
                  </button>
               </div>
            </div>
          </>
        ) : (
          /* Estado Vacío (Solo Desktop) */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={40} className="opacity-50" />
             </div>
             <p className="text-lg font-medium text-gray-400">Selecciona un contacto</p>
             <p className="text-sm">para comenzar a chatear</p>
          </div>
        )}

      </div>
    </div>
  );
}