"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NoticiaResponse } from "@/src/interfaces/noticia";
import { getYouTubeID, imagenesDeNoticia } from "@/src/components/utils/youtube";
import { sanitizarHtml } from "@/src/components/utils/html";
import { formatearFechaLarga } from "@/src/components/utils/fecha";
import { Calendar, Tag, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DetalleNoticiaPage() {
    const { id } = useParams();
    const [noticia, setNoticia] = useState<NoticiaResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNoticia = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/${id}`);
                if (!response.ok) {
                    setNoticia(null);
                    return;
                }
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#701C32]" size={40} />
        </div>
    );
    if (!noticia) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
            <p className="text-slate-500 font-medium">Noticia no encontrada.</p>
            <Link href="/noticias" className="text-[#093E7A] font-bold hover:text-[#701C32] transition-colors">
                Volver a noticias
            </Link>
        </div>
    );

    const videoId = noticia.categoria === "video" ? getYouTubeID(noticia.imagen_portada_url || "") : null;
    const galeria = imagenesDeNoticia(noticia);

    return (
        <div className="bg-white">
            <div className="min-h-screen pb-20">
                {/* Header de la Noticia */}
                <div className="bg-slate-50 border-b border-slate-100 py-10 md:py-12 mb-10 md:mb-12">
                    <div className="max-w-4xl mx-auto px-4">
                        <Link
                            href="/noticias"
                            className="flex items-center gap-2 text-[#093E7A] font-bold text-sm mb-6 md:mb-8 hover:gap-3 transition-all w-fit"
                        >
                            <ArrowLeft size={20} /> Volver a noticias
                        </Link>

                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${noticia.categoria === 'video' ? 'bg-red-100 text-red-700' : 'bg-[#FFF1E3] text-[#701C32]'
                                }`}>
                                {noticia.categoria}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400 text-sm font-medium">
                                <Calendar size={14} />
                                {formatearFechaLarga(noticia.fecha_publicacion)}
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-[#701C32] leading-[1.08] mb-8">
                            {noticia.titulo}
                        </h1>

                        <div className="flex items-center gap-4 border-t border-slate-200 pt-6 md:pt-8">
                            <div className="w-12 h-12 rounded-full bg-[#093E7A] flex items-center justify-center text-white font-bold shrink-0">
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
                    {/* Visual principal: el video, o la galería de la noticia. */}
                    {noticia.categoria === "video" && videoId ? (
                        <div className="mb-10 md:mb-12 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="aspect-video w-full">
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={noticia.titulo}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-10 md:mb-12 space-y-5">
                            {/* Todas las fotos van a lo ancho, de la primera a la
                                última. Antes la portada iba a lo ancho y el resto
                                en una rejilla de dos o tres columnas, así que de la
                                segunda en adelante se veían a la mitad de tamaño.

                                El recuadro no impone proporción: toma el alto que le
                                dé cada foto. Así se ve entera, sin recortar, venga
                                apaisada, cuadrada o vertical. */}
                            {(galeria.length ? galeria : ["/placeholder-news.svg"]).map((url, i) => (
                                <div key={`${url}-${i}`}
                                     className="rounded-3xl overflow-hidden shadow-2xl bg-slate-100 w-full">
                                    <img
                                        src={url}
                                        alt={i === 0 ? noticia.titulo
                                                     : `${noticia.titulo} — imagen ${i + 1}`}
                                        /* La portada entra con la página; las demás,
                                           solo si el lector baja hasta ellas. Con
                                           galerías largas es la diferencia entre
                                           abrir la noticia al momento o esperar. */
                                        loading={i === 0 ? "eager" : "lazy"}
                                        decoding={i === 0 ? "sync" : "async"}
                                        fetchPriority={i === 0 ? "high" : "low"}
                                        className="w-full h-auto block"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CONTENIDO DEL EDITOR (TIPTAP) — sanitizado */}
                    <div className="prose prose-base md:prose-lg prose-slate max-w-none
            prose-headings:text-[#701C32] prose-headings:font-black
            prose-p:text-slate-600 prose-p:leading-relaxed
            prose-strong:text-slate-900
            prose-img:rounded-2xl
            prose-blockquote:border-l-[#093E7A] prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg
            prose-li:marker:text-[#093E7A]
            mb-16"
                        dangerouslySetInnerHTML={{ __html: sanitizarHtml(noticia.contenido) }}
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
            </div>
        </div>
    );
}
