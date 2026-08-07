"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import * as LucideIcons from "lucide-react";
import { ArrowRight, ChevronRight, PlayCircle, CalendarClock, Sun, GraduationCap } from "lucide-react";
import { NoticiaResponse } from "@/src/interfaces/noticia";
import { getNoticiaImagen } from "@/src/components/utils/youtube";
import { extractoTexto } from "@/src/components/utils/html";
import { formatearFechaLarga } from "@/src/components/utils/fecha";
import { esVideo } from "@/src/components/utils/media";
import type { ConfigItem } from "@/src/hooks/useConfiguracion";

interface InscripcionAbierta {
  id_anio_escolar: string;
  tipo: string;
  fin_inscripcion?: string;
}

interface AdmisionEstado {
  abierto: boolean;
  tipo?: string;
  proxima_inscripcion?: string;
  // El backend puede devolver más de una inscripción vigente a la vez
  // (por ejemplo, el año regular y el de verano solapados).
  inscripciones?: InscripcionAbierta[];
}

// Etiqueta y descripción de cada tipo, para que se distinga a qué postula uno
const ETIQUETA_ADMISION: Record<string, { titulo: string; detalle: string }> = {
  VERANO: { titulo: "Admisión Verano", detalle: "Año académico de verano" },
  REGULAR: { titulo: "Admisión Regular", detalle: "Año escolar 2026" },
};

const etiquetaDe = (tipo: string, anio?: string) => {
  const base = ETIQUETA_ADMISION[(tipo || "").toUpperCase()];
  if (base) {
    return {
      titulo: base.titulo,
      detalle: tipo.toUpperCase() === "REGULAR" && anio ? `Año escolar ${anio}` : base.detalle,
    };
  }
  return { titulo: `Admisión ${tipo}`, detalle: anio ? `Año ${anio}` : "" };
};

export default function HomeClient({
  config,
  noticias,
  admision,
}: {
  config: ConfigItem[];
  noticias: NoticiaResponse[];
  admision: AdmisionEstado;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Helpers de configuración a partir de los datos ya cargados en el servidor
  const getVal = (clave: string, defecto = "") =>
    config.find(i => i.clave === clave)?.valor?.trim() || defecto;
  const getJsonVal = <T,>(clave: string, defecto: T): T => {
    const val = config.find(i => i.clave === clave)?.valor;
    try { return val ? (JSON.parse(val) as T) : defecto; } catch { return defecto; }
  };

  const propuestas = getJsonVal<any[]>('home_enfoques', []);
  const niveles = getJsonVal<any[]>('home_niveles', []);
  const heroImagen = getVal('hero_imagen');

  // Inscripciones vigentes. Si el backend es una versión anterior y solo manda
  // `tipo`, se arma una lista de un elemento para no perder el botón.
  const inscripciones: InscripcionAbierta[] =
    admision.inscripciones && admision.inscripciones.length > 0
      ? admision.inscripciones
      : admision.abierto && admision.tipo
        ? [{ id_anio_escolar: "", tipo: admision.tipo }]
        : [];
  const varias = inscripciones.length > 1;

  // Carrusel automático de propuestas
  useEffect(() => {
    if (propuestas.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % propuestas.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [propuestas.length]);

  const RenderIcon = ({ name, size = 24, className = "" }: { name: string, size?: number, className?: string }) => {
    const Icon = (LucideIcons as any)[name] || LucideIcons.HelpCircle;
    return <Icon size={size} className={className} strokeWidth={1.5} />;
  };

  return (
    <>
      {/* HERO SECTION DINÁMICO */}
      <section className="portada-inicio relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroImagen && (
            esVideo(heroImagen) ? (
              <video
                className="w-full h-full object-cover scale-105"
                src={heroImagen}
                autoPlay
                muted
                loop
                playsInline
                aria-hidden="true"
              />
            ) : (
              <img alt="" className="w-full h-full object-cover scale-105" src={heroImagen} />
            )
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-[#701C32]/75 via-[#701C32]/55 to-[#093E7A]/65"></div>
        </div>
        <div className="absolute -top-24 -left-24 w-72 h-72 md:w-96 md:h-96 bg-white/10 rounded-full blur-3xl z-0 animate-float-slow"></div>
        <div className="absolute -bottom-32 -right-20 w-80 h-80 md:w-[28rem] md:h-[28rem] bg-[#093E7A]/40 rounded-full blur-3xl z-0 animate-float-slower"></div>

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-full mb-6">
            <span className="material-symbols-outlined text-base">verified</span>
            Colegio Amancio Varona
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-[1.05] drop-shadow-lg">
            {getVal('hero_titulo', "Formando líderes para el futuro")}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/85 mb-10 font-light max-w-2xl mx-auto leading-relaxed">
            {getVal('hero_subtitulo', "Excelencia académica y valores que trascienden generaciones.")}
          </p>
          {admision.abierto && inscripciones.length > 0 ? (
            <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${varias ? "sm:gap-5" : ""}`}>
              {inscripciones.map((ins) => {
                const { titulo, detalle } = etiquetaDe(ins.tipo, ins.id_anio_escolar);
                const esVeranoIns = ins.tipo?.toUpperCase() === "VERANO";
                return (
                  <Link
                    key={ins.id_anio_escolar}
                    href={`/admision?tipo=${encodeURIComponent(ins.tipo)}&anio=${encodeURIComponent(ins.id_anio_escolar)}`}
                    className="w-full sm:w-auto"
                  >
                    <button
                      className={`w-full px-8 sm:px-10 py-4 rounded-full font-bold text-base sm:text-lg hover:scale-105 transition-transform shadow-2xl flex items-center justify-center gap-3 ${
                        esVeranoIns && varias
                          ? "bg-[#093E7A] text-white"
                          : "bg-white text-[#701C32]"
                      }`}
                    >
                      {esVeranoIns ? <Sun size={20} /> : <GraduationCap size={20} />}
                      <span className="flex flex-col items-start leading-tight">
                        <span>{titulo}</span>
                        {/* Con dos convocatorias abiertas hay que dejar clarísimo
                            cuál es cuál, así que se muestra el detalle debajo */}
                        {varias && detalle && (
                          <span className="text-[11px] font-semibold opacity-70 uppercase tracking-wide">
                            {detalle}
                          </span>
                        )}
                      </span>
                      <ArrowRight size={20} />
                    </button>
                  </Link>
                );
              })}
            </div>
          ) : admision.proxima_inscripcion ? (
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/30 text-white px-6 sm:px-8 py-4 rounded-full font-bold text-sm sm:text-lg shadow-lg mx-auto">
              <CalendarClock size={22} />
              <span>Próximas inscripciones: {formatearFechaLarga(admision.proxima_inscripcion)}</span>
            </div>
          ) : null}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent z-0"></div>
      </section>

      {/* PROPUESTA EDUCATIVA (CARRUSEL DINÁMICO) */}
      {propuestas.length > 0 && (
        <section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:mb-16">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#093E7A]">Formación integral</span>
              <h2 className="text-4xl md:text-5xl font-black text-[#701C32] mt-2 mb-4">Propuesta Educativa</h2>
              <div className="w-24 h-1.5 bg-[#701C32] mx-auto rounded-full"></div>
            </div>

            <div className="relative">
              <div className="bg-[#FFF1E3] rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-xl shadow-[#701C32]/5 border border-white grid md:grid-cols-2 items-stretch">
                {/* IMAGEN COMPLETA (llena toda su columna, sin recortes de círculo) */}
                <div key={currentSlide} className="relative order-1 min-h-[240px] sm:min-h-[340px] md:min-h-[480px] bg-[#f8ebdd] animate-fadeIn">
                  {propuestas[currentSlide].imagen ? (
                    <img
                      src={propuestas[currentSlide].imagen}
                      alt={propuestas[currentSlide].titulo}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#FFF1E3] to-[#f8e0cf]">
                      <RenderIcon name={propuestas[currentSlide].icon} className="text-[#701C32] w-28 h-28 sm:w-36 sm:h-36" />
                    </div>
                  )}
                </div>

                {/* TEXTO */}
                <div className="order-2 p-8 sm:p-10 md:p-14 flex flex-col justify-center text-center md:text-left">
                  <h3 className="text-3xl sm:text-4xl font-black text-[#701C32] mb-4 sm:mb-5 leading-tight">
                    {propuestas[currentSlide].titulo}
                  </h3>
                  <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                    {propuestas[currentSlide].descripcion}
                  </p>
                </div>
              </div>

              {/* Botones del carrusel, debajo del recuadro */}
              <div className="flex justify-center gap-3 mt-8">
                {propuestas.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Ir a la propuesta ${index + 1}`}
                    className={`h-3 rounded-full transition-all duration-300 ${currentSlide === index ? "w-10 bg-[#701C32]" : "w-3 bg-slate-300 hover:bg-slate-400"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* NIVELES ACADÉMICOS DINÁMICOS */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-[86rem] mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#701C32] mb-4">Nuestros niveles académicos</h2>
            <p className="text-slate-500 font-medium">Adaptamos el aprendizaje a cada etapa del desarrollo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {niveles.map((nivel: any, idx: number) => (
              <div key={idx} className="group relative bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#701C32] to-[#093E7A] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 z-10"></div>
                {nivel.imagen ? (
                  <div className="-mt-8 sm:-mt-10 -mx-8 sm:-mx-10 mb-8 h-72 sm:h-80 overflow-hidden">
                    <img
                      src={nivel.imagen}
                      alt={nivel.titulo}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-[#FFF1E3] to-[#f8e0cf] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                    <RenderIcon name={nivel.icon} size={48} className="text-[#701C32]" />
                  </div>
                )}
                <h3 className="text-3xl sm:text-4xl font-black text-[#093E7A] mb-4">{nivel.titulo}</h3>
                <p className="text-slate-600 mb-2 leading-relaxed text-base sm:text-lg">{nivel.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* News Section */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#093E7A]">Actualidad</span>
            <h2 className="text-4xl md:text-5xl font-black text-[#701C32] mt-2 mb-4">Noticias Amancistas</h2>
            <div className="w-24 h-1.5 bg-[#093E7A] mx-auto rounded-full"></div>
          </div>

          {noticias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {noticias.map((noticia) => (
                <article key={noticia.id_noticia} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col">
                  <div className="relative h-56 overflow-hidden group">
                    <img alt={noticia.titulo} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src={getNoticiaImagen(noticia)} />
                    {noticia.categoria === "video" && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="bg-white/90 p-2 rounded-full shadow-lg">
                          <PlayCircle className="text-red-600" size={24} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 sm:p-8 flex flex-col flex-grow">
                    <span className={`inline-block font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4 ${
                      noticia.categoria === 'video' ? 'bg-red-500 text-white' : 'bg-[#FFF1E3] text-[#701C32]'
                    }`}>
                      {noticia.categoria}
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 leading-snug line-clamp-2 group-hover:text-[#701C32] transition-colors">
                      {noticia.titulo}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                      {extractoTexto(noticia.contenido)}
                    </p>
                    <Link href={`/noticias/${noticia.id_noticia}`} className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors">
                      Leer noticia completa
                      <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 font-medium italic py-10">
              Aún no hay noticias publicadas. ¡Vuelve pronto!
            </p>
          )}

          <div className="mt-12 md:mt-16 text-center">
            <Link href="/noticias">
              <button className="bg-[#093E7A] text-white px-8 sm:px-10 py-4 rounded-full font-bold hover:bg-[#073365] transition-all shadow-xl shadow-[#093E7A]/30 inline-flex items-center space-x-2">
                <span>Ver todas las noticias</span>
                <ArrowRight size={20} />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
