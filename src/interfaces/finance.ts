export interface Pago {
  id_pago: number;
  id_alumno: number;
  alumno_nombre?: string; // Se llena con un JOIN en el backend
  dni_alumno?: string;
  concepto: string;
  monto: number;
  mora: number;
  monto_total: number;
  estado: "PENDIENTE" | "PAGADO" | "VENCIDO";
  fecha_vencimiento: string;
  fecha_pago?: string;
  codigo_operacion_bcp?: string;
}

export interface Solicitud {
  id_solicitud_tramite: number;
  id_alumno: number;
  alumno_nombre?: string;
  alumno_dni?: string;
  tramite_nombre?: string;
  fecha_solicitud: string;
  estado: "PENDIENTE_PAGO" | "PAGADO_PENDIENTE_REVISION" | "APROBADO" | "RECHAZADO";
  archivo_adjunto?: string;
  comentario_usuario?: string;
  respuesta_administrativa?: string;
}