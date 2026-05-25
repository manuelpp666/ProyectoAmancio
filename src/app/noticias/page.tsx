"use client";
import { useEffect, useState } from "react";
import Header from "@/src/components/Pagina-Web/Header";
import Footer from "@/src/components/Pagina-Web/Footer";
import { NoticiaResponse } from "@/src/interfaces/noticia";
import { getYouTubeID } from "@/src/components/utils/youtube";
import Link from "next/link";
import { Search, ArrowRight, PlayCircle } from "lucide-react";
import ChatWidget from "@/src/components/utils/ChatbotWidget";
import { useConfiguracion } from "@/src/hooks/useConfiguracion";

export default function Home() {
  const [noticias, setNoticias] = useState<NoticiaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const { data: config } = useConfiguracion('noticias');
  const getVal = (clave: string, defecto: string) => config.find(i => i.clave === clave)?.valor || defecto;

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/`);
        const data = await response.json();
        setNoticias(data);
      } catch (error) {
        console.error("Error cargando noticias:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNoticias();
  }, []);

  // Función para obtener la imagen de portada
  const getImageUrl = (noticia: NoticiaResponse) => {
    if (noticia.categoria === "video") {
      const videoId = getYouTubeID(noticia.imagen_portada_url || "");
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return noticia.imagen_portada_url || "/placeholder-news.jpg";
  };

  const noticiasFiltradas = noticias.filter(n =>
    n.titulo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="bg-white text-slate-800">
      <Header />

      {/* Banner con degradado de marca */}
      <section className="relative py-24 overflow-hidden bg-gradient-to-br from-[#701C32] via-[#701C32] to-[#093E7A]">
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl z-0"></div>
        <div className="absolute -bottom-24 -left-10 w-96 h-96 bg-[#093E7A]/40 rounded-full blur-3xl z-0"></div>
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-full mb-5">
            <span className="material-symbols-outlined text-base">campaign</span>
            Actualidad
          </span>
          <h1 className="text-5xl font-black text-white mb-4 drop-shadow-lg">{getVal('noticias_titulo', 'Noticias Amancistas')}</h1>
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
            />
          </div>
        </div>
      </section>

      <main className="py-16 px-4 bg-white min-h-screen">
        <div className="max-w-7xl mx-auto">

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {noticiasFiltradas.map((noticia) => (
                <article
                  key={noticia.id_noticia}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all border border-slate-100 flex flex-col"
                >
                  {/* Contenedor de Imagen */}
                  <div className="relative h-60 overflow-hidden group">
                    <img
                      alt={noticia.titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      src={getImageUrl(noticia)}
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

                  {/* Contenido */}
                  <div className="p-8 flex flex-col flex-grow">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
                      {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>

                    <h4 className="text-xl font-black text-[#701C32] mb-6 leading-tight line-clamp-2">
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
          )}
        </div>
      </main>

      <Footer />
      {/* WIDGET DE AMANCIO IA */}
      <ChatWidget />
    </div>
  );
}