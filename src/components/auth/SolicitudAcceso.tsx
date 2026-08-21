"use client";

/**
 * "No puedo entrar": el aviso que se manda desde la pantalla de inicio de sesión.
 *
 * POR QUÉ EXISTE
 *   Quien no consigue entrar no tenía forma de avisar. La mensajería interna
 *   está detrás del login, así que la pantalla se limitaba a decirle que
 *   hablara con la administración y los avisos acababan llegando por WhatsApp
 *   al que le pillara, sin quedar constancia de ninguno.
 *
 * LO QUE NO HACE
 *   No abre ninguna puerta. Mandar esto no reinicia contraseñas ni desbloquea
 *   cuentas: deja una nota en el panel para que un administrador la atienda a
 *   mano. Quien la manda no ha demostrado ser quien dice ser, y el formulario
 *   se lo dice claramente para que no se quede esperando un correo automático.
 *
 * LAS COMPROBACIONES
 *   Las mismas que hace el backend, repetidas aquí. No es por desconfiar del
 *   servidor: es que un DNI mal escrito descubierto al enviar, con el mensaje
 *   ya redactado, se corrige mucho peor que uno señalado al momento. El que
 *   manda es el backend; esto solo evita el viaje.
 */

import { useEffect, useRef, useState } from "react";
import {
  LifeBuoy, X, Loader2, CheckCircle2, IdCard, Phone, MessageSquare, Info,
} from "lucide-react";

const DNI_LARGO = 8;
const TELEFONO_MIN = 7;
const TELEFONO_MAX = 9;
const DESCRIPCION_MIN = 20;
const DESCRIPCION_MAX = 1000;

/** Deja solo las cifras: la gente escribe guiones, espacios y prefijos. */
const soloDigitos = (texto: string) => texto.replace(/\D+/g, "");

/** El error del DNI, o null si está bien. Misma regla que el backend. */
export function errorDeDni(valor: string): string | null {
  const d = soloDigitos(valor);
  if (!d) return "Escribe tu DNI.";
  if (d.length !== DNI_LARGO)
    return `El DNI tiene ${DNI_LARGO} cifras y llevas ${d.length}.`;
  if (d === d[0].repeat(DNI_LARGO))
    return "Ese DNI no es válido: son ocho cifras iguales.";
  if (d === "12345678") return "Escribe tu DNI real, no un ejemplo.";
  return null;
}

/** El error del teléfono, o null. Se admite el fijo, que tiene siete cifras. */
export function errorDeTelefono(valor: string): string | null {
  let d = soloDigitos(valor);
  if (d.length > TELEFONO_MAX && d.startsWith("51")) d = d.slice(2);
  if (!d) return "Escribe un teléfono donde podamos llamarte.";
  if (d.length < TELEFONO_MIN || d.length > TELEFONO_MAX)
    return `El teléfono tiene ${d.length} cifras: debe tener entre ${TELEFONO_MIN} y ${TELEFONO_MAX}.`;
  if (d.length === TELEFONO_MAX && !d.startsWith("9"))
    return "Un celular de nueve cifras empieza por 9.";
  if (d === d[0].repeat(d.length))
    return "Ese teléfono no es válido: son todas cifras iguales.";
  return null;
}

/** El error de la descripción, o null. */
export function errorDeDescripcion(valor: string): string | null {
  const limpio = valor.trim().replace(/\s+/g, " ");
  if (limpio.length < DESCRIPCION_MIN)
    return `Cuenta un poco más: llevas ${limpio.length} de ${DESCRIPCION_MIN} caracteres.`;
  if (limpio.length > DESCRIPCION_MAX)
    return `Es demasiado larga (máximo ${DESCRIPCION_MAX} caracteres).`;
  // "aaaa aaaa aaaa" pasa el mínimo y no dice nada.
  if (new Set(limpio.toLowerCase().split(" ")).size < 3)
    return "Explica el problema con tus palabras: por ejemplo, qué mensaje te sale.";
  return null;
}

interface Props {
  /** Se rellena solo si ya escribió su DNI en el campo de usuario del login. */
  dniSugerido?: string;
}

export default function SolicitudAcceso({ dniSugerido }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [descripcion, setDescripcion] = useState("");
  // Un campo solo enseña su error cuando ya se ha salido de él. Marcarlo en
  // rojo mientras teclea la primera cifra es hostil.
  const [tocado, setTocado] = useState<Record<string, boolean>>({});

  const primerCampo = useRef<HTMLInputElement>(null);
  const dialogo = useRef<HTMLDivElement>(null);

  const eDni = errorDeDni(dni);
  const eTelefono = errorDeTelefono(telefono);
  const eDescripcion = errorDeDescripcion(descripcion);
  const listo = !eDni && !eTelefono && !eDescripcion;

  const abrir = () => {
    setAbierto(true);
    setEnviado(false);
    setErrorGeneral(null);
    setTocado({});
    // Si ya había escrito su DNI en el login, no hay que hacérselo repetir.
    const sugerido = soloDigitos(dniSugerido ?? "");
    if (sugerido.length === DNI_LARGO && !dni) setDni(sugerido);
  };

  const cerrar = () => {
    if (enviando) return;   // a media petición, cerrar deja el aviso a medias
    setAbierto(false);
  };

  // Escape cierra, y el foco entra en el diálogo: sin esto, el teclado se
  // queda detrás, en el formulario de login que ya no se ve.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", alPulsar);
    const t = setTimeout(() => primerCampo.current?.focus(), 60);
    // Mientras el diálogo está encima, la página de abajo no se desplaza.
    const scrollPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alPulsar);
      clearTimeout(t);
      document.body.style.overflow = scrollPrevio;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, enviando]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setTocado({ dni: true, telefono: true, descripcion: true });
    if (!listo) return;

    setEnviando(true);
    setErrorGeneral(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/seguridad/solicitudes-acceso`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dni, telefono, descripcion }),
        }
      );

      if (!res.ok) {
        // Solo se le enseña al visitante lo que el servidor escribió PARA él:
        // un dato mal (422), demasiadas solicitudes (429), o el buzón caído
        // (503). Cualquier otro estado trae mensajes internos —un 404 dice
        // literalmente "Not Found"— que no le dicen nada y le asustan.
        const suyo = [400, 422, 429, 503].includes(res.status);
        const datos = suyo ? await res.json().catch(() => null) : null;
        // Un 422 de FastAPI trae la lista de campos; se saca el primer motivo,
        // que es el que la persona puede corregir.
        const detalle = datos?.detail;
        const motivo = Array.isArray(detalle)
          ? (detalle[0]?.msg ?? "").replace(/^Value error, /, "")
          : typeof detalle === "string"
            ? detalle
            : null;
        throw new Error(
          motivo ||
          "No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos " +
          "o acércate a la administración del colegio."
        );
      }

      setEnviado(true);
      setDni("");
      setTelefono("");
      setDescripcion("");
      setTocado({});
    } catch (err: unknown) {
      setErrorGeneral(
        err instanceof Error && err.message
          ? err.message
          : "No pudimos enviar tu solicitud. Revisa tu conexión."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {/* El botón va en la propia pantalla de login, a la vista y con aspecto
          de botón. Antes esto era una frase gris que no invitaba a nada. */}
      <button
        type="button"
        onClick={abrir}
        className="w-full mt-6 flex items-center justify-center gap-2 border-2 border-[#701C32]/20 text-[#701C32] hover:bg-[#701C32] hover:text-white hover:border-[#701C32] font-bold text-sm py-3 rounded-xl transition-all"
      >
        <LifeBuoy size={18} />
        No puedo entrar / Reportar un problema
      </button>

      {!abierto ? null : (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
        >
          <div
            ref={dialogo}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-solicitud"
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl my-8"
          >
            <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FFF1E3] text-[#701C32] shrink-0">
                  <LifeBuoy size={22} />
                </div>
                <div>
                  <h2 id="titulo-solicitud" className="text-lg font-black text-[#701C32] leading-tight">
                    ¿Problemas para entrar?
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cuéntanos qué te pasa y el colegio te contactará
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {enviado ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                <h3 className="font-black text-slate-800 text-lg mb-2">
                  Solicitud enviada
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                  El colegio revisará tu caso y se pondrá en contacto contigo por
                  el teléfono que dejaste. No hace falta que la mandes otra vez.
                </p>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="mt-6 px-6 py-3 bg-[#093E7A] hover:bg-[#072e5c] text-white font-bold text-sm rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={enviar} className="p-6 space-y-5" noValidate>
                {errorGeneral && (
                  <div role="alert" className="p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm font-medium">
                    {errorGeneral}
                  </div>
                )}

                <Campo
                  id="sol-dni"
                  etiqueta="Tu DNI"
                  icono={<IdCard size={18} />}
                  error={tocado.dni ? eDni : null}
                  ayuda="Las 8 cifras, sin puntos ni guiones."
                >
                  <input
                    ref={primerCampo}
                    id="sol-dni"
                    // inputMode numérico para que el móvil abra el teclado de
                    // cifras; el type sigue siendo text porque `number` deja
                    // meter signos y notación científica.
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={DNI_LARGO}
                    value={dni}
                    onChange={(e) => setDni(soloDigitos(e.target.value).slice(0, DNI_LARGO))}
                    onBlur={() => setTocado((t) => ({ ...t, dni: true }))}
                    placeholder="12345678"
                    className={entrada(tocado.dni && eDni)}
                  />
                </Campo>

                <Campo
                  id="sol-telefono"
                  etiqueta="Teléfono de contacto"
                  icono={<Phone size={18} />}
                  error={tocado.telefono ? eTelefono : null}
                  ayuda="Un número al que podamos llamarte o escribirte."
                >
                  <input
                    id="sol-telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={TELEFONO_MAX}
                    value={telefono}
                    onChange={(e) => setTelefono(soloDigitos(e.target.value).slice(0, TELEFONO_MAX))}
                    onBlur={() => setTocado((t) => ({ ...t, telefono: true }))}
                    placeholder="987654321"
                    className={entrada(tocado.telefono && eTelefono)}
                  />
                </Campo>

                <Campo
                  id="sol-descripcion"
                  etiqueta="¿Qué te pasa al intentar entrar?"
                  icono={<MessageSquare size={18} />}
                  error={tocado.descripcion ? eDescripcion : null}
                  ayuda={`${descripcion.trim().length}/${DESCRIPCION_MAX} caracteres`}
                >
                  <textarea
                    id="sol-descripcion"
                    rows={4}
                    maxLength={DESCRIPCION_MAX}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    onBlur={() => setTocado((t) => ({ ...t, descripcion: true }))}
                    placeholder="Ejemplo: escribo mi DNI y mi contraseña y me sale «Credenciales inválidas». Ya probé desde el celular y desde la computadora."
                    className={`${entrada(tocado.descripcion && eDescripcion)} !pl-4 resize-y min-h-[110px] leading-relaxed`}
                  />
                </Campo>

                <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <Info size={16} className="text-[#093E7A] shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Esto <b>no cambia tu contraseña ni te abre la cuenta</b>: es un
                    aviso para que alguien del colegio lo revise. Te llamarán al
                    teléfono que dejes, así que compruébalo antes de enviar.
                  </p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={cerrar}
                    disabled={enviando}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="flex-[2] py-3.5 rounded-xl font-bold text-sm text-white bg-[#701C32] hover:bg-[#5a1628] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                  >
                    {enviando && <Loader2 size={18} className="animate-spin" />}
                    {enviando ? "Enviando..." : "Enviar solicitud"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/** El recuadro de un campo, en rojo si tiene un error que ya toca enseñar. */
const entrada = (conError: string | null | false | undefined) =>
  `w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm ${
    conError
      ? "border-red-400 focus:ring-2 focus:ring-red-200"
      : "border-gray-300 focus:ring-2 focus:ring-[#093E7A] focus:border-transparent"
  }`;

function Campo({ id, etiqueta, icono, error, ayuda, children }: {
  id: string;
  etiqueta: string;
  icono: React.ReactNode;
  error: string | null;
  ayuda: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-1.5">
        {etiqueta} <span className="text-[#701C32]">*</span>
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-[1.15rem] -translate-y-1/2 text-slate-400 pointer-events-none">
          {icono}
        </span>
        {children}
      </div>
      <p className={`text-xs mt-1.5 ${error ? "text-red-600 font-medium" : "text-slate-400"}`}>
        {error ?? ayuda}
      </p>
    </div>
  );
}
