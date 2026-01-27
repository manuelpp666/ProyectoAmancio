// src/app/campus-estudiante/inicio-campus/page.tsx
"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect } from "react";
import { ArrowRight, Megaphone, Star, Wallet, Clock, Calendar } from "lucide-react";

export default function DashboardPage() {

    const { setRole } = useUser();

    useEffect(() => {
        setRole("estudiante"); // Marcamos que el usuario actual es estudiante
    }, []);

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">

            {/* 1. HEADER TEXT (Fuera del grid para ancho completo) */}
            <div>
                <h1 className="text-3xl font-bold text-[#701C32] mb-1">!Hola, Gabriela!</h1>
                <p className="text-gray-500 text-sm">Bienvenido a tu nuevo Campus Virtual.</p>
            </div>

            {/* 2. GRID PRINCIPAL (Contenido Izquierda | Widgets Derecha) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

                {/* --- COLUMNA IZQUIERDA (Spans 8 o 9) --- */}
                <div className="xl:col-span-9 space-y-8">

                    {/* BANNER ROJO */}
                    <div className="w-full bg-[#701C32] rounded-2xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg">
                        <div className="relative z-10 max-w-2xl">
                            <div className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-bold tracking-wide mb-4 backdrop-blur-sm">
                                PRÓXIMO EVENTO: 3 DÍAS
                            </div>
                            <h2 className="text-4xl font-bold mb-3">Inicio de clases</h2>
                            <p className="text-sm md:text-base text-white/90 mb-8 max-w-lg">
                                Prepárate para la llegada del año 2026 con esmero y dedicación.
                            </p>
                            <button className="px-6 py-2.5 border border-white/40 text-white rounded-lg hover:bg-white hover:text-[#701C32] transition-all font-medium text-sm">
                                Ver próximos eventos
                            </button>
                        </div>
                        {/* Decoración de fondo opcional */}
                        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-black/10 to-transparent pointer-events-none"></div>
                    </div>

                    {/* CURSOS RECIENTES */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[#701C32] font-bold text-lg uppercase">Cursos Recientes</h3>
                            <a href="#" className="text-xs font-bold text-[#701C32] hover:underline flex items-center gap-1">
                                Ver todos <ArrowRight size={14} />
                            </a>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {/* CARD 1: Matemática */}
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="h-28 w-full flex items-center justify-center mb-2">
                                    {/* Reemplaza src con tu imagen real: /matematica.png */}
                                    <img src="https://placehold.co/150x120/png?text=Matemática" alt="Matemática" className="h-full object-contain" />
                                </div>
                                <div className="w-full text-left">
                                    <h4 className="font-bold text-gray-800 text-sm">Matemática</h4>
                                    <p className="text-[11px] text-gray-400 mb-4">Puicon Rivera, José Emmanuel</p>
                                    <div className="flex justify-end">
                                        <button className="text-[11px] font-bold text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all">
                                            Ir al curso <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 2: Religión */}
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="h-28 w-full flex items-center justify-center mb-2">
                                    <img src="https://placehold.co/150x120/png?text=Religión" alt="Religión" className="h-full object-contain" />
                                </div>
                                <div className="w-full text-left">
                                    <h4 className="font-bold text-gray-800 text-sm">Religión</h4>
                                    <p className="text-[11px] text-gray-400 mb-4">Puicon Rivera, José Emmanuel</p>
                                    <div className="flex justify-end">
                                        <button className="text-[11px] font-bold text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all">
                                            Ir al curso <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 3: Ciencias Sociales */}
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="h-28 w-full flex items-center justify-center mb-2">
                                    <img src="https://placehold.co/150x120/png?text=Sociales" alt="Sociales" className="h-full object-contain" />
                                </div>
                                <div className="w-full text-left">
                                    <h4 className="font-bold text-gray-800 text-sm">Ciencias Sociales</h4>
                                    <p className="text-[11px] text-gray-400 mb-4">Puicon Rivera, José Emmanuel</p>
                                    <div className="flex justify-end">
                                        <button className="text-[11px] font-bold text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all">
                                            Ir al curso <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* CARD 4: Comunicación */}
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="h-28 w-full flex items-center justify-center mb-2">
                                    <img src="https://placehold.co/150x120/png?text=Comunicación" alt="Comunicación" className="h-full object-contain" />
                                </div>
                                <div className="w-full text-left">
                                    <h4 className="font-bold text-gray-800 text-sm">Comunicación</h4>
                                    <p className="text-[11px] text-gray-400 mb-4">Puicon Rivera, José Emmanuel</p>
                                    <div className="flex justify-end">
                                        <button className="text-[11px] font-bold text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all">
                                            Ir al curso <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* CARD 5: Química */}
                            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center">
                                <div className="h-28 w-full flex items-center justify-center mb-2">
                                    <img src="https://placehold.co/150x120/png?text=Química" alt="Química" className="h-full object-contain" />
                                </div>
                                <div className="w-full text-left">
                                    <h4 className="font-bold text-gray-800 text-sm">Química</h4>
                                    <p className="text-[11px] text-gray-400 mb-4">Puicon Rivera, José Emmanuel</p>
                                    <div className="flex justify-end">
                                        <button className="text-[11px] font-bold text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all">
                                            Ir al curso <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- COLUMNA DERECHA (Spans 3 o 4) --- */}
                <div className="xl:col-span-3 space-y-6">

                    {/* WIDGET: TAREAS PENDIENTES */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="text-[#701C32] font-bold text-sm uppercase mb-4 tracking-wide">Tareas Pendientes</h3>
                        <div className="space-y-3">

                            {/* Tarea Item 1 */}
                            <div className="bg-[#F8F9FA] rounded-lg p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-[#701C32] mb-1 uppercase">Matemática</p>
                                <p className="text-xs text-gray-700 font-medium mb-2 leading-snug">Lista de ejercicios para desarrollar</p>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock size={12} />
                                    Fecha entrega: 20/01/2026
                                </div>
                            </div>

                            {/* Tarea Item 2 */}
                            <div className="bg-[#F8F9FA] rounded-lg p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-[#701C32] mb-1 uppercase">Ciencias Sociales</p>
                                <p className="text-xs text-gray-700 font-medium mb-2 leading-snug">Lectura para aprender y exponer en clase</p>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock size={12} />
                                    Fecha entrega: 18/01/2026
                                </div>
                            </div>

                            {/* Tarea Item 3 */}
                            <div className="bg-[#F8F9FA] rounded-lg p-3 border border-gray-100">
                                <p className="text-[10px] font-bold text-[#701C32] mb-1 uppercase">Religión</p>
                                <p className="text-xs text-gray-700 font-medium mb-2 leading-snug">Lectura de resumen y cuestionario</p>
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock size={12} />
                                    Fecha entrega: 23/01/2026
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* WIDGET: NOTIFICACIONES */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <h3 className="text-[#701C32] font-bold text-sm uppercase mb-4 tracking-wide">Notificaciones</h3>
                        <div className="space-y-5">

                            {/* Notif 1 */}
                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-[#701C32]/10 text-[#701C32] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Megaphone size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-800 leading-tight mb-1">
                                        <span className="font-bold">Comunicado:</span> Suspensión de clases el día lunes por feriado nacional.
                                    </p>
                                    <span className="text-[10px] text-gray-400">Hace 2 horas</span>
                                </div>
                            </div>

                            {/* Notif 2 */}
                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-[#701C32]/10 text-[#701C32] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Star size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-800 leading-tight mb-1">
                                        <span className="font-bold">Calificación:</span> Haz recibido 18 en Examen Parcial de Química.
                                    </p>
                                    <span className="text-[10px] text-gray-400">Hace 4 horas</span>
                                </div>
                            </div>

                            {/* Notif 3 */}
                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-[#701C32]/10 text-[#701C32] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Star size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-800 leading-tight mb-1">
                                        <span className="font-bold">Calificación:</span> Haz recibido 19 en Lectura y Cuestionario de Ciencias Sociales.
                                    </p>
                                    <span className="text-[10px] text-gray-400">Hace 1 día</span>
                                </div>
                            </div>

                            {/* Notif 4 */}
                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-[#701C32]/10 text-[#701C32] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Wallet size={14} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-800 leading-tight mb-1">
                                        <span className="font-bold">Pagos:</span> Pago pendiente de 240 soles para Pensión mes de Marzo.
                                    </p>
                                    <span className="text-[10px] text-gray-400">Hace 1 día</span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </div>




    );
}