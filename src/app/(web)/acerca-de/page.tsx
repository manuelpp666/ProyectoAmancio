"use client";
import { useConfiguracion } from "@/src/hooks/useConfiguracion";
import { Loader2 } from "lucide-react";

export default function AcercaDePage() {
  const { data, loading } = useConfiguracion('nosotros');
  const { data: dataInicio, loading: loadingInicio } = useConfiguracion('inicio');

  const getVal = (clave: string, defecto: string) => {
    // Busca primero en datos de nosotros, si no, busca en datos de inicio
    const item = data.find(i => i.clave === clave) || dataInicio.find(i => i.clave === clave);
    return item?.valor?.trim() || defecto;
  };

  // Esperamos ambas secciones para mostrar el contenido ya completo
  if (loading || loadingInicio) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#701C32]" size={40} />
    </div>
  );

  const portadaImagen = getVal('nosotros_header_imagen', '');
  const misionImagen = getVal('mision_imagen', '');
  const visionImagen = getVal('vision_imagen', '');

  return (
    <div className="bg-[#FFF1E3] text-slate-800">
      {/* Portada (mismo patrón que los demás apartados) */}
      <section className="relative py-20 md:py-24 overflow-hidden bg-gradient-to-br from-[#701C32] via-[#701C32] to-[#093E7A]">
        {/* Imagen de portada opcional */}
        {portadaImagen && (
          <div className="absolute inset-0 z-0">
            <img alt="" className="w-full h-full object-cover opacity-45" src={portadaImagen} />
            <div className="absolute inset-0 bg-gradient-to-br from-[#701C32]/72 to-[#093E7A]/75"></div>
          </div>
        )}
        {/* Formas decorativas difuminadas */}
        <div className="absolute -top-16 -right-16 w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full blur-3xl z-0 animate-float-slow"></div>
        <div className="absolute -bottom-24 -left-10 w-80 h-80 md:w-96 md:h-96 bg-[#093E7A]/40 rounded-full blur-3xl z-0 animate-float-slower"></div>

        <div className="max-w-7xl mx-auto px-4 text-center relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-full mb-5">
            <span className="material-symbols-outlined text-base">groups</span>
            Sobre Nosotros
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-5 leading-tight drop-shadow-lg">
            {getVal('nosotros_header_titulo', 'Nuestra Institución')}
          </h1>
          <div className="w-24 h-1.5 bg-white/80 mx-auto rounded-full mb-6"></div>
          <p className="text-base md:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed">
            {getVal('nosotros_header_desc', 'Conoce la historia, los valores y el compromiso que definen a la familia Amancista.')}
          </p>
        </div>
      </section>

      {/* Historia Section */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img
                  alt="Nuestra Historia"
                  className="w-full h-auto"
                  src={getVal('nosotros_imagen', '/placeholder-news.svg')}
                />
              </div>
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                {getVal('nosotros_titulo', 'Forjando mentes brillantes desde 1999')}
              </h2>
              <div className="w-20 h-1.5 bg-[#701C32] mb-8 rounded-full"></div>
              <div className="space-y-6 text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                {getVal('nosotros_contenido', 'La Institución Educativa Amancistas nació con el sueño...')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión y Visión Dinámicas */}
      <section className="py-16 md:py-24 px-4 bg-[#FFF1E3]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group overflow-hidden">
              {misionImagen && (
                <div className="h-72 md:h-[26rem] overflow-hidden">
                  <img src={misionImagen} alt="Misión" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-8 md:p-14">
                <h3 className="text-3xl md:text-4xl font-black text-[#701C32] mb-6">Misión</h3>
                <p className="text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {getVal('mision', 'Formar ciudadanos líderes con pensamiento crítico...')}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group overflow-hidden">
              {visionImagen && (
                <div className="h-72 md:h-[26rem] overflow-hidden">
                  <img src={visionImagen} alt="Visión" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-8 md:p-14">
                <h3 className="text-3xl md:text-4xl font-black text-[#701C32] mb-6">Visión</h3>
                <p className="text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                  {getVal('vision', 'Ser reconocida en el 2030 como la institución...')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Himno del Colegio (solo si está configurado) */}
      {getVal('himno_contenido', '') && (
        <section className="py-16 md:py-24 px-4 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-[#701C32]/10 rounded-2xl flex items-center justify-center text-[#701C32] mb-6 mx-auto">
              <span className="material-symbols-outlined text-4xl">music_note</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#701C32] mb-4">
              {getVal('himno_titulo', 'Himno del Colegio')}
            </h2>
            <div className="w-20 h-1.5 bg-[#701C32] mx-auto rounded-full mb-8"></div>
            <div className="bg-[#FFF1E3]/50 border border-[#FFF1E3] rounded-[2rem] p-8 md:p-12 text-slate-700 leading-loose text-base md:text-lg whitespace-pre-line italic">
              {getVal('himno_contenido', '')}
            </div>
          </div>
        </section>
      )}

      {/* Quote Section DINÁMICA */}
      <section
        className="py-16 md:py-24 px-4 text-white overflow-hidden relative"
        style={{
          backgroundColor: "#701C32",
          backgroundImage: [
            "radial-gradient(140% 95% at 8% 105%, #093E7A 0%, rgba(9,62,122,0) 55%)",
            "radial-gradient(130% 90% at 100% 10%, #0b4a92 0%, rgba(11,74,146,0) 52%)",
            "radial-gradient(95% 130% at 50% 40%, #8a2440 0%, rgba(138,36,64,0) 60%)",
          ].join(", "),
        }}
      >
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
          <span className="material-icons-round text-[20rem] md:text-[30rem] -mr-32 -mt-24">school</span>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <span className="material-symbols-outlined text-5xl md:text-6xl text-white/30 mb-2 block">format_quote</span>
          <blockquote className="text-2xl md:text-4xl font-black italic leading-[1.25] mb-8">
            {getVal('nosotros_frase', 'Educar no es dar carrera para vivir, sino templar el alma para las dificultades de la vida.')}
          </blockquote>
          <div className="w-16 h-1 bg-white mx-auto mb-6"></div>
          <p className="font-bold tracking-widest uppercase">
            {getVal('nosotros_frase_autor', 'Modelo Educativo Amancista')}
          </p>
        </div>
      </section>
    </div>
  );
}
