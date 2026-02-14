export interface Area {
  id_area: number;
  nombre: string;
}

export interface Seccion {
  id_seccion: number;
  id_grado: number;
  id_anio_escolar: string;
  nombre: string;
  vacantes: number;
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
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  tipo: 'REGULAR' | 'VERANO'; // Nuevo
}

export interface Curso {
  id_curso: number;
  nombre: string;
  id_area: number;
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
  id_hora: number;
  dia_semana: string;
  curso_nombre: string;
  docente_nombre: string;
}

export interface HoraLectiva {
  id_hora: number;
  hora_inicio: string;
  hora_fin: string;
  tipo: 'lectiva' | 'receso';
}