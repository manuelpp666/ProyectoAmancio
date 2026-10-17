export interface AlumnoBase {
  id_alumno: number;
  dni: string;
  nombres: string;
  apellidos: string;
  grado_ingreso?: {
    id_grado: number;
    nombre: string;
  };
  seccion?: string;
  estado_ingreso: "POSTULANTE" | "ADMITIDO" | "ESTUDIANTE" | "RETIRADO"| "RECHAZADO";
  motivo_rechazo?: string;
  // Campos que ya devuelve /alumnos/ (AlumnoResponse) y usa la edición
  id_usuario?: number | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  direccion?: string | null;
  enfermedad?: string | null;
  talla_polo?: string | null;
  colegio_procedencia?: string | null;
  id_grado_ingreso?: number | null;
  usuario?: {
    activo: boolean;
    username?: string | null;
    /** Se le pedirá cambiar la contraseña al entrar (columna de Gestión de Estudiantes). */
    debe_cambiar_password?: boolean;
  } | null;
}

export interface SolicitudAdmision extends AlumnoBase {
  familiar_nombre: string;
  familiar_telefono: string;
  fecha_postulacion: string;
}