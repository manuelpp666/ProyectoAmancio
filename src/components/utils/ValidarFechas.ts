

/**
 * Valida si un rango de fechas es lógico (fin > inicio)
 */
export const isDateRangeValid = (inicio: string, fin?: string): boolean => {
  if (!inicio || !fin) return true; // Si falta una, no podemos validar error aún
  
  const dateInicio = new Date(inicio);
  const dateFin = new Date(fin);
  
  return dateFin > dateInicio;
};

/**
 * Valida si una fecha no es anterior al día de hoy (útil para aperturas)
 */
export const isNotPastDate = (fecha: string): boolean => {
  const date = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return date >= hoy;
};