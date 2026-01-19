"use client"; // Necesario para que funcione el botón del menú móvil

import { useState } from "react";
import Link from "next/link";
import { 
  Home, 
  BookOpen, 
  MessageSquare, 
  User, 
  ArrowLeftRight, 
  ChevronDown, 
  Bell,
  Menu, // Icono de hamburguesa
  X     // Icono de cerrar
} from "lucide-react";

export default function CampusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Estado para controlar si el menú móvil está abierto o cerrado
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F2F4F7] font-sans text-slate-800">
      
      {/* --- OVERLAY OSCURO (Solo móvil) --- */}
      {/* Se muestra cuando el menú está abierto para oscurecer el fondo */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* --- SIDEBAR (Barra Lateral) --- */}
      {/* Clases Clave para Responsive:
         - fixed inset-y-0 left-0: Fija la barra a la izquierda.
         - transform transition-transform: Permite la animación de deslizar.
         - -translate-x-full: Por defecto oculta la barra hacia la izquierda en móvil.
         - lg:translate-x-0 lg:static: En pantallas grandes (lg), la barra siempre se ve y deja de ser flotante.
      */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#701C32] text-white flex flex-col h-screen overflow-y-auto transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-auto lg:flex
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative">
               {/* Asegúrate de que esta ruta sea correcta */}
               <img src="/logo.png" alt="Logo" className="object-contain" />
            </div>
            <span className="font-bold text-lg leading-tight">Campus Virtual</span>
          </div>
          {/* Botón cerrar solo visible en móvil dentro del menú */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation - ¡CONTENIDO INTACTO! */}
        <nav className="flex-1 py-6 space-y-2 px-3">
          
          <Link 
            href="/campus-estudiante/inicio-campus" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg text-white font-medium transition-colors"
          >
            <Home size={20} />
            Inicio
          </Link>

          <Link 
            href="/campus-estudiante/inicio-campus/cursos" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors group"
          >
            <BookOpen size={20} className="group-hover:text-white"/>
            Cursos
          </Link>

          <Link 
            href="/campus-estudiante/inicio-campus/mensajeria" 
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors group"
          >
            <MessageSquare size={20} className="group-hover:text-white"/>
            Mensajería
          </Link>

          {/* Dropdowns simulados (Botones originales) */}
          <button className="w-full flex items-center justify-between px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left group">
              <div className="flex items-center gap-3">
                <User size={20} className="group-hover:text-white"/>
                Alumno
              </div>
              <ChevronDown size={16} />
          </button>

          <button className="w-full flex items-center justify-between px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors text-left group">
              <div className="flex items-center gap-3">
                <ArrowLeftRight size={20} className="group-hover:text-white"/>
                Trámites
              </div>
              <ChevronDown size={16} />
          </button>
        </nav>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* HEADER SUPERIOR */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shrink-0">
          
          {/* Botón Menú Hamburguesa (Solo visible en móvil lg:hidden) */}
          <div className="flex items-center gap-3 lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-[#701C32] p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={28} />
            </button>
            <span className="font-bold text-[#701C32] text-lg">Campus Virtual</span>
          </div>
          
          {/* Espaciador para desktop (mantiene alineación) */}
          <div className="hidden lg:block"></div>

          {/* Área Derecha (Notificaciones y Perfil) */}
          <div className="flex items-center gap-4 lg:gap-6 ml-auto">
            <Link 
              href="/campus-estudiante/inicio-campus/notificaciones" 
              className="relative text-gray-400 hover:text-[#701C32] transition-colors"
            >
              <Bell size={22} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </Link>
            
            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block leading-tight">
                <p className="text-sm font-bold text-gray-800">Gabriela Antonet</p>
                <p className="text-[11px] text-gray-500">5to Año de Secundaria</p>
              </div>
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full border border-gray-200 overflow-hidden p-0.5">
                 <img 
                   src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriela" 
                   alt="Perfil" 
                   className="w-full h-full object-cover rounded-full bg-gray-100"
                 />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENIDO DE PÁGINAS */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}