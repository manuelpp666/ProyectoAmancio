"use client";
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import Link from "next/link";
import { Docente } from "@/src/interfaces/docente";
import { TeacherRow } from "@/src/components/Docente/TablaDocente";
import { useEffect, useState } from 'react';
import {
    Search,
    UserPlus,
} from "lucide-react";

export default function GestionDocentesPage() {

    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [loading, setLoading] = useState(true);
const [searchTerm, setSearchTerm] = useState("");
    useEffect(() => {
        const fetchDocentes = async () => {
            try {
                // 2. Construir la URL con el parámetro opcional
                let url = `${process.env.NEXT_PUBLIC_API_URL}/docentes/`;
                if (searchTerm) {
                    url += `?search=${encodeURIComponent(searchTerm)}`;
                }

                const response = await fetch(url);
                const data = await response.json();
                setDocentes(data);
            } catch (error) {
                console.error("Error cargando docentes:", error);
            } finally {
                setLoading(false);
            }
        };

        // 3. DEBOUNCE: Esperamos 400ms antes de llamar a la API
        const timer = setTimeout(() => {
            fetchDocentes();
        }, 400);

        return () => clearTimeout(timer); // Limpiar el timer si el usuario sigue escribiendo
    }, [searchTerm]);

    if (loading) return <p className="p-8">Cargando docentes...</p>;
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="flex h-screen overflow-hidden">

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    <HeaderPanel />

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                        {/* Header de la Sección */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Administración de Docentes</h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Gestión integral del personal académico y asignación de grados.</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                {/* Barra de Búsqueda */}
                                <div className="relative w-full sm:w-80 group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#093E7A] transition-colors">
                                        <Search size={18} strokeWidth={2.5} />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Busca por nombre, apellido o especialidad..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] transition-all font-medium text-xs shadow-sm placeholder:text-gray-400"
                                    />
                                </div>

                                <Link href="/campus/panel-control/pagina-web/docentes-web/nuevo-docente" className="w-full sm:w-auto">
                                    <button className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-black text-sm shadow-lg shadow-[#093E7A]/20 active:scale-95">
                                        <UserPlus size={18} strokeWidth={3} />
                                        Añadir Docente
                                    </button>
                                </Link>
                            </div>
                        </div>

                        

                        {/* Table Container */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Docente</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Especialidad</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Teléfono</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Correo electrónico</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {docentes.map((d) => (
                                            <TeacherRow
                                                key={d.id_docente}
                                                docente={d}
                            
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

