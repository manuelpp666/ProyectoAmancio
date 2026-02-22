"use client";
import { useState, useMemo } from "react";
import Header from "@/src/components/Pagina-Web/Header";
import Footer from "@/src/components/Pagina-Web/Footer";
import ChatWidget from "@/src/components/utils/ChatbotWidget";
import { useEventos } from "@/src/hooks/useEvento";

export default function Page() {
    const { eventos } = useEventos('todos');
    const [viewDate, setViewDate] = useState(new Date());

    const meses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const isToday = (day: number | null) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    // Filtrar eventos para el mes actual
    const eventosDelMes = useMemo(() => {
        return eventos.filter(ev => {
            const date = new Date(ev.fecha_inicio);
            return date.getMonth() === month && date.getFullYear() === year;
        });
    }, [eventos, month, year]);

    // Extraer tipos únicos para la leyenda dinámica
    const leyenda = useMemo(() => {
        const tipos = Array.from(new Set(eventos.map(e => e.tipo_evento)));
        return tipos.map(tipo => ({
            nombre: tipo,
            color: eventos.find(e => e.tipo_evento === tipo)?.color || "#093E7A"
        }));
    }, [eventos]);

    const calendarDays: (number | null)[] = [
        ...Array.from({ length: firstDayOfMonth }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];

    return (
        <div className="bg-white text-slate-800">
            <Header />

            <main className="py-12 px-4 max-w-7xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-[#701C32] mb-2">Calendario Académico</h1>
                    <p className="text-slate-500">Consulta las fechas importantes del año {year}.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-[#093E7A]">{meses[month]} {year}</h2>
                                <div className="flex space-x-2">
                                    <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><span className="material-symbols-outlined">chevron_left</span></button>
                                    <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><span className="material-symbols-outlined">chevron_right</span></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100 py-4 text-center">
                                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => <div key={d} className="text-xs font-black uppercase text-slate-400">{d}</div>)}
                            </div>

                            <div className="grid grid-cols-7 p-2">
                                {calendarDays.map((day, index) => (
                                    <div key={index} className={`h-24 p-2 border border-slate-50 rounded-xl flex flex-col ${isToday(day) ? "bg-[#FFF1E3]" : ""}`}>
                                        {day && (
                                            <>
                                                <span className={`text-sm font-bold ${isToday(day) ? "text-[#701C32]" : "text-slate-500"}`}>{day}</span>
                                                <div className="mt-1 flex flex-col gap-1">
                                                    {eventosDelMes.filter(e => new Date(e.fecha_inicio).getDate() === day).map(ev => (
                                                        <div key={ev.id_evento} className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color }} />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Leyenda Dinámica */}
                        <div className="mt-8 flex flex-wrap gap-6 items-center bg-[#FFF1E3]/40 p-6 rounded-2xl border border-[#FFF1E3]">
                            <span className="text-sm font-black text-[#701C32] uppercase">Leyenda:</span>
                            {leyenda.map(item => (
                                <div key={item.nombre} className="flex items-center space-x-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                    <span className="text-sm font-bold text-slate-700">{item.nombre}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar de Eventos */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-[#701C32] flex items-center">Próximos Eventos</h3>
                        <div className="space-y-4">
                            {eventosDelMes.slice(0, 3).map(ev => (
                                <div key={ev.id_evento} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white" style={{ backgroundColor: ev.color }}>
                                            <span className="text-xs font-black">{new Date(ev.fecha_inicio).getDate()}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-800">{ev.titulo}</h4>
                                    </div>
                                    <p className="text-xs text-slate-500">{ev.descripcion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <ChatWidget />
        </div>
    );
}