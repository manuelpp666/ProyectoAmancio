import { Edit3, Trash2, Calendar, FileText, Youtube, ExternalLink } from 'lucide-react';
import { NoticiaResponse } from "@/src/interfaces/noticia";
import Link from 'next/link';
import { useState } from 'react';
import { getYouTubeID } from "@/src/components/utils/youtube";

interface NoticiaRowProps {
    noticia: NoticiaResponse;
}

export const NoticiaRow = ({ noticia }: NoticiaRowProps) => {
    const [isLoading, setIsLoading] = useState(false);

    // Lógica para obtener la imagen de previsualización
    const isVideo = noticia.categoria === "video";
    const videoId = isVideo ? getYouTubeID(noticia.imagen_portada_url || "") : null;
    const previewImg = isVideo 
        ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` 
        : noticia.imagen_portada_url;

    const fecha = new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return (
        <tr className="hover:bg-gray-50/50 transition-colors group">
            {/* PORTADA Y TÍTULO */}
            <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <div
                            className="w-16 h-10 rounded-lg bg-gray-200 border border-gray-100 shadow-sm bg-cover bg-center overflow-hidden"
                            style={{ backgroundImage: `url('${previewImg || '/placeholder-news.jpg'}')` }}
                        >
                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Youtube size={16} className="text-white" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="max-w-xs">
                        <span className="font-bold text-gray-900 block leading-tight truncate">
                            {noticia.titulo}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                            ID: #{noticia.id_noticia}
                        </span>
                    </div>
                </div>
            </td>

            {/* CATEGORÍA / TIPO */}
            <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                    {isVideo ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700">
                            <Youtube size={12} /> Video
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700">
                            <FileText size={12} /> Artículo
                        </span>
                    )}
                </div>
            </td>

            {/* FECHA */}
            <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm font-medium">{fecha}</span>
                </div>
            </td>

            {/* ESTADO */}
            <td className="px-6 py-5 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                    Publicado
                </span>
            </td>

            {/* ACCIONES */}
            <td className="px-8 py-5 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-[#093E7A] rounded-xl transition-all">
                        <Edit3 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-[#701C32] rounded-xl transition-all">
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
};