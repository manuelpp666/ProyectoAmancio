"use client";
import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import {
    Save, Send, Bold, Italic, Underline,
    List, ListOrdered, Quote, Settings, Youtube,
    Info, CheckCircle2, AlertCircle, XCircle
} from "lucide-react";
import { Noticia, NoticiaCreate } from "@/src/interfaces/noticia";
import { useForm } from "@/src/hooks/useForm";
import ImageUpload from "@/src/components/utils/ImageUpload";
import { uploadToCloudinary } from "@/src/components/utils/cloudinary";
import { getYouTubeID } from "@/src/components/utils/youtube";
import { toast } from 'sonner';

interface NoticiaFormProps {
    initialData?: Noticia;
    onSubmit: (data: NoticiaCreate) => Promise<void>;
    loading: boolean; // Usaremos esta prop que viene del padre
}

export function NoticiaForm({ initialData, onSubmit, loading }: NoticiaFormProps) {
    // 1. Estado local para archivos y carga de imagen
    const [portada, setPortada] = useState<File | null>(null);
    const [isuploading, setIsUploading] = useState(false);

    // 2. Inicializar form con useForm
    const { formData, handleChange, setFormData, resetForm } = useForm({
        titulo: initialData?.titulo || "",
        tipoContenido: initialData?.categoria === "video" ? "video" : "texto",
        videoUrl: (initialData?.categoria === "video" ? initialData.imagen_portada_url : "") || "",
        categoria: "General"
    });

    const { titulo, tipoContenido, videoUrl } = formData;
    const videoId = getYouTubeID(videoUrl);

    // 3. Configurar Editor
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ bulletList: true, orderedList: true }),
            UnderlineExtension,
        ],
        content: initialData?.contenido || '',
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-blue max-w-none focus:outline-none min-h-[500px] p-8 text-gray-700 leading-relaxed',
            },
        },
    });

    // 4. EFECTO: Sincronizar si initialData cambia (Modo Edición)
    useEffect(() => {
        if (initialData) {
            setFormData({
                titulo: initialData.titulo,
                tipoContenido: initialData.categoria === "video" ? "video" : "texto",
                videoUrl: initialData.categoria === "video" ? initialData.imagen_portada_url : "",
                categoria: "General"
            });
            editor?.commands.setContent(initialData.contenido);
        }
    }, [initialData, editor, setFormData]);

    const handleAction = async () => {
        // Validaciones
        if (!titulo) return toast.warning("El título es obligatorio");
        if (tipoContenido === "video" && !videoId) return toast.warning("La URL de YouTube no es válida");
        if (tipoContenido === "texto" && !portada && !initialData?.imagen_portada_url) {
            return toast.warning("Debes subir una imagen de portada");
        }

        setIsUploading(true);
        try {
            let urlFinal = initialData?.imagen_portada_url || "";

            if (tipoContenido === "video") {
                urlFinal = videoUrl;
            } else if (portada) {
                const url = await uploadToCloudinary(portada);
                if (!url) throw new Error("Error al subir la imagen");
                urlFinal = url;
            }

            const noticiaPayload: NoticiaCreate = {
                titulo: titulo,
                id_autor: initialData?.id_autor || 0,
                categoria: tipoContenido,
                contenido: editor?.getHTML() || "",
                imagen_portada_url: urlFinal,
            };

            // EJECUTAR FUNCIÓN DEL PADRE (Crear o Editar)
            await onSubmit(noticiaPayload);
            
            if (!initialData) { // Si es creación, limpiar
                resetForm();
                setPortada(null);
                editor?.commands.setContent("");
            }

        } catch (error: any) {
            toast.error(error.message || "Error al procesar la noticia");
        } finally {
            setIsUploading(false);
        }
    };

    if (!editor) return null;

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
                <div className="max-w-6xl mx-auto p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Título */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Título de la Noticia</label>
                                <input
                                    name="titulo"
                                    value={titulo}
                                    onChange={handleChange}
                                    className="w-full bg-white border border-gray-200 rounded-2xl py-5 px-6 text-2xl font-black text-gray-900 focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] outline-none transition-all"
                                    placeholder="Escribe un título impactante..."
                                    type="text"
                                />
                            </div>

                            {/* Editor */}
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Contenido</label>
                                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50/80 border-b border-gray-100 p-3 flex flex-wrap gap-1">
                                        <EditorButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} icon={<Bold size={18} />} title="Negrita" />
                                        <EditorButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} icon={<Italic size={18} />} title="Cursiva" />
                                        <EditorButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} icon={<Underline size={18} />} title="Subrayado" />
                                        <div className="w-px h-6 bg-gray-200 mx-2 self-center"></div>
                                        <EditorButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} icon={<List size={18} />} title="Lista con viñetas" />
                                        <EditorButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} icon={<ListOrdered size={18} />} title="Lista numerada" />
                                        <div className="w-px h-6 bg-gray-200 mx-2 self-center"></div>
                                        <EditorButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} icon={<Quote size={18} />} title="Cita" />
                                    </div>
                                    <EditorContent editor={editor} />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <Settings size={18} className="text-[#093E7A]" /> Configuración
                                </h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Contenido</label>
                                        <select
                                            name="tipoContenido"
                                            value={tipoContenido}
                                            onChange={handleChange}
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl py-2.5 text-sm font-bold text-gray-700"
                                        >
                                            <option value="texto">Artículo de Texto</option>
                                            <option value="video">Video de YouTube</option>
                                        </select>
                                    </div>

                                    {tipoContenido === 'video' ? (
                                        <div className="space-y-2">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">URL de YouTube</label>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300">
                                                    <Youtube size={18} />
                                                </div>
                                                <input
                                                    name="videoUrl"
                                                    value={videoUrl}
                                                    onChange={handleChange}
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 py-2.5 text-sm"
                                                    placeholder="https://youtube.com/..."
                                                />
                                            </div>
                                            {videoId && (
                                                <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} className="mt-2 rounded-xl border w-full" alt="Preview" />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <ImageUpload
                                                label="Portada del Artículo"
                                                initialImage={initialData?.imagen_portada_url}
                                                onImageChange={(file) => setPortada(file)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl">
                                <p className="text-sm font-bold">
                                    {initialData ? "Estás editando una noticia existente." : "Al publicar, la noticia será visible en la web."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="h-24 border-t bg-white px-8 flex items-center justify-end gap-4 shrink-0 shadow-md">
                <button
                    type="button"
                    className="flex items-center gap-2 px-6 py-3 text-gray-500 font-bold text-xs uppercase"
                    onClick={() => window.history.back()}
                >
                    <XCircle size={18} /> Cancelar
                </button>
                <button
                    onClick={handleAction}
                    disabled={loading || isuploading}
                    className="flex items-center gap-3 px-8 py-4 bg-[#093E7A] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#062d59] disabled:opacity-50 transition-all"
                >
                    <Send size={20} />
                    {loading || isuploading ? "Procesando..." : (initialData ? "Actualizar Noticia" : "Publicar Noticia")}
                </button>
            </footer>

            <style jsx global>{`
                .prose ul { list-style-type: disc !important; padding-left: 1.5em !important; }
                .prose ol { list-style-type: decimal !important; padding-left: 1.5em !important; }
                .prose blockquote { border-left: 4px solid #093E7A !important; padding-left: 1em !important; font-style: italic !important; }
            `}</style>
        </main>
    );
}

// Botón del editor extraído
function EditorButton({ icon, title, onClick, active }: any) {
    return (
        <button
            type="button"
            title={title}
            onClick={(e) => { e.preventDefault(); onClick?.(); }}
            className={`p-2.5 rounded-lg transition-all duration-200 ${active ? "bg-[#093E7A] text-white shadow-md" : "text-gray-400 hover:bg-gray-100"}`}
        >
            {icon}
        </button>
    );
}