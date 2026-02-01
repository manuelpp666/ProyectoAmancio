"use client";
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import Link from "next/link";
import { Docente } from "@/src/interfaces/docente";
import { TeacherRow } from "@/src/components/utils/TablaDocente";
import { useEffect, useState } from 'react';
import {
    Search,
    UserPlus,
    Users,
    UserCheck,
    UserX,
} from "lucide-react";

export default function GestionDocentesPage() {

    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocentes = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docentes/`);
                const data = await response.json();
                setDocentes(data);
            } catch (error) {
                console.error("Error cargando docentes:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDocentes();
    }, []);

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
                                        placeholder="Buscar docente o especialidad..."
                                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] transition-all font-medium text-sm shadow-sm placeholder:text-gray-400"
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

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard label="Total Docentes" value="42" icon={<Users size={24} />} color="text-blue-600" bg="bg-blue-50" />
                            <StatCard label="Personal Activo" value="38" icon={<UserCheck size={24} />} color="text-emerald-600" bg="bg-emerald-50" />
                            <StatCard label="Inactivos / Licencia" value="4" icon={<UserX size={24} />} color="text-[#701C32]" bg="bg-[#701C32]/10" />
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
                                                status="activo" 
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


// Componente para las Tarjetas de Estadísticas
function StatCard({ label, value, icon, color, bg }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
            <div className="flex items-center gap-5">
                <div className={`p-4 ${bg} ${color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                    <h4 className="text-3xl font-black text-gray-900 mt-1">{value}</h4>
                </div>
            </div>
        </div>
    );
}