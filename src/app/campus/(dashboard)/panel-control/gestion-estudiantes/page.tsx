"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlumnoBase } from "@/src/interfaces/admision";

export default function GestionEstudiantesPage() {
    const [alumnos, setAlumnos] = useState<AlumnoBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroPostulantes, setFiltroPostulantes] = useState(false);

    // Estados para el Modal de Rechazo
    const [modalRechazo, setModalRechazo] = useState({ abierto: false, id: 0, nombre: "" });
    const [motivoRechazo, setMotivoRechazo] = useState("");

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const endpoint = filtroPostulantes ? "/alumnos/solicitudes-pendientes" : "/alumnos/";
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
            if (!response.ok) throw new Error("Error al obtener datos");
            const data = await response.json();
            setAlumnos(data);
        } catch (error) {
            toast.error("No se pudo conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [filtroPostulantes]);

    // 2. Función Principal de Decisión
    const ejecutarDecision = async (id: number, aprobado: boolean, motivo?: string) => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/alumnos/decidir-admision/${id}?aprobado=${aprobado}${motivo ? `&motivo=${motivo}` : ""}`;

        const promise = fetch(url, { method: "POST" }).then(async (res) => {
            if (!res.ok) throw new Error();
            cargarDatos();
            return res.json();
        });

        toast.promise(promise, {
            loading: 'Procesando...',
            success: aprobado ? 'Alumno admitido correctamente' : 'Postulación rechazada',
            error: 'Error al procesar la solicitud',
        });

        if (!aprobado) {
            setModalRechazo({ abierto: false, id: 0, nombre: "" });
            setMotivoRechazo("");
        }
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                body { background-color: #FDFCFB; color: #111418; font-family: 'Lato', sans-serif; }
                .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            `}} />

            {/* --- MODAL DE RECHAZO --- */}
            {modalRechazo.abierto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-black text-gray-900">Rechazar Postulación</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                Indica el motivo por el cual no se admite a <b>{modalRechazo.nombre}</b>.
                            </p>
                            
                            <textarea
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                className="w-full mt-4 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm min-h-[100px]"
                                placeholder="Ej: Documentación incompleta, vacantes agotadas..."
                            />

                            <div className="flex gap-3 mt-6">
                                <button 
                                    onClick={() => setModalRechazo({ abierto: false, id: 0, nombre: "" })}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    disabled={!motivoRechazo.trim()}
                                    onClick={() => ejecutarDecision(modalRechazo.id, false, motivoRechazo)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    Confirmar Rechazo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] antialiased">
                <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    
                    {/* Header */}
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-[#111418] tracking-tight">
                                    {filtroPostulantes ? "Solicitudes de Admisión" : "Gestión de Estudiantes"}
                                </h2>
                                <p className="text-[#617489] text-sm mt-1">Panel de control administrativo.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setFiltroPostulantes(!filtroPostulantes)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-bold transition-all border ${filtroPostulantes ? "bg-orange-100 border-orange-300 text-orange-700" : "bg-white border-gray-200 text-gray-600"}`}
                                >
                                    <span className="material-symbols-outlined">{filtroPostulantes ? 'group' : 'pending_actions'}</span>
                                    {filtroPostulantes ? "Ver Todos los Alumnos" : "Ver Solicitudes Pendientes"}
                                </button>

                                <Link href="/campus/panel-control/gestion-estudiantes/registrar-estudiante">
                                    <button className="flex items-center gap-2 bg-[#093E7A] hover:bg-[#072e5a] text-white px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-md">
                                        <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                        <span>Registrar Nuevo</span>
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="px-8 py-4 flex-1">
                        <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#fcfafa] border-b border-[#e5e7eb]">
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Nombre Completo</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">DNI</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Grado</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Estado</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489] text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f3f4f6]">
                                        {loading ? (
                                            <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm italic">Cargando registros...</td></tr>
                                        ) : alumnos.length === 0 ? (
                                            <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No hay alumnos para mostrar.</td></tr>
                                        ) : (
                                            alumnos.map((alumno) => (
                                                <tr key={alumno.id_alumno} className="hover:bg-[#fcfafa] transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-[#111418]">{alumno.nombres} {alumno.apellidos}</td>
                                                    <td className="px-6 py-4 text-sm text-[#4b5563]">{alumno.dni}</td>
                                                    <td className="px-6 py-4 text-sm text-[#4b5563]">{alumno.grado}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${['ADMITIDO', 'ESTUDIANTE', 'ACTIVO'].includes(alumno.estado_ingreso) ? 'bg-green-100 text-green-700' : alumno.estado_ingreso === 'RECHAZADO' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-[#093E7A]'}`}>
                                                            {alumno.estado_ingreso}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {alumno.estado_ingreso === "POSTULANTE" ? (
                                                                <>
                                                                    <button 
                                                                        onClick={() => ejecutarDecision(alumno.id_alumno, true)}
                                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700"
                                                                    >ADMITIR</button>
                                                                    <button 
                                                                        onClick={() => setModalRechazo({ abierto: true, id: alumno.id_alumno, nombre: `${alumno.nombres} ${alumno.apellidos}` })}
                                                                        className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200"
                                                                    >RECHAZAR</button>
                                                                </>
                                                            ) : (
                                                                <button className="p-2 text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg">
                                                                    <span className="material-symbols-outlined">edit</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}