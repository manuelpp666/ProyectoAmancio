// Tipos del módulo de conducta (reportes del auxiliar, catálogo del reglamento)

export interface AlumnoBusqueda {
  id_alumno: number;
  nombres: string;
  apellidos: string;
  dni: string;
}

export interface NivelConducta {
  id_nivel_conducta: number;
  nombre: string;
  id_tipo_falta: number;
  tipo_falta: string;
  puntos: number;
  medida: string | null;
  cambio_ie: boolean;
  descripcion: string | null;
}

export interface ResultadoReporte {
  id_reporte: number;
  alumno: string;
  falta: string;
  puntos_descontados: number;
  medida: string | null;
  puntaje_actual: number;
  estado_color: "Verde" | "Amarillo" | "Rojo";
  requiere_cambio_ie: boolean;
  /** Bimestre en el que cae el reporte: el puntaje se reinicia en cada uno. */
  bimestre?: number | null;
  /** La escala la manda el backend (única fuente de verdad). Opcional para no
   *  romper si la respuesta viene de una versión anterior del servidor. */
  puntaje_maximo?: number;
  umbral_observacion?: number;
  umbral_critico?: number;
}

export interface ReporteReciente {
  id_reporte: number;
  id_alumno?: number;
  id_nivel_conducta?: number;
  id_tipo_falta?: number;
  fecha: string;
  alumno: string;
  dni: string | null;
  falta: string;
  tipo_falta: string | null;
  puntos: number;
  medida: string | null;
  cambio_ie: boolean;
  descripcion: string;
}

/** Respuesta de GET /conducta/reportes/ (bandeja e historial). */
export interface RespuestaReportes {
  total: number;
  items: ReporteReciente[];
}
