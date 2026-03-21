"use client";
import Link from "next/link";
import {
  Home,
  BookOpen,
  Users,
  Globe,
  Bot,
  GraduationCap,
  Settings,
  X,
  LayoutDashboard,
  ClipboardList,
  UserCog // <-- Icono nuevo importado para Gestión de Personal
} from "lucide-react";
import { usePathname } from "next/navigation";
import { usePermisos } from "@/src/hooks/usePermisos";


export function AsidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { tienePermiso } = usePermisos();
  // Función para verificar si el link está activo
  // Lógica para Contenido Web
const getContenidoWebPath = () => {
    if (tienePermiso("contenido_web", "info_general")) return "/campus/panel-control/pagina-web";
    if (tienePermiso("contenido_web", "noticias")) return "/campus/panel-control/pagina-web/noticias-web";
    if (tienePermiso("contenido_web", "calendario")) return "/campus/panel-control/pagina-web/calendario-anual";
    return "/campus/panel-control/pagina-web"; // Fallback
};

// Lógica para Gestión Académica
const getAcademicaPath = () => {
    if (tienePermiso("academico", "estructura")) return "/campus/panel-control/gestion-academica";
    if (tienePermiso("academico", "horarios")) return "/campus/panel-control/gestion-academica/gestion-horario";
    if (tienePermiso("academico", "docentes")) return "/campus/panel-control/gestion-academica/asignar-docente";
    if (tienePermiso("academico", "estudiantes")) return "/campus/panel-control/gestion-academica/asignar-estudiante";
    if (tienePermiso("academico", "cursos")) return "/campus/panel-control/gestion-academica/gestion-cursos";
    return "/campus/panel-control/gestion-academica"; // Fallback
};
  const isActive = (path: string) => pathname === path;
  console.log("¿Tengo permiso personal?:", tienePermiso('gestion_personal'));
  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#701C32] text-white flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} shadow-2xl`}>

        {/* Header del Sidebar */}
        <div className="h-24 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5 flex items-center justify-center w-10 h-10 shadow-lg">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm uppercase tracking-tight leading-none">Amancio Varona</span>
              <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-1">Admin Panel</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Navegación Condicional */}
        <nav className="flex-1 py-8 space-y-1 px-4 overflow-y-auto custom-scrollbar">

          <div className="text-white/30 text-[10px] uppercase font-black tracking-[0.2em] px-4 mb-4">Menú Principal</div>

          {/* 1. Panel de Control */}
          {tienePermiso('panel_control') && (
            <SidebarLink
              href="/campus/panel-control"
              icon={<LayoutDashboard size={20} />}
              label="Panel de Control"
              active={isActive("/campus/panel-control")}
              onClick={onClose}
            />
          )}

          {/* 2. Gestión de Estudiantes */}
          {tienePermiso('gestion_estudiantes') && (
            <SidebarLink
              href="/campus/panel-control/gestion-estudiantes"
              icon={<Users size={20} />}
              label="Gestión de Estudiantes"
              active={isActive("/campus/panel-control/gestion-estudiantes") || pathname.includes("/gestion-estudiantes/")}
              onClick={onClose}
            />
          )}

          {/* 3. Gestión de Personal (RRHH) */}
          {tienePermiso('gestion_personal') && (
            <SidebarLink
              href="/campus/panel-control/gestion-personal"
              icon={<UserCog size={20} />}
              label="Gestión de Personal"
              active={pathname.includes("/panel-control/gestion-personal")}
              onClick={onClose}
            />
          )}

          {/* 4. Trámites y Finanzas */}
          {tienePermiso('tramites_finanzas') && (
            <SidebarLink
              href="/campus/panel-control/tramites/configuracion"
              icon={<ClipboardList size={20} />}
              label="Trámites y Finanzas"
              active={pathname.includes("/panel-control/tramites")}
              onClick={onClose}
            />
          )}

          {/* 5. Gestión Académica (Cursos) */}
{tienePermiso('academico') && (
  <SidebarLink
    href={getAcademicaPath()} // <--- CAMBIO AQUÍ
    icon={<GraduationCap size={20} />}
    label="Cursos y Materias"
    // Usamos .includes para que el botón se mantenga activo aunque estemos en un submódulo
    active={pathname.includes("/campus/panel-control/gestion-academica")}
    onClick={onClose}
  />
)}

{/* 6. Contenido Web */}
{tienePermiso('contenido_web') && (
  <SidebarLink
    href={getContenidoWebPath()} // <--- CAMBIO AQUÍ
    icon={<Globe size={20} />}
    label="Contenido Web"
    active={pathname.includes("/campus/panel-control/pagina-web")}
    onClick={onClose}
  />
)}
          {/* 7. Chatbot AI */}
          {tienePermiso('chatbot') && (
            <SidebarLink
              href="/campus/panel-control/chatbot"
              icon={<Bot size={20} />}
              label="Gestionar Chatbot"
              active={isActive("/campus/panel-control/chatbot")}
              onClick={onClose}
            />
          )}

        </nav>


      </aside>
    </>
  );
}

// Sub-componente para los links del sidebar
function SidebarLink({ href, icon, label, active, onClick }: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
        ${active
          ? "bg-white/10 text-white border-l-4 border-[#09397c] shadow-inner"
          : "text-white/60 hover:bg-white/5 hover:text-white"
        }
      `}
    >
      <span className={`${active ? "text-white" : "text-white/40 group-hover:text-white group-hover:scale-110 transition-all"}`}>
        {icon}
      </span>
      <span className={`text-sm ${active ? "font-bold" : "font-medium"}`}>
        {label}
      </span>
    </Link>
  );
}