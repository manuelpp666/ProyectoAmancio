"use client";
import { useState } from "react";
import Link from "next/link";
import { Home, BookOpen, MessageSquare, User, ArrowLeftRight, ChevronDown, X } from "lucide-react";

export function AsideCampus({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {

  const [isTramitesOpen, setIsTramitesOpen] = useState(false);
  const [isAlumnoOpen, setIsAlumnoOpen] = useState(false);

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
        <Link href="/campus/campus-estudiante/inicio-campus" onClick={onClose} className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-lg">
          <Home size={20} /> Inicio
        </Link>
        <Link
          href="/campus/campus-estudiante/inicio-campus/cursos"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors group"
        >
          <BookOpen size={20} className="group-hover:text-white" />
          Cursos
        </Link>

        <Link
          href="/campus/campus-estudiante/inicio-campus/mensajeria"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors group"
        >
          <MessageSquare size={20} className="group-hover:text-white" />
          Mensajería
        </Link>


        {/* Dropdowns simulados (Botones originales) */}
        {/* Alumno */}
        <div className="space-y-1">
          <button
            onClick={() => setIsAlumnoOpen(!isAlumnoOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-left group ${isAlumnoOpen ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            <div className="flex items-center gap-3">
              <User size={20} className="group-hover:text-white" />
              Alumno
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${isAlumnoOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAlumnoOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="pl-11 pr-4 py-1 space-y-1">
              <Link href="#" className="block py-2 text-sm text-white/60 hover:text-white transition-colors">Notas</Link>
              <Link href="/campus/campus-estudiante/inicio-campus/alumno" className="block py-2 text-sm text-white/60 hover:text-white transition-colors">Horario</Link>
            </div>
          </div>
        </div>
        {/* Trámites */}
        <div className="space-y-1">
          <button
            onClick={() => setIsTramitesOpen(!isTramitesOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-left group ${isTramitesOpen ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            <div className="flex items-center gap-3">
              <ArrowLeftRight size={20} className="group-hover:text-white" />
              Trámites
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${isTramitesOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Contenedor de Miniopciones */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isTramitesOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="pl-11 pr-4 py-1 space-y-1">
              {/* --- NUEVO LINK AGREGADO AQUÍ --- */}
              <Link href="/campus/campus-estudiante/inicio-campus/tramites/solicitud" onClick={onClose} className="block py-2 text-sm text-white/60 hover:text-white transition-colors">
                Solicitud de trámite
              </Link>
              {/* ------------------------------- */}
              
              <Link href="/campus/campus-estudiante/inicio-campus/tramites" onClick={onClose} className="block py-2 text-sm text-white/60 hover:text-white transition-colors">
                Estado de cuenta
              </Link>
              <Link href="/campus/campus-estudiante/inicio-campus/tramites/pago" onClick={onClose} className="block py-2 text-sm text-white/60 hover:text-white transition-colors">
                Pagar pensión
              </Link>
              <Link href="/campus/campus-estudiante/inicio-campus/tramites/manual" onClick={onClose} className="block py-2 text-sm text-white/60 hover:text-white transition-colors">
                Manual de pagos
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}