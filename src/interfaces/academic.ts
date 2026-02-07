export interface Area {
  id_area: number;
  nombre: string;
}

export interface Seccion {
  id_seccion: number;
  id_grado: number;
  nombre: string;
  aula?: string; // Opcional según tu DB
  vacantes: number;
}

export interface Grado {
  id_grado: number;
  id_nivel: number;
  nombre: string;
  orden: number;
  secciones: Seccion[];
}

export interface Nivel {
  id_nivel: number;
  nombre: string;
  grados: Grado[];
}

export interface AnioEscolar {
  id_anio_escolar: string;
  fecha_inicio: string; // Las fechas vienen como string de la API
  fecha_fin: string;
  activo: boolean;
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