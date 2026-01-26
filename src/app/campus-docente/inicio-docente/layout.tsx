"use client";
import { useState } from "react";
// Importamos el nuevo componente. Ajusta la ruta si es necesario.
import { AsideDocente } from "../../../components/CampusDocente/AsideDocente"; 
import { Menu, Bell } from "lucide-react";

export default function DocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F2F4F7] font-sans text-slate-800">
      
      {/* Overlay para móvil */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* USAMOS EL COMPONENTE ASIDE DOCENTE */}
      <AsideDocente 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER SUPERIOR (Igual diseño) */}
        <header className="h-16 lg:h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shrink-0 shadow-sm">
          
          <div className="flex items-center gap-3 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-[#701C32] p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-[#701C32] text-lg">Docente</span>
          </div>
          
          <div className="hidden lg:block">
             <h2 className="font-bold text-gray-800 text-xl">Bienvenido, Profesor</h2>
             <p className="text-xs text-gray-500">Panel de gestión académica</p>
          </div>

          <div className="flex items-center gap-4 lg:gap-6 ml-auto">
            <button className="relative text-gray-400 hover:text-[#701C32] transition-colors p-2 hover:bg-gray-50 rounded-full">
              <Bell size={22} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block leading-tight">
                <p className="text-sm font-bold text-gray-800">Prof. Juan Perez</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase">Docente Principal</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-gray-100 overflow-hidden bg-gray-50 p-0.5">
                 <img 
                   src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                   alt="Perfil" 
                   className="w-full h-full object-cover rounded-full"
                 />
              </div>
            </div>
          </div>
        </header>

        {/* PÁGINAS */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}