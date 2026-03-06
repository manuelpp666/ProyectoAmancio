export interface AlumnoMatriculado {
  id_matricula: number;
  id_alumno: number;
  nombres: string;
  apellidos: string;
  dni: string;
  id_seccion: number | null;
  id_grado: number;
}