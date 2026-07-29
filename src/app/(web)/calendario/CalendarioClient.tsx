"use client";
import { useState, useMemo } from "react";
import { parseFechaLocal, formatearFechaCorta } from "@/src/components/utils/fecha";
import { Evento } from "@/src/interfaces/evento";
import type { ConfigItem } from "@/src/hooks/useConfiguracion";

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Rango de años (según fecha) que abarca un evento
function anosDeEvento(ev: Evento): number[] {
    const ini = parseFechaLocal(ev.fecha_inicio);
    if (!ini) return [];
    const fin = parseFechaLocal(ev.fecha_fin) || ini;
    const anos: number[] = [];
    for (let y = ini.getFullYear(); y <= fin.getFullYear(); y++) anos.push(y);
    return anos;
}

// Fecha (1er día del mes) del primer evento de un año dado; sirve para
// aterrizar el calendario en un mes que sí tenga eventos.
function primerMesConEvento(eventos: Evento[], anio: number): Date | null {
    const delAnio = eventos
        .map(ev => parseFechaLocal(ev.fecha_inicio))
        .filter((d): d is Date => !!d && d.getFullYear() === anio)
        .sort((a, b) => a.getTime() - b.getTime());
    return delAnio.length ? new Date(anio, delAnio[0].getMonth(), 1) : null;
}

export default function CalendarioClient({
    eventos,
    config,
}: {
    eventos: Evento[];
    config: ConfigItem[];
}) {
    const getVal = (clave: string, defecto: string) =>
        config.find(i => i.clave === clave)?.valor?.trim() || defecto;

    // Estado inicial: aterriza en un año que tenga eventos (el actual si los
    // tiene; si no, el más reciente con eventos; si no hay, el mes actual).
    const [viewDate, setViewDate] = useState<Date>(() => {
        const hoy = new Date();
        const anios = new Set<number>();
        eventos.forEach(ev => anosDeEvento(ev).forEach(y => anios.add(y)));
        if (anios.size === 0) return hoy;
        if (anios.has(hoy.getFullYear())) {
            return primerMesConEvento(eventos, hoy.getFullYear()) || hoy;
        }
        const maxY = Math.max(...anios);
        return primerMesConEvento(eventos, maxY) || new Date(maxY, 0, 1);
    });

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

    // Años disponibles para el combo (los que tienen eventos + el año en vista + el actual)
    const aniosDisponibles = useMemo(() => {
        const s = new Set<number>();
        eventos.forEach(ev => anosDeEvento(ev).forEach(y => s.add(y)));
        s.add(year);
        s.add(new Date().getFullYear());
        return Array.from(s).sort((a, b) => b - a);
    }, [eventos, year]);

    const cambiarAnio = (anio: number) => {
        setViewDate(primerMesConEvento(eventos, anio) || new Date(anio, 0, 1));
    };

    // Eventos que caen dentro del año en vista
    const eventosDelAnio = useMemo(
        () => eventos.filter(ev => anosDeEvento(ev).includes(year)),
        [eventos, year]
    );

    const eventoEnDia = (ev: Evento, dayDate: Date) => {
        const inicio = parseFechaLocal(ev.fecha_inicio);
        if (!inicio) return false;
        const fin = parseFechaLocal(ev.fecha_fin) || inicio;
        return dayDate >= inicio && dayDate <= fin;
    };

    const eventosDelDia = (day: number) => {
        const dayDate = new Date(year, month, day);
        return eventosDelAnio.filter(ev => eventoEnDia(ev, dayDate));
    };

    const leyenda = useMemo(() => {
        const tipos = Array.from(new Set(eventosDelAnio.map(e => e.tipo_evento).filter(Boolean)));
        return tipos.map(tipo => ({
            nombre: tipo as string,
            color: eventosDelAnio.find(e => e.tipo_evento === tipo)?.color || "#093E7A"
        }));
    }, [eventosDelAnio]);

    // Lista lateral: todos los eventos del año elegido, ordenados por fecha
    const eventosOrdenados = useMemo(() => {
        return [...eventosDelAnio].sort((a, b) => {
            const da = parseFechaLocal(a.fecha_inicio)?.getTime() || 0;
            const db = parseFechaLocal(b.fecha_inicio)?.getTime() || 0;
            return da - db;
        });
    }, [eventosDelAnio]);

    const calendarDays: (number | null)[] = [
        ...Array.from({ length: firstDayOfMonth }, () => null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];

    return (
        <div className="bg-white text-slate-800">
            {/* Banner con degradado de marca */}
            <section className="relative py-16 md:py-20 overflow-hidden bg-gradient-to-br from-[#701C32] via-[#701C32] to-[#093E7A]">
                <div className="absolute -top-16 -right-16 w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full blur-3xl z-0 animate-float-slow"></div>
                <div className="absolute -bottom-24 -left-10 w-80 h-80 md:w-96 md:h-96 bg-[#093E7A]/40 rounded-full blur-3xl z-0 animate-float-slower"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-md border border-white/25 text-white font-bold text-xs uppercase tracking-widest rounded-full mb-4">
                        <span className="material-symbols-outlined text-base">event</span>
                        Año {year}
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">{getVal('calendario_titulo', 'Calendario Académico')}</h1>
                    <div className="w-20 h-1.5 bg-white/80 rounded-full mb-3"></div>
                    <p className="text-white/90 max-w-2xl">{getVal('calendario_subtitulo', 'Consulta las fechas importantes y eventos del año escolar.')}</p>
                </div>
            </section>

            <div className="py-10 md:py-12 px-4 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                                <h2 className="text-xl sm:text-2xl font-black text-[#093E7A]">{MESES[month]} {year}</h2>
                                <div className="flex items-center gap-2">
                                    {/* COMBO BOX DE AÑO */}
                                    <label className="sr-only" htmlFor="selector-anio">Año</label>
                                    <div className="relative">
                                        <select
                                            id="selector-anio"
                                            value={year}
                                            onChange={(e) => cambiarAnio(Number(e.target.value))}
                                            className="appearance-none bg-slate-50 border border-slate-200 text-[#093E7A] font-bold text-sm rounded-full pl-4 pr-9 py-2 cursor-pointer hover:bg-slate-100 focus:ring-2 focus:ring-[#093E7A]/20 outline-none transition-colors"
                                        >
                                            {aniosDisponibles.map(a => (
                                                <option key={a} value={a}>{a}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-lg">expand_more</span>
                                    </div>
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

                    {/* Sidebar de Eventos del año seleccionado */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-[#701C32]">Eventos {year}</h3>
                            {eventosOrdenados.length > 0 && (
                                <span className="text-[11px] font-bold text-[#093E7A] bg-[#093E7A]/10 px-3 py-1 rounded-full">
                                    {eventosOrdenados.length}
                                </span>
                            )}
                        </div>
                        <div className="space-y-4 lg:max-h-[600px] lg:overflow-y-auto custom-scrollbar lg:pr-1">
                            {eventosOrdenados.map(ev => {
                                const inicio = parseFechaLocal(ev.fecha_inicio);
                                const pasado = inicio ? inicio < today : false;
                                return (
                                    <button
                                        key={ev.id_evento}
                                        onClick={() => inicio && setViewDate(new Date(inicio.getFullYear(), inicio.getMonth(), 1))}
                                        className={`w-full text-left bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all ${pasado ? "opacity-60" : ""}`}
                                    >
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="w-11 h-11 rounded-lg flex flex-col items-center justify-center text-white shrink-0" style={{ backgroundColor: ev.color || '#093E7A' }}>
                                                <span className="text-sm font-black leading-none">{inicio?.getDate()}</span>
                                                <span className="text-[8px] font-bold uppercase">{MESES[inicio?.getMonth() ?? 0].slice(0, 3)}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-800 leading-tight truncate">{ev.titulo}</h4>
                                                <p className="text-[11px] text-slate-400 font-medium">{formatearFechaCorta(ev.fecha_inicio)}</p>
                                            </div>
                                        </div>
                                        {ev.descripcion && <p className="text-xs text-slate-500 line-clamp-2">{ev.descripcion}</p>}
                                    </button>
                                );
                            })}
                            {eventosOrdenados.length === 0 && (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                                    <p className="text-sm text-slate-400 font-medium italic">No hay eventos registrados para {year}.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
