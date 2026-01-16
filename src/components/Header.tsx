import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <div className="w-12 h-12  rounded-lg flex items-center justify-center text-white">
                <Link href="/">
                  <img
                    src="/logo.png"
                    alt="Logo Amancio Varona"
                    className="h-30 md:h-30 object-contain cursor-pointer"
                  />
                </Link>
              </div>
              <span className="font-black text-xl tracking-tight text-[#701C32] uppercase">Amancio Verona</span>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              <a className="font-bold text-sm uppercase tracking-wider text-slate-700 hover:text-[#701C32] transition-colors" href="/">Inicio</a>
              <a className="font-bold text-sm uppercase tracking-wider text-slate-700 hover:text-[#701C32] transition-colors" href="/noticias">Noticias</a>
              <a className="font-bold text-sm uppercase tracking-wider text-slate-700 hover:text-[#701C32] transition-colors" href="/acerca-de">Acerca de</a>
              <a className="font-bold text-sm uppercase tracking-wider text-slate-700 hover:text-[#701C32] transition-colors" href="/docentes">Docentes</a>
              <a className="font-bold text-sm uppercase tracking-wider text-slate-700 hover:text-[#701C32] transition-colors" href="/calendario">Calendario</a>
              <a className="bg-[#093E7A] text-white px-6 py-2.5 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-[#073365] transition-all shadow-lg shadow-[#093E7A]/20" href="/campus-estudiante">Campus Estudiantil</a>
            </div>
            <div className="md:hidden">
              <span className="material-icons-round text-3xl cursor-pointer text-[#701C32]">menu</span>
            </div>
          </div>
        </div>
      </nav> 
  );
}