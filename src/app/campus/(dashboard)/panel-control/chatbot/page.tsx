"use client";
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner'
import { ConfirmModal } from '@/src/components/utils/ConfirmModal';
import {
  FileText, Trash2,
  PlayCircle, CheckCircle2, Loader2, X, Send, Bot, MessageSquare
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { Chatbot } from '@/src/interfaces/chatbot';
import { ChatMessage } from '@/src/interfaces/chatbot';
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';

// Etapas que se muestran mientras se procesa el archivo. No reflejan un
// progreso real medido en el backend (la subida es una sola petición/
// respuesta), pero comunican honestamente QUÉ está pasando en ese momento,
// que es lo que reduce la ansiedad de "pantalla congelada".
const UPLOAD_STAGES = [
  { label: "Subiendo archivo al servidor...", upTo: 20 },
  { label: "Extrayendo texto y tablas...", upTo: 45 },
  { label: "Revisando datos sensibles...", upTo: 60 },
  { label: "Generando conocimiento (embeddings)...", upTo: 85 },
  { label: "Verificando en la base de conocimiento...", upTo: 96 },
];

export default function ChatbotKnowledgePage() {
  const [documents, setDocuments] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ESTADOS PARA EL CHAT DE PRUEBA ---
  const [showTestChat, setShowTestChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- ESTADOS PARA EL MODAL DE CONFIRMACIÓN ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/chatbot/documents"); // URL corta y limpia

      if (!res.ok) throw new Error();

      const data = await res.json();
      setDocuments(data);
    } catch (error) {
      toast.error("Error al cargar los documentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  // Avanza el progreso simulado en "cámara lenta" (trickle): rápido al
  // inicio, más lento a medida que se acerca al 96%, para nunca prometer un
  // 100% que todavía no llegó. El texto de la etapa cambia junto al %,
  // dándole al usuario una historia clara de qué está pasando en vez de
  // un spinner mudo.
  const startUploadProgress = () => {
    setUploadProgress(2);
    setUploadStage(UPLOAD_STAGES[0].label);
    let stageIndex = 0;

    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        const currentStage = UPLOAD_STAGES[stageIndex];
        if (prev >= currentStage.upTo) {
          if (stageIndex < UPLOAD_STAGES.length - 1) {
            stageIndex += 1;
            setUploadStage(UPLOAD_STAGES[stageIndex].label);
          }
          return prev; // se queda esperando en el techo de la etapa actual
        }
        // Avance decreciente: pasos grandes al inicio, chiquitos al final
        const remaining = currentStage.upTo - prev;
        const step = Math.max(0.5, remaining * 0.12);
        return Math.min(currentStage.upTo, prev + step);
      });
    }, 350);
  };

  const stopUploadProgress = (success: boolean) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (success) {
      setUploadProgress(100);
      setUploadStage("¡Listo!");
    }
    // Pequeña pausa para que se alcance a ver el 100% antes de resetear
    setTimeout(() => {
      setUploading(false);
      setUploadProgress(0);
      setUploadStage("");
    }, success ? 600 : 0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setUploading(true);
      startUploadProgress();

      const res = await apiFetch("/chatbot/upload", {
        method: "POST",
        body: formData, // apiFetch detectará que es FormData y no pondrá JSON header
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al subir");
      }

      const data = await res.json();
      toast.success("Documento entrenado correctamente");

      // Si el backend detectó y redactó datos sensibles (DNI, teléfonos,
      // correos, cuentas bancarias, etc.), avisamos al admin para que
      // revise si en verdad quería subir ese archivo.
      if (data.advertencia_seguridad) {
        toast.warning(data.advertencia_seguridad, { duration: 8000 });
      }
      // Si quedaron fragmentos sin confirmar en Pinecone tras los reintentos
      if (data.advertencia_chunks_faltantes) {
        toast.warning(data.advertencia_chunks_faltantes, { duration: 10000 });
      }

      stopUploadProgress(true);
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || "Error al subir archivo");
      stopUploadProgress(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Limpieza del intervalo si el usuario navega fuera de la página a medio subir
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Función que abre el modal
  const confirmDelete = (id: number) => {
    setSelectedDocId(id);
    setIsDeleteModalOpen(true);
  }

  // Función que ejecuta la eliminación real
  const handleDelete = async () => {
    if (!selectedDocId) return;

    const deleteAction = async () => {
      const res = await apiFetch(`/chatbot/delete/${selectedDocId}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error();
      return res;
    };

    toast.promise(deleteAction(), {
      loading: 'Eliminando conocimiento de Amancio IA...',
      success: () => {
        setDocuments(prev => prev.filter(doc => doc.id !== selectedDocId));
        return 'Conocimiento eliminado con éxito';
      },
      error: 'No se pudo eliminar el documento',
    });
  };

  // --- LÓGICA DE PREGUNTA AL CHATBOT (con streaming) ---
  // El backend ahora devuelve el texto en fragmentos a medida que el modelo
  // los genera (StreamingResponse), en vez de un solo JSON al final. Por eso
  // usamos fetch + ReadableStream en lugar de axios (axios no puede leer un
  // stream incremental en el navegador). Vamos actualizando el ÚLTIMO
  // mensaje del historial en cada fragmento, dando el efecto "typewriter" y
  // permitiendo que el usuario empiece a leer en 1-3s en vez de esperar la
  // respuesta completa.
  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('question', userText);

      const res = await apiFetch("/chatbot/ask", {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.body) {
        throw new Error("Respuesta no válida del servidor");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulated = "";
      let receivedAny = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;

        const chunkText = decoder.decode(value, { stream: true });
        if (!chunkText) continue;

        accumulated += chunkText;
        receivedAny = true;

        // En cuanto llega el primer fragmento real, quitamos el indicador
        // de "escribiendo..." y creamos/actualizamos el mensaje del bot.
        setIsTyping(false);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          // Mientras estamos en esta pregunta, el último mensaje solo puede
          // ser el 'user' que acabamos de agregar (primer fragmento -> hay
          // que crear el mensaje del bot) o el propio mensaje 'bot' que ya
          // veníamos completando (fragmentos siguientes -> lo reemplazamos).
          if (last?.role === 'bot') {
            return [...prev.slice(0, -1), { role: 'bot', text: accumulated }];
          }
          return [...prev, { role: 'bot', text: accumulated }];
        });
      }

      // Si el stream terminó sin haber mandado ni un fragmento (error
      // silencioso en el backend antes de empezar a generar).
      if (!receivedAny) {
        setMessages(prev => [...prev, { role: 'bot', text: "Lo siento, hubo un error al procesar tu pregunta. 🍎" }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Lo siento, hubo un error al procesar tu pregunta. 🍎" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    
    <RoleGuard modulo="chatbot">
    
    <div className="flex h-full overflow-hidden bg-[#F8FAFC] antialiased">
      {/* --- EL MODAL DE CONFIRMACIÓN --- */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar conocimiento?"
        message="Esta acción eliminará el archivo y todos los vectores de búsqueda asociados en Pinecone. No se puede deshacer."
        confirmText="Eliminar permanentemente"
      />
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="p-8 space-y-10 max-w-[1400px] mx-auto w-full">

          <header>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Entrenamiento del Chatbot</h2>
            <p className="text-sm text-gray-500 font-medium">Gestiona la información que alimenta la inteligencia del asistente virtual. POR AHORA NO SE PUEDEN SUBIR IMÁGENES</p>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.docx" />
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed border-gray-200 rounded-[1.5rem] p-12 flex flex-col items-center justify-center transition-all group ${uploading ? 'cursor-default' : 'cursor-pointer hover:bg-[#701C32]/[0.02]'}`}
                >
                  {uploading ? (
                    <div className="w-full max-w-xs flex flex-col items-center">
                      <div className="bg-white p-5 rounded-2xl shadow-sm mb-4 relative">
                        <Loader2 size={40} className="text-[#701C32] animate-spin" />
                      </div>
                      <p className="text-gray-900 font-black text-sm uppercase text-center mb-1">{uploadStage}</p>
                      <p className="text-[#701C32] text-xs font-black mb-3">{Math.round(uploadProgress)}%</p>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#701C32] h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-400 text-[10px] mt-3 font-bold uppercase text-center">
                        No cierres esta ventana, esto puede tardar unos segundos según el tamaño del archivo
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white p-5 rounded-2xl shadow-sm mb-4">
                        <FileText size={40} className="text-gray-400 group-hover:text-[#701C32]" />
                      </div>
                      <p className="text-gray-900 font-black text-sm uppercase">Subir Nueva Información</p>
                      <p className="text-gray-400 text-[11px] mt-1 font-bold uppercase">PDF, DOCX (Máx. 10MB)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase">Archivo</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase">Fecha</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase">Estado</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {documents.map((doc) => (
                        <KnowledgeRow
                          key={doc.id}
                          doc={doc}
                          onDelete={() => confirmDelete(doc.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm sticky top-8 space-y-8">
                <div className="flex justify-between items-end mb-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase">Capacidad</p>
                  <p className="text-sm font-black text-gray-900">{documents.length} / 5</p>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-[#701C32] h-full transition-all duration-500" style={{ width: `${(documents.length / 5) * 100}%` }}></div>
                </div>

                {/* BOTÓN PARA ABRIR CHAT */}
                <button
                  onClick={() => setShowTestChat(true)}
                  className="w-full bg-[#701C32] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#701C32]/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <PlayCircle size={16} /> Probar Chatbot
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* --- MODAL DE CHAT DE PRUEBA --- */}
      {showTestChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-right duration-500">

            <div className="p-6 bg-[#701C32] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Bot size={20} className="text-blue-200" />
                <h3 className="text-xs font-black uppercase tracking-widest">Amancio IA</h3>
              </div>
              <button onClick={() => setShowTestChat(false)} className="hover:bg-white/10 p-1 rounded-full transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-30">
                  <MessageSquare size={32} />
                  <p className="text-[10px] font-black uppercase">Haz una pregunta sobre tus documentos cargando</p>
                </div>
              )}
              {messages.map((msg, i) => (
  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
      msg.role === 'user' 
        ? 'bg-[#093E7A] text-white rounded-tr-none' 
        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none prose prose-sm max-w-none'
    }`}>
      {msg.role === 'user' ? (
        msg.text
      ) : (
        <ReactMarkdown
          components={{
            // Formatea listas con viñetas limpias
            ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="my-0.5">{children}</li>,
            // Párrafos con separación fluida
            p: ({ children }) => <p className="my-1.5 leading-normal">{children}</p>,
            // Negritas sutiles
            strong: ({ children }) => <strong className="font-black text-gray-900">{children}</strong>,
          }}
        >
          {msg.text}
        </ReactMarkdown>
      )}
    </div>
  </div>
))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleAsk} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregunta algo..."
                className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-[#701C32]/10"
              />
              <button type="submit" disabled={isTyping} className="bg-[#701C32] text-white p-3 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}

function KnowledgeRow({ doc, onDelete }: { doc: Chatbot, onDelete: () => void }) {
  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white transition-all">
            {doc.file_type === 'pdf' ? <FileText className="text-red-500" size={18} /> : <FileText className="text-blue-500" size={18} />}
          </div>
          <span className="text-sm font-black text-gray-900 truncate max-w-[200px]">{doc.filename}</span>
        </div>
      </td>
      <td className="px-8 py-6 text-xs font-bold text-gray-500 uppercase">{new Date(doc.fecha_creacion).toLocaleDateString()}</td>
      <td className="px-8 py-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={12} /> {doc.status}
        </span>
      </td>
      <td className="px-8 py-6 text-right">
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
      </td>
    </tr>
  );
}