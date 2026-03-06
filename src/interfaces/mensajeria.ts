
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


export interface ListaProps {
  contactos: Contacto[];
  chatActivoID: number | null;
  setChatActivoID: (id: number | null) => void;
  query: string;
  setQuery: (q: string) => void;
  resultadosBusqueda: any[];
  estaBuscando: boolean;
  seleccionarContacto: (contacto: any) => void;
}


export interface ChatProps {
  contacto: Contacto | undefined;
  setChatActivoID: (id: number | null) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  textoMensaje: string;
  setTextoMensaje: (t: string) => void;
  onEnviar: () => void;
}


