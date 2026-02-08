"use client";
import { useState, useRef, useEffect } from "react";
import { Camera, X } from "lucide-react";

interface ImageUploadProps {
  label: string;
  onImageChange: (file: File | null) => void;
  initialImage?: string| null; 
}

export default function ImageUpload({ label, onImageChange, initialImage }: ImageUploadProps) {
  // Inicializamos con lo que venga, pero necesitamos el useEffect abajo
  const [preview, setPreview] = useState<string | null>(initialImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AGREGA ESTE EFECTO ---
  // Esto hace que si la noticia carga después (API), la imagen aparezca
  useEffect(() => {
    if (initialImage) {
      setPreview(initialImage);
    }
  }, [initialImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("El archivo es muy pesado (máximo 2MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
        {label}
      </h3>
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative border-2 border-dashed border-gray-200 rounded-2xl h-48 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/50 hover:border-[#093E7A]/20 transition-all cursor-pointer overflow-hidden group"
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="text-white" size={32} />
            </div>
            <button
              type="button" // Importante: especificar type="button" para que no haga submit al formulario
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg z-10"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Camera size={28} className="text-gray-400 group-hover:text-[#093E7A]" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subir Imagen</p>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
}