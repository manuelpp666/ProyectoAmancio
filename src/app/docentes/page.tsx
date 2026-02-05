import Header from "@/src/components/Pagina-Web/Header";
import Footer from "@/src/components/Pagina-Web/Footer";
import { Docente } from "@/src/interfaces/docente";
import ChatWidget from "@/src/components/utils/ChatbotWidget";

// Función para obtener los docentes desde el servidor
async function getDocentes(): Promise<Docente[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docentes/`, {
    next: { revalidate: 60 } // Revalida los datos cada minuto
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function Page() {
  const docentes = await getDocentes();

  // Filtramos solo los docentes activos para la página pública
  const docentesActivos = docentes.filter(d => d.usuario?.activo);

  return (
    <div className="antialiased bg-white text-slate-800">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-20 bg-[#FFF1E3]">
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-[#701C32] mb-4 leading-tight">
              Nuestros Docentes
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto font-light">
              Contamos con un equipo de profesionales apasionados, dedicados a inspirar y guiar a cada estudiante en su camino hacia la excelencia.
            </p>
          </div>
        </section>

        {/* Teachers Grid */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

              {docentesActivos.map((docente) => {
                // Lógica de imagen: URL de Cloudinary o Avatar con iniciales
                const fotoDocente = docente.url_perfil && docente.url_perfil.trim() !== ""
                  ? docente.url_perfil
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(docente.nombres + ' ' + docente.apellidos)}&background=093E7A&color=fff&size=512`;

                return (
                  <article
                    key={docente.id_docente}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col group"
                  >
                    <div className="relative h-80 overflow-hidden bg-slate-50">
                      <img
                        alt={`${docente.nombres} ${docente.apellidos}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={fotoDocente}
                      />
                      {/* Overlay decorativo suave */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#093E7A]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-6 flex flex-col flex-grow text-center">
                      <span className="inline-block bg-[#093E7A]/10 text-[#093E7A] font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full w-fit mx-auto mb-3">
                        {docente.especialidad || 'Docente'}
                      </span>
                      <h3 className="text-xl font-black text-[#701C32] mb-2">
                        {docente.nombres} {docente.apellidos}
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                        {docente.descripcion || 'Comprometido con la formación integral de nuestros estudiantes.'}
                      </p>
                    </div>
                  </article>
                );
              })}

            </div>

            {/* Empty State: Por si no hay docentes registrados */}
            {docentesActivos.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-400 font-medium italic">Próximamente conocerás a nuestro equipo docente.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      {/* WIDGET DE AMANCIO IA */}
      <ChatWidget />
    </div>
  );
}