"use client";

import Link from "next/link";
import { Home, ClipboardCheck, FileWarning, X, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUser } from "@/src/context/userContext";

export function AsideAuxiliar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { logout } = useUser();

  const isActive = (path: string) => pathname === path;

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#701C32] text-white flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      {/* HEADER DEL SIDEBAR */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg leading-tight">Auxiliatura</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/80"><X size={24} /></button>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto custom-scrollbar">
        <Link
          href="/campus/campus-auxiliar/inicio"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${isActive('/campus/campus-auxiliar/inicio') ? 'bg-white/10 text-white font-bold' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
        >
          <Home size={20} className={isActive('/campus/campus-auxiliar/inicio') ? 'text-white' : 'group-hover:text-white'} />
          Inicio / Dashboard
        </Link>
        <Link
          href="/campus/campus-auxiliar/asistencia"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${pathname.includes('/asistencia') ? 'bg-white/10 text-white font-bold' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
        >
          <ClipboardCheck size={20} className={pathname.includes('/asistencia') ? 'text-white' : 'group-hover:text-white'} />
          Asistencia
        </Link>
        <Link
          href="/campus/campus-auxiliar/reportes"
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${pathname.includes('/reportes') ? 'bg-white/10 text-white font-bold' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
        >
          <FileWarning size={20} className={pathname.includes('/reportes') ? 'text-white' : 'group-hover:text-white'} />
          Reportes y Partes
        </Link>
      </nav>

      {/* FOOTER DEL SIDEBAR */}
      <div className="p-4 border-t border-white/10 mt-auto">
        <button
          onClick={() => {
            logout();
            window.location.href = "/campus";
          }}
          className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors w-full text-left"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}