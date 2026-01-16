import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

export default function Page() {
    return (
        <div className="antialiased bg-white text-slate-800">


            {/* Navigation */}
            <Header></Header>

            <main>
                {/* Hero Section */}
                <section className="relative py-20 bg-[#FFF1E3]">
                    <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
                        <h1 className="text-4xl md:text-5xl font-black text-[#701C32] mb-4 leading-tight">Nuestros Docentes</h1>
                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-light">
                            Contamos con un equipo de profesionales apasionados, dedicados a inspirar y guiar a cada estudiante en su camino hacia la excelencia.
                        </p>
                    </div>
                </section>

                {/* Teachers Grid */}
                <section className="py-24 px-4 bg-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {/* Teacher 1 */}
                            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
                                <div className="relative h-72 overflow-hidden bg-slate-50">
                                    <img alt="Docente Matemáticas" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8riFGzxF7Xi8k51pIcOWgyT-W41kMVT9oI3dC7rx8P4ctXhFpXEuJ6ndr0oD5mVmU1zmHR9mYFcRDHi7vYtTXksD5tDRXffR0466FYDWpxLxvruXMDHNWV9uAt-4XvZDJWkj2gDgKzpMYSkrX4QjFKlZRKSu5jYn-MuZ549oHqHCjD7xnYlXHQ4VhwZsGSWNSq9LJKqm269dAbViBdoKxoqCd51LurobyxRHDeUo9qit1md6Oc65qP3Rlno-slOMA2UFWmjjiIYUc" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow text-center">
                                    <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">Matemáticas</span>
                                    <h3 className="text-xl font-black text-[#701C32] mb-2 font-display">Dr. Ricardo Espinoza</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        Especialista en didáctica de las matemáticas con más de 15 años de experiencia en formación pre-universitaria.
                                    </p>
                                </div>
                            </article>

                            {/* Teacher 2 */}
                            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
                                <div className="relative h-72 overflow-hidden bg-slate-50">
                                    <img alt="Docente Literatura" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAt5AXZgv6uMwV_iPVEshxTY0vjn-5vWhhl3OjzhvS4uD-xIsx51VEkG5DQ-cFgYK2qvbAvq3XS3ButrNVB6Pn3HaZdGv0uAuYOtLwnnyn3daY6f0HV3J-fFB_7l0REtB6fhG8y1_dSjrmHlqDVvH44GUl0AHzCdfAvZw_mBzlTBtcbc8INo5rvO501U6WAusYlbyKNPDxWO3WD90ZmFF00JVaoHKyVs0kvkZzYBXxCbjnlJoGhLPhgDBIxp2ZmzBGSM_SrylrNVadN" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow text-center">
                                    <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">Comunicación</span>
                                    <h3 className="text-xl font-black text-[#701C32] mb-2 font-display">Mg. Lucía Valdivia</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        Apasionada por la literatura y la expresión oral, fomenta el pensamiento crítico a través del análisis textual.
                                    </p>
                                </div>
                            </article>

                            {/* Teacher 3 */}
                            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
                                <div className="relative h-72 overflow-hidden bg-slate-50">
                                    <img alt="Docente Ciencias" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfPkBJOzH2RfzJNqusZg1kUcTwAGvdca2_cFvDP3ZIctaXuDX5E75j_ZowL_kafL0gInuVLEAB2H_Z5b-dZlmDR_5IPWAib0Kf35g2R_nSwplc7HWPHZTw5cZGYU7uX9Wc28Sz2vdNZxOOoLfMZBUu5HGts5Ctn80PgQk7eSqCoESRfpl55S4oRwbuiH_ZCjoMq04reSjY9bbYLcoUefr92Cu26VVndTWsvCLpgeRBNmPCfXRoU_KHuzswbPGxXZiKXRjF9j9ry0ZG" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow text-center">
                                    <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">Biología</span>
                                    <h3 className="text-xl font-black text-[#701C32] mb-2 font-display">Dr. Alberto Méndez</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        Investigador científico dedicado a despertar la curiosidad por el mundo natural y la conservación ambiental.
                                    </p>
                                </div>
                            </article>

                            {/* Teacher 4 */}
                            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
                                <div className="relative h-72 overflow-hidden bg-slate-50">
                                    <img alt="Docente Historia" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCeDJEUa3VRVaDxeZyYurSNnKrM-26Y7x98OUAL1PoHVFW_OrKeMceoQ68jyEoRh2yDjzFQ2FBbHdQi1Oi3v_izfzVk4f1ySsocla-1GO5cFh0iIJFHubT9okiOnoOkaqOfWejJeckgO33-JxXNPVDuIbpfHucgEGI5U0LcjlnoKlu6pK2bUJxCb8A2cuvVUuXqtahO1MFlk4Z_nWP_YYXx3KkAkyCq-roNzZLhDO15Y8qhQPppqkw5zWMDNuBiGNitduXKc26Mtm38" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow text-center">
                                    <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">Ciencias Sociales</span>
                                    <h3 className="text-xl font-black text-[#701C32] mb-2 font-display">Lic. Carmen Salazar</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        Experta en historia contemporánea, ayuda a los estudiantes a comprender el presente a través del pasado.
                                    </p>
                                </div>
                            </article>

                            {/* Teacher 5 */}
                            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
                                <div className="relative h-72 overflow-hidden bg-slate-50">
                                    <img alt="Docente Inglés" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-4e1seyEXf4SAI2e7Axtx0jpKRqK3NSgj0i33k6_gdpkyg9TMVC3xjukDgOuR-1QXdW9wpiQizY8C96ZXidac8LDf1OyP3vN16xReis1XlpOCojbTkdwQ7WnEcR0IkNC8IN3C7fdvyNBX-sdBOg_RBcfPoAMNtgvFaJPce88jgQh3PJ1XZY10EI2amJW9t-LxYCmhh7oUfsqxs5gcKNXEcaDZC0IguNMO7c31ophIMVVe35n1CHXg4L52tUc09_u3ifUsv2qoaJjf" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow text-center">
                                    <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">Idiomas</span>
                                    <h3 className="text-xl font-black text-[#701C32] mb-2 font-display">Mg. Robert Thompson</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        Docente bilingüe con enfoque en la comunicación efectiva y la inmersión cultural global.
                                    </p>
                                </div>
                            </article>

                            {/* Teacher 6 */}
                            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
                                <div className="relative h-72 overflow-hidden bg-slate-50">
                                    <img alt="Docente Arte" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGk9k-tkODKmg9SXqXuVn0-LFWawwNVf-kmwPQddRyhQhvgroi4aTZJhfLLQfOXOp8ALtbH96CswYIqY3mQmtb_h13TD0xmIUhFxQ_XIbz04ICr0W2l4yEwmu8-EGkkNA-ZMG6lsrRfQmFmJD2oafPXslkKJqx6BxOn4Py-FSJZxl3Jgl5Y6UuE-iJdMWgT5kkiSC9z-Zir9nM0DxTm55LTdhWK0bo0wfQ_9Gdezfnk7vZwR118-AQVVl0PDW83gbSy7upF9DGUN83" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow text-center">
                                    <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">Arte y Cultura</span>
                                    <h3 className="text-xl font-black text-[#701C32] mb-2 font-display">Lic. Sofía Paredes</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        Promueve la creatividad y la expresión artística como pilares fundamentales del desarrollo humano.
                                    </p>
                                </div>
                            </article>

                            {/* Teacher 7 */}
                            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
                                <div className="relative h-72 overflow-hidden bg-slate-50">
                                    <img alt="Docente Física" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpVzWhL--32i5pPFR9N_ejGRuj_NE1zO_F4LbDxjvDjbgspVRXmu_GE7lqQuIZilHTmM1d2UM_DKB88OMth3j30BbNFakik86girI7lSD0zF6_bdxMbhw2PLWTBRnvewKkhvMzi4Ex6X4QOyEPTgZd6k5OVGXpudo6ElfCsY1nZ2o0NNTSluuOwBp9RK1OAdajkVuK-uImh09kyGgxn9l2lvgrXgMczJKZpcBsZdGwc3cCq-42Ah3bGtXmwabz9tQqnyAz6be_-912" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow text-center">
                                    <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">Física Elemental</span>
                                    <h3 className="text-xl font-black text-[#701C32] mb-2 font-display">Ing. Marcos Ruíz</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        Aplica la tecnología y la experimentación práctica para explicar los fenómenos del universo.
                                    </p>
                                </div>
                            </article>

                            {/* Teacher 8 */}
                            <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group">
                                <div className="relative h-72 overflow-hidden bg-slate-50">
                                    <img alt="Docente Psicología" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqYvWriLMQaI70Yt0_I44MzsUr_Mqz41M1XaMsPlALGGME_OjY9IsFtPYIBLL4PNx_P3YR8MLKf8RIYaKG99yVs4n8c-zLeFx1CuCi7PLQql3t1Od0DmfVFxOg3JiEKODRA3vqWcBJTN9eXk3oPcdTO5jm4HAmXFAV_8qRV7W7lC38XkKe_8EDLzpz8d1WpaMWyoybrSd8TD5liaq_6r7fPMtQGA4VQsuATH1UhNO76Zis0WU-jQ0XXpZauqakMEYqU3Q27B240SMV" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow text-center">
                                    <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[11px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">Psicopedagogía</span>
                                    <h3 className="text-xl font-black text-[#701C32] mb-2 font-display">Mg. Andrea Castro</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
                                        Especialista en acompañamiento emocional y optimización de procesos de aprendizaje individualizado.
                                    </p>
                                </div>
                            </article>
                        </div>

                        {/* Load More Button */}
                        <div className="mt-16 text-center">
                            <button className="bg-[#093E7A] text-white px-10 py-4 rounded-full font-bold hover:bg-[#073365] transition-all shadow-xl shadow-[#093E7A]/30 inline-flex items-center space-x-2">
                                <span>Cargar más docentes</span>
                                <span className="material-symbols-outlined">expand_more</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>


            {/* Footer */}
            <Footer></Footer>
        </div>
    );
}