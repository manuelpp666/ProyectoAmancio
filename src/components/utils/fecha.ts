// Utilidades de fecha seguras frente a zona horaria.
// La API envía fechas tipo "2026-07-14" o "2026-07-14T00:00:00". Si se pasan
// directamente a `new Date()`, JS las interpreta como UTC y en Perú (UTC-5)
// retroceden un día. Estas funciones parsean la parte de fecha manualmente para
// construir siempre una fecha en la zona horaria local.

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

/** Convierte un string ISO ("2026-07-14" o con hora) en un Date local sin desfase. */
export const parseFechaLocal = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const soloFecha = iso.split("T")[0];
  const [y, m, d] = soloFecha.split("-").map(Number);
  if (!y || !m || !d) {
    // Fallback: dejar que el motor lo intente (por si viniera otro formato)
    const fallback = new Date(iso);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
  return new Date(y, m - 1, d);
};

/** "2026-07-14" -> "14 de julio de 2026" */
export const formatearFechaLarga = (iso?: string | null): string => {
  const fecha = parseFechaLocal(iso);
  if (!fecha) return "";
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

/** "2026-07-14" -> "14 jul 2026" (formato corto para tarjetas) */
export const formatearFechaCorta = (iso?: string | null): string => {
  const fecha = parseFechaLocal(iso);
  if (!fecha) return "";
  return fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
};
