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
  medida: string | null;
  cambio_ie: boolean;
  nota_reglamento: string;
}

export interface EstadoConducta {
  id_usuario: number;
  id_alumno: number;
  puntaje_actual: number;
  puntaje_maximo: number;
  umbral_observacion: number;
  umbral_critico: number;
  porcentaje_progreso: string;
  estado_color: "Verde" | "Amarillo" | "Rojo";
  requiere_cambio_ie: boolean;
  total_reportes: number;
  historial: HistorialConducta[];
}


export interface Cita {
  id_cita: number;
  motivo: string;
  fecha: string;
  hora: string;
  estado: "PROGRAMADA" | "REPROGRAMADA" | "COMPLETADA" | "CANCELADA";
  es_hoy: boolean;
}
