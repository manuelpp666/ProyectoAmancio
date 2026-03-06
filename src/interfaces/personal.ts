export type TipoPersonal = "admin" | "docente" | "auxiliar";

export interface Personal {
  id: number; // Corregido: int -> number
  id_usuario: number; // Corregido: int -> number
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  sueldo: number;
  usuario: { activo: boolean; username: string };
}
