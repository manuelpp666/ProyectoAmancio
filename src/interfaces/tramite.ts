export interface Tramite {
  id_tipo_tramite: number;
  nombre: string;
  costo: number;
  requisitos: string;
  alcance: "TODOS" | "GRADOS";
  grados_permitidos: string | null;
  activo: boolean;
  periodo_academico: "REGULAR" | "VERANO" | "AMBOS";
  dias_vencimiento: number;
  /** Si al solicitarlo hay que avisar al alumno con cuotas vencidas.
   *  Opcional: los trámites guardados antes de que existiera no lo traen. */
  requiere_pagos_al_dia?: boolean;
}
