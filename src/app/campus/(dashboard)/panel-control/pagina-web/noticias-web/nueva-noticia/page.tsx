"use client";
import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import Link from "next/link";
import {
  ArrowLeft, Save, Send, Bold, Italic, Underline,
  List, ListOrdered, Quote, Settings, Youtube,
  Info, CheckCircle2, AlertCircle, Facebook
} from "lucide-react";
import ImageUpload from "@/src/components/utils/ImageUpload";
import { getYouTubeID } from "@/src/components/utils/youtube";
import { NoticiaCreate } from "@/src/interfaces/noticia";
import { uploadToCloudinary } from "@/src/components/utils/cloudinary";
import { useForm } from "@/src/hooks/useForm";
import { toast } from 'sonner';

export default function CrearNoticiaPage() {
  const { formData, handleChange, setFormData, resetForm } = useForm({
    titulo: "",
    tipoContenido: "texto",
    videoUrl: "",
    categoria: "General"
  });

  const [portada, setPortada] = useState<File | null>(null);
  const { titulo, tipoContenido, videoUrl } = formData;
  const [loading, setLoading] = useState(false);
  // Obtener el ID del video de YouTube (si es aplicable)
  const videoId = getYouTubeID(videoUrl);


  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: true,
        orderedList: true,
      }),
      UnderlineExtension,
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        // Añadimos 'prose' para que Tailwind estilice automáticamente las listas y citas
        class: 'prose prose-blue max-w-none focus:outline-none min-h-[500px] p-8 text-gray-700 leading-relaxed',
      },
    },
  });

  // Si el editor no está listo, no renderizamos nada para evitar errores de SSR
  if (!editor) return null;

  const handlePublicar = async () => {
    // 1. Validaciones iniciales rápidas
    if (!formData.titulo) return toast.warning("El título es obligatorio");
    if (formData.tipoContenido === "video" && !videoId) return toast.warning("La URL de YouTube no es válida");
    if (formData.tipoContenido === "facebook" && !formData.videoUrl.includes("facebook.com")) {
      return toast.warning("La URL de Facebook no es válida");
    }
    if (formData.tipoContenido === "texto" && !portada) return toast.warning("Debes subir una imagen de portada");

    setLoading(true);
    // Iniciamos la notificación de carga
    const toastId = toast.loading("Publicando noticia en el servidor...");

    try {
      let valorAlmacenadoEnPortada = "";

      // 2. Lógica de imagen o video
      if (formData.tipoContenido === "video") {
        valorAlmacenadoEnPortada = formData.videoUrl;
      }
      else if (formData.tipoContenido === "facebook") {
        // Guardamos el link de FB directamente en el campo de portada
        valorAlmacenadoEnPortada = formData.videoUrl;
      }
      else {
        if (portada) {
          const url = await uploadToCloudinary(portada);
          if (!url) throw new Error("Error al subir la imagen");
          valorAlmacenadoEnPortada = url;
        }
      }

      // 3. Preparar el Payload
      const noticiaPayload: NoticiaCreate = {
        titulo: formData.titulo,
        id_autor: 1, // ID del usuario real
        categoria: formData.tipoContenido,
        contenido: editor?.getHTML() || "",
        imagen_portada_url: valorAlmacenadoEnPortada,
      };

      // 4. Petición a FastAPI
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noticiaPayload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.detail;
        const message = Array.isArray(errorMsg) ? errorMsg[0].msg : errorMsg;
        throw new Error(message || "Error al registrar la noticia");
      }

      // 5. ÉXITO
      toast.success("¡Noticia publicada exitosamente!", { id: toastId });

      // Opcional: Limpiar el formulario tras el éxito
      resetForm();
      setPortada(null);
      editor?.commands.setContent("");

    } catch (error: any) {
      // 6. ERROR
      toast.error(error.message || "Ocurrió un error inesperado", { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#F6F7F8]">
      <div className="flex h-screen overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Header Superior */}
          <header className="h-20 border-b flex items-center justify-between px-8 bg-white shrink-0">
            <div className="flex items-center gap-5">
              <Link
                href="/campus/panel-control/pagina-web/noticias-web"
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#701C32] transition-all"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Crear Nueva Noticia</h2>

              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
            <div className="max-w-6xl mx-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                <div className="lg:col-span-2 space-y-8">
                  {/* Título Input */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Título de la Noticia</label>
                    <input
                      name="titulo"
                      value={formData.titulo}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-200 rounded-2xl py-5 px-6 text-2xl font-black text-gray-900 focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] outline-none transition-all placeholder:text-gray-200"
                      placeholder="Escribe un título impactante..."
                      type="text"
                    />
                  </div>

                  {/* Editor de Texto */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Contenido</label>
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-[#093E7A]/5 transition-all">

                      {/* Barra de Herramientas */}
                      <div className="bg-gray-50/80 border-b border-gray-100 p-3 flex flex-wrap gap-1">
                        <EditorButton
                          onClick={() => editor.chain().focus().toggleBold().run()}
                          active={editor.isActive('bold')}
                          icon={<Bold size={18} />}
                          title="Negrita"
                        />
                        <EditorButton
                          onClick={() => editor.chain().focus().toggleItalic().run()}
                          active={editor.isActive('italic')}
                          icon={<Italic size={18} />}
                          title="Cursiva"
                        />
                        <EditorButton
                          onClick={() => editor.chain().focus().toggleUnderline().run()}
                          active={editor.isActive('underline')}
                          icon={<Underline size={18} />}
                          title="Subrayado"
                        />
                        <div className="w-px h-6 bg-gray-200 mx-2 self-center"></div>
                        <EditorButton
                          onClick={() => editor.chain().focus().toggleBulletList().run()}
                          active={editor.isActive('bulletList')}
                          icon={<List size={18} />}
                          title="Lista con viñetas"
                        />
                        <EditorButton
                          onClick={() => editor.chain().focus().toggleOrderedList().run()}
                          active={editor.isActive('orderedList')}
                          icon={<ListOrdered size={18} />}
                          title="Lista numerada"
                        />
                        <div className="w-px h-6 bg-gray-200 mx-2 self-center"></div>
                        <EditorButton
                          onClick={() => editor.chain().focus().toggleBlockquote().run()}
                          active={editor.isActive('blockquote')}
                          icon={<Quote size={18} />}
                          title="Cita"
                        />
                      </div>

                      {/* Editor real con estilos para listas */}
                      <div className="editor-container">
                        <EditorContent editor={editor} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar (Configuración y Portada) */}
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Settings size={18} className="text-[#093E7A]" /> Configuración
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Contenido</label>
                        {/* 3. Conectamos el select al estado */}
                        <select
                          name="tipoContenido"
                          value={formData.tipoContenido} // <-- AGREGAR ESTO
                          onChange={handleChange}
                          className="w-full bg-gray-50 border-gray-200 rounded-xl py-2.5 text-sm font-bold text-gray-700 focus:ring-[#093E7A] transition-all"
                        >
                          <option value="texto">Artículo de Texto</option>
                          <option value="video">Video de YouTube</option>
                          <option value="facebook">Facebook</option>
                        </select>
                      </div>

                      {/* CASO A: Si es VIDEO de YouTube */}
                      {tipoContenido === 'video' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">URL de YouTube</label>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors">
                              <Youtube size={18} />
                            </div>
                            <input
                              name="videoUrl"
                              value={formData.videoUrl}
                              onChange={handleChange}
                              className="w-full bg-gray-50 border-gray-200 border rounded-xl pl-10 py-2.5 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium"
                              placeholder="https://youtube.com/watch?v=..."
                              type="text"
                            />
                            {videoUrl && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {videoId ? (
                                  <CheckCircle2 size={18} className="text-green-500" />
                                ) : (
                                  <AlertCircle size={18} className="text-red-400" />
                                )}
                              </div>
                            )}
                          </div>
                          {/* Miniatura de YouTube */}
                          {videoId && (
                            <div className="mt-4 relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-black shadow-sm">
                              <img
                                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                className="w-full h-full object-cover opacity-80"
                                alt="Preview"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
                                  <div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white ml-1" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* CASO B: Si es FACEBOOK */}
                      {tipoContenido === 'facebook' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Link de Facebook</label>
                          <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors">
                              <Facebook size={18} />
                            </div>
                            <input
                              name="videoUrl"
                              value={formData.videoUrl}
                              onChange={handleChange}
                              className="w-full bg-gray-50 border-gray-200 border rounded-xl pl-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                              placeholder="https://facebook.com/nombredepage/posts/..."
                              type="text"
                            />
                          </div>
                          <p className="text-[10px] text-blue-600 font-bold flex items-center gap-1 mt-1">
                            <Info size={12} /> Se mostrará el post interactivo
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CASO C: Si es TEXTO (Muestra la subida de imagen de portada) */}
                  {tipoContenido === 'texto' && (
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                      <ImageUpload
                        label="Portada del Artículo"
                        onImageChange={(file) => setPortada(file)}
                      />
                      <p className="text-[10px] text-gray-400 mt-3 font-medium text-center italic">
                        Sube una imagen atractiva para el listado de noticias.
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                    <Info className="absolute -right-2 -bottom-2 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                      <p className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">Publicación</p>
                      <p className="text-sm font-bold leading-relaxed">
                        Al publicar, la noticia aparecerá automáticamente en el apartado de noticias de la página
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <footer className="h-24 border-t bg-white px-8 flex items-center justify-between shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            
            <div className="flex items-center gap-4">
              <button
                onClick={handlePublicar} // <-- CAMBIAR AQUÍ (antes decía onClick={() => console.log(...)})
                disabled={loading}       // <-- AGREGAR ESTO para evitar múltiples clics
                className="..."
              >
                <Send size={20} />
                {loading ? "Publicando..." : "Publicar Noticia"}
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* Estilos locales para asegurar que las listas se vean */}
      <style jsx global>{`
        .prose ul { list-style-type: disc !important; padding-left: 1.5em !important; }
        .prose ol { list-style-type: decimal !important; padding-left: 1.5em !important; }
        .prose blockquote { border-left: 4px solid #093E7A !important; padding-left: 1em !important; font-style: italic !important; }
      `}</style>
    </div>
  );
}

function EditorButton({
  icon,
  title,
  onClick,
  active
}: {
  icon: React.ReactNode;
  title?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
      }}
      className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center ${active
        ? "bg-[#093E7A] text-white shadow-md scale-105"
        : "text-gray-400 hover:text-[#093E7A] hover:bg-white border border-transparent hover:border-gray-100"
        }`}
    >
      {icon}
    </button>
  );
}