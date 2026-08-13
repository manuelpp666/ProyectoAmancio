// components/Horario/TablaHorario.tsx
// Misma rejilla que el Constructor de Horarios del panel: los bloques y los
// recesos los calcula el backend a partir de la configuración del colegio.
// Antes se generaban aquí con los valores escritos a mano (50 min, recesos a
// las 10:50 y 17:30); si el colegio los cambiaba, esta tabla seguía pintando
// los antiguos y las clases no cuadraban con sus filas.
import { useMemo } from "react";
import { BloqueHorario, HorarioAsignado } from "@/src/interfaces/academic";
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

interface Props {
    horario: HorarioAsignado[];
    /** Rejilla que envía el backend. Si no llega, se deduce del propio horario. */
    bloques?: BloqueHorario[];
}

export function TablaHorario({ horario, bloques: bloquesProp }: Props) {
    const bloques = useMemo<BloqueHorario[]>(() => {
        // Sin rejilla del backend, se reconstruye a partir de las clases que
        // hay: así la tabla nunca sale vacía aunque falle esa petición.
        const base: BloqueHorario[] = bloquesProp?.length
            ? bloquesProp
            : Array.from(
                new Map(
                    (Array.isArray(horario) ? horario : []).map(h => [
                        h.hora_inicio.substring(0, 5),
                        {
                            hora_inicio: h.hora_inicio.substring(0, 5),
                            hora_fin: h.hora_fin.substring(0, 5),
                            tipo: "clase" as const,
                            duracion: 0,
                        },
                    ])
                ).values()
            ).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

        if (!Array.isArray(horario) || horario.length === 0) return base;

        // Recortar las filas vacías del final: mostramos hasta el último bloque con clase
        let ultimoConClase = -1;
        base.forEach((b, i) => {
            const tieneClase = horario.some(h => h.hora_inicio.substring(0, 5) === b.hora_inicio);
            if (tieneClase) ultimoConClase = i;
        });
        return ultimoConClase >= 0 ? base.slice(0, ultimoConClase + 1) : base;
    }, [horario, bloquesProp]);

    const obtenerCelda = (horaInicioBloque: string, dia: string) => {
        if (!Array.isArray(horario)) return undefined;
        return horario.find(h =>
            h.hora_inicio.substring(0, 5) === horaInicioBloque.substring(0, 5) &&
            h.dia_semana.toLowerCase() === dia.toLowerCase()
        );
    };

    return (
        <div className="min-w-[820px]">
            {/* CABECERA */}
            <div className="grid grid-cols-[78px_repeat(5,1fr)] bg-gray-50 border-b text-center font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                <div className="py-2 border-r flex items-center justify-center gap-1.5">
                    <Clock size={12} /> Hora
                </div>
                {DIAS.map(d => (
                    <div key={d} className="py-2 border-r last:border-r-0 text-[#701C32] font-black text-xs">{d}</div>
                ))}
            </div>

            {/* FILAS DE BLOQUES */}
            {bloques.map((bloque, idx) => (
                <div key={idx} className="grid grid-cols-[78px_repeat(5,1fr)]">
                    {/* Columna de hora. La fila del receso va más baja: no hay
                        nada que mostrar dentro y así no roba espacio. */}
                    <div className={`${bloque.tipo === "receso" ? "min-h-[26px] bg-amber-50/60" : "min-h-[56px] bg-gray-50/30"} border-b border-r flex flex-col items-center justify-center text-[10px] font-bold`}>
                        <span className={bloque.tipo === "receso" ? "text-amber-700" : "text-gray-600"}>
                            {bloque.hora_inicio}
                        </span>
                        {bloque.tipo !== "receso" && (
                            <span className="text-gray-400 font-normal">{bloque.hora_fin}</span>
                        )}
                    </div>

                    {/* El receso ocupa la franja entera, sin dividirla por días */}
                    {bloque.tipo === "receso" ? (
                        <div className="col-span-5 min-h-[26px] border-b bg-amber-50/60 flex items-center justify-center">
                            <span className="text-[9px] font-black text-amber-600/80 uppercase tracking-[0.2em]">
                                {bloque.nombre || "Receso"}
                            </span>
                        </div>
                    ) : DIAS.map((dia) => {
                        const celda = obtenerCelda(bloque.hora_inicio, dia);
                        const color = celda ? colorCurso(celda.curso_nombre) : null;

                        return (
                            <div key={dia} className="min-h-[56px] border-b border-r last:border-r-0 p-1">
                                {celda && color ? (
                                    <div className={`h-full w-full ${color.bg} border ${color.border} rounded-md px-1.5 py-1 flex flex-col justify-center animate-in fade-in zoom-in duration-300`}>
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
