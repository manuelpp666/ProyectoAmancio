"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  MessageSquare,
  X
} from "lucide-react";

const BASE = "/campus/campus-psicologo";

export function AsidePsicologo({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  const esActivo = (ruta: string, exacto = false) =>
    exacto ? pathname === ruta : pathname === ruta || pathname.startsWith(`${ruta}/`);

  const claseLink = (activo: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
      activo ? "bg-white/10 text-white font-bold" : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#701C32] text-white flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>

      {/* HEADER */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg leading-tight">Panel Psicología</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/80"><X size={24} /></button>
      </div>

      {/* NAVEGACIÓN */}
      <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto custom-scrollbar">
        <Link
          href={BASE}
          onClick={onClose}
          className={claseLink(esActivo(BASE, true))}
        >
          <Home size={20} /> Inicio
        </Link>

        <Link
          href={`${BASE}/agenda`}
          onClick={onClose}
          className={claseLink(esActivo(`${BASE}/agenda`))}
        >
          <Calendar size={20} /> Agenda de Citas
        </Link>

        <Link
          href={`${BASE}/estudiantes`}
          onClick={onClose}
          className={claseLink(esActivo(`${BASE}/estudiantes`))}
        >
          <Users size={20} /> Seguimiento Alumnos
        </Link>

        <Link
          href={`${BASE}/mensajeria`}
          onClick={onClose}
          className={claseLink(esActivo(`${BASE}/mensajeria`))}
        >
          <MessageSquare size={20} /> Mensajería
        </Link>
      </nav>

    </aside>
  );
}