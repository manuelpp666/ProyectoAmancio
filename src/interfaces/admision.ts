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
}

export interface SolicitudAdmision extends AlumnoBase {
  familiar_nombre: string;
  familiar_telefono: string;
  fecha_postulacion: string;
}