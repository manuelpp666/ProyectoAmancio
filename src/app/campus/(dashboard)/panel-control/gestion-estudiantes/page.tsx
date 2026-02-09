"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlumnoBase } from "@/src/interfaces/admision";
import EdadBadge from "@/src/components/utils/CalcularEdad";

function InfoItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">{value || "---"}</p>
        </div>
    );
}

export default function GestionEstudiantesPage() {

    const [busqueda, setBusqueda] = useState("");
    const [alumnos, setAlumnos] = useState<AlumnoBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtroPostulantes, setFiltroPostulantes] = useState(false);
    const [modalInfo, setModalInfo] = useState<{ abierto: boolean, datos: any | null }>({
        abierto: false,
        datos: null
    });
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    // Estados para el Modal de Rechazo
    const [modalRechazo, setModalRechazo] = useState({ abierto: false, id: 0, nombre: "" });
    const [motivoRechazo, setMotivoRechazo] = useState("");

    const cargarDatos = async () => {
        setLoading(true);
        try {
            let endpoint = filtroPostulantes ? "/alumnos/solicitudes-pendientes" : "/alumnos/";

            // Si hay algo escrito en búsqueda, lo añadimos como query param
            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
            if (busqueda) {
                url.searchParams.append("dni", busqueda);
            }

            const response = await fetch(url.toString());
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
        const delayDebounceFn = setTimeout(() => {
            cargarDatos();
        }, 300); // 300ms de debounce para no saturar la API mientras escribes

        return () => clearTimeout(delayDebounceFn);
    }, [filtroPostulantes, busqueda]);
    const verDetalle = async (id: number) => {
        setCargandoDetalle(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alumnos/detalle-completo/${id}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setModalInfo({ abierto: true, datos: data });
        } catch (error) {
            toast.error("No se pudo obtener la información detallada");
        } finally {
            setCargandoDetalle(false);
        }
    };
    // 2. Función Principal de Decisión
    const ejecutarDecision = async (id: number, aprobado: boolean, motivo?: string) => {
        setModalInfo({ abierto: false, datos: null });
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
            <style dangerouslySetInnerHTML={{
                __html: `
            body { background-color: #FDFCFB; color: #111418; font-family: 'Lato', sans-serif; }
            .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        `}} />

            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] antialiased">
                <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">

                    {/* Header */}
                    <div className="px-8 pt-8 pb-4">
                        {/* ... (tu código del header igual) ... */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-[#111418] tracking-tight">
                                    {filtroPostulantes ? "Solicitudes de Admisión" : "Gestión de Estudiantes"}
                                </h2>
                                <p className="text-[#617489] text-sm mt-1">Panel de control administrativo.</p>
                            </div>
                            <div className="relative flex-1 max-w-md mx-4">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar por DNI del alumno..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A] outline-none transition-all"
                                />
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
                                                            <button
                                                                onClick={() => verDetalle(alumno.id_alumno)}
                                                                className="p-2 text-slate-400 hover:text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                            </button>
                                                            {alumno.estado_ingreso === "POSTULANTE" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => ejecutarDecision(alumno.id_alumno, true)}
                                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors"
                                                                    >ADMITIR</button>
                                                                    <button
                                                                        onClick={() => setModalRechazo({ abierto: true, id: alumno.id_alumno, nombre: `${alumno.nombres} ${alumno.apellidos}` })}
                                                                        className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 transition-colors"
                                                                    >RECHAZAR</button>
                                                                </>
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

            {/* --- MODAL 1: INFORMACIÓN DETALLADA (Z-60) --- */}
            {modalInfo.abierto && modalInfo.datos && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        {/* Header del expediente */}
                        <div className="p-6 bg-[#701C32] text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                    <span className="material-symbols-outlined text-2xl">account_circle</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight leading-none">Expediente del Postulante</h3>
                                    <p className="text-red-100 text-[10px] mt-1 font-bold uppercase tracking-widest">Admisión Colegio Amancio</p>
                                </div>
                            </div>
                            <button onClick={() => setModalInfo({ abierto: false, datos: null })} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-8">
                                    <div>
                                        <h4 className="text-[#093E7A] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-[#093E7A] rounded-full"></span>
                                            Información Personal
                                        </h4>
                                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <InfoItem label="Nombres" value={modalInfo.datos.alumno.nombres} />
                                            <InfoItem label="Apellidos" value={modalInfo.datos.alumno.apellidos} />
                                            <InfoItem label="DNI" value={modalInfo.datos.alumno.dni} />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Fecha de Nacimiento</p>
                                                <div className="flex items-center">
                                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                                        {modalInfo.datos.alumno.fecha_nacimiento || "---"}
                                                    </p>
                                                    <EdadBadge fecha={modalInfo.datos.alumno.fecha_nacimiento} />
                                                </div>
                                            </div>
                                            <InfoItem label="Grado al que Postula" value={modalInfo.datos.alumno.grado} />
                                            <InfoItem label="Colegio" value={modalInfo.datos.alumno.colegio_procedencia || "No especifica"} />
                                            <InfoItem label="Dirección" value={modalInfo.datos.alumno.direccion} />
                                            <InfoItem label="Enfermedades/Alergias" value={modalInfo.datos.alumno.enfermedad || "Ninguna"} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-600 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                                            Contactos Familiares
                                        </h4>
                                        <div className="space-y-3">
                                            {modalInfo.datos.familiares.map((fam: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:border-emerald-200 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        {/* Ahora usamos un color neutro o azul, ya que no hay un "apoderado" marcado en esta tabla */}
                                                        <div className="p-2 rounded-lg bg-blue-50 text-[#093E7A]">
                                                            <span className="material-symbols-outlined">family_restroom</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-700">{fam.nombre}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                                {fam.parentesco} {fam.dni ? `• DNI: ${fam.dni}` : ''} • Tel: {fam.telefono || 'Sin número'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="bg-slate-900 rounded-2xl p-6 text-white text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Estado de Solicitud</p>
                                        <span className="text-lg font-black block mb-4">{modalInfo.datos.alumno.estado_ingreso}</span>
                                    </div>
                                    {modalInfo.datos.alumno.estado_ingreso === "POSTULANTE" && (
                                        <div className="space-y-3 mt-4">
                                            <button onClick={() => ejecutarDecision(modalInfo.datos.alumno.id_alumno, true)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-lg">check_circle</span> ADMITIR
                                            </button>
                                            <button onClick={() => setModalRechazo({ abierto: true, id: modalInfo.datos.alumno.id_alumno, nombre: modalInfo.datos.alumno.nombres })} className="w-full py-4 bg-white border-2 border-red-50 text-red-500 rounded-xl font-black text-sm hover:bg-red-50 transition-all">
                                                RECHAZAR
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: RECHAZO (Z-70 - ENCIMA DE TODO) --- */}
            {modalRechazo.abierto && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
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
                                <button onClick={() => setModalRechazo({ abierto: false, id: 0, nombre: "" })} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                    Cancelar
                                </button>
                                <button
                                    disabled={!motivoRechazo.trim()}
                                    onClick={() => ejecutarDecision(modalRechazo.id, false, motivoRechazo)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Confirmar Rechazo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}