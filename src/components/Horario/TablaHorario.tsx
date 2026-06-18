// components/Horario/TablaHorario.tsx
// Replica el formato del Constructor de Horarios del panel de administración:
// bloques dinámicos de 50 min (07:30 a 19:30) con recesos fijos y tarjetas de colores por curso.
import { useMemo } from "react";
import { HorarioAsignado } from "@/src/interfaces/academic";
import { Clock } from "lucide-react";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Misma paleta usada en el panel de administración para diferenciar cursos
const COLORES_CURSO = [
    { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
    { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
    { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
    { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
    { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700" },
];
const colorCurso = (nombre: string) => {
    let h = 0;
    for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
    return COLORES_CURSO[h % COLORES_CURSO.length];
};

interface BloqueTiempo {
    hora_inicio: string;
    hora_fin: string;
    tipo: "clase" | "receso";
}

// Genera los mismos bloques que el Constructor de Horarios del admin:
// clases de 50 min de 7:30 a 19:30, recesos 10:50-11:10 y 17:30-17:50
function generarBloques(): BloqueTiempo[] {
    const toDate = (h: number, m: number) => new Date(2000, 0, 1, h, m);
    const fmt = (d: Date) => d.toTimeString().substring(0, 5);
    const recesos = [
        { inicio: toDate(10, 50), fin: toDate(11, 10) },
        { inicio: toDate(17, 30), fin: toDate(17, 50) },
    ];
    const end = toDate(19, 30);
    const DURACION = 50;
    const bloques: BloqueTiempo[] = [];
    let current = toDate(7, 30);

    while (current < end) {
        const receso = recesos.find(r => r.inicio.getTime() === current.getTime());
        if (receso) {
            bloques.push({ hora_inicio: fmt(receso.inicio), hora_fin: fmt(receso.fin), tipo: "receso" });
            current = receso.fin;
            continue;
        }
        let next = new Date(current.getTime() + DURACION * 60000);
        const cruza = recesos.find(r => r.inicio.getTime() > current.getTime() && r.inicio.getTime() < next.getTime());
        if (cruza) next = cruza.inicio;
        if (next.getTime() > end.getTime()) next = end;
        if (next.getTime() <= current.getTime()) break;
        bloques.push({ hora_inicio: fmt(current), hora_fin: fmt(next), tipo: "clase" });
        current = next;
    }
    return bloques;
}

interface Props {
    horario: HorarioAsignado[];
}

export function TablaHorario({ horario }: Props) {
    const bloques = useMemo(() => {
        const todos = generarBloques();
        if (!Array.isArray(horario) || horario.length === 0) return todos;

        // Recortar las filas vacías del final: mostramos hasta el último bloque con clase
        let ultimoConClase = -1;
        todos.forEach((b, i) => {
            const tieneClase = horario.some(h => h.hora_inicio.substring(0, 5) === b.hora_inicio);
            if (tieneClase) ultimoConClase = i;
        });
        return ultimoConClase >= 0 ? todos.slice(0, ultimoConClase + 1) : todos;
    }, [horario]);

    const obtenerCelda = (horaInicioBloque: string, dia: string) => {
        if (!Array.isArray(horario)) return undefined;
        return horario.find(h =>
            h.hora_inicio.substring(0, 5) === horaInicioBloque.substring(0, 5) &&
            h.dia_semana.toLowerCase() === dia.toLowerCase()
        );
    };

    return (
        <div className="min-w-[900px]">
            {/* CABECERA */}
            <div className="grid grid-cols-[120px_repeat(5,1fr)] bg-gray-50 border-b text-center font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                <div className="p-4 border-r flex items-center justify-center gap-1.5">
                    <Clock size={12} /> Bloque
                </div>
                {DIAS.map(d => (
                    <div key={d} className="p-4 border-r text-[#701C32] font-black text-xs">{d}</div>
                ))}
            </div>

            {/* FILAS DE BLOQUES */}
            {bloques.map((bloque, idx) => (
                <div key={idx} className="grid grid-cols-[120px_repeat(5,1fr)]">
                    {/* Columna de hora */}
                    <div className={`min-h-[80px] border-b border-r flex flex-col items-center justify-center text-[10px] font-bold ${bloque.tipo === "receso" ? "bg-slate-100" : "bg-gray-50/30"}`}>
                        <span className="text-gray-600">{bloque.hora_inicio}</span>
                        <span className="text-gray-400 font-normal">{bloque.hora_fin}</span>
                    </div>

                    {/* Columnas de días */}
                    {DIAS.map((dia) => {
                        if (bloque.tipo === "receso") {
                            return (
                                <div key={dia} className="min-h-[40px] border-b border-r bg-slate-50 flex items-center justify-center">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest rotate-[-10deg]">
                                        Receso
                                    </span>
                                </div>
                            );
                        }

                        const celda = obtenerCelda(bloque.hora_inicio, dia);
                        const color = celda ? colorCurso(celda.curso_nombre) : null;

                        return (
                            <div key={dia} className="min-h-[80px] border-b border-r p-2">
                                {celda && color ? (
                                    <div className={`h-full w-full ${color.bg} border ${color.border} rounded-lg p-2 flex flex-col justify-between animate-in fade-in zoom-in duration-300`}>
                                        <div>
                                            <p className={`text-[10px] font-black ${color.text} uppercase leading-tight`}>
                                                {celda.curso_nombre}
                                            </p>
                                            <p className={`text-[9px] ${color.text} opacity-70 mt-1`}>
                                                {celda.docente_nombre}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full w-full"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
