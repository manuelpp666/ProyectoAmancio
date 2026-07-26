"use client";
import { useState, useMemo, useEffect } from "react";
import { NoticiaResponse } from "@/src/interfaces/noticia";
import { getNoticiaImagen } from "@/src/components/utils/youtube";
import { formatearFechaCorta } from "@/src/components/utils/fecha";
import Link from "next/link";
import { Search, ArrowRight, PlayCircle } from "lucide-react";
import type { ConfigItem } from "@/src/hooks/useConfiguracion";

const POR_PAGINA = 9;

export default function NoticiasClient({
  noticias,
  config,
}: {
  noticias: NoticiaResponse[];
  config: ConfigItem[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [visibles, setVisibles] = useState(POR_PAGINA);

  const getVal = (clave: string, defecto: string) =>
    config.find(i => i.clave === clave)?.valor?.trim() || defecto;

  const noticiasFiltradas = useMemo(
    () => noticias.filter(n => n.titulo.toLowerCase().includes(busqueda.toLowerCase())),
    [noticias, busqueda]
  );

  useEffect(() => { setVisibles(POR_PAGINA); }, [busqueda]);

  const noticiasMostradas = noticiasFiltradas.slice(0, visibles);

  return (
    <div className="bg-white text-slate-800">
      {/* Banner con degradado de marca */}
      <section className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-br from-[#701C32] via-[#701C32] to-[#093E7A]">
        <div className="absolute -top-16 -right-16 w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-24 -left-10 w-80 h-80 md:w-96 md:h-96 bg-[#093E7A]/40 rounded-full blur-3xl z-0"></div>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-full mb-5">
            <span className="material-symbols-outlined text-base">campaign</span>
            Actualidad
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-lg">{getVal('noticias_titulo', 'Noticias Amancistas')}</h1>
          <div className="w-24 h-1.5 bg-white/80 mx-auto rounded-full mb-5"></div>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">{getVal('noticias_subtitulo', 'Mantente al día con los comunicados, logros y actividades de nuestra comunidad.')}</p>
          <div className="max-w-2xl mx-auto relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093E7A] transition-colors" size={20} />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-full border border-white/20 bg-white focus:ring-2 focus:ring-white/40 focus:border-transparent outline-none transition-all shadow-lg"
              placeholder="Buscar noticias..."
              type="text"
              aria-label="Buscar noticias"
            />
          </div>
        </div>
      </section>

      <div className="py-12 md:py-16 px-4 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {noticiasMostradas.map((noticia) => (
              <article
                key={noticia.id_noticia}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100 flex flex-col"
              >
                <div className="relative h-60 overflow-hidden group">
                  <img
                    alt={noticia.titulo}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    src={getNoticiaImagen(noticia)}
                  />
                  {noticia.categoria === "video" && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="bg-white/90 p-3 rounded-full shadow-lg">
                        <PlayCircle className="text-red-600" size={32} />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${noticia.categoria === 'video' ? 'bg-red-500 text-white' : 'bg-[#FFF1E3] text-[#701C32]'
                      }`}>
                      {noticia.categoria}
                    </span>
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex flex-col flex-grow">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                    {formatearFechaCorta(noticia.fecha_publicacion)}
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-[#701C32] mb-6 leading-tight line-clamp-2">
                    {noticia.titulo}
                  </h4>
                  <div className="mt-auto">
                    <Link
                      href={`/noticias/${noticia.id_noticia}`}
                      className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors"
                    >
                      Leer noticia completa
                      <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            {noticiasFiltradas.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
                <p className="font-medium">No se encontraron noticias{busqueda ? ` para "${busqueda}"` : ''}.</p>
              </div>
            )}
          </div>

          {visibles < noticiasFiltradas.length && (
            <div className="text-center">
              <button
                onClick={() => setVisibles(v => v + POR_PAGINA)}
                className="bg-[#093E7A] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#073365] transition-all shadow-lg inline-flex items-center gap-2"
              >
                Cargar más noticias
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
