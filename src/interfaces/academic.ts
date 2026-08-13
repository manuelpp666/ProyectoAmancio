export interface Area {
  id_area: number;
  nombre: string;
}

export interface Seccion {
  id_seccion?: number;
  id_grado: number;
  id_anio_escolar?: string;
  nombre: string;
  vacantes?: number;
  ocupadas?: number;
  grado?: Grado;
}

export interface Grado {
  id_grado: number;
  id_nivel: number;
  nombre: string;
  orden: number;
  nivel?: Nivel;
}

export interface Nivel {
  id_nivel: number;
  nombre: string;
}

export interface AnioEscolar {
  id_anio_escolar: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  activo: boolean;
  tipo: 'REGULAR' | 'VERANO';
  inicio_inscripcion?: string; 
  fin_inscripcion?: string; 
}

export interface CursoDocente {
  id_carga: number;
  curso_nombre: string;
  // Propiedades opcionales: no causarán error si el JSON no las trae
  grado_nombre?: string;
  seccion_nombre?: string;
  alumnos?: number;
  img?: string; 
}

export interface Tarea {
  id_tarea: number;
  titulo: string;
  fecha_entrega: string;
  curso?: string;
  entregado: boolean;
  descripcion?: string;
  nota?: number;
  archivo_adjunto_url?: string;
  retroalimentacion_docente?: string; // Nuevo campo
  bimestre: number; // Nuevo campo
  peso: number;
}

export interface ResumenNotas {
  nota_bimestre1?: number;
  nota_bimestre2?: number;
  nota_bimestre3?: number;
  nota_bimestre4?: number;
  promedio_final?: number;
}

export interface MaterialClase {
  id_material: number;
  titulo: string;
  descripcion?: string | null;
  archivo_url?: string | null;
  bimestre: number;
}

export interface DetalleCurso {
  curso_nombre: string;
  docente_nombre: string;
  tareas: Tarea[];
  materiales?: MaterialClase[];
  notas: ResumenNotas;
}


export interface Curso {
  id_curso: number;
  nombre: string;
  id_area: number;
  docente?: string;
  minutos_semanales?: number;
  es_verano?: boolean;
  tipo_verano?: string | null; // FIJO / TALLER
  grupo_verano?: string | null; // PRIM_1_2, ..., PRE_ACADEMIA
}

export interface PlanEstudio {
  id_plan_estudio: number;
  id_curso: number;
  id_grado: number;
  curso: Curso; // Esto viene del schema PlanEstudioResponse
}

// interfaz para Grado que incluye cursos
export interface GradoConCursos extends Omit<Grado, 'secciones'> {
  planes_estudio: PlanEstudio[];
}

// Nueva interfaz para Nivel que incluye grados con cursos
export interface NivelConCursos {
  id_nivel: number;
  nombre: string;
  grados: GradoConCursos[];
}


export interface MateriaDisponible {
  id_carga_academica: number;
  curso_nombre: string;
  docente_nombre: string;
}

export interface HorarioAsignado {
  id_horario: number;
  id_hora?: number;       
  dia_semana: string;
  hora_inicio: string;   
  hora_fin: string;       
  curso_nombre: string;
  docente_nombre: string;
}

export interface HoraLectiva {
  id_hora: number;
  hora_inicio: string;
  hora_fin: string;
  tipo: 'lectiva' | 'receso';
}

/**
 * Una fila de la rejilla del horario, tal como la calcula el backend.
 *
 * La duración del bloque y los recesos se configuran desde el panel y viven
 * en la base de datos; antes estaban escritos a mano en el código, en el
 * constructor y en la tabla del docente por separado, y era fácil que
 * dejaran de coincidir. Ahora el cálculo se hace en un solo sitio.
 */
export interface BloqueHorario {
  hora_inicio: string;
  hora_fin: string;
  tipo: 'clase' | 'receso';
  duracion: number;
  /** Solo en los recesos: "Recreo", "Almuerzo"… */
  nombre?: string | null;
}

export interface RecesoConfig {
  id_receso: number;
  nombre: string;
  hora_inicio: string;
  duracion: number;
}

export type AmbitoHorario = 'PRIMARIA' | 'SECUNDARIA' | 'PRE_ACADEMIA';
export type ModalidadHorario = 'REGULAR' | 'VERANO';

export interface ConfiguracionHorario {
  id_configuracion: number;
  ambito: AmbitoHorario;
  modalidad: ModalidadHorario;
  duracion_bloque: number;
  hora_inicio: string;
  hora_fin: string;
  recesos: RecesoConfig[];
  bloques: BloqueHorario[];
}