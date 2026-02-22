export interface Evento {
  id_evento: number;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio: string; 
  fecha_fin?: string | null;
  tipo_evento?: string | null;
  color?: string | null;
  activo: boolean;
}