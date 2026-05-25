export interface Docente {
  id_docente: number;
  nombres: string;
  apellidos: string;
  especialidad: string | null;
  descripcion: string | null;     
  url_perfil: string | null;
  telefono: string;
  email: string;
  dni: string;
  visible_web?: boolean; // Controla si aparece en la web pública
  id_usuario?: number | null; // El "?" significa que es opcional
  usuario?: {
        activo: boolean;
        rol: string;
    };
}

//Interfaz para el formulario de registro, no se necesita el id_docente todavía
export interface DocenteCreate {
  nombres: string;
  apellidos: string;
  especialidad: string | null;
  descripcion?: string | null; 
  url_perfil?: string | null;
  telefono: string;
  email: string;
  dni: string;
}