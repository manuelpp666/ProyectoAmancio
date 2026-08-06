export type TipoPersonal = "admin" | "docente" | "auxiliar" | "psicologo";


/**
 * Árbol de permisos de un administrador: apartado → pestaña → subpestaña.
 *
 * No se enumeran las claves aquí a propósito. La lista viva está en
 * src/config/permisos.ts (CATALOGO_PERMISOS), y duplicarla como tipo obligaba
 * a tocar dos sitios cada vez que el panel gana una pestaña.
 */
export type PermisosAdmin = Record<string, unknown>;

export interface Personal {
  id: number;
  id_usuario: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  permisos?: PermisosAdmin | null;
  usuario: { activo: boolean; username: string };
}