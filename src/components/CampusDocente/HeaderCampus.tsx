"use client";
import { useState, useRef, useEffect } from "react";
import { Menu, Bell, User, Key, LogOut } from "lucide-react";
import Link from "next/link";

export function HeaderCampus({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-3 lg:hidden">
        <button onClick={onOpenMenu} className="text-[#701C32] p-1">
          <Menu size={28} />
        </button>
        <span className="font-bold text-[#701C32] text-lg">Campus Virtual</span>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <Link href="/notificaciones" className="relative text-gray-400">
          <Bell size={22} />
        </Link>

        {/* Contenedor del Perfil con Menú Desplegable */}
        <div className="relative" ref={menuRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-gray-800">Gabriela Antonet</p>
              <p className="text-[11px] text-gray-500">5to Año de Secundaria</p>
            </div>
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriela" 
              className="w-10 h-10 rounded-full border border-gray-200" 
              alt="Perfil" 
            />
          </div>

          {/* Menú Desplegable (Dropdown) */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in duration-200">
              <Link 
                href="/perfil" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#701C32]"
              >
                <User size={16} /> Mis Datos
              </Link>
              <Link 
                href="/cambiar-password" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#701C32]"
              >
                <Key size={16} /> Cambiar Contraseña
              </Link>
              <hr className="my-1 border-gray-100" />
              <button 
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                onClick={() => console.log("Cerrar sesión")}
              >
                <LogOut size={16} /> Salir
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}