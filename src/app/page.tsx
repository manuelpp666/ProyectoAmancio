"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import Header from "../components/Header";
export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const propuestas = [
    {
      titulo: "Enfoque Científico",
      descripcion: "Nuestra metodología fomenta la curiosidad natural y el pensamiento crítico a través de laboratorios modernos y proyectos de investigación aplicada desde temprana edad. Preparamos a nuestros estudiantes para los desafíos tecnológicos del mañana.",
      icon: "biotech",
      badge: "lightbulb",
      color: "#701C32"
    },
    {
      titulo: "Enfoque Humanístico",
      descripcion: "Priorizamos la formación en valores, ética y responsabilidad social. A través de la literatura, la historia y el debate, desarrollamos ciudadanos conscientes de su entorno y capaces de liderar con empatía.",
      icon: "history_edu",
      badge: "auto_stories",
      color: "#701C32"
    },
    {
      titulo: "Enfoque Artístico",
      descripcion: "Potenciamos la expresión creativa mediante talleres de música, artes plásticas y teatro. Creemos que el arte es fundamental para el desarrollo de la sensibilidad y la resolución creativa de problemas.",
      icon: "palette",
      badge: "music_note",
      color: "#701C32"
    },
    {
      titulo: "Enfoque Deportivo",
      descripcion: "Promovemos un estilo de vida saludable y el trabajo en equipo a través de diversas disciplinas deportivas. Nuestras infraestructuras están diseñadas para forjar la disciplina, la resiliencia y la salud física.",
      icon: "sports_soccer",
      badge: "emoji_events",
      color: "#701C32"
    }
  ];

  // Opcional: Auto-reproducción cada 5 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % propuestas.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="bg-white text-slate-800 transition-colors duration-300">


      {/* Navigation */}
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-[#FFF1E3]">
          <div className="absolute inset-0 z-0">
            <img alt="Students in campus" className="w-full h-full object-cover opacity-30" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDu0vQ65OwZKHBD3Lt0hTzEN4cGhR2GGdbuNhX3l3DABC94yLNQuOa5AzUcL9rAvNzwjJeH2vtEj5KU0C4oAjRHnhbg5-AmTkbCTCJ4EGTDSwpxDXK4gvYVPKjryglfDmgTFO6L_nXUzTt03t2fhPlBCFKkWegqTkOFr5yriouUTzWajvOHE4Jo4_wt-ggQI32d6AHJKF3z0zySO8yNJjRhVSN4_svLn0cN6kN36tSVPIOTCHduURF-sq4q1Ovt-FGzPUi7iIHxO1CN" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
          </div>
          <div className="relative z-10 text-center px-4 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-black text-[#701C32] mb-6 leading-tight">Formando líderes para el futuro</h1>
            <p className="text-xl md:text-2xl text-slate-700 mb-10 font-light">Excelencia académica y valores que trascienden generaciones.</p>
            <button className="bg-[#093E7A] text-white px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-[#093E7A]/30 flex items-center space-x-2 mx-auto">
              <span>Admisión 2024</span>
              <span className="material-icons-round">arrow_forward</span>
            </button>
          </div>
        </section>

        {/* Educational Proposal Section */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-[#701C32] mb-4">Propuesta Educativa</h2>
              <div className="w-24 h-1.5 bg-[#701C32] mx-auto rounded-full"></div>
            </div>

            <div className="relative group">
              {/* Contenedor con transición suave */}
              <div className="bg-[#FFF1E3] rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12 shadow-inner border border-white min-h-[450px] transition-all duration-500 ease-in-out">

                {/* Lado de la Imagen/Icono */}
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className="relative w-64 h-64 bg-white rounded-full flex items-center justify-center shadow-xl animate-fadeIn">
                    <span className="material-icons-round text-[120px] text-[#701C32] transition-all duration-500">
                      {propuestas[currentSlide].icon}
                    </span>
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#093E7A] rounded-2xl flex items-center justify-center text-white rotate-12 shadow-lg">
                      <span className="material-icons-round text-3xl">
                        {propuestas[currentSlide].badge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado del Texto */}
                <div className="w-full md:w-1/2 text-center md:text-left">
                  <h3 className="text-3xl font-black text-[#701C32] mb-6 transition-all">
                    {propuestas[currentSlide].titulo}
                  </h3>
                  <p className="text-lg text-slate-700 leading-relaxed mb-8 min-h-[120px]">
                    {propuestas[currentSlide].descripcion}
                  </p>

                  {/* Dots / Navegación del Carrusel */}
                  <div className="flex justify-center md:justify-start space-x-3">
                    {propuestas.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`h-3 rounded-full transition-all duration-300 ${currentSlide === index ? "w-10 bg-[#701C32]" : "w-3 bg-slate-300 hover:bg-slate-400"
                          }`}
                        aria-label={`Ir al slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Levels Section */}
        <section className="py-24 px-4 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-[#701C32] mb-4">Conoce nuestra metodología por niveles</h2>
              <p className="text-slate-500 font-medium">Adaptamos el aprendizaje a cada etapa del desarrollo</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-transform border border-slate-100">
                <div className="w-20 h-20 bg-[#FFF1E3] rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-icons-round text-4xl text-[#701C32]">child_care</span>
                </div>
                <h3 className="text-2xl font-black text-[#093E7A] mb-4">Nivel Primaria</h3>
                <p className="text-slate-600 mb-6">Fomentamos la creatividad y las habilidades sociales a través del juego y el descubrimiento guiado.</p>
                <a className="text-[#701C32] font-bold flex items-center group" href="#">
                  Saber más
                  <span className="material-icons-round ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-transform border border-slate-100">
                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-icons-round text-4xl text-[#093E7A]">menu_book</span>
                </div>
                <h3 className="text-2xl font-black text-[#093E7A] mb-4">Nivel Secundaria</h3>
                <p className="text-slate-600 mb-6">Fortalecemos la autonomía académica y el pensamiento crítico con un enfoque pre-universitario integral.</p>
                <a className="text-[#701C32] font-bold flex items-center group" href="#">
                  Saber más
                  <span className="material-icons-round ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
              <div className="bg-white p-8 rounded-[2rem] shadow-xl hover:-translate-y-2 transition-transform border border-slate-100">
                <div className="w-20 h-20 bg-[#FFF1E3] rounded-2xl flex items-center justify-center mb-6">
                  <span className="material-icons-round text-4xl text-[#701C32]">workspace_premium</span>
                </div>
                <h3 className="text-2xl font-black text-[#093E7A] mb-4">Academia Pre</h3>
                <p className="text-slate-600 mb-6">Especialización intensiva diseñada para el ingreso exitoso a las mejores universidades del país.</p>
                <a className="text-[#701C32] font-bold flex items-center group" href="#">
                  Saber más
                  <span className="material-icons-round ml-2 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </a>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col">
                <div className="relative h-56 overflow-hidden">
                  <img alt="Feria de Ciencias" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8ulXudOIR7WBzlFcCSCtTLL9O5jZ-dY0t3YOZNBiZy7lYFudE8mw6TMf-SuP2XTC3T0sKxP2DrLZP_I0rGwtvigsDkVRJeEQ12iTTx4fJ0yNF6v_lcDqGJh3H3myAusDT6HbqL9qK_eRbS7XJ84U5igQ33UIBgHI6rvxbPMwgX3jA_5cHBywO1Cu5SxRTt0FmIJalTqN8O8jxvDarKK33OIseaQggxf_VQoRWCD7tccXv5ekTiqfZKisSiUgLjmbskiMx5_MHjCAz" />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <span className="inline-block bg-[#FFF1E3] text-[#701C32] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">Académico</span>
                  <h4 className="text-xl font-black text-slate-900 mb-4 leading-tight">Éxito total en nuestra Feria de Ciencias 2023</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                    Nuestros alumnos demostraron proyectos innovadores en robótica y biotecnología, destacando el compromiso con la investigación científica.
                  </p>
                  <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                    Leer más
                    <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </a>
                </div>
              </article>
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col">
                <div className="relative h-56 overflow-hidden">
                  <img alt="Concurso de Matemática" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1Mn40Wqx6aXSMlKISuvypeXRtzgZPRZc3LMb9zLD7pGs4T2kjTZ1e7AoTxa6a_wyqO4g5S5EnIAUN35tcljfYinx_3m-Omd0lYihdWYQxGk6Wf6uiqiyAH4TAb1cT4K2apmwy8jKAVSgDsnrpNWQbLEty9KQZwvBsgOfhRMLTUzGp203C3AMhIdRCMKopj3PNNTm5NXroQ_W9zvJlZk4cUQYVW46oSGgepGGEC81ED6MEYR1dIRzl1_NfwCH_caGTbzUEO1hNoaV7" />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <span className="inline-block bg-[#FFF1E3] text-[#701C32] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">Académico</span>
                  <h4 className="text-xl font-black text-slate-900 mb-4 leading-tight">Primeros puestos en el Regional de Matemática</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                    Celebramos el esfuerzo de nuestra delegación de secundaria que obtuvo 5 medallas de oro en el certamen regional más importante.
                  </p>
                  <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                    Leer más
                    <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </a>
                </div>
              </article>
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border border-slate-100 flex flex-col">
                <div className="relative h-56 overflow-hidden">
                  <img alt="Taller de Oratoria" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYdfHitF3cGUaOx3bVE3yg-UpNX2qWuG0uQkT4jpppXq8_YCbCWWcIr9kySXAjujflh-otNaY48DjXbCoOp3SIcjYyJon2bRilDO4X3-0Is2lZLZK1uOc-yXkNkJvRSTMl6KrMmUL52ySmU0s8_6tcl1OvVJJaNJBg_e_gLVmDw57qoF_Rjio0hvCk4YGC2PXzMtPg8hUCRT0q_640BrDUAIR4QFzyJN7M02ULvD6Xcd8RNvxWLBr7lHc39_h7buek2aqmMS8I6NoH" />
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <span className="inline-block bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">Cultura</span>
                  <h4 className="text-xl font-black text-slate-900 mb-4 leading-tight">Taller de Oratoria: Liderazgo desde el aula</h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-grow">
                    Iniciamos un nuevo ciclo de formación en habilidades blandas, potenciando la voz y la confianza de nuestros futuros líderes.
                  </p>
                  <a className="text-[#093E7A] font-bold text-sm flex items-center group hover:text-[#701C32] transition-colors" href="#">
                    Leer más
                    <span className="material-symbols-outlined text-lg ml-1 group-hover:translate-x-1 transition-transform">chevron_right</span>
                  </a>
                </div>
              </article>
            </div>
            <div className="mt-16 text-center">
              <button className="bg-[#093E7A] text-white px-10 py-4 rounded-full font-bold hover:bg-[#073365] transition-all shadow-xl shadow-[#093E7A]/30 inline-flex items-center space-x-2">
                <span>Cargar más</span>
                <span className="material-symbols-outlined">expand_more</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}