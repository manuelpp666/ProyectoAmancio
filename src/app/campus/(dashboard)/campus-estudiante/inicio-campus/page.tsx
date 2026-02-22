// src/app/campus-estudiante/inicio-campus/page.tsx
"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Megaphone, Star, Wallet, Clock, Loader2, Calendar, CheckCheck } from "lucide-react";
import Link from "next/link";


interface Curso {
    id: number;
    nombre: string;
    docente: string;
}

interface Tarea {
    id: number;
    curso: string;
    titulo: string;
    fecha: string;
}

interface DashboardData {
    nombre_completo: string;
    cursos: Curso[];
    tareas_pendientes: Tarea[];
    anio_actual: string;
}

// Función helper para seleccionar iconos
const getIcon = (tipo: string) => {
    switch (tipo) {
        case "entrega": return CheckCheck;
        case "nota": return Star;
        case "pago": return Wallet;
        case "evento": return Calendar;
        default: return Megaphone;
    }
};
export default function DashboardPage() {

    // 1. Extraer datos reales del contexto
    const { id_usuario, role, loading } = useUser();
    const router = useRouter();
    const [resumenEventos, setResumenEventos] = useState<any>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [notificaciones, setNotificaciones] = useState<any[]>([]);

    // 2. Proteger la ruta: Si no es estudiante, lo expulsamos
    useEffect(() => {
        if (!loading) {
            if (!role) {
                router.push("/campus"); // No ha iniciado sesión
            } else if (role !== "ALUMNO") {
                router.push("/prohibido"); // Es admin o docente intentando entrar aquí
            }
        }
    }, [role, loading, router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!id_usuario) return;
            try {
                // Cargar dashboard general
                const resData = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/api/dashboard/estudiante/${id_usuario}`);
                const json: DashboardData = await resData.json();
                setData(json);

                // Cargar resumen de eventos
                const resEventos = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/eventos/resumen`);
                const jsonEventos = await resEventos.json();
                setResumenEventos(jsonEventos);

            } catch (error) {
                console.error("Error al cargar datos", error);
            } finally {
                setLoadingData(false);
            }
        };
        if (!loading && id_usuario) fetchDashboardData();
    }, [id_usuario, loading]);

    // Efecto para cargar notificaciones (Limitado a 4)
    useEffect(() => {
        const fetchNotificaciones = async () => {
            if (!id_usuario) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/notificaciones/${id_usuario}`);
                const json = await res.json();
                // Tomamos solo las 4 primeras
                setNotificaciones(json.notificaciones.slice(0, 4));
            } catch (error) {
                console.error("Error al cargar notificaciones", error);
            }
        };
        if (!loading && id_usuario) fetchNotificaciones();
    }, [id_usuario, loading]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id_usuario) return;
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/api/dashboard/estudiante/${id_usuario}`);
                const json: DashboardData = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error al cargar dashboard", error);
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [id_usuario]);


    // 3. Estado de carga mientras se recupera la sesión del localStorage
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-[#701C32]" size={48} />
            </div>
        );
    }

    // Si no hay rol (y ya terminó de cargar), no renderizamos nada para evitar parpadeos
    if (!role) return null;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">

            {/* 1. HEADER TEXT (Fuera del grid para ancho completo) */}
            <div>
                <h1 className="text-3xl font-bold text-[#701C32] mb-1">
                    ¡Hola, {data?.nombre_completo || "estudiante"}!
                </h1>
                <p className="text-gray-500 text-sm">Bienvenido a tu nuevo Campus Virtual.</p>
            </div>

            {/* 2. GRID PRINCIPAL (Contenido Izquierda | Widgets Derecha) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* --- COLUMNA IZQUIERDA (Spans 8 o 9) --- */}
                <div className="xl:col-span-9 space-y-8">

                    {/* BANNER ROJO */}
                    <div className="w-full bg-[#701C32] rounded-2xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg">
                        {resumenEventos?.proximo_evento ? (
                            <div className="relative z-10 max-w-2xl">
                                <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-bold tracking-wide mb-4 backdrop-blur-sm">
                                    PRÓXIMO EVENTO: {resumenEventos.dias_faltantes_proximo === 0
                                        ? "¡ES HOY!"
                                        : `${resumenEventos.dias_faltantes_proximo} DÍAS`}
                                </div>
                                <h2 className="text-4xl font-bold mb-3">
                                    {resumenEventos.proximo_evento.titulo}
                                </h2>
                                <p className="text-sm md:text-base text-white/90 mb-8 max-w-lg">
                                    {resumenEventos.proximo_evento.descripcion || "Evento académico importante."}
                                </p>

                            </div>
                        ) : (
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold">¡Bienvenido al Campus!</h2>
                                <p className="text-white/80">No hay eventos próximos programados por el momento.</p>
                            </div>
                        )}

                        {/* Decoración de fondo */}
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/10 to-transparent pointer-events-none"></div>
                    </div>

                    {/* CURSOS RECIENTES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {data?.cursos.map((curso) => (
                            <div key={curso.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                {/* ... tu imagen ... */}
                                <div className="w-full text-left">
                                    <h4 className="font-bold text-gray-800 text-sm">{curso.nombre}</h4>
                                    <p className="text-[11px] text-gray-400 mb-4">{curso.docente}</p>
                                    <Link
                                        href={`/campus/campus-estudiante/inicio-campus/cursos/mis-cursos/${curso.id}?anio=${data?.anio_actual}`}
                                        className="text-[11px] font-black text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all"
                                    >
                                        ENTRAR <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- COLUMNA DERECHA (Spans 3 o 4) --- */}
                <div className="xl:col-span-3 space-y-6">

                    {/* WIDGET: TAREAS PENDIENTES */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="text-[#701C32] font-bold text-sm uppercase mb-4 tracking-wide">Tareas Pendientes</h3>
                        <div className="space-y-3">
                            {data?.tareas_pendientes.map((tarea) => (
                                <div key={tarea.id} className="bg-[#F8F9FA] rounded-lg p-3 border border-gray-100">
                                    <p className="text-[10px] font-bold text-[#701C32] mb-1 uppercase">{tarea.curso}</p>
                                    <p className="text-xs text-gray-700 font-medium mb-2 leading-snug">{tarea.titulo}</p>
                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                        <Clock size={12} />
                                        {new Date(tarea.fecha).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {data?.tareas_pendientes.length === 0 && (
                                <p className="text-xs text-gray-500">No tienes tareas pendientes.</p>
                            )}
                        </div>
                    </div>

                    {/* WIDGET: NOTIFICACIONES */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="text-[#701C32] font-bold text-sm uppercase mb-4 tracking-wide">
                            Notificaciones
                        </h3>
                        <div className="space-y-5">
                            {notificaciones.length > 0 ? (
                                notificaciones.map((notif, index) => {
                                    const Icon = getIcon(notif.tipo);
                                    return (
                                        <div key={index} className="flex gap-3 items-start">
                                            <div className="w-8 h-8 rounded-full bg-[#701C32]/10 text-[#701C32] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Icon size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-800 leading-tight mb-1">
                                                    <span className="font-bold capitalize">{notif.tipo}: </span>
                                                    {notif.mensaje}
                                                </p>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(notif.fecha).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-xs text-gray-400 italic">No tienes notificaciones recientes.</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}