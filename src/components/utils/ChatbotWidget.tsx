"use client";
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // <--- 1. Importación agregada
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '¡Hola! Soy Amancio IA. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll automático
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userQuery = input;
    setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
    setInput('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('question', userQuery);

      // El backend responde con un stream de texto (StreamingResponse), no
      // con un JSON { answer: "..." }. Por eso usamos fetch + ReadableStream
      // en vez de axios (axios no lee streams incrementales en el navegador
      // y con esta respuesta terminaba devolviendo un string plano, así que
      // res.data?.answer siempre daba undefined y caía en el mensaje de error).
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/ask`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok || !res.body) {
        throw new Error('Respuesta no válida del servidor');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';
      let receivedAny = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        const chunkText = decoder.decode(value, { stream: true });
        if (!chunkText) continue;

        accumulated += chunkText;
        receivedAny = true;

        // En cuanto llega el primer fragmento, quitamos el loader y vamos
        // actualizando el último mensaje del bot con lo acumulado.
        setLoading(false);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'bot') {
            return [...prev.slice(0, -1), { role: 'bot', text: accumulated }];
          }
          return [...prev, { role: 'bot', text: accumulated }];
        });
      }

      if (!receivedAny) {
        setMessages(prev => [...prev, { role: 'bot', text: 'No encontré una respuesta para eso. ¿Puedes reformular tu pregunta?' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Lo siento, tuve un problema al procesar tu consulta. Reintenta en un momento.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">
      {/* Ventana de Chat */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-2rem)] sm:w-[400px] h-[70vh] max-h-[500px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-[#701C32] p-5 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight">Amancio IA</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                  <p className="text-[10px] font-bold text-red-100 uppercase">En línea ahora</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                  ? 'bg-[#701C32] text-white rounded-tr-none' 
                  : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                }`}>
                  {/* 2. Renderizado condicional según el rol */}
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <ReactMarkdown
                      components={{
                        // Estilos adaptados para espacios reducidos en el widget flotante
                        ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="my-0.5">{children}</li>,
                        p: ({ children }) => <p className="my-1 leading-normal">{children}</p>,
                        strong: ({ children }) => <strong className="font-extrabold text-gray-900">{children}</strong>,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                  <Loader2 size={16} className="animate-spin text-[#701C32]" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-50 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-[#701C32]/10 outline-none transition-all"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[#701C32] text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      {/* Botón Flotante (Trigger) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Cerrar chat" : "Abrir chat de ayuda"}
        className="bg-[#701C32] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all group relative"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        
        {/* Tooltip opcional */}
        {!isOpen && (
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-[#701C32] px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-xl border border-gray-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            ¿Dudas? Pregúntale a Amancio
          </span>
        )}
      </button>
    </div>
  );
}