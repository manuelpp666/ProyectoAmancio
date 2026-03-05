"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react"; // Importante para RenderIcon
import {
  Loader2,
  ArrowRight,
  ChevronRight,
  PlayCircle
} from "lucide-react";
import Footer from "../components/Pagina-Web/Footer";
import Header from "../components/Pagina-Web/Header";
import ChatWidget from "../components/utils/ChatbotWidget";
import { NoticiaResponse } from "@/src/interfaces/noticia"; 
import { getYouTubeID } from "@/src/components/utils/youtube"; 
import { useConfiguracion } from '@/src/hooks/useConfiguracion';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [noticias, setNoticias] = useState<NoticiaResponse[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);

  // Traemos la configuración de la sección 'inicio'
  const { data: config, loading: loadingConfig } = useConfiguracion('inicio');

  // Helpers para la configuración
  const getVal = (clave: string) => config.find(i => i.clave === clave)?.valor || "";
  const getJsonVal = (clave: string, defecto: any) => {
    const val = getVal(clave);
    try { return val ? JSON.parse(val) : defecto; }
    catch { return defecto; }
  };

  const propuestas = getJsonVal('home_enfoques', []);
  const niveles = getJsonVal('home_niveles', []);

  // --- CARGA DE NOTICIAS Y TIMER ---
  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/`);
        const data = await response.json();
        setNoticias(data.slice(0, 3));
      } catch (error) {
        console.error("Error cargando noticias:", error);
      } finally {
        setLoadingNoticias(false);
      }
    };
    fetchNoticias();
  }, []); // Solo al montar

  // Timer separado que depende de la longitud de propuestas
  useEffect(() => {
    if (propuestas.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % propuestas.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [propuestas.length]);

  const getImageUrl = (noticia: NoticiaResponse) => {
    if (noticia.categoria === "video") {
      const videoId = getYouTubeID(noticia.imagen_portada_url || "");
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return noticia.imagen_portada_url || "/placeholder-news.jpg";
  };

  // Componente para renderizar iconos desde strings de la BD
  const RenderIcon = ({ name, size = 24, className = "" }: { name: string, size?: number, className?: string }) => {
    const Icon = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <Icon size={size} className={className} strokeWidth={1.5} />;
  };

  if (loadingConfig) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#701C32]" size={40} />
    </div>
  );

  return (
    <div className="bg-white text-slate-800 transition-colors duration-300">
      <Header />
      <main>
        {/* HERO SECTION DINÁMICO */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-[#FFF1E3]">
          <div className="absolute inset-0 z-0">
            <img 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-30" 
              src={getVal('hero_imagen') || "https://lh3.googleusercontent.com/aida-public/AB6AXuDu0vQ65OwZKHBD3Lt0hTzEN4cGhR2GGdbuNhX3l3DABC94yLNQuOa5AzUcL9rAvNzwjJeH2vtEj5KU0C4oAjRHnhbg5-AmTkbCTCJ4EGTDSwpxDXK4gvYVPKjryglfDmgTFO6L_nXUzTt03t2fhPlBCFKkWegqTkOFr5yriouUTzWajvOHE4Jo4_wt-ggQI32d6AHJKF3z0zySO8yNJjRhVSN4_svLn0cN6kN36tSVPIOTCHduURF-sq4q1Ovt-FGzPUi7iIHxO1CN"} 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black text-[#701C32] mb-6 leading-tight">
              {getVal('hero_titulo') || "Formando líderes para el futuro"}
            </h1>
            <p className="text-xl md:text-2xl text-slate-700 mb-10 font-light">
              {getVal('hero_subtitulo') || "Excelencia académica y valores que trascienden generaciones."}
            </p>
            <Link href="/admision">
              <button className="bg-[#093E7A] text-white px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl flex items-center space-x-2 mx-auto">
                <span>Admisión</span>
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </section>

        {/* PROPUESAT EDUCATIVA (CARRUSEL DINÁMICO) */}
        {propuestas.length > 0 && (
          <section className="py-24 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-[#701C32] mb-4">Propuesta Educativa</h2>
                <div className="w-24 h-1.5 bg-[#701C32] mx-auto rounded-full"></div>
              </div>

              <div className="relative">
                <div className="bg-[#FFF1E3] rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-inner border border-white min-h-[450px]">
                  <div className="w-full md:w-1/2 flex justify-center">
                    <div key={currentSlide} className="relative w-64 h-64 bg-white rounded-full flex items-center justify-center shadow-2xl animate-fadeIn border-8 border-[#f8ebdd]">
                      <RenderIcon 
                        name={propuestas[currentSlide].icon} 
                        size={140} 
                        className="text-[#701C32]" 
                      />
                      <div className="absolute -top-2 -right-2 w-20 h-20 bg-[#093E7A] rounded-2xl flex items-center justify-center text-white rotate-12 shadow-lg border-4 border-white">
                        <RenderIcon name={propuestas[currentSlide].badge} size={35} />
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-1/2 text-center md:text-left">
                    <h3 className="text-3xl font-black text-[#701C32] mb-6">
                      {propuestas[currentSlide].titulo}
                    </h3>
                    <p className="text-lg text-slate-700 leading-relaxed mb-8 min-h-[120px]">
                      {propuestas[currentSlide].descripcion}
                    </p>
                    <div className="flex justify-center md:justify-start space-x-3">
                      {propuestas.map((_: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`h-3 rounded-full transition-all duration-300 ${currentSlide === index ? "w-10 bg-[#701C32]" : "w-3 bg-slate-300 hover:bg-slate-400"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* NIVELES ACADÉMICOS DINÁMICOS */}
        <section className="py-24 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-[#701C32] mb-4">Nuestra metodología</h2>
              <p className="text-slate-500 font-medium">Adaptamos el aprendizaje a cada etapa del desarrollo</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {niveles.map((nivel: any, idx: number) => (
                <div key={idx} className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-transform border border-slate-100">
                  <div className="w-20 h-20 bg-[#FFF1E3] rounded-2xl flex items-center justify-center mb-6">
                    <RenderIcon name={nivel.icon} size={40} className="text-[#701C32]" />
                  </div>
                  <h3 className="text-2xl font-black text-[#093E7A] mb-4">{nivel.titulo}</h3>
                  <p className="text-slate-600 mb-6">{nivel.descripcion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* News Section */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-[#701C32] mb-4">Noticias Amancistas</h2>
              <div className="w-24 h-1.5 bg-[#093E7A] mx-auto rounded-full"></div>
            </div>

            {loadingNoticias ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 bg-slate-100 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {noticias.map((noticia) => (
                  <article 
                    key={noticia.id_noticia} 
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col"
                  >
                    <div className="relative h-56 overflow-hidden group">
                      <img 
                        alt={noticia.titulo} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        src={getImageUrl(noticia)} 
                      />
                      {noticia.categoria === "video" && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-white/90 p-2 rounded-full shadow-lg">
                            <PlayCircle className="text-red-600" size={24} />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-8 flex flex-col flex-grow">
                      <span className={`inline-block font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4 ${
                        noticia.categoria === 'video' ? 'bg-red-500 text-white' : 'bg-[#FFF1E3] text-[#701C32]'
                      }`}>
                        {noticia.categoria}
                      </span>
                      
                      <h4 className="text-xl font-black text-slate-900 mb-4 leading-tight line-clamp-2">
                        {noticia.titulo}
                      </h4>
                      
                      <div className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-3" 
                        dangerouslySetInnerHTML={{ __html: noticia.contenido.substring(0, 150) + "..." }} 
                      />

                      <Link 
                        href={`/noticias/${noticia.id_noticia}`}
                        className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors"
                      >
                        Leer noticia completa
                        <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-16 text-center">
              <Link href="/noticias">
                <button className="bg-[#093E7A] text-white px-10 py-4 rounded-full font-bold hover:bg-[#073365] transition-all shadow-xl shadow-[#093E7A]/30 inline-flex items-center space-x-2">
                  <span>Ver todas las noticias</span>
                  <ArrowRight size={20} />
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      {/* WIDGET DE AMANCIO IA */}
      <ChatWidget />
    </div>
  );
}