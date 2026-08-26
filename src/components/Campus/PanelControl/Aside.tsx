"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe,
  Bot,
  Users,
  GraduationCap,
  X,
  ChevronDown,
  LayoutDashboard,
  ClipboardList,
  UserCog,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import { usePathname } from "next/navigation";
import { usePermisos } from "@/src/hooks/usePermisos";

const BASE = "/campus/panel-control";

/**
 * Subapartados de los dos módulos que se recorren por el menú y no por
 * pestañas: cada uno es una pantalla propia con su propia ruta.
 *
 * `permiso` es la clave del catálogo de permisos (config/permisos.ts), así que
 * lo que aquí se ve es exactamente lo que el administrador tiene marcado.
 *
 * `exacto` marca las rutas índice: sin él, "Estructura Escolar" saldría activa
 * también dentro de Gestión de Horarios, porque su ruta es el prefijo de todas
 * las demás del módulo.
 */
interface Subapartado {
  permiso: string;
  label: string;
  href: string;
  exacto?: boolean;
}

const SUB_ACADEMICO: Subapartado[] = [
  { permiso: "estructura", label: "Estructura Escolar", href: `${BASE}/gestion-academica`, exacto: true },
  { permiso: "horarios", label: "Gestión de Horarios", href: `${BASE}/gestion-academica/gestion-horario` },
  { permiso: "docentes", label: "Asignación de Docentes", href: `${BASE}/gestion-academica/asignar-docente` },
  { permiso: "estudiantes", label: "Asignación de Estudiantes", href: `${BASE}/gestion-academica/asignar-estudiante` },
  { permiso: "cursos", label: "Gestión de Cursos", href: `${BASE}/gestion-academica/gestion-cursos` },
];

const SUB_CONTENIDO: Subapartado[] = [
  { permiso: "info_general", label: "Editor Web", href: `${BASE}/pagina-web`, exacto: true },
  { permiso: "noticias", label: "Gestión de Noticias", href: `${BASE}/pagina-web/noticias-web` },
  { permiso: "calendario", label: "Calendario Anual", href: `${BASE}/pagina-web/calendario-anual` },
];

export function AsidePanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { tienePermiso } = usePermisos();

  const isActive = (path: string) => pathname === path;

  // Activo = la ruta exacta, o cualquier subruta suya (una noticia abierta en
  // /noticias-web/editar/3 sigue siendo Gestión de Noticias).
  const enRuta = (ruta: string, exacto = false) =>
    exacto ? pathname === ruta : pathname === ruta || pathname.startsWith(`${ruta}/`);

  const visibles = (modulo: string, subs: Subapartado[]) =>
    subs.filter((s) => tienePermiso(modulo, s.permiso));

  const subsAcademico = visibles("academico", SUB_ACADEMICO);
  const subsContenido = visibles("contenido_web", SUB_CONTENIDO);

  const enAcademico = enRuta(`${BASE}/gestion-academica`);
  const enContenido = enRuta(`${BASE}/pagina-web`);

  // Cada desplegable arranca abierto si se está dentro de él.
  const [academicoAbierto, setAcademicoAbierto] = useState(enAcademico);
  const [contenidoAbierto, setContenidoAbierto] = useState(enContenido);

  // Al cambiar de pantalla se abre el del apartado actual y se cierra el otro,
  // igual que en el panel del alumno.
  useEffect(() => {
    setAcademicoAbierto(enAcademico);
    setContenidoAbierto(enContenido);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* El fondo oscuro del menú plegado lo pone el layout del campus, igual
          que para los demás roles. Aquí había otro idéntico y se sumaban. */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#701C32] text-white flex flex-col h-screen transition-transform duration-300 ease-in-out xl:sticky xl:top-0 ${isOpen ? "translate-x-0" : "max-xl:-translate-x-full"}`}>

        {/* Header del Sidebar */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="font-bold text-lg leading-tight">Panel de Administrador</span>
          </div>
          <button onClick={onClose} className="xl:hidden text-white/80"><X size={24} /></button>
        </div>

        {/* Navegación Condicional */}
        <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto custom-scrollbar">

          {/* 1. Dashboard */}
          {tienePermiso('panel_control') && (
            <SidebarLink
              href={BASE}
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              active={isActive(BASE)}
              onClick={onClose}
            />
          )}

          {/* 2. Gestión de Estudiantes */}
          {tienePermiso('gestion_estudiantes') && (
            <SidebarLink
              href={`${BASE}/gestion-estudiantes`}
              icon={<Users size={20} />}
              label="Gestión de Estudiantes"
              active={enRuta(`${BASE}/gestion-estudiantes`)}
              onClick={onClose}
            />
          )}

          {/* 3. Gestión de Personal (RRHH) */}
          {tienePermiso('gestion_personal') && (
            <SidebarLink
              href={`${BASE}/gestion-personal`}
              icon={<UserCog size={20} />}
              label="Gestión de Personal"
              active={enRuta(`${BASE}/gestion-personal`)}
              onClick={onClose}
            />
          )}

          {/* 4. Trámites y Finanzas */}
          {tienePermiso('tramites_finanzas') && (
            <SidebarLink
              href={`${BASE}/tramites/configuracion`}
              icon={<ClipboardList size={20} />}
              label="Trámites y Finanzas"
              active={enRuta(`${BASE}/tramites`)}
              onClick={onClose}
            />
          )}

          {/* 5. Cursos y Materias: sus pantallas cuelgan del menú.
              Si el administrador no tiene ninguna permitida, no se dibuja el
              desplegable: un botón que se abre y no enseña nada confunde. */}
          {subsAcademico.length > 0 && (
            <SidebarGrupo
              icon={<GraduationCap size={20} />}
              label="Cursos y Materias"
              abierto={academicoAbierto}
              dentro={enAcademico}
              onToggle={() => setAcademicoAbierto((v) => !v)}
              items={subsAcademico}
              enRuta={enRuta}
              onNavegar={onClose}
            />
          )}

          {/* 6. Contenido Web */}
          {subsContenido.length > 0 && (
            <SidebarGrupo
              icon={<Globe size={20} />}
              label="Contenido Web"
              abierto={contenidoAbierto}
              dentro={enContenido}
              onToggle={() => setContenidoAbierto((v) => !v)}
              items={subsContenido}
              enRuta={enRuta}
              onNavegar={onClose}
            />
          )}

          {/* 7. Chatbot AI */}
          {tienePermiso('chatbot') && (
            <SidebarLink
              href={`${BASE}/chatbot`}
              icon={<Bot size={20} />}
              label="Gestionar Chatbot"
              active={isActive(`${BASE}/chatbot`)}
              onClick={onClose}
            />
          )}

          {/* 8. Mensajería */}
          {tienePermiso('mensajeria') && (
            <SidebarLink
              href={`${BASE}/mensajeria`}
              icon={<MessageSquare size={20} />}
              label="Mensajería"
              active={enRuta(`${BASE}/mensajeria`)}
              onClick={onClose}
            />
          )}

          {/* 9. Seguridad de las cuentas */}
          {tienePermiso('seguridad') && (
            <SidebarLink
              href={`${BASE}/seguridad`}
              icon={<ShieldCheck size={20} />}
              label="Seguridad"
              active={enRuta(`${BASE}/seguridad`)}
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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group ${
        active ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className={active ? "text-white" : "text-white/80 group-hover:text-white"}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

/**
 * Apartado con subapartados desplegables.
 *
 * El botón solo abre y cierra: no navega. Así, entrar a un módulo es siempre
 * elegir a qué pantalla suya se va, en vez de caer en una por defecto.
 */
function SidebarGrupo({ icon, label, abierto, dentro, onToggle, items, enRuta, onNavegar }: {
  icon: React.ReactNode;
  label: string;
  abierto: boolean;
  dentro: boolean;
  onToggle: () => void;
  items: Subapartado[];
  enRuta: (ruta: string, exacto?: boolean) => boolean;
  onNavegar: () => void;
}) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left group ${
          abierto || dentro ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-3">
          <span className="group-hover:text-white">{icon}</span>
          {label}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`transition-transform duration-300 ${abierto ? "rotate-180" : ""}`}
        />
      </button>

      {/* La altura sale del número de opciones: así la animación no se corta
          al añadir una pestaña nueva ni deja hueco de más al quitarla. */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
        style={{ maxHeight: abierto ? items.length * 40 + 16 : 0, opacity: abierto ? 1 : 0 }}
      >
        <div className="ml-7 pr-4 py-1 space-y-1 border-l border-white/10">
          {items.map((s) => {
            const activo = enRuta(s.href, s.exacto);
            return (
              <Link
                key={s.href}
                href={s.href}
                onClick={onNavegar}
                tabIndex={abierto ? undefined : -1}
                aria-current={activo ? "page" : undefined}
                className={`block py-2 text-sm transition-colors border-l-2 pl-4 -ml-px ${
                  activo
                    ? "text-white font-bold border-white"
                    : "text-white/60 hover:text-white border-transparent"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
