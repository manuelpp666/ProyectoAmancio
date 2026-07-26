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

  // Esperamos ambas secciones para evitar que la imagen del hero aparezca a destiempo
  if (loading || loadingInicio) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#701C32]" size={40} />
    </div>
  );

  const heroImagen = getVal('hero_imagen', '');

  return (
    <div className="bg-[#FFF1E3] text-slate-800">
      {/* Header Dinámico */}
      <header className="relative py-20 md:py-24 bg-[#701C32] overflow-hidden">
        <div className="absolute inset-0 z-0">
          {heroImagen && (
            <img
              alt=""
              className="w-full h-full object-cover opacity-30"
              src={heroImagen}
            />
          )}
          {/* Overlay para asegurar legibilidad del texto claro */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#701C32]/95 via-[#701C32]/85 to-[#093E7A]/85"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-lg">
            {getVal('nosotros_header_titulo', 'Nuestra Institución')}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            {getVal('nosotros_header_desc', 'Conoce la historia, los valores y el compromiso que definen a la familia Amancista.')}
          </p>
        </div>
      </header>

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
              <div className="inline-block px-4 py-1 bg-[#FFF1E3] text-[#701C32] font-bold text-sm rounded-full mb-4">Nuestra Historia</div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6">
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
            <div className="bg-white p-8 md:p-14 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-[#093E7A]/10 rounded-2xl flex items-center justify-center text-[#093E7A] mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">rocket_launch</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-[#093E7A] mb-6">Misión</h3>
              <p className="text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                {getVal('mision', 'Formar ciudadanos líderes con pensamiento crítico...')}
              </p>
            </div>
            <div className="bg-white p-8 md:p-14 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-[#701C32]/10 rounded-2xl flex items-center justify-center text-[#701C32] mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">visibility</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-[#701C32] mb-6">Visión</h3>
              <p className="text-slate-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
                {getVal('vision', 'Ser reconocida en el 2030 como la institución...')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section DINÁMICA */}
      <section className="py-16 md:py-24 px-4 bg-[#093E7A] text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
          <span className="material-icons-round text-[20rem] md:text-[30rem] -mr-32 -mt-24">school</span>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-black mb-8 italic">
            &ldquo;{getVal('nosotros_frase', 'Educar no es dar carrera para vivir, sino templar el alma para las dificultades de la vida.')}&rdquo;
          </h2>
          <div className="w-16 h-1 bg-white mx-auto mb-6"></div>
          <p className="font-bold tracking-widest uppercase">
            {getVal('nosotros_frase_autor', 'Modelo Educativo Amancista')}
          </p>
        </div>
      </section>
    </div>
  );
}
