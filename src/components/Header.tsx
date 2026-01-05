import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full">
      {/* Franja superior guinda */}
      <div className="h-8 w-full bg-colegio-red"></div>

      {/* Navegación Principal */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-white shadow-sm">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/">
            <img 
              src="/logo.png" // Asegúrate de que el nombre sea exacto en /public
              alt="Logo Amancio Varona" 
              className="h-16 md:h-20 object-contain cursor-pointer" 
            />
          </Link>
        </div>

        {/* Menú de Enlaces */}
        <div className="hidden lg:flex items-center gap-8">
          <Link href="/" className="text-sm font-bold text-gray-800 hover:text-colegio-blue transition-colors">
            INICIO
          </Link>
          <Link href="/noticias" className="text-sm font-bold text-gray-800 hover:text-colegio-blue transition-colors">
            NOTICIAS
          </Link>
          <Link href="/acerca-de" className="text-sm font-bold text-gray-800 hover:text-colegio-blue transition-colors">
            ACERCA DE
          </Link>
          <Link href="/docentes" className="text-sm font-bold text-gray-800 hover:text-colegio-blue transition-colors">
            DOCENTES
          </Link>
          <Link href="/calendario" className="text-sm font-bold text-gray-800 hover:text-colegio-blue transition-colors">
            CALENDARIO ANUAL
          </Link>
        </div>

        {/* Botón Campus */}
        <Link 
          href="/campus" 
          className="bg-colegio-blue text-white px-5 py-2.5 rounded flex items-center gap-2 text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md"
        >
          Campus Estudiante 
          <span className="text-lg">→</span>
        </Link>
      </nav>
    </header>
  );
}