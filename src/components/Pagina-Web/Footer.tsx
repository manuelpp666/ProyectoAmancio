"use client";
import Link from "next/link";
import { useConfiguracion } from "@/src/hooks/useConfiguracion"; // Asegúrate de que la ruta sea correcta

export default function Footer() {
  // Traemos los datos de la sección 'footer'
  const { data, loading } = useConfiguracion('footer');

  // Función auxiliar para obtener el valor o uno por defecto
  const getVal = (clave: string, defecto: string) => {
    const item = data.find(i => i.clave === clave);
    return item ? item.valor : defecto;
  };

  // Redes sociales (solo se muestran las que tengan link configurado)
  const redes = [
    {
      nombre: "Facebook",
      url: getVal("footer_facebook", "").trim(),
      icono: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.892h-2.33v6.987C18.343 21.128 22 16.991 22 12z" />
        </svg>
      ),
    },
    {
      nombre: "YouTube",
      url: getVal("footer_youtube", "").trim(),
      icono: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      nombre: "TikTok",
      url: getVal("footer_tiktok", "").trim(),
      icono: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      ),
    },
  ].filter(r => r.url !== "");

  return (
    <footer className="bg-[#701C32] text-white pt-20 pb-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-[#701C32]">
                <Link href="/">
                  <img
                    src="/logo.png"
                    alt="Logo Amancio Varona"
                    className="h-30 md:h-30 object-contain cursor-pointer"
                  />
                </Link>
              </div>
              <span className="font-black text-xl tracking-tight uppercase">Amancistas</span>
            </div>
            {/* DESCRIPCIÓN DINÁMICA */}
            <p className="text-[#FFF1E3]/80 text-sm leading-relaxed">
              {getVal('footer_descripcion', 'Comprometidos con la formación integral de ciudadanos éticos, competentes y preparados para transformar la sociedad.')}
            </p>

            {/* REDES SOCIALES DINÁMICAS */}
            {redes.length > 0 && (
              <div className="mt-6">
                <p className="text-[#FFF1E3]/60 text-xs font-bold uppercase tracking-widest mb-3">Síguenos</p>
                <div className="flex items-center gap-3">
                  {redes.map((red) => (
                    <a
                      key={red.nombre}
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={red.nombre}
                      title={red.nombre}
                      className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#FFF1E3] hover:bg-white hover:text-[#701C32] hover:scale-110 transition-all"
                    >
                      {red.icono}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h5 className="font-black text-lg mb-6 text-white">Enlaces Rápidos</h5>
            <ul className="space-y-4 text-[#FFF1E3]/70">
              <li><Link className="hover:text-[#FFF1E3] transition-colors" href="/campus">Campus</Link></li>
              <li><Link className="hover:text-[#FFF1E3] transition-colors" href="/noticias">Noticias</Link></li>
              <li><Link className="hover:text-[#FFF1E3] transition-colors" href="/acerca-de">Acerca De</Link></li>
              <li><Link className="hover:text-[#FFF1E3] transition-colors" href="/docentes">Docentes</Link></li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2">
            <h5 className="font-black text-lg mb-6 text-white">Contáctanos</h5>
            <div className="space-y-4">
              {/* DIRECCIÓN DINÁMICA */}
              <div className="flex items-center space-x-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <span className="material-icons-round text-[#FFF1E3]">place</span>
                </div>
                <span className="text-[#FFF1E3]/80">
                  {getVal('footer_direccion', 'Av. Las Orquídeas 123, Urb. San Isidro')}
                </span>
              </div>

              {/* EMAIL DINÁMICO */}
              <div className="flex items-center space-x-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <span className="material-icons-round text-[#FFF1E3]">mail</span>
                </div>
                <span className="text-[#FFF1E3]/80">
                  {getVal('footer_correo', 'informes@amancistas.edu.pe')}
                </span>
              </div>

              {/* TELÉFONO DINÁMICO */}
              <div className="flex items-center space-x-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                  <span className="material-icons-round text-[#FFF1E3]">phone</span>
                </div>
                <span className="text-[#FFF1E3]/80">
                  {getVal('footer_telefono', '+51 987 654 321')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 text-center">
          <p className="text-[#FFF1E3]/50 text-xs">
            {new Date().getFullYear()} © Copyright Amancio Varona | Todos los Derechos Reservados
          </p>
        </div>
      </div>
    </footer>
  );
}