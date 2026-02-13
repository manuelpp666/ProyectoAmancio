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
  ClipboardList // <-- Icono nuevo importado
} from "lucide-react";
import { usePathname } from "next/navigation";

export function AsidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // Función auxiliar para verificar exactitud (usada en la mayoría)
  const isActive = (path: string) => pathname === path;

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

        {/* Navegación */}
        <nav className="flex-1 py-8 space-y-1 px-4 overflow-y-auto custom-scrollbar">
          
          <div className="text-white/30 text-[10px] uppercase font-black tracking-[0.2em] px-4 mb-4">Menú Principal</div>

          <SidebarLink 
            href="/campus/panel-control" 
            icon={<LayoutDashboard size={20} />} 
            label="Panel de Control" 
            active={isActive("/campus/panel-control")}
            onClick={onClose} 
          />

          <SidebarLink 
            href="/campus/panel-control/gestion-estudiantes" 
            icon={<Users size={20} />} 
            label="Gestión de Estudiantes" 
            active={isActive("/campus/panel-control/gestion-estudiantes")}
            onClick={onClose} 
          />

          {/* --- NUEVO APARTADO: TRÁMITES --- */}
          {/* Usamos 'includes' para que siga activo si entras a editar o ver detalles */}
          <SidebarLink 
            href="/campus/panel-control/tramites/configuracion" 
            icon={<ClipboardList size={20} />} 
            label="Trámites" 
            active={pathname.includes("/panel-control/tramites")}
            onClick={onClose} 
          />

          <SidebarLink 
            href="/campus/panel-control/gestion-academica" 
            icon={<GraduationCap size={20} />} 
            label="Cursos y Materias" 
            active={isActive("/campus/panel-control/gestion-academica")}
            onClick={onClose} 
          />

          <SidebarLink 
            href="/campus/panel-control/pagina-web" 
            icon={<Globe size={20} />} 
            label="Contenido Web" 
            active={isActive("/campus/panel-control/pagina-web")}
            onClick={onClose} 
          />

          <SidebarLink 
            href="/campus/panel-control/chatbot" 
            icon={<Bot size={20} />} 
            label="Gestionar Chatbot" 
            active={isActive("/campus/panel-control/chatbot")}
            onClick={onClose} 
          />

          <div className="pt-8 mb-4">
            <div className="text-white/30 text-[10px] uppercase font-black tracking-[0.2em] px-4 mb-4">Sistema</div>
            <SidebarLink 
              href="/ajustes" 
              icon={<Settings size={20} />} 
              label="Ajustes" 
              active={isActive("/ajustes")}
              onClick={onClose} 
            />
          </div>
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 bg-black/10 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-8 h-8 rounded-full bg-[#09397c] flex items-center justify-center font-bold text-xs border border-white/20">
              AV
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">Admin v1.0.4</p>
              <p className="text-[10px] text-white/40 truncate italic">Conectado</p>
            </div>
          </div>
        </div>
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