"use client"; // 1. Importante para usar hooks

import Link from "next/link";
import { usePathname } from "next/navigation"; // Hook para detectar la ruta
import { usePermisos } from "@/src/hooks/usePermisos";

export default function HeaderPanel() {
    const pathname = usePathname(); // 2. Obtenemos la URL actual
    const { tienePermiso } = usePermisos();
    // Función auxiliar para aplicar clases dinámicamente
    const getTabClass = (path: string) => {
        const baseClass = "py-4 px-2 text-sm font-bold flex items-center gap-2 transition-all border-b-[3px]";
        const activeClass = "active-tab text-blue-600 border-blue-600"; // Ajusta según tus colores
        const inactiveClass = "text-gray-400 hover:text-gray-700 border-transparent";

        return `${baseClass} ${pathname === path ? activeClass : inactiveClass}`;
    };

    return (
        <div className="bg-white px-8">
            <div className="flex gap-8 border-b">

                {tienePermiso("contenido_web", "info_general") && (
                    <Link href="/campus/panel-control/pagina-web">
                        <button className={getTabClass("/campus/panel-control/pagina-web")}>
                            <span className="material-symbols-outlined text-[20px]">info</span>
                            Información General
                        </button>
                    </Link>
                )}


                {/* Submódulo: Noticias */}
                {tienePermiso("contenido_web", "noticias") && (
                    <Link href="/campus/panel-control/pagina-web/noticias-web">
                        <button className={getTabClass("/campus/panel-control/pagina-web/noticias-web")}>
                            <span className="material-symbols-outlined text-[20px]">newspaper</span>
                            Gestión de Noticias
                        </button>
                    </Link>
                )}

                {/* Submódulo: Calendario */}
                {tienePermiso("contenido_web", "calendario") && (
                    <Link href="/campus/panel-control/pagina-web/calendario-anual">
                        <button className={getTabClass("/campus/panel-control/pagina-web/calendario-anual")}>
                            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                            Calendario Anual
                        </button>
                    </Link>
                )}


            </div>
        </div>
    );
}