"use client";

/**
 * Subida de varias imágenes para una noticia.
 *
 * El orden importa y es el de subida: la primera es la portada (la que sale
 * en el listado y en el inicio) y las demás van detrás en la galería. Por eso
 * se puede quitar una, pero lo que queda no se reordena solo.
 *
 * Convive con las noticias antiguas, que traen una sola URL: llegan por
 * `initialImages` como lista de un elemento y se editan igual que el resto.
 */

import { useEffect, useRef, useState } from "react";
import { Camera, X, Plus } from "lucide-react";

/** Imagen ya subida (viene de la noticia) o recién elegida (aún sin subir). */
export interface ImagenElegida {
  /** Lo que se pinta: la URL de Cloudinary o el data: del archivo local. */
  preview: string;
  /** Solo en las nuevas. Las que ya estaban en la noticia no traen archivo. */
  file: File | null;
  /** Solo en las que ya estaban: su URL definitiva. */
  url: string | null;
}

interface Props {
  label: string;
  maximo?: number;
  initialImages?: string[];
  onChange: (imagenes: ImagenElegida[]) => void;
}

const PESO_MAXIMO = 2 * 1024 * 1024;   // 2 MB por imagen, como antes

export default function ImagenesUpload({
  label, maximo = 4, initialImages, onChange,
}: Props) {
  const [imagenes, setImagenes] = useState<ImagenElegida[]>([]);
  const entrada = useRef<HTMLInputElement>(null);
  // Las de la noticia solo se cargan una vez. Sin esto, cualquier repintado
  // del formulario borraría las fotos que se acaban de añadir.
  const yaCargadas = useRef(false);

  useEffect(() => {
    if (yaCargadas.current || !initialImages?.length) return;
    yaCargadas.current = true;
    const iniciales = initialImages
      .filter(Boolean)
      .slice(0, maximo)
      .map((url) => ({ preview: url, file: null, url }));
    setImagenes(iniciales);
    onChange(iniciales);
  }, [initialImages, maximo, onChange]);

  const actualizar = (nuevas: ImagenElegida[]) => {
    setImagenes(nuevas);
    onChange(nuevas);
  };

  const elegir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    if (!archivos.length) return;

    const hueco = maximo - imagenes.length;
    if (hueco <= 0) {
      alert(`Ya tienes ${maximo} imágenes. Quita alguna para poder añadir otra.`);
      return;
    }
    if (archivos.length > hueco) {
      alert(`Solo caben ${maximo} imágenes: se añadirán las ${hueco} primeras.`);
    }

    const pesadas = archivos.filter((f) => f.size > PESO_MAXIMO);
    if (pesadas.length) {
      alert(`Estas imágenes pesan más de 2MB y no se pueden subir:\n` +
            pesadas.map((f) => `· ${f.name}`).join("\n"));
    }

    // Se leen todas a la vez pero se guardan EN EL ORDEN EN QUE SE ELIGIERON,
    // no en el que termine cada lectura, que es aleatorio.
    const aceptados = archivos.filter((f) => f.size <= PESO_MAXIMO).slice(0, hueco);
    if (!aceptados.length) {
      if (entrada.current) entrada.current.value = "";
      return;
    }

    Promise.all(aceptados.map((file) => new Promise<ImagenElegida>((listo) => {
      const lector = new FileReader();
      lector.onloadend = () => listo({
        preview: lector.result as string, file, url: null,
      });
      lector.readAsDataURL(file);
    }))).then((nuevas) => {
      actualizar([...imagenes, ...nuevas]);
      if (entrada.current) entrada.current.value = "";
    });
  };

  const quitar = (i: number) =>
    actualizar(imagenes.filter((_, j) => j !== i));

  const lleno = imagenes.length >= maximo;

  return (
    <div className="space-y-3">
      <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
        {label}
        <span className="text-[10px] font-bold text-gray-400 normal-case tracking-normal">
          {imagenes.length}/{maximo}
        </span>
      </h3>

      {imagenes.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {imagenes.map((img, i) => (
            <div key={`${img.url ?? "nueva"}-${i}`}
                 className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-100 group">
              {/* object-cover: la miniatura se ve igual que en la noticia,
                  ocupando el recuadro entero. */}
              <img src={img.preview} alt={`Imagen ${i + 1}`}
                   className="w-full h-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-black uppercase tracking-wider">
                {i === 0 ? "Portada" : `Foto ${i + 1}`}
              </span>
              <button type="button" onClick={() => quitar(i)}
                      title="Quitar esta imagen"
                      className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => { if (!lleno) entrada.current?.click(); }}
        className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden ${
          imagenes.length ? "h-24" : "h-48"} ${
          lleno
            ? "border-gray-200 bg-gray-50 cursor-not-allowed"
            : "border-gray-200 bg-gray-50/50 hover:bg-blue-50/50 hover:border-[#093E7A]/20 cursor-pointer group"}`}
      >
        {lleno ? (
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-center">
            Ya tienes las {maximo} imágenes
          </p>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
              imagenes.length ? "w-9 h-9 mb-2" : "w-14 h-14 mb-4"}`}>
              {imagenes.length
                ? <Plus size={18} className="text-gray-400 group-hover:text-[#093E7A]" />
                : <Camera size={28} className="text-gray-400 group-hover:text-[#093E7A]" />}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-center">
              {imagenes.length ? "Añadir otra imagen" : `Subir imágenes (hasta ${maximo})`}
            </p>
          </div>
        )}
        <input type="file" ref={entrada} onChange={elegir} accept="image/*"
               multiple className="hidden" />
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Se muestran en el orden en que las subes. La primera es la portada: es la
        que sale en el listado de noticias y en la página de inicio.
      </p>
    </div>
  );
}
