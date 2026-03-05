"use client";
import Header from "@/src/components/Pagina-Web/Header";
import Footer from "@/src/components/Pagina-Web/Footer";
import ChatWidget from "@/src/components/utils/ChatbotWidget";
import { useConfiguracion } from "@/src/hooks/useConfiguracion";
import { Loader2 } from "lucide-react";

export default function AcercaDePage() {
  const { data, loading } = useConfiguracion('nosotros');
  const { data: dataInicio } = useConfiguracion('inicio');

  const getVal = (clave: string, defecto: string) => {
    // Busca primero en datos de nosotros, si no, busca en datos de inicio
    const item = data.find(i => i.clave === clave) || dataInicio.find(i => i.clave === clave);
    return item?.valor || defecto;
  };
if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#701C32]" size={40} />
    </div>
  );
  return (
    <div className="bg-[#FFF1E3] text-slate-800 transition-colors duration-300">
      <Header />

      {/* Header Dinámico */}
      <header className="relative py-20 bg-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
              alt="Hero Background" 
              className="w-full h-full object-cover opacity-40" // Sube la opacidad a 40%
              src={getVal('hero_imagen', '/placeholder-hero.jpg')} 
            />
          {/* Overlay para asegurar legibilidad del texto */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-[#701C32]/40"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-[#701C32] mb-4">
            {getVal('nosotros_header_titulo', 'Nuestra Institución')}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {getVal('nosotros_header_desc', 'Conoce la historia, los valores y el compromiso que definen a la familia Amancista.')}
          </p>
        </div>
      </header>

      {/* Historia Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  alt="Nuestra Historia" 
                  className="w-full h-auto" 
                  src={getVal('nosotros_imagen', 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8ulXudOIR7WBzlFcCSCtTLL9O5jZ-dY0t3YOZNBiZy7lYFudE8mw6TMf-SuP2XTC3T0sKxP2DrLZP_I0rGwtvigsDkVRJeEQ12iTTx4fJ0yNF6v_lcDqGJh3H3myAusDT6HbqL9qK_eRbS7XJ84U5igQ33UIBgHI6rvxbPMwgX3jA_5cHBywO1Cu5SxRTt0FmIJalTqN8O8jxvDarKK33OIseaQggxf_VQoRWCD7tccXv5ekTiqfZKisSiUgLjmbskiMx5_MHjCAz')}
                />
              </div>
              
            </div>
            <div>
              <div className="inline-block px-4 py-1 bg-[#FFF1E3] text-[#701C32] font-bold text-sm rounded-full mb-4">Nuestra Historia</div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">
                {getVal('nosotros_titulo', 'Forjando mentes brillantes desde 1999')}
              </h2>
              <div className="w-20 h-1.5 bg-[#701C32] mb-8 rounded-full"></div>
              <div className="space-y-6 text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                {getVal('nosotros_contenido', 'La Institución Educativa Amancistas nació con el sueño...')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión y Visión Dinámicas */}
      <section className="py-24 px-4 bg-[#FFF1E3]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-[#093E7A]/10 rounded-2xl flex items-center justify-center text-[#093E7A] mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">rocket_launch</span>
              </div>
              <h3 className="text-3xl font-black text-[#093E7A] mb-6">Misión</h3>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                {getVal('mision', 'Formar ciudadanos líderes con pensamiento crítico...')}
              </p>
            </div>
            <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-[#701C32]/10 rounded-2xl flex items-center justify-center text-[#701C32] mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">visibility</span>
              </div>
              <h3 className="text-3xl font-black text-[#701C32] mb-6">Visión</h3>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                {getVal('vision', 'Ser reconocida en el 2030 como la institución...')}
              </p>
            </div>
          </div>
        </div>
      </section>

      

      {/* Quote Section DINÁMICA */}
      <section className="py-24 px-4 bg-[#093E7A] text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
          <span className="material-icons-round text-[30rem] -mr-32 -mt-24">school</span>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-black mb-8 italic">
            "{getVal('nosotros_frase', 'Educar no es dar carrera para vivir, sino templar el alma para las dificultades de la vida.')}"
          </h2>
          <div className="w-16 h-1 bg-white mx-auto mb-6"></div>
          <p className="font-bold tracking-widest uppercase">
            {getVal('nosotros_frase_autor', 'Modelo Educativo Amancista')}
          </p>
        </div>
      </section>

      <Footer />
      <ChatWidget />
    </div>
  );
}