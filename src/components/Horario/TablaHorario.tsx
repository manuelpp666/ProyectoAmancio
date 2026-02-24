// components/Horario/TablaHorario.tsx
import { HorarioAsignado, HoraLectiva } from "@/src/interfaces/academic";
import { Clock } from "lucide-react";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

interface Props {
    horario: HorarioAsignado[];
    bloques: HoraLectiva[];
}

export function TablaHorario({ horario, bloques }: Props) {
    const obtenerCelda = (id_hora: number, dia: string) => {
        if (!Array.isArray(horario)) return undefined;
        return horario.find(h => h.id_hora === id_hora && h.dia_semana.toLowerCase() === dia.toLowerCase());
    };

    return (
        <table className="w-full border-collapse">
            <thead>
                <tr className="bg-gray-50">
                    <th className="p-4 border-b border-r text-gray-500 font-bold text-xs uppercase w-32">
                        <div className="flex items-center gap-2 justify-center">
                            <Clock size={14} /> Hora
                        </div>
                    </th>
                    {DIAS.map(dia => (
                        <th key={dia} className="p-4 border-b border-r text-[#701C32] font-black text-sm uppercase">
                            {dia}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {bloques.map((bloque) => (
                    <tr key={bloque.id_hora} className="group">
                        {/* Columna de Hora */}
                        <td className="p-4 border-b border-r bg-gray-50/50 text-center">
                            <span className="text-sm font-bold text-gray-700 block">
                                {bloque.hora_inicio.substring(0, 5)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {bloque.hora_fin.substring(0, 5)}
                            </span>
                        </td>

                        {/* Columnas de Días */}
                        {DIAS.map(dia => {
                            const celda = obtenerCelda(bloque.id_hora, dia);
                            const esReceso = bloque.tipo.toLowerCase() === "receso";

                            if (esReceso) {
                                return (
                                    <td key={dia} className="p-2 border-b border-r bg-slate-50 text-center">
                                        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                                            Receso
                                        </span>
                                    </td>
                                );
                            }

                            return (
                                <td key={dia} className="p-2 border-b border-r min-w-[150px] transition-colors group-hover:bg-gray-50/30">
                                    {celda ? (
                                        <div className="bg-[#701C32]/5 border-l-4 border-[#701C32] p-3 rounded-r-lg h-full">
                                            <p className="text-xs font-black text-[#701C32] leading-tight mb-1">
                                                {celda.curso_nombre}
                                            </p>
                                            <p className="text-[10px] text-gray-500 font-medium truncate">
                                                {celda.docente_nombre}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="h-full min-h-[50px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-gray-300 italic">Libre</span>
                                        </div>
                                    )}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}