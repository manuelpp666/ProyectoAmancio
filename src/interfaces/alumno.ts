import { Curso } from "./academic";
import { Tarea } from "./academic";
export interface DashboardData {
    nombre_completo: string;
    cursos: Curso[];
    tareas_pendientes: Tarea[];
    anio_actual: string;
}