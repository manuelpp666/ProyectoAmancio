export interface Docente {
  id_docente: number;
  nombres: string;
  apellidos: string;
  especialidad: string | null;
  telefono: string;
  email: string;
  dni: string;
  id_usuario?: number | null; // El "?" significa que es opcional
}

//Interfaz para el formulario de registro, no se necesita el id_docente todavía
export interface DocenteCreate {
  nombres: string;
  apellidos: string;
  especialidad: string;
  telefono: string;
  email: string;
  dni: string;
}