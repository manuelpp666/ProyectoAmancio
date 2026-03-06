export interface Tramite {
  id_tipo_tramite: number;
  nombre: string;
  costo: number;
  requisitos: string;
  alcance: "TODOS" | "GRADOS";
  grados_permitidos: string | null;
  activo: boolean;
  periodo_academico: "REGULAR" | "VERANO" | "AMBOS";
}
