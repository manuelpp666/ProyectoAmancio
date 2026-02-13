"use client";
import { useState, useRef, useEffect } from "react";
import { Menu, Bell, User, Key, LogOut, Loader2 } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/src/context/userContext";

export function HeaderCampus({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { username, role, logout } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [nombreCompleto, setNombreCompleto] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // EFECTO: Buscar el nombre real en el backend usando el username (DNI)
  useEffect(() => {
    const fetchNombre = async () => {
      if (!username) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/perfil/mi-perfil/${username}`);
        if (response.ok) {
          const data = await response.json();
          // Guardamos "Nombres Apellidos"
          setNombreCompleto(`${data.datos.nombres} ${data.datos.apellidos}`);
        }
      } catch (error) {
        console.error("Error obteniendo nombre para el header:", error);
      }
    };
    fetchNombre();
  }, [username]);

  // Cerrar el menú si se hace clic fuera
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
        <Link href="/campus/perfil/notificaciones" className="relative text-gray-400 hover:text-[#701C32] transition-colors">
          <Bell size={22} />
        </Link>

        {/* Contenedor del Perfil */}
        <div className="relative" ref={menuRef}>
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="text-right hidden sm:block">
              {/* Muestra el nombre completo o un cargando si aún no llega el fetch */}
              <p className="text-sm font-bold text-gray-800 leading-tight">
                {nombreCompleto ? nombreCompleto : <span className="text-gray-400 animate-pulse">Cargando...</span>}
              </p>
              
            </div>
            
            {/* Avatar con la inicial del nombre real */}
            <div className="w-10 h-10 rounded-full border-2 border-[#701C32]/10 bg-[#701C32] text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {nombreCompleto ? nombreCompleto[0] : <Loader2 size={16} className="animate-spin" />}
            </div>
          </div>

          {/* Menú Desplegable (Dropdown) */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in duration-200">
              <div className="px-4 py-2 border-b border-gray-50 mb-1 sm:hidden">
                 <p className="text-xs font-bold text-gray-800 truncate">{nombreCompleto}</p>
              </div>
              
              <Link
                href="/campus/perfil"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#701C32] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={18} className="text-gray-400" /> Mis Datos
              </Link>
              <Link
                href="/campus/perfil/cambiar-contrasena"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#701C32] transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Key size={18} className="text-gray-400" /> Cambiar Contraseña
              </Link>
              
              <div className="my-1 border-t border-gray-100" />

              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-semibold transition-colors"
                onClick={() => {
                  logout();
                  window.location.href = "/campus";
                }}
              >
                <LogOut size={18} /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}