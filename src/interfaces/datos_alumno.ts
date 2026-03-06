export interface ResumenNota {
  id_curso: number;
  curso_nombre: string;
  promedio_final: number;
  nota_bimestre1: number;
  nota_bimestre2: number;
  nota_bimestre3: number;
  nota_bimestre4: number;
}


export interface HistorialConducta {
  fecha: string;
  motivo: string;
  puntos_restados: number;
  nota_reglamento: string;
}

export interface EstadoConducta {
  id_usuario: number;
  id_alumno: number;
  puntaje_actual: number;
  porcentaje_progreso: string;
  estado_color: "Verde" | "Amarillo" | "Rojo";
  total_reportes: number;
  historial: HistorialConducta[];
}


export interface Cita {
  id_cita: number;
  motivo: string;
  fecha: string;
  hora: string;
  estado: "PROGRAMADA" | "COMPLETADA" | "CANCELADA";
  es_hoy: boolean;
}
