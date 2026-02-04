import { Edit3, Trash2, Calendar, FileText, Youtube, Facebook,EyeOff,CheckCircle2 } from 'lucide-react';
import { NoticiaResponse } from "@/src/interfaces/noticia";
import { useState } from 'react';
import { getYouTubeID } from "@/src/components/utils/youtube";
import Link from 'next/link';
import { ConfirmModal } from '../utils/ConfirmModal';
interface NoticiaRowProps {
    noticia: NoticiaResponse;
}
import { toast } from 'sonner';

export const NoticiaRow = ({ noticia }: NoticiaRowProps) => {
   const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 
const handleToggleStatus = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/${noticia.id_noticia}`, {
                method: 'DELETE', // Tu endpoint usa @router.delete
            });

            if (response.ok) {
                toast.success(noticia.activo ? "Noticia desactivada" : "Noticia activada");
                window.location.reload();
            } else {
                toast.error("Error al cambiar el estado de la noticia");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Error de conexión con el servidor");
        } finally {
            setIsLoading(false);
            setIsModalOpen(false);
        }
    };
    // 1. Lógica extendida para tipos de contenido
    const isVideo = noticia.categoria === "video";
    const isFacebook = noticia.categoria === "facebook"; 
    const isArticulo = noticia.categoria === "texto";

    const videoId = isVideo ? getYouTubeID(noticia.imagen_portada_url || "") : null;

    // 2. Ajuste de la imagen de previsualización
    let previewImg = noticia.imagen_portada_url;
    
    if (isVideo) {
        previewImg = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    } else if (isFacebook) {
        // Como Facebook no da miniatura directa por URL, usamos un placeholder 
        // o un icono. Por ahora, el placeholder.
        previewImg = '/placeholder-facebook.jpg'; 
    }

    const fecha = new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });

    return (
        <tr className={`hover:bg-gray-50/50 transition-colors group ${!noticia.activo ? 'opacity-60 bg-gray-50/30' : ''}`}>
            {/* PORTADA Y TÍTULO */}
            <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <div
                            className="w-16 h-10 rounded-lg bg-gray-200 border border-gray-100 shadow-sm bg-cover bg-center overflow-hidden flex items-center justify-center"
                            style={{ backgroundImage: isFacebook ? 'none' : `url('${previewImg || '/placeholder-news.jpg'}')` }}
                        >
                            {/* Icono superpuesto para Video */}
                            {isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Youtube size={16} className="text-white" />
                                </div>
                            )}
                            {/* Icono central para Facebook (ya que no hay miniatura) */}
                            {isFacebook && (
                                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                                    <Facebook size={18} className="text-white" />
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

            {/* CATEGORÍA / TIPO - Ajustado con Switch o Condicional múltiple */}
            <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                    {isVideo && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700">
                            <Youtube size={12} /> Video
                        </span>
                    )}
                    

                    {isArticulo && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-50 text-gray-700">
                            <FileText size={12} /> Artículo
                        </span>
                    )}
                </div>
            </td>

            {/* ... Resto del componente igual (Fecha, Estado, Acciones) ... */}
            <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm font-medium">{fecha}</span>
                </div>
            </td>
            <td className="px-6 py-5 text-center">
                {noticia.activo ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700">
                        <CheckCircle2 size={12} /> Publicado
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700">
                        <EyeOff size={12} /> Oculto
                    </span>
                )}
            </td>
            <td className="px-8 py-5 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link 
        href={`/campus/panel-control/pagina-web/noticias-web/editar/${noticia.id_noticia}`}
        className="p-2 text-gray-400 hover:text-[#093E7A] rounded-xl transition-all"
    >
        <Edit3 size={18} />
    </Link>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        disabled={isLoading}
                        className={`p-2 rounded-xl transition-all ${noticia.activo ? 'text-gray-400 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-700'}`}
                        title={noticia.activo ? "Ocultar noticia" : "Mostrar noticia"}
                    >
                        {noticia.activo ? <Trash2 size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                </div>
                {/* MODAL DE CONFIRMACIÓN */}
                <ConfirmModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleToggleStatus}
                    title={noticia.activo ? "Desactivar Noticia" : "Activar Noticia"}
                    message={`¿Estás seguro de que deseas ${noticia.activo ? 'ocultar' : 'mostrar'} la noticia: "${noticia.titulo}"?`}
                    confirmText={noticia.activo ? "Desactivar" : "Activar"}
                />
            </td>
        </tr>
    );
};