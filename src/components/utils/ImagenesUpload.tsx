"use client";

/**
 * Subida de imágenes para una noticia. Sin tope: se pueden añadir todas las
 * que haga falta.
 *
 * El orden importa y es el de subida: la primera es la portada (la que sale
 * en el listado y en el inicio) y las demás van detrás en la galería. Por eso
 * se puede quitar una, pero lo que queda no se reordena solo.
 *
 * Convive con las noticias antiguas, que traen una sola URL: llegan por
 * `initialImages` como lista de un elemento y se editan igual que el resto.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, X, Plus } from "lucide-react";
import { toast } from "sonner";

/** Imagen ya subida (viene de la noticia) o recién elegida (aún sin subir). */
export interface ImagenElegida {
  /** Lo que se pinta: la URL de Cloudinary o la del archivo local. */
  preview: string;
  /** Solo en las nuevas. Las que ya estaban en la noticia no traen archivo. */
  file: File | null;
  /** Solo en las que ya estaban: su URL definitiva. */
  url: string | null;
}

interface Props {
  label: string;
  initialImages?: string[];
  onChange: (imagenes: ImagenElegida[]) => void;
}

const PESO_MAXIMO = 2 * 1024 * 1024;   // 2 MB por imagen, como antes

/**
 * Aviso de cortesía cuando la galería se va de las manos. No impide nada: solo
 * recuerda que la página de la noticia va a quedar larguísima.
 */
const MUCHAS = 30;

export default function ImagenesUpload({ label, initialImages, onChange }: Props) {
  const [imagenes, setImagenes] = useState<ImagenElegida[]>([]);
  const entrada = useRef<HTMLInputElement>(null);
  // Las de la noticia solo se cargan una vez. Sin esto, cualquier repintado
  // del formulario borraría las fotos que se acaban de añadir.
  const yaCargadas = useRef(false);
  // Las vistas previas locales son URLs de objeto, no data: en base64. Pesan
  // lo que el archivo en vez de un tercio más y no hay que leerlo entero en
  // memoria, que con muchas fotos a la vez se notaba. A cambio hay que
  // devolverlas al navegador a mano: si no, se quedan retenidas.
  const objetos = useRef<string[]>([]);

  const soltar = useCallback((url: string) => {
    if (!url.startsWith("blob:")) return;
    URL.revokeObjectURL(url);
    objetos.current = objetos.current.filter((u) => u !== url);
  }, []);

  useEffect(() => {
    if (yaCargadas.current || !initialImages?.length) return;
    yaCargadas.current = true;
    const iniciales = initialImages
      .filter(Boolean)
      .map((url) => ({ preview: url, file: null, url }));
    setImagenes(iniciales);
    onChange(iniciales);
  }, [initialImages, onChange]);

  // Al salir del formulario se sueltan todas las que queden vivas.
  useEffect(() => () => {
    objetos.current.forEach((u) => URL.revokeObjectURL(u));
    objetos.current = [];
  }, []);

  const actualizar = (nuevas: ImagenElegida[]) => {
    setImagenes(nuevas);
    onChange(nuevas);
  };

  const elegir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? []);
    // Pase lo que pase hay que vaciar el input: si no, volver a elegir el
    // mismo archivo no dispara el evento y parece que la subida no funciona.
    if (entrada.current) entrada.current.value = "";
    if (!archivos.length) return;

    const pesadas = archivos.filter((f) => f.size > PESO_MAXIMO);
    if (pesadas.length) {
      const nombres = pesadas.slice(0, 3).map((f) => f.name).join(", ");
      toast.warning(
        pesadas.length === 1
          ? `"${nombres}" pesa más de 2 MB y no se puede subir`
          : `${pesadas.length} imágenes pesan más de 2 MB y no se pueden subir` +
            ` (${nombres}${pesadas.length > 3 ? "…" : ""})`
      );
    }

    const aceptados = archivos.filter((f) => f.size <= PESO_MAXIMO);
    if (!aceptados.length) return;

    const nuevas = aceptados.map((file) => {
      const preview = URL.createObjectURL(file);
      objetos.current.push(preview);
      return { preview, file, url: null };
    });

    const total = imagenes.length + nuevas.length;
    if (total > MUCHAS && imagenes.length <= MUCHAS) {
      toast.info(`Llevas ${total} imágenes. Se subirán todas, pero la noticia ` +
                 `quedará muy larga para quien la lea.`);
    }
    actualizar([...imagenes, ...nuevas]);
  };

  const quitar = (i: number) => {
    soltar(imagenes[i].preview);
    actualizar(imagenes.filter((_, j) => j !== i));
  };

  return (
    <div className="space-y-3">
      <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
        {label}
        <span className="text-[10px] font-bold text-gray-400 normal-case tracking-normal">
          {imagenes.length === 1 ? "1 imagen" : `${imagenes.length} imágenes`}
        </span>
      </h3>

      {imagenes.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {imagenes.map((img, i) => (
            <div key={img.preview}
                 className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] bg-gray-100 group">
              {/* object-cover: la miniatura se ve igual que en la noticia,
                  ocupando el recuadro entero. */}
              <img src={img.preview} alt={`Imagen ${i + 1}`}
                   loading="lazy" decoding="async"
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
        onClick={() => entrada.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden border-gray-200 bg-gray-50/50 hover:bg-blue-50/50 hover:border-[#093E7A]/20 cursor-pointer group ${
          imagenes.length ? "h-24" : "h-48"}`}
      >
        <div className="flex flex-col items-center">
          <div className={`bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${
            imagenes.length ? "w-9 h-9 mb-2" : "w-14 h-14 mb-4"}`}>
            {imagenes.length
              ? <Plus size={18} className="text-gray-400 group-hover:text-[#093E7A]" />
              : <Camera size={28} className="text-gray-400 group-hover:text-[#093E7A]" />}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-center">
            {imagenes.length ? "Añadir más imágenes" : "Subir imágenes"}
          </p>
        </div>
        <input type="file" ref={entrada} onChange={elegir} accept="image/*"
               multiple className="hidden" />
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        Puedes subir todas las que quieras, de hasta 2 MB cada una. Se muestran
        en el orden en que las subes y todas del mismo tamaño. La primera es la
        portada: es la que sale en el listado de noticias y en la página de inicio.
      </p>
    </div>
  );
}
