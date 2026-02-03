"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Header from "@/src/components/Pagina-Web/Header";
import Footer from "@/src/components/Pagina-Web/Footer";
import { NoticiaResponse } from "@/src/interfaces/noticia";
import { getYouTubeID } from "@/src/components/utils/youtube";
import { Calendar, Tag, ArrowLeft, Share2, Clock } from "lucide-react";
import Link from "next/link";

export default function DetalleNoticiaPage() {
    const { id } = useParams();
    const [noticia, setNoticia] = useState<NoticiaResponse | null>(null);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchNoticia = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/${id}`);
                const data = await response.json();
                setNoticia(data);
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchNoticia();
    }, [id]);

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando noticia...</div>;
    if (!noticia) return <div className="min-h-screen flex items-center justify-center">Noticia no encontrada</div>;

    const videoId = noticia.categoria === "video" ? getYouTubeID(noticia.imagen_portada_url || "") : null;

    return (
        <div className="bg-white">
            <Header />

            <main className="min-h-screen pb-20">
                {/* Header de la Noticia */}
                <div className="bg-slate-50 border-b border-slate-100 py-12 mb-12">
                    <div className="max-w-4xl mx-auto px-4">
                        <Link
                            href="/noticias"
                            className="flex items-center gap-2 text-[#093E7A] font-bold text-sm mb-8 hover:gap-3 transition-all"
                        >
                            <ArrowLeft size={20} /> Volver a noticias
                        </Link>

                        <div className="flex items-center gap-3 mb-6">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${noticia.categoria === 'video' ? 'bg-red-100 text-red-700' : 'bg-[#FFF1E3] text-[#701C32]'
                                }`}>
                                {noticia.categoria}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400 text-sm font-medium">
                                <Calendar size={14} />
                                {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black text-[#701C32] leading-[1.1] mb-8">
                            {noticia.titulo}
                        </h1>

                        <div className="flex items-center gap-4 border-t border-slate-200 pt-8">
                            <div className="w-12 h-12 rounded-full bg-[#093E7A] flex items-center justify-center text-white font-bold">
                                A
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">Prensa Amancista</p>
                                <p className="text-xs text-slate-500">Comunicación Institucional</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4">
                    {/* Visual principal (Imagen o Video) */}
                    <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl">
                        {noticia.categoria === "video" && videoId ? (
                            <div className="aspect-video w-full">
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        ) : (
                            <img
                                src={noticia.imagen_portada_url || "/placeholder.jpg"}
                                alt={noticia.titulo}
                                className="w-full h-auto object-cover max-h-[500px]"
                            />
                        )}
                    </div>

                    {/* CONTENIDO DEL EDITOR (TIPTAP) */}
                    <div className="prose prose-lg prose-slate max-w-none 
            prose-headings:text-[#701C32] prose-headings:font-black
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-strong:text-slate-900
            prose-blockquote:border-l-[#093E7A] prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
            prose-li:marker:text-[#093E7A]
            mb-16"
                        dangerouslySetInnerHTML={{ __html: noticia.contenido }}
                    />

                    {/* Footer de noticia */}
                    <div className="border-t border-slate-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Tag size={18} className="text-slate-400" />
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Etiquetas:</span>
                            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-xs font-bold">Institucional</span>
                        </div>

                        
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}