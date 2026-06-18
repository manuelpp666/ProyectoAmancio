// src/app/campus-estudiante/inicio-campus/page.tsx
"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState } from "react";
import {
    ArrowRight, Megaphone, Star, Wallet, Clock, Loader2, Calendar,
    CheckCheck, HeartPulse, BookOpen, History, CalendarDays, MessageSquare, ClipboardList
} from "lucide-react";
import Link from "next/link";
import { DashboardData } from "@/src/interfaces/alumno";
import { apiFetch } from "@/src/lib/api";
import { obtenerCursosRecientes, CursoReciente } from "@/src/lib/cursosRecientes";

// Función helper para seleccionar iconos
const getIcon = (tipo: string) => {
    switch (tipo) {
        case "entrega": return CheckCheck;
        case "nota": return Star;
        case "pago": return Wallet;
        case "evento": return Calendar;
        case "cita": return HeartPulse;
        case "mensaje": return MessageSquare;
        default: return Megaphone;
    }
};

// Formatea fechas de eventos de forma corta (Ej: 12 may.)
const fechaCorta = (fecha: string) =>
    new Date(fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" });

export default function DashboardPage() {

    // 1. Extraer datos reales del contexto
    const { id_usuario, role, loading } = useUser();
    const [resumenEventos, setResumenEventos] = useState<any>(null);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [notificaciones, setNotificaciones] = useState<any[]>([]);
    const [cursosRecientes, setCursosRecientes] = useState<CursoReciente[]>([]);

    useEffect(() => {
        const fetchAllData = async () => {
            if (!id_usuario) return;

            setLoadingData(true);
            try {
                // Ejecutamos las peticiones en paralelo para mayor velocidad
                const [resDash, resEventos, resNotif] = await Promise.all([
                    apiFetch(`/virtual/api/dashboard/estudiante/${id_usuario}`),
                    apiFetch(`/web/eventos/resumen`),
                    apiFetch(`/gestion/notificaciones/${id_usuario}`)
                ]);

                const [jsonDash, jsonEventos, jsonNotif] = await Promise.all([
                    resDash.ok ? resDash.json() : null,
                    resEventos.ok ? resEventos.json() : null,
                    resNotif.ok ? resNotif.json() : null
                ]);

                setData(jsonDash);
                setResumenEventos(jsonEventos);
                setNotificaciones(jsonNotif?.notificaciones?.slice(0, 4) || []);
            } catch (error) {
                console.error("Error al cargar la información del dashboard:", error);
            } finally {
                setLoadingData(false);
            }
        };

        if (!loading && id_usuario) {
            fetchAllData();
            setCursosRecientes(obtenerCursosRecientes(id_usuario));
        }
    }, [id_usuario, loading]);

    // 3. Estado de carga mientras se recupera la sesión
    if (loading || loadingData) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-[#701C32]" size={48} />
            </div>
        );
    }

    if (!role) return null;

    const proximosEventos: any[] = resumenEventos?.proximos_eventos || [];
    const eventoPrincipal = proximosEventos[0] || resumenEventos?.proximo_evento || null;
    const otrosEventos = proximosEventos.slice(1, 4);
    const tareasPendientes = [...(data?.tareas_pendientes || [])]
        .sort((a, b) => new Date(a.fecha_entrega).getTime() - new Date(b.fecha_entrega).getTime())
        .slice(0, 5);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">

            {/* 1. HEADER TEXT */}
            <div>
                <h1 className="text-3xl font-bold text-[#701C32] mb-1">
                    ¡Hola, {data?.nombre_completo || "estudiante"}!
                </h1>
                <p className="text-gray-500 text-sm">Bienvenido a tu Campus Virtual. Este es el resumen de tu día.</p>
            </div>

            {/* 2. GRID PRINCIPAL (Contenido Izquierda | Widgets Derecha) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* --- COLUMNA IZQUIERDA --- */}
                <div className="xl:col-span-9 space-y-8">

                    {/* BANNER ROJO: PRÓXIMOS EVENTOS REALES */}
                    <div className="w-full bg-[#701C32] rounded-2xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg">
                        {/* Decoración de fondo */}
                        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
                        <div className="absolute -right-4 bottom-[-60px] w-44 h-44 rounded-full bg-white/5 pointer-events-none"></div>

                        {eventoPrincipal ? (
                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                                {/* Evento principal */}
                                <div className="lg:col-span-2">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-[10px] font-bold tracking-widest mb-4 backdrop-blur-sm uppercase">
                                        <CalendarDays size={12} />
                                        Próximo evento · {resumenEventos?.dias_faltantes_proximo === 0
                                            ? "¡Es hoy!"
                                            : `Faltan ${resumenEventos?.dias_faltantes_proximo} día${resumenEventos?.dias_faltantes_proximo === 1 ? "" : "s"}`}
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black mb-3 leading-tight">
                                        {eventoPrincipal.titulo}
                                    </h2>
                                    <p className="text-sm md:text-base text-white/85 mb-5 max-w-lg leading-relaxed">
                                        {eventoPrincipal.descripcion || "Evento académico importante del calendario escolar."}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-[#FFF1E3]">
                                        <Calendar size={16} />
                                        {new Date(eventoPrincipal.fecha_inicio).toLocaleDateString("es-PE", {
                                            weekday: "long", day: "numeric", month: "long"
                                        })}
                                        {eventoPrincipal.fecha_fin && (
                                            <span className="text-white/70 font-medium">
                                                — hasta el {fechaCorta(eventoPrincipal.fecha_fin)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Lista de los siguientes eventos */}
                                {otrosEventos.length > 0 && (
                                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-3">
                                            También se acerca
                                        </p>
                                        <div className="space-y-3">
                                            {otrosEventos.map((ev: any) => (
                                                <div key={ev.id_evento} className="flex items-center gap-3">
                                                    <div className="w-11 h-11 rounded-lg bg-white/15 flex flex-col items-center justify-center shrink-0">
                                                        <span className="text-sm font-black leading-none">
                                                            {new Date(ev.fecha_inicio).getDate()}
                                                        </span>
                                                        <span className="text-[9px] uppercase font-bold text-white/70">
                                                            {new Date(ev.fecha_inicio).toLocaleDateString("es-PE", { month: "short" }).replace(".", "")}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold leading-snug line-clamp-2">{ev.titulo}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative z-10">
                                <h2 className="text-2xl font-bold">¡Bienvenido al Campus!</h2>
                                <p className="text-white/80">No hay eventos próximos programados por el momento.</p>
                            </div>
                        )}
                    </div>

                    {/* CURSOS VISITADOS RECIENTEMENTE / MIS CURSOS */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                {cursosRecientes.length > 0 ? (
                                    <><History className="text-[#701C32]" size={20} /> Visitados recientemente</>
                                ) : (
                                    <><BookOpen className="text-[#701C32]" size={20} /> Mis cursos</>
                                )}
                            </h3>
                            <Link
                                href="/campus/campus-estudiante/inicio-campus/cursos"
                                className="text-[11px] font-black text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-wide"
                            >
                                Ver todos <ArrowRight size={12} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {(cursosRecientes.length > 0
                                ? cursosRecientes.map((c) => ({
                                    id_curso: c.id_curso,
                                    nombre: c.nombre,
                                    docente: c.docente,
                                    anio: c.anio || data?.anio_actual
                                }))
                                : (data?.cursos || []).slice(0, 4).map((c) => ({
                                    id_curso: c.id_curso,
                                    nombre: c.nombre,
                                    docente: c.docente,
                                    anio: data?.anio_actual
                                }))
                            ).map((curso) => (
                                <Link
                                    key={curso.id_curso}
                                    href={`/campus/campus-estudiante/inicio-campus/cursos/mis-cursos/${curso.id_curso}?anio=${curso.anio}`}
                                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                                >
                                    <div className="h-2 w-full bg-[#701C32]"></div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="w-11 h-11 rounded-xl bg-[#FFF1E3] border border-[#F8EBDD] flex items-center justify-center text-[#701C32] mb-4 group-hover:scale-105 transition-transform">
                                            <BookOpen size={22} />
                                        </div>
                                        <h4 className="font-black text-gray-800 text-sm leading-snug line-clamp-2 mb-1">
                                            {curso.nombre}
                                        </h4>
                                        <p className="text-[11px] text-gray-400 mb-4">{curso.docente || "Docente por asignar"}</p>
                                        <span className="mt-auto text-[11px] font-black text-[#701C32] flex items-center gap-1 group-hover:gap-2 transition-all uppercase">
                                            Entrar <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </Link>
                            ))}

                            {cursosRecientes.length === 0 && (data?.cursos || []).length === 0 && (
                                <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
                                    <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-medium">Aún no tienes cursos asignados este año.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- COLUMNA DERECHA --- */}
                <div className="xl:col-span-3 space-y-6">

                    {/* WIDGET: TAREAS PENDIENTES */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[#701C32] font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                                <ClipboardList size={16} /> Tareas Pendientes
                            </h3>
                            {tareasPendientes.length > 0 && (
                                <span className="text-[10px] font-black bg-[#701C32] text-white rounded-full w-5 h-5 flex items-center justify-center">
                                    {tareasPendientes.length}
                                </span>
                            )}
                        </div>
                        <div className="space-y-3">
                            {tareasPendientes.map((tarea) => {
                                const diasRestantes = Math.ceil(
                                    (new Date(tarea.fecha_entrega).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                );
                                const urgente = diasRestantes <= 2;
                                return (
                                    <div key={tarea.id_tarea} className="bg-[#F8F9FA] rounded-xl p-3 border border-gray-100 hover:border-[#701C32]/30 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[10px] font-bold text-[#701C32] uppercase truncate pr-2">{tarea.curso}</p>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${urgente ? "bg-red-50 text-red-600" : "bg-[#FFF1E3] text-[#701C32]"}`}>
                                                {diasRestantes <= 0 ? "HOY" : `${diasRestantes} día${diasRestantes === 1 ? "" : "s"}`}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-700 font-medium mb-2 leading-snug">{tarea.titulo}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                            <Clock size={12} />
                                            Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString()}
                                        </div>
                                    </div>
                                );
                            })}
                            {tareasPendientes.length === 0 && (
                                <div className="text-center py-6">
                                    <CheckCheck size={28} className="mx-auto text-green-500 mb-2" />
                                    <p className="text-xs text-gray-500">¡Estás al día! No tienes tareas pendientes.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* WIDGET: NOTIFICACIONES */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                        <h3 className="text-[#701C32] font-bold text-sm uppercase mb-4 tracking-wide flex items-center gap-2">
                            <Megaphone size={16} /> Notificaciones
                        </h3>
                        <div className="space-y-4">
                            {notificaciones.length > 0 ? (
                                notificaciones.map((notif, index) => {
                                    const Icon = getIcon(notif.tipo);
                                    return (
                                        <div key={index} className="flex gap-3 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div className="w-8 h-8 rounded-full bg-[#701C32]/10 text-[#701C32] flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Icon size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs text-gray-800 leading-tight mb-1">
                                                    <span className="font-bold capitalize">{notif.tipo}: </span>
                                                    {notif.mensaje}
                                                </p>
                                                {notif.fecha && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(notif.fecha).toLocaleDateString()}
                                                    </span>
                                                )}
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
