/** Familiar vinculado a un alumno, tal como lo devuelve /alumnos/{id}/familiares */
export interface Familiar {
  id_familiar: number;
  nombre: string;
  nombres: string;
  apellidos: string;
  dni: string;
  parentesco: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
}

export const PARENTESCOS = ["Padre", "Madre", "Tutor", "Abuelo(a)", "Hermano(a)", "Otro"] as const;
