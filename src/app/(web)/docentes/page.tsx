import Header from "@/src/components/Pagina-Web/Header";
import Footer from "@/src/components/Pagina-Web/Footer";
import { Docente } from "@/src/interfaces/docente";
import ChatWidget from "@/src/components/utils/ChatbotWidget";

export const dynamic = "force-dynamic";
// Función para obtener los docentes desde el servidor
async function getDocentes(): Promise<Docente[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docentes/`, {
      next: { revalidate: 60 },
      // Es buena idea añadir un timeout para que la web no se quede "colgada" esperando al back
      signal: AbortSignal.timeout(7000)
    });

    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error cargando docentes:", error);
    return []; // Retorna un array vacío para que el componente siga funcionando
  }
}

// Configuración editable desde Contenido Web (sección 'docentes')
async function getConfigDocentes(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion/docentes`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(7000)
    });
    if (!res.ok) return {};
    const data: { clave: string; valor: string }[] = await res.json();
    return Object.fromEntries(data.map(i => [i.clave, i.valor]));
  } catch {
    return {};
  }
}

export default async function Page() {
  const [docentes, config] = await Promise.all([getDocentes(), getConfigDocentes()]);

  const getVal = (clave: string, defecto: string) => config[clave]?.trim() || defecto;
  const titulo = getVal('docentes_titulo', 'Nuestros Docentes');
  const subtitulo = getVal('docentes_subtitulo', 'Contamos con un equipo de profesionales apasionados, dedicados a inspirar y guiar a cada estudiante en su camino hacia la excelencia.');
  const heroImagen = config['docentes_imagen']?.trim() || "";

  // Mostramos solo docentes activos y marcados como visibles en la web
  const docentesActivos = docentes.filter(d => d.usuario?.activo && d.visible_web !== false);

  return (
    <div className="antialiased bg-white text-slate-800">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative py-28 overflow-hidden bg-gradient-to-br from-[#701C32] via-[#701C32] to-[#093E7A]">
          {/* Imagen de fondo opcional */}
          {heroImagen && (
            <div className="absolute inset-0 z-0">
              <img alt="" className="w-full h-full object-cover opacity-25" src={heroImagen} />
              <div className="absolute inset-0 bg-gradient-to-br from-[#701C32]/90 to-[#093E7A]/90"></div>
            </div>
          )}
          {/* Formas decorativas difuminadas */}
          <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/10 rounded-full blur-3xl z-0"></div>
          <div className="absolute -bottom-24 -left-10 w-96 h-96 bg-[#093E7A]/40 rounded-full blur-3xl z-0"></div>

          <div className="max-w-7xl mx-auto px-4 text-center relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-full mb-5">
              <span className="material-symbols-outlined text-base">school</span>
              Plana Docente
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-5 leading-tight drop-shadow-lg">
              {titulo}
            </h1>
            <div className="w-24 h-1.5 bg-white/80 mx-auto rounded-full mb-6"></div>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto font-light leading-relaxed">
              {subtitulo}
            </p>
          </div>
        </section>

        {/* Teachers Grid */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            {docentesActivos.length > 0 && (
              <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest mb-12">
                {docentesActivos.length} {docentesActivos.length === 1 ? 'docente' : 'docentes'} a tu servicio
              </p>
            )}
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