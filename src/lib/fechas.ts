/**
 * Fechas en formato AAAA-MM-DD, siempre en la hora del colegio.
 *
 * POR QUÉ EXISTE ESTE ARCHIVO
 * El atajo habitual para sacar la fecha de un `Date` es
 * `new Date().toISOString().split("T")[0]`, y está mal: `toISOString()`
 * convierte a UTC. Perú va cinco horas por detrás, así que a partir de las
 * 7 de la tarde ese atajo devuelve el día SIGUIENTE.
 *
 * En la práctica significaba que la asistencia registrada de noche se guardaba
 * con la fecha de mañana, y que los filtros por día del historial de conducta
 * y de citas dejaban fuera lo ocurrido esa misma tarde.
 *
 * Estas funciones leen el día, el mes y el año tal como los ve el usuario, sin
 * pasar por UTC.
 */

/** La fecha de un `Date` como AAAA-MM-DD, en hora local. */
export const fechaLocalISO = (fecha: Date = new Date()): string => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

/**
 * Lo mismo, para un valor que viene del servidor (texto o Date).
 * Devuelve "" si no se puede interpretar, para no romper un filtro con un
 * "NaN-NaN-NaN" que no coincidiría con nada y escondería el fallo.
 */
export const aFechaLocalISO = (valor: string | Date | null | undefined): string => {
  if (!valor) return "";
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? "" : fechaLocalISO(d);
};
