// Color predeterminado de cada tipo de evento.
//
// Está en un solo sitio a propósito: el formulario del panel lo usa para pintar
// el color al elegir el tipo, y el calendario público lo usa para los puntos y
// la leyenda. Si estuviera duplicado, cualquier retoque acabaría con la leyenda
// diciendo un color y el calendario mostrando otro.
//
// El orden de esta lista es el que sale en el desplegable del panel.
export const COLOR_POR_TIPO: Record<string, string> = {
  "Inicio de Clases": "#0E7490",
  "Ceremonia": "#093E7A",
  "Festividades": "#701C32",
  "Feriado": "#D97706",
  "Actividad": "#059669",
  "Actividad Escolar": "#2563EB",
  "Vacaciones": "#DB2777",
};

// Para un evento sin tipo, o de un tipo que ya no esté en la lista de arriba.
export const COLOR_POR_DEFECTO = "#093E7A";

export const TIPOS_DE_EVENTO = Object.keys(COLOR_POR_TIPO);

/** Color que le toca a un tipo de evento. */
export const colorDeTipo = (tipo?: string | null): string => {
  if (!tipo) return COLOR_POR_DEFECTO;
  return COLOR_POR_TIPO[tipo.trim()] ?? COLOR_POR_DEFECTO;
};

/**
 * Color con el que se pinta un evento. Manda el que tenga guardado —los eventos
 * de antes de esta lista ya traen uno, y desde el panel se puede cambiar a mano—
 * y si no tiene, el de su tipo.
 */
export const colorDeEvento = (
  ev: { tipo_evento?: string | null; color?: string | null }
): string => ev.color?.trim() || colorDeTipo(ev.tipo_evento);
