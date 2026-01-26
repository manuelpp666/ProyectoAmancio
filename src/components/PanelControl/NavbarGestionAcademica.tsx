"use client"; // 1. Importante para usar hooks

import Link from "next/link";
import { usePathname } from "next/navigation"; // Hook para detectar la ruta

export default function HeaderPanel() {
    const pathname = usePathname(); // 2. Obtenemos la URL actual

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
                <Link href="/panel-control/gestion-academica">
                    <button className={getTabClass("/panel-control/gestion-academica")}>
                        <span className="material-symbols-outlined text-[20px] fill-icon">account_tree</span>
                        Estructura Escolar
                    </button>
                </Link>

                <Link href="/panel-control/gestion-academica/gestion-horario">
                    <button className={getTabClass("/panel-control/gestion-academica/gestion-horario")}>
                        <span className="material-symbols-outlined text-[20px]">menu_book</span>
                        Gestion de horarios
                    </button>
                </Link>

                <Link href="/panel-control/gestion-academica/asignar-docente">
                    <button className={getTabClass("/panel-control/gestion-academica/asignar-docente")}>
                        <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
                        Asignación de Docentes
                    </button>
                </Link>

                <Link href="/panel-control/gestion-academica/asignar-estudiante">
                    <button className={getTabClass("/panel-control/gestion-academica/asignar-estudiante")}>
                        <span className="material-symbols-outlined text-[20px]">group</span>
                        Asignación de Estudiantes
                    </button>
                </Link>

                <Link href="/panel-control/gestion-academica/gestion-cursos">

                    <button className={getTabClass("/panel-control/gestion-academica/gestion-cursos")}>
                        <span className="material-symbols-outlined text-[20px]">menu_book</span>
                        Gestion de cursos
                    </button>
                </Link>

            </div>
        </div>
    );
}