import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#701C32] text-white pt-20 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-[#701C32]">
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
              <p className="text-[#FFF1E3]/80 text-sm leading-relaxed">
                Comprometidos con la formación integral de ciudadanos éticos, competentes y preparados para transformar la sociedad.
              </p>
            </div>
            <div>
              <h5 className="font-black text-lg mb-6 text-white">Enlaces Rápidos</h5>
              <ul className="space-y-4 text-[#FFF1E3]/70">
                <li><a className="hover:text-[#FFF1E3] transition-colors" href="#">Admisión 2024</a></li>
                <li><a className="hover:text-[#FFF1E3] transition-colors" href="#">Convenios Universitarios</a></li>
                <li><a className="hover:text-[#FFF1E3] transition-colors" href="#">Extracurriculares</a></li>
                <li><a className="hover:text-[#FFF1E3] transition-colors" href="#">Galería de Fotos</a></li>
              </ul>
            </div>
            <div className="col-span-1 md:col-span-2">
              <h5 className="font-black text-lg mb-6 text-white">Contáctanos</h5>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <span className="material-icons-round text-[#FFF1E3]">place</span>
                  </div>
                  <span className="text-[#FFF1E3]/80">Av. Las Orquídeas 123, Urb. San Isidro</span>
                </div>
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <span className="material-icons-round text-[#FFF1E3]">mail</span>
                  </div>
                  <span className="text-[#FFF1E3]/80">informes@amancistas.edu.pe</span>
                </div>
                <div className="flex items-center space-x-4 group cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <span className="material-icons-round text-[#FFF1E3]">phone</span>
                  </div>
                  <span className="text-[#FFF1E3]/80">+51 987 654 321</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-10 border-t border-white/10 text-center">
            <p className="text-[#FFF1E3]/50 text-xs">
              2024 © Copyright Amancio Varona Yumari | Todos los Derechos Reservados
            </p>
          </div>
        </div>
      </footer>
    );
}