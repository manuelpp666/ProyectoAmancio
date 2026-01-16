"use client";
import { useState } from "react";
import Header from "@/src/components/Header";
import Footer from "@/src/components/Footer";

export default function Page() {
    // Estado para manejar la fecha actual del calendario
    const [viewDate, setViewDate] = useState(new Date());

    // Configuración de nombres
    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Cálculos del calendario
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Primer día del mes (0 = Domingo, 1 = Lunes...)
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    // Cantidad de días en el mes actual
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Día actual real (para resaltar "Hoy")
    const today = new Date();
    const isToday = (day) =>
        day === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear();

    // Funciones de navegación
    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    // Generar array de días (incluyendo celdas vacías al inicio)
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarDays.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
        calendarDays.push(d);
    }

    return (
        <div className="bg-white text-slate-800">


            {/* Navigation */}
            <Header></Header>

            {/* Main Content */}
            <main className="py-12 px-4 max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-[#701C32] mb-2">Calendario Académico Anual</h1>
                    <p className="text-slate-500">Mantente al tanto de las fechas más importantes del año escolar {year}.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Calendar Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">

                            {/* Calendar Header Dinámico */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-[#093E7A]">
                                    {meses[month]} {year}
                                </h2>
                                <div className="flex space-x-2">
                                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-[#093E7A]">
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-[#093E7A]">
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Days Header */}
                            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100 text-center py-4">
                                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
                                    <div key={day} className="text-xs font-black uppercase tracking-widest text-slate-400">{day}</div>
                                ))}
                            </div>

                            {/* Calendar Grid Dinámico */}
                            <div className="grid grid-cols-7 p-2">
                                {calendarDays.map((day, index) => (
                                    <div
                                        key={index}
                                        className={`h-24 p-2 border border-transparent rounded-xl flex flex-col items-center transition-all ${day === null ? "bg-slate-50/30" : ""
                                            } ${isToday(day) ? "bg-[#FFF1E3] border-2 border-[#701C32]/30" : ""}`}
                                    >
                                        {day && (
                                            <>
                                                <span className={`text-sm font-bold ${isToday(day) ? "text-[#701C32] font-black" : "text-slate-500"}`}>
                                                    {day}
                                                </span>
                                                {isToday(day) && (
                                                    <span className="text-[10px] uppercase font-bold text-[#701C32] mt-1">Hoy</span>
                                                )}

                                                {/* Aquí podrías mapear eventos en el futuro según el 'day' */}
                                                {/* Ejemplo visual de puntos de eventos (estático por ahora) */}
                                                {day === 7 && <div className="mt-2 flex space-x-1"><span className="w-2 h-2 rounded-full bg-[#093E7A]"></span></div>}
                                                {day === 10 && <div className="mt-2 flex space-x-1"><span className="w-2 h-2 rounded-full bg-[#701C32]"></span></div>}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="mt-8 flex flex-wrap gap-6 items-center bg-[#FFF1E3]/40 p-6 rounded-2xl border border-[#FFF1E3]">
                            <span className="text-sm font-black text-[#701C32] uppercase tracking-wide">Leyenda:</span>
                            <div className="flex items-center space-x-2">
                                <span className="w-3 h-3 rounded-full bg-[#093E7A]"></span>
                                <span className="text-sm font-bold text-slate-700">Académico</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="w-3 h-3 rounded-full bg-[#701C32]"></span>
                                <span className="text-sm font-bold text-slate-700">Institucional</span>
                            </div>
                        </div>
                    </div>

                    {/* Events Sidebar */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-[#701C32] flex items-center">
                            <span className="material-symbols-outlined mr-2">event_note</span>
                            Próximos Eventos
                        </h3>

                        <div className="space-y-4">
                            {/* Event 1 */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-[#093E7A]/10 text-[#093E7A] rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-xs font-black leading-none">07</span>
                                            <span className="text-[8px] uppercase font-bold">May</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#093E7A]">Académico</span>
                                            <h4 className="font-bold text-slate-800 leading-tight">Exámenes Parciales</h4>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">Inicio de la semana de evaluaciones del segundo periodo académico.</p>
                                <div className="flex items-center text-xs text-slate-400">
                                    <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                                    08:00 AM - 01:00 PM
                                </div>
                            </div>

                            {/* Event 2 */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-[#701C32]/10 text-[#701C32] rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-xs font-black leading-none">10</span>
                                            <span className="text-[8px] uppercase font-bold">May</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#701C32]">Institucional</span>
                                            <h4 className="font-bold text-slate-800 leading-tight">Día de la Madre</h4>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">Ceremonia especial y actividades recreativas para las madres amancistas.</p>
                                <div className="flex items-center text-xs text-slate-400">
                                    <span className="material-symbols-outlined text-sm mr-1">place</span>
                                    Patio Central
                                </div>
                            </div>

                            {/* Event 3 */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-[#093E7A]/10 text-[#093E7A] rounded-lg flex flex-col items-center justify-center">
                                            <span className="text-xs font-black leading-none">17</span>
                                            <span className="text-[8px] uppercase font-bold">May</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#093E7A]">Académico</span>
                                            <h4 className="font-bold text-slate-800 leading-tight">Entrega de Libretas</h4>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">Reunión de padres de familia para la entrega de resultados del primer bimestre.</p>
                                <div className="flex items-center text-xs text-slate-400">
                                    <span className="material-symbols-outlined text-sm mr-1">schedule</span>
                                    04:00 PM
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-slate-100 text-[#093E7A] font-black py-4 rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center uppercase tracking-wider text-sm">
                            Ver todos los eventos
                            <span className="material-symbols-outlined ml-2">expand_more</span>
                        </button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer></Footer>
        </div>
    );
}