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
  /** Bimestre en curso: el puntaje se reinicia al empezar cada uno. */
  bimestre?: number | null;
  /** Reportes que caen dentro del bimestre en curso (los únicos que descuentan). */
  reportes_del_bimestre?: number;
  /** True si la nota la puso el colegio en el sistema anterior. En ese caso no
   *  sale de los reportes: manda la nota migrada, para que coincida con la
   *  libreta que la familia ya tiene impresa. */
  nota_de_registro_anterior?: boolean;
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
