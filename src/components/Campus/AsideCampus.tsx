"use client";
import Link from "next/link";
import { Home, BookOpen, MessageSquare, User, ArrowLeftRight, ChevronDown, X } from "lucide-react";

export function AsideCampus({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#701C32] text-white flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg leading-tight">Campus Virtual</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/80"><X size={24} /></button>
      </div>
      <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto custom-scrollbar">
        <Link href="/campus-estudiante/inicio-campus" onClick={onClose} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg">
          <Home size={20} /> Inicio
        </Link>
        <Link 
            href="/campus-estudiante/inicio-campus/cursos" 
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors group"
          >
            <BookOpen size={20} className="group-hover:text-white"/>
            Cursos
          </Link>

          <Link 
            href="/campus-estudiante/inicio-campus/mensajeria" 
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors group"
          >
            <MessageSquare size={20} className="group-hover:text-white"/>
            Mensajería
          </Link>

          <Link 
            href="/campus-estudiante/inicio-campus/prueba" 
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors group"
          >
            <MessageSquare size={20} className="group-hover:text-white"/>
            Prueba
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
  );
}