import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

export default function Home() {
  return (
    <div className="bg-[#FFF1E3] text-slate-800 transition-colors duration-300">
      
      {/* Navigation */}
      <Header></Header>

      {/* Header */}
      <header className="relative py-20 bg-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img alt="Fondo escolar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDu0vQ65OwZKHBD3Lt0hTzEN4cGhR2GGdbuNhX3l3DABC94yLNQuOa5AzUcL9rAvNzwjJeH2vtEj5KU0C4oAjRHnhbg5-AmTkbCTCJ4EGTDSwpxDXK4gvYVPKjryglfDmgTFO6L_nXUzTt03t2fhPlBCFKkWegqTkOFr5yriouUTzWajvOHE4Jo4_wt-ggQI32d6AHJKF3z0zySO8yNJjRhVSN4_svLn0cN6kN36tSVPIOTCHduURF-sq4q1Ovt-FGzPUi7iIHxO1CN"/>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-[#701C32] mb-4">Nuestra Institución</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">Conoce la historia, los valores y el compromiso que definen a la familia Amancista.</p>
        </div>
      </header>

      {/* Historia Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img alt="Nuestra Historia" className="w-full h-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8ulXudOIR7WBzlFcCSCtTLL9O5jZ-dY0t3YOZNBiZy7lYFudE8mw6TMf-SuP2XTC3T0sKxP2DrLZP_I0rGwtvigsDkVRJeEQ12iTTx4fJ0yNF6v_lcDqGJh3H3myAusDT6HbqL9qK_eRbS7XJ84U5igQ33UIBgHI6rvxbPMwgX3jA_5cHBywO1Cu5SxRTt0FmIJalTqN8O8jxvDarKK33OIseaQggxf_VQoRWCD7tccXv5ekTiqfZKisSiUgLjmbskiMx5_MHjCAz"/>
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#701C32] rounded-2xl flex items-center justify-center text-white shadow-xl">
                <div className="text-center">
                  <span className="block text-4xl font-black">25</span>
                  <span className="text-xs uppercase font-bold">Años de Excelencia</span>
                </div>
              </div>
            </div>
            <div>
              <div className="inline-block px-4 py-1 bg-[#FFF1E3] text-[#701C32] font-bold text-sm rounded-full mb-4">Nuestra Historia</div>
              <h2 className="text-4xl font-black text-slate-900 mb-6">Forjando mentes brillantes desde 1999</h2>
              <div className="w-20 h-1.5 bg-[#701C32] mb-8 rounded-full"></div>
              <div className="space-y-6 text-slate-600 leading-relaxed text-lg">
                <p>La Institución Educativa Amancistas nació con el sueño de brindar una educación que no solo se centrara en el conocimiento académico, sino en la formación de la integridad humana y el espíritu crítico.</p>
                <p>A lo largo de más de dos décadas, hemos evolucionado integrando tecnologías de vanguardia y metodologías activas de aprendizaje, convirtiéndonos en un referente regional por nuestro alto desempeño académico y formación en valores.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="py-24 px-4 bg-[#FFF1E3]/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-[#093E7A]/10 rounded-2xl flex items-center justify-center text-[#093E7A] mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">rocket_launch</span>
              </div>
              <h3 className="text-3xl font-black text-[#093E7A] mb-6">Misión</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                Formar ciudadanos líderes con pensamiento crítico, sólidos valores éticos y competencias globales, a través de una educación integral basada en la investigación, la innovación y el respeto a la diversidad.
              </p>
            </div>
            <div className="bg-white p-10 md:p-14 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
              <div className="w-16 h-16 bg-[#701C32]/10 rounded-2xl flex items-center justify-center text-[#701C32] mb-8 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">visibility</span>
              </div>
              <h3 className="text-3xl font-black text-[#701C32] mb-6">Visión</h3>
              <p className="text-slate-600 leading-relaxed text-lg">
                Ser reconocida en el 2030 como la institución educativa líder en innovación pedagógica y formación en valores, destacando por la excelencia académica de nuestros egresados y su impacto positivo en la sociedad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Nuestros Valores</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Los pilares que sostienen nuestra comunidad educativa y guían cada una de nuestras acciones.</p>
            <div className="w-24 h-1.5 bg-[#093E7A] mx-auto mt-6 rounded-full"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="p-8 border border-[#FFF1E3] rounded-3xl hover:bg-[#FFF1E3] transition-colors">
              <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[#701C32] text-3xl">favorite</span>
              </div>
              <h4 className="font-black text-xl text-slate-800">Respeto</h4>
              <p className="text-sm text-slate-500 mt-2">Valoramos la individualidad y los derechos de cada miembro.</p>
            </div>
            <div className="p-8 border border-[#FFF1E3] rounded-3xl hover:bg-[#FFF1E3] transition-colors">
              <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[#093E7A] text-3xl">verified_user</span>
              </div>
              <h4 className="font-black text-xl text-slate-800">Integridad</h4>
              <p className="text-sm text-slate-500 mt-2">Actuamos con honestidad y rectitud en todo momento.</p>
            </div>
            <div className="p-8 border border-[#FFF1E3] rounded-3xl hover:bg-[#FFF1E3] transition-colors">
              <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[#701C32] text-3xl">workspace_premium</span>
              </div>
              <h4 className="font-black text-xl text-slate-800">Excelencia</h4>
              <p className="text-sm text-slate-500 mt-2">Buscamos superar nuestras metas día tras día.</p>
            </div>
            <div className="p-8 border border-[#FFF1E3] rounded-3xl hover:bg-[#FFF1E3] transition-colors">
              <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-[#093E7A] text-3xl">groups</span>
              </div>
              <h4 className="font-black text-xl text-slate-800">Solidaridad</h4>
              <p className="text-sm text-slate-500 mt-2">Trabajamos juntos por el bienestar de la comunidad.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-24 px-4 bg-[#093E7A] text-white overflow-hidden relative">
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
          <span className="material-icons-round text-[30rem] -mr-32 -mt-24">school</span>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-black mb-8 italic">"Educar no es dar carrera para vivir, sino templar el alma para las dificultades de la vida."</h2>
          <div className="w-16 h-1 bg-white mx-auto mb-6"></div>
          <p className="font-bold tracking-widest uppercase">Modelo Educativo Amancista</p>
        </div>
      </section>

      {/* Footer */}
      <Footer></Footer>
    </div>
  );
}