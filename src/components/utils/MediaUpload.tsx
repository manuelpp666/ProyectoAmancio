"use client";
import { useState, useRef, useEffect } from "react";
import { Camera, X, Film } from "lucide-react";
import { esVideo } from "@/src/components/utils/media";

interface MediaUploadProps {
  label: string;
  onMediaChange: (file: File | null) => void;
  initialMedia?: string | null;
  // Límite en MB (imágenes pesan poco; los videos algo más)
  maxImageMB?: number;
  maxVideoMB?: number;
}

// Uploader que acepta una IMAGEN o un VIDEO. Muestra vista previa acorde
// al tipo. Pensado para fondos que pueden ser un clip en bucle.
export default function MediaUpload({
  label,
  onMediaChange,
  initialMedia,
  maxImageMB = 2,
  maxVideoMB = 20,
}: MediaUploadProps) {
  const [preview, setPreview] = useState<string | null>(initialMedia || null);
  const [tipoVideo, setTipoVideo] = useState<boolean>(esVideo(initialMedia));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialMedia) {
      setPreview(initialMedia);
      setTipoVideo(esVideo(initialMedia));
    }
  }, [initialMedia]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const esVid = file.type.startsWith("video/");
    const limiteMB = esVid ? maxVideoMB : maxImageMB;
    if (file.size > limiteMB * 1024 * 1024) {
      alert(`El archivo es muy pesado (máximo ${limiteMB}MB para ${esVid ? "video" : "imagen"})`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setTipoVideo(esVid);
    // Para video usamos un object URL (los data URL de video son enormes)
    setPreview(esVid ? URL.createObjectURL(file) : URL.createObjectURL(file));
    onMediaChange(file);
  };

  const removeMedia = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setTipoVideo(false);
    onMediaChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
        {label}
      </h3>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-gray-200 rounded-2xl h-56 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/50 hover:border-[#093E7A]/20 transition-all cursor-pointer overflow-hidden group"
      >
        {preview ? (
          <>
            {tipoVideo ? (
              <video
                src={preview}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white" size={32} />
            </div>
            {tipoVideo && (
              <span className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg z-10">
                <Film size={12} /> Video en bucle
              </span>
            )}
            <button
              type="button"
              onClick={removeMedia}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg z-10"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-center px-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Camera size={28} className="text-gray-400 group-hover:text-[#093E7A]" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Subir Imagen o Video
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Imagen hasta {maxImageMB}MB · Video hasta {maxVideoMB}MB (se reproduce en bucle)
            </p>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,video/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
