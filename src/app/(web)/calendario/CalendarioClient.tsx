"use client";
import { useState, useMemo } from "react";
import { parseFechaLocal, formatearFechaCorta } from "@/src/components/utils/fecha";
import { Evento } from "@/src/interfaces/evento";
import type { ConfigItem } from "@/src/hooks/useConfiguracion";

export default function CalendarioClient({
    eventos,
    config,
}: {
    eventos: Evento[];
    config: ConfigItem[];
}) {
    const getVal = (clave: string, defecto: string) =>
        config.find(i => i.clave === clave)?.valor?.trim() || defecto;
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
    today.setHours(0, 0, 0, 0);

    const isToday = (day: number | null) =>
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const eventoEnDia = (ev: Evento, dayDate: Date) => {
        const inicio = parseFechaLocal(ev.fecha_inicio);
        if (!inicio) return false;
        const fin = parseFechaLocal(ev.fecha_fin) || inicio;
        return dayDate >= inicio && dayDate <= fin;
    };

    const eventosDelDia = (day: number) => {
        const dayDate = new Date(year, month, day);
        return eventos.filter(ev => eventoEnDia(ev, dayDate));
    };

    const leyenda = useMemo(() => {
        const tipos = Array.from(new Set(eventos.map(e => e.tipo_evento).filter(Boolean)));
        return tipos.map(tipo => ({
            nombre: tipo as string,
            color: eventos.find(e => e.tipo_evento === tipo)?.color || "#093E7A"
        }));
    }, [eventos]);

    const proximosEventos = useMemo(() => {
        return eventos
            .filter(ev => {
                const fin = parseFechaLocal(ev.fecha_fin) || parseFechaLocal(ev.fecha_inicio);
                return fin ? fin >= today : false;
            })
            .sort((a, b) => {
                const da = parseFechaLocal(a.fecha_inicio)?.getTime() || 0;
                const db = parseFechaLocal(b.fecha_inicio)?.getTime() || 0;
                return da - db;
            })
            .slice(0, 4);
    }, [eventos]);

    const calendarDays: (number | null)[] = [
        ...Array.from({ length: firstDayOfMonth }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];

    return (
        <div className="bg-white text-slate-800">
            {/* Banner con degradado de marca */}
            <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-[#701C32] via-[#701C32] to-[#093E7A]">
                <div className="absolute -top-16 -right-16 w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full blur-3xl z-0"></div>
                <div className="absolute -bottom-24 -left-10 w-80 h-80 md:w-96 md:h-96 bg-[#093E7A]/40 rounded-full blur-3xl z-0"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-full mb-4">
                        <span className="material-symbols-outlined text-base">event</span>
                        Año {year}
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">{getVal('calendario_titulo', 'Calendario Académico')}</h1>
                    <div className="w-20 h-1.5 bg-white/80 rounded-full mb-3"></div>
                    <p className="text-white/90 max-w-2xl">{getVal('calendario_subtitulo', 'Consulta las fechas importantes y eventos del año escolar.')}</p>
                </div>
            </section>

            <div className="py-10 md:py-12 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xl sm:text-2xl font-black text-[#093E7A]">{meses[month]} {year}</h2>
                                <div className="flex space-x-2">
                                    <button onClick={prevMonth} aria-label="Mes anterior" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><span className="material-symbols-outlined">chevron_left</span></button>
                                    <button onClick={nextMonth} aria-label="Mes siguiente" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><span className="material-symbols-outlined">chevron_right</span></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100 py-3 sm:py-4 text-center">
                                {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(d => <div key={d} className="text-[10px] sm:text-xs font-black uppercase text-slate-400">{d}</div>)}
                            </div>

                            <div className="grid grid-cols-7 p-1.5 sm:p-2">
                                {calendarDays.map((day, index) => {
                                    const evs = day ? eventosDelDia(day) : [];
                                    return (
                                        <div key={index} className={`h-16 sm:h-24 p-1.5 sm:p-2 border border-slate-50 rounded-lg sm:rounded-xl flex flex-col ${isToday(day) ? "bg-[#FFF1E3]" : ""}`}>
                                            {day && (
                                                <>
                                                    <span className={`text-xs sm:text-sm font-bold ${isToday(day) ? "text-[#701C32]" : "text-slate-500"}`}>{day}</span>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {evs.slice(0, 4).map(ev => (
                                                            <div key={ev.id_evento} title={ev.titulo} className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color || '#ccc' }} />
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {leyenda.length > 0 && (
                            <div className="mt-8 flex flex-wrap gap-4 sm:gap-6 items-center bg-[#FFF1E3]/40 p-4 sm:p-6 rounded-2xl border border-[#FFF1E3]">
                                <span className="text-sm font-black text-[#701C32] uppercase">Leyenda:</span>
                                {leyenda.map(item => (
                                    <div key={item.nombre} className="flex items-center space-x-2">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                        <span className="text-sm font-bold text-slate-700">{item.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar de Eventos */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-black text-[#701C32] flex items-center">Próximos Eventos</h3>
                        <div className="space-y-4">
                            {proximosEventos.map(ev => (
                                <div key={ev.id_evento} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-11 h-11 rounded-lg flex flex-col items-center justify-center text-white shrink-0" style={{ backgroundColor: ev.color || '#093E7A' }}>
                                            <span className="text-sm font-black leading-none">{parseFechaLocal(ev.fecha_inicio)?.getDate()}</span>
                                            <span className="text-[8px] font-bold uppercase">{meses[(parseFechaLocal(ev.fecha_inicio)?.getMonth() ?? 0)].slice(0, 3)}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 leading-tight">{ev.titulo}</h4>
                                            <p className="text-[11px] text-slate-400 font-medium">{formatearFechaCorta(ev.fecha_inicio)}</p>
                                        </div>
                                    </div>
                                    {ev.descripcion && <p className="text-xs text-slate-500">{ev.descripcion}</p>}
                                </div>
                            ))}
                            {proximosEventos.length === 0 && (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-sm text-slate-400 font-medium italic">No hay eventos próximos programados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
