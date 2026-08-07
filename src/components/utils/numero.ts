/**
 * Campos numéricos que se pueden dejar en blanco mientras se escriben.
 *
 * Un <input type="number"> controlado cuyo estado es siempre un número no se
 * puede vaciar: al borrar el contenido el navegador manda "", el onChange lo
 * convierte de vuelta a un número (con `parseInt(v) || 0` o similar) y el valor
 * anterior reaparece en la casilla. Para escribir "180" hay que seleccionar el
 * 0 y sobrescribirlo, cosa que nadie hace: se acaba tecleando "0180".
 *
 * La variante sin red de seguridad (`parseInt(v)` a secas) es peor: deja NaN en
 * el estado, React avisa por consola, el total calculado sale "NaN" y al
 * guardar `JSON.stringify` lo manda como null.
 *
 * La solución es dejar que el estado guarde la cadena vacía mientras el campo
 * está en blanco, y volver a número en cuanto haya algo escrito. Al guardar,
 * `aNumero` resuelve ese vacío al valor que corresponda.
 *
 *   const [form, setForm] = useState({ minutos: "" as CampoNumero });
 *
 *   <input type="number"
 *          value={form.minutos}
 *          onChange={(e) => setForm({ ...form, minutos: leerNumero(e.target.value) })} />
 *
 *   // al guardar
 *   if (aNumero(form.minutos) <= 0) { ... }
 */
export type CampoNumero = number | "";

/**
 * Convierte lo que escribe el usuario en el valor del estado.
 *
 * El campo vacío se queda vacío en vez de saltar a cero. Un valor que el
 * navegador no sabe interpretar (pasa con entradas a medio escribir como "1e")
 * llega aquí como "" y se trata igual.
 */
export const leerNumero = (valor: string): CampoNumero => {
  if (valor.trim() === "") return "";
  const numero = Number(valor);
  return Number.isNaN(numero) ? "" : numero;
};

/**
 * Valor definitivo a la hora de guardar o calcular: el campo vacío cuenta como
 * `porDefecto` (cero salvo que se indique otra cosa).
 */
export const aNumero = (valor: CampoNumero, porDefecto = 0): number =>
  valor === "" ? porDefecto : valor;

/** ¿El campo quedó en blanco? Para validar antes de enviar. */
export const estaVacio = (valor: CampoNumero): boolean => valor === "";
