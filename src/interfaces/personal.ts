export type TipoPersonal = "admin" | "docente" | "auxiliar" | "psicologo";


export interface PermisosAdmin {
  panel_control?: boolean;
  gestion_estudiantes?: boolean;
  gestion_personal?: boolean;
  tramites_finanzas?: boolean;
  chatbot?: boolean;
  academico?: {
    estructura?: boolean;
    horarios?: boolean;
    docentes?: boolean;
    estudiantes?: boolean;
    cursos?: boolean;
  };
  contenido_web?: {
    info_general?: boolean;
    noticias?: boolean;
    calendario?: boolean;
  };
  all?: boolean; 
}

export interface Personal {
  id: number;
  id_usuario: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  sueldo: number;
  permisos?: PermisosAdmin | null;
  usuario: { activo: boolean; username: string };
}