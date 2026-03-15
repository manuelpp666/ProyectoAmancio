export type TipoPersonal = "admin" | "docente" | "auxiliar" | "psicologo";

export interface Personal {
  id: number;
  id_usuario: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  sueldo: number;
  usuario: { activo: boolean; username: string };
}