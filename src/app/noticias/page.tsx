import Header from "@/src/components/Header";
import Footer
 from "@/src/components/Footer";
export default function Home() {

  return (
    <div className="bg-white text-slate-800">
      
      {/* Navigation */}
      <Header></Header>
      {/* Main Content */}
      <main className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-black text-[#701C32] mb-6">Noticias Amancistas</h1>
            <div className="w-24 h-1.5 bg-[#093E7A] mx-auto rounded-full mb-10"></div>
            <div className="max-w-2xl mx-auto flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input className="w-full pl-12 pr-4 py-4 rounded-full border-slate-200 focus:ring-[#093E7A] focus:border-[#093E7A] transition-all" placeholder="Buscar noticias..." type="text"/>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button className="px-6 py-2 rounded-full font-bold text-sm bg-[#701C32] text-white shadow-lg">Todos</button>
            <button className="px-6 py-2 rounded-full font-bold text-sm bg-[#FFF1E3] text-[#701C32] hover:bg-[#701C32] hover:text-white transition-colors">Académico</button>
            <button className="px-6 py-2 rounded-full font-bold text-sm bg-[#FFF1E3] text-[#701C32] hover:bg-[#701C32] hover:text-white transition-colors">Deportes</button>
            <button className="px-6 py-2 rounded-full font-bold text-sm bg-[#FFF1E3] text-[#701C32] hover:bg-[#701C32] hover:text-white transition-colors">Cultura</button>
            <button className="px-6 py-2 rounded-full font-bold text-sm bg-[#FFF1E3] text-[#701C32] hover:bg-[#701C32] hover:text-white transition-colors">Eventos</button>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Article 1 */}
            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col">
              <div className="relative h-60 overflow-hidden">
                <img alt="Feria de Ciencias" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8ulXudOIR7WBzlFcCSCtTLL9O5jZ-dY0t3YOZNBiZy7lYFudE8mw6TMf-SuP2XTC3T0sKxP2DrLZP_I0rGwtvigsDkVRJeEQ12iTTx4fJ0yNF6v_lcDqGJh3H3myAusDT6HbqL9qK_eRbS7XJ84U5igQ33UIBgHI6rvxbPMwgX3jA_5cHBywO1Cu5SxRTt0FmIJalTqN8O8jxvDarKK33OIseaQggxf_VQoRWCD7tccXv5ekTiqfZKisSiUgLjmbskiMx5_MHjCAz"/>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-[#FFF1E3] text-[#701C32] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Académico</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">12 Oct, 2023</span>
                </div>
                <h4 className="text-xl font-black text-[#701C32] mb-4 leading-tight">Éxito total en nuestra Feria de Ciencias 2023</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                  Nuestros alumnos demostraron proyectos innovadores en robótica y biotecnología, destacando el compromiso con la investigación científica institucional.
                </p>
                <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                  Leer más
                  <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </article>

            {/* Article 2 */}
            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col">
              <div className="relative h-60 overflow-hidden">
                <img alt="Campeonato Deportivo" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1Mn40Wqx6aXSMlKISuvypeXRtzgZPRZc3LMb9zLD7pGs4T2kjTZ1e7AoTxa6a_wyqO4g5S5EnIAUN35tcljfYinx_3m-Omd0lYihdWYQxGk6Wf6uiqiyAH4TAb1cT4K2apmwy8jKAVSgDsnrpNWQbLEty9KQZwvBsgOfhRMLTUzGp203C3AMhIdRCMKopj3PNNTm5NXroQ_W9zvJlZk4cUQYVW46oSGgepGGEC81ED6MEYR1dIRzl1_NfwCH_caGTbzUEO1hNoaV7"/>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-[#FFF1E3] text-[#701C32] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Deportes</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">05 Oct, 2023</span>
                </div>
                <h4 className="text-xl font-black text-[#701C32] mb-4 leading-tight">Primeros puestos en el Regional de Matemática</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                  Celebramos el esfuerzo de nuestra delegación de secundaria que obtuvo medallas de oro en el certamen regional más importante del año escolar.
                </p>
                <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                  Leer más
                  <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </article>

            {/* Article 3 */}
            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col">
              <div className="relative h-60 overflow-hidden">
                <img alt="Taller de Oratoria" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYdfHitF3cGUaOx3bVE3yg-UpNX2qWuG0uQkT4jpppXq8_YCbCWWcIr9kySXAjujflh-otNaY48DjXbCoOp3SIcjYyJon2bRilDO4X3-0Is2lZLZK1uOc-yXkNkJvRSTMl6KrMmUL52ySmU0s8_6tcl1OvVJJaNJBg_e_gLVmDw57qoF_Rjio0hvCk4YGC2PXzMtPg8hUCRT0q_640BrDUAIR4QFzyJN7M02ULvD6Xcd8RNvxWLBr7lHc39_h7buek2aqmMS8I6NoH"/>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-[#FFF1E3] text-[#701C32] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Cultura</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">28 Sep, 2023</span>
                </div>
                <h4 className="text-xl font-black text-[#701C32] mb-4 leading-tight">Taller de Oratoria: Liderazgo desde el aula</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                  Iniciamos un nuevo ciclo de formación en habilidades blandas, potenciando la voz y la confianza de nuestros futuros líderes en un entorno seguro.
                </p>
                <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                  Leer más
                  <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </article>

            {/* Article 4 */}
            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col">
              <div className="relative h-60 overflow-hidden">
                <img alt="Infraestructura" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDu0vQ65OwZKHBD3Lt0hTzEN4cGhR2GGdbuNhX3l3DABC94yLNQuOa5AzUcL9rAvNzwjJeH2vtEj5KU0C4oAjRHnhbg5-AmTkbCTCJ4EGTDSwpxDXK4gvYVPKjryglfDmgTFO6L_nXUzTt03t2fhPlBCFKkWegqTkOFr5yriouUTzWajvOHE4Jo4_wt-ggQI32d6AHJKF3z0zySO8yNJjRhVSN4_svLn0cN6kN36tSVPIOTCHduURF-sq4q1Ovt-FGzPUi7iIHxO1CN"/>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-[#FFF1E3] text-[#701C32] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Institucional</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">15 Sep, 2023</span>
                </div>
                <h4 className="text-xl font-black text-[#701C32] mb-4 leading-tight">Inauguración de modernos laboratorios de STEAM</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                  Nuevos espacios equipados con tecnología de punta para potenciar el aprendizaje práctico en ciencias, tecnología, ingeniería y artes.
                </p>
                <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                  Leer más
                  <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </article>

            {/* Article 5 */}
            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col">
              <div className="relative h-60 overflow-hidden">
                <img alt="Taller de Música" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8ulXudOIR7WBzlFcCSCtTLL9O5jZ-dY0t3YOZNBiZy7lYFudE8mw6TMf-SuP2XTC3T0sKxP2DrLZP_I0rGwtvigsDkVRJeEQ12iTTx4fJ0yNF6v_lcDqGJh3H3myAusDT6HbqL9qK_eRbS7XJ84U5igQ33UIBgHI6rvxbPMwgX3jA_5cHBywO1Cu5SxRTt0FmIJalTqN8O8jxvDarKK33OIseaQggxf_VQoRWCD7tccXv5ekTiqfZKisSiUgLjmbskiMx5_MHjCAz"/>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-[#FFF1E3] text-[#701C32] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Cultura</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">02 Sep, 2023</span>
                </div>
                <h4 className="text-xl font-black text-[#701C32] mb-4 leading-tight">Encuentro Coral: Voces Amancistas en escena</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                  Nuestro coro institucional deleitó a padres y docentes en una noche llena de talento musical y armonía en nuestro auditorio principal.
                </p>
                <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                  Leer más
                  <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </article>

            {/* Article 6 */}
            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col">
              <div className="relative h-60 overflow-hidden">
                <img alt="Simulacro" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1Mn40Wqx6aXSMlKISuvypeXRtzgZPRZc3LMb9zLD7pGs4T2kjTZ1e7AoTxa6a_wyqO4g5S5EnIAUN35tcljfYinx_3m-Omd0lYihdWYQxGk6Wf6uiqiyAH4TAb1cT4K2apmwy8jKAVSgDsnrpNWQbLEty9KQZwvBsgOfhRMLTUzGp203C3AMhIdRCMKopj3PNNTm5NXroQ_W9zvJlZk4cUQYVW46oSGgepGGEC81ED6MEYR1dIRzl1_NfwCH_caGTbzUEO1hNoaV7"/>
              </div>
              <div className="p-8 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block bg-[#FFF1E3] text-[#701C32] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full">Académico</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">20 Ago, 2023</span>
                </div>
                <h4 className="text-xl font-black text-[#701C32] mb-4 leading-tight">Simulacro de Admisión: Rumbo a la Excelencia</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                  Estudiantes de 5to de secundaria midieron sus conocimientos bajo estandares de las principales universidades nacionales.
                </p>
                <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                  Leer más
                  <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
            </article>
          </div>

          {/* Load More Button */}
          <div className="text-center">
            <button className="bg-[#093E7A] text-white px-12 py-4 rounded-full font-bold hover:bg-[#073365] transition-all shadow-xl shadow-[#093E7A]/30 inline-flex items-center space-x-2">
              <span>Cargar más noticias</span>
              <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer></Footer>
    </div>
  );
}