
// src/types/mensajeria.ts

export interface Mensaje {
  id: number;
  texto: string;
  esMio: boolean;
  hora: string;
  remitente_id?: number; // Opcional, útil para lógica de sockets
}

export interface Contacto {
  id: number;           // Representa el id_conversacion
  receptor_id: number;  // id_usuario de la otra persona
  nombre: string;
  rol: string;
  ultimoMensaje: string;
  hora: string;
  iniciales: string;
  color: string;
  mensajes: Mensaje[];
}

// También podemos exportar tipos para las respuestas de la API
export interface ApiResponseHistorial {
  id: number;
  texto: string;
  remitente_id: number;
  hora: string;
}