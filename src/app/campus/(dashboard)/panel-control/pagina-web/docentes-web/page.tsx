"use client";
import React from 'react';
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import Link from "next/link";
import {
    UserPlus,
    Filter,
    Edit3,
    UserMinus,
    CheckCircle2,
    PauseCircle,
    XCircle,
    Users,
    UserCheck,
    UserX,
    MoreVertical,
    Mail,
    GraduationCap
} from "lucide-react";

export default function GestionDocentesPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="flex h-screen overflow-hidden">

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden">

                    <HeaderPanel />

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

                        {/* Header de la Sección */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Administración de Docentes</h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Gestión integral del personal académico y asignación de grados.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm shadow-sm active:scale-95">
                                    <Filter size={18} />
                                    Filtrar
                                </button>
                                <Link href="/campus/panel-control/pagina-web/docentes-web/nuevo-docente">
                                    <button className="flex items-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-black text-sm shadow-lg shadow-[#093E7A]/20 active:scale-95">
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
                                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Grados</th>
                                            <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Estado</th>
                                            <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        <TeacherRow
                                            name="Elena Rodríguez"
                                            email="elena.rodriguez@escuela.edu"
                                            specialty="Ciencias Naturales"
                                            grades={["1ero Sec.", "2do Sec."]}
                                            status="activo"
                                            img="10"
                                        />
                                        <TeacherRow
                                            name="Marco Antonio Solís"
                                            email="m.solis@escuela.edu"
                                            specialty="Matemáticas"
                                            grades={["4to Sec.", "5to Sec."]}
                                            status="activo"
                                            img="8"
                                        />
                                        <TeacherRow
                                            name="Carla Méndez"
                                            email="c.mendez@escuela.edu"
                                            specialty="Historia y Geografía"
                                            grades={["3ero Sec."]}
                                            status="licencia"
                                            img="9"
                                        />
                                        <TeacherRow
                                            name="Javier López"
                                            email="j.lopez@escuela.edu"
                                            specialty="Educación Física"
                                            grades={[]}
                                            status="inactivo"
                                            img="11"
                                        />
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

// Componente para la Fila de la Tabla
function TeacherRow({ name, email, specialty, grades, status, img }) {
    const statusStyles = {
        activo: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 size={14} />, label: "Activo" },
        licencia: { bg: "bg-amber-50", text: "text-amber-700", icon: <PauseCircle size={14} />, label: "En Licencia" },
        inactivo: { bg: "bg-red-50", text: "text-red-700", icon: <XCircle size={14} />, label: "Inactivo" }
    };

    const currentStatus = statusStyles[status];

    return (
        <tr className={`hover:bg-gray-50/50 transition-colors group ${status === 'inactivo' ? 'opacity-60' : ''}`}>
            <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div
                            className="w-11 h-11 rounded-full bg-gray-200 border-2 border-white shadow-sm bg-cover bg-center"
                            style={{ backgroundImage: `url('https://i.pravatar.cc/150?u=${img}')` }}
                        ></div>
                        {status === 'activo' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>}
                    </div>
                    <div>
                        <span className="font-bold text-gray-900 block leading-tight">{name}</span>
                        <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                            <Mail size={10} /> {email}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">{specialty}</span>
                </div>
            </td>
            <td className="px-6 py-5">
                <div className="flex flex-wrap gap-1.5">
                    {grades.length > 0 ? grades.map((g, i) => (
                        <span key={i} className="px-2.5 py-0.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-[10px] font-black uppercase">
                            {g}
                        </span>
                    )) : (
                        <span className="text-[10px] font-bold text-gray-300 italic tracking-widest">SIN ASIGNAR</span>
                    )}
                </div>
            </td>
            <td className="px-6 py-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentStatus.bg} ${currentStatus.text}`}>
                    {currentStatus.icon}
                    {currentStatus.label}
                </span>
            </td>
            <td className="px-8 py-5 text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-gray-400 hover:text-[#093E7A] hover:bg-[#093E7A]/5 rounded-xl transition-all" title="Editar Perfil">
                        <Edit3 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-[#701C32] hover:bg-[#701C32]/5 rounded-xl transition-all" title="Dar de Baja">
                        <UserMinus size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
                        <MoreVertical size={18} />
                    </button>
                </div>
            </td>
        </tr>
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