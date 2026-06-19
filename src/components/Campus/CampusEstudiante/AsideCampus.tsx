"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, MessageSquare, User, ArrowLeftRight, ChevronDown, X } from "lucide-react";

const BASE = "/campus/campus-estudiante/inicio-campus";

export function AsideCampus({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {

  const pathname = usePathname();

  // Detectar la sección activa según la ruta actual
  const esActivo = (ruta: string, exacto = false) =>
    exacto ? pathname === ruta : pathname === ruta || pathname.startsWith(`${ruta}/`);

  const enAlumno = esActivo(`${BASE}/alumno`);
  const enTramites = esActivo(`${BASE}/tramites`);

  // Los dropdowns inician abiertos si la ruta actual está dentro de ellos
  const [isTramitesOpen, setIsTramitesOpen] = useState(enTramites);
  const [isAlumnoOpen, setIsAlumnoOpen] = useState(enAlumno);

  // Al cambiar de apartado: abrir el dropdown de la sección actual y cerrar los demás
  useEffect(() => {
    setIsAlumnoOpen(enAlumno);
    setIsTramitesOpen(enTramites);
  }, [pathname]);

  // Estilos reutilizando los mismos colores del diseño actual
  const claseLink = (activo: boolean) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
      activo ? "bg-white/10 text-white font-bold" : "text-white/80 hover:bg-white/10 hover:text-white"
    }`;

  const claseSubLink = (activo: boolean) =>
    `block py-2 text-sm transition-colors border-l-2 pl-4 -ml-px ${
      activo ? "text-white font-bold border-white" : "text-white/60 hover:text-white border-transparent"
    }`;

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
        <Link
          href={BASE}
          onClick={onClose}
          className={claseLink(esActivo(BASE, true))}
        >
          <Home size={20} className="group-hover:text-white" /> Inicio
        </Link>

        <Link
          href={`${BASE}/cursos`}
          onClick={onClose}
          className={claseLink(esActivo(`${BASE}/cursos`))}
        >
          <BookOpen size={20} className="group-hover:text-white" />
          Cursos
        </Link>

        <Link
          href={`${BASE}/mensajeria`}
          onClick={onClose}
          className={claseLink(esActivo(`${BASE}/mensajeria`))}
        >
          <MessageSquare size={20} className="group-hover:text-white" />
          Mensajería
        </Link>


        {/* Dropdowns simulados (Botones originales) */}
        {/* Alumno */}
        <div className="space-y-1">
          <button
            onClick={() => setIsAlumnoOpen(!isAlumnoOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-left group ${isAlumnoOpen || enAlumno ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            <div className="flex items-center gap-3">
              <User size={20} className="group-hover:text-white" />
              Alumno
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${isAlumnoOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAlumnoOpen ? "max-h-60 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="ml-7 pr-4 py-1 space-y-1 border-l border-white/10">
              <Link href={`${BASE}/alumno/conducta`} onClick={onClose} className={claseSubLink(esActivo(`${BASE}/alumno/conducta`))}>Conducta</Link>
              <Link href={`${BASE}/alumno/citas`} onClick={onClose} className={claseSubLink(esActivo(`${BASE}/alumno/citas`))}>Citas psicología</Link>
              <Link href={`${BASE}/alumno/notas`} onClick={onClose} className={claseSubLink(esActivo(`${BASE}/alumno/notas`))}>Notas</Link>
              <Link href={`${BASE}/alumno`} onClick={onClose} className={claseSubLink(esActivo(`${BASE}/alumno`, true))}>Horario</Link>
              <Link href={`${BASE}/alumno/matricula`} onClick={onClose} className={claseSubLink(esActivo(`${BASE}/alumno/matricula`))}>Matrícula</Link>
            </div>
          </div>
        </div>
        {/* Trámites */}
        <div className="space-y-1">
          <button
            onClick={() => setIsTramitesOpen(!isTramitesOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-left group ${isTramitesOpen || enTramites ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
          >
            <div className="flex items-center gap-3">
              <ArrowLeftRight size={20} className="group-hover:text-white" />
              Trámites
            </div>
            <ChevronDown size={16} className={`transition-transform duration-300 ${isTramitesOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Contenedor de Miniopciones */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isTramitesOpen ? "max-h-56 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="ml-7 pr-4 py-1 space-y-1 border-l border-white/10">
              <Link href={`${BASE}/tramites/solicitud`} onClick={onClose} className={claseSubLink(esActivo(`${BASE}/tramites/solicitud`))}>
                Solicitud de trámite
              </Link>
              <Link href={`${BASE}/tramites`} onClick={onClose} className={claseSubLink(esActivo(`${BASE}/tramites`, true))}>
                Estado de cuenta
              </Link>
              <Link href={`${BASE}/tramites/manual`} onClick={onClose} className={claseSubLink(esActivo(`${BASE}/tramites/manual`))}>
                Manual de pagos
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
