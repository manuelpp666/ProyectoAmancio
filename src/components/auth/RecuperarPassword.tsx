"use client";

/**
 * "¿Olvidaste tu contraseña?": DNI -> código al correo -> contraseña nueva.
 *
 * Todo pasa en un mismo diálogo, paso a paso. La pantalla solo guía: cada paso
 * lo vuelve a comprobar el backend (app/modules/recuperacion), que es el que
 * manda. Aquí se repiten las reglas fáciles (8 cifras, que coincidan las
 * contraseñas…) para no hacer un viaje al servidor por un error que se ve al
 * momento.
 *
 * Según cómo esté la cuenta, el DNI lleva a sitios distintos:
 *   CON_CORREO          se envía el código directamente.
 *   INICIAL_CON_CORREO  aviso de contraseña inicial, y el código si lo prefiere.
 *   INICIAL_SIN_CORREO  aviso de contraseña inicial y «No puedo entrar».
 *   SIN_CORREO          no hay dónde mandar el código: «No puedo entrar».
 *   DESACTIVADA         que hable con el colegio.
 * Nunca se dice cuál es la contraseña inicial.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyRound, X, Loader2, CheckCircle2, IdCard, Mail, ShieldCheck, Lock,
  Eye, EyeOff, AlertTriangle, Info, ArrowLeft, RefreshCw, UserRound, LifeBuoy,
} from "lucide-react";
import { errorDeDni } from "@/src/components/auth/SolicitudAcceso";

const API = process.env.NEXT_PUBLIC_API_URL;
const DNI_LARGO = 8;
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72;

type Estado = "CON_CORREO" | "SIN_CORREO" | "INICIAL_SIN_CORREO" | "INICIAL_CON_CORREO" | "DESACTIVADA";
type Paso = "dni" | "cuentas" | "estado" | "codigo" | "nueva" | "listo";

interface Cuenta {
  rol: string;
  rol_nombre: string;
  usuario: string;
  estado: Estado;
  correo_oculto: string | null;
}

interface Props {
  /** Lo que ya escribió en el campo de usuario del login, si parece un DNI. */
  dniSugerido?: string;
  /** Abrir «No puedo entrar» con el DNI ya escrito. */
  onNoPuedoEntrar: (dni: string) => void;
  /** Volver al login con el usuario ya escrito. */
  onIrALogin: (usuario: string) => void;
}

const soloDigitos = (t: string) => t.replace(/\D+/g, "");

/** Lo que el servidor escribió PARA la persona. Otros estados (un 500, un
 *  404 de ruta) traen textos internos que no le dicen nada. */
async function leerError(res: Response, porDefecto: string): Promise<string> {
  if (![400, 403, 404, 409, 410, 422, 429, 503].includes(res.status)) return porDefecto;
  const datos = await res.json().catch(() => null);
  const detalle = datos?.detail;
  if (typeof detalle === "string" && detalle.trim()) return detalle;
  if (Array.isArray(detalle) && detalle[0]?.msg) {
    return String(detalle[0].msg).replace(/^Value error, /, "");
  }
  return porDefecto;
}

const SIN_CONEXION = "No pudimos conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.";

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function RecuperarPassword({ dniSugerido, onNoPuedoEntrar, onIrALogin }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [paso, setPaso] = useState<Paso>("dni");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El código ya no sirve (venció o se agotaron los intentos): lo único que
  // tiene sentido es pedir otro, así que ese botón pasa a ser el principal.
  const [codigoMuerto, setCodigoMuerto] = useState(false);

  const [dni, setDni] = useState("");
  const [dniTocado, setDniTocado] = useState(false);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [elegida, setElegida] = useState<Cuenta | null>(null);
  const [correoOculto, setCorreoOculto] = useState("");

  const [codigo, setCodigo] = useState("");
  const [venceCodigo, setVenceCodigo] = useState(0);
  const [puedeReenviar, setPuedeReenviar] = useState(0);
  const [token, setToken] = useState("");
  const [vencePermiso, setVencePermiso] = useState(0);

  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [tocadoPass, setTocadoPass] = useState({ nueva: false, confirmacion: false });
  const [usuarioFinal, setUsuarioFinal] = useState("");

  const [ahora, setAhora] = useState(() => Date.now());
  const primerCampo = useRef<HTMLInputElement>(null);

  // El reloj solo corre mientras hay algo que caduca en pantalla.
  useEffect(() => {
    if (!abierto || (paso !== "codigo" && paso !== "nueva")) return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [abierto, paso]);

  const reiniciar = () => {
    setPaso("dni"); setError(null); setCodigoMuerto(false); setCuentas([]);
    setElegida(null); setCodigo(""); setToken(""); setNueva(""); setConfirmacion("");
    setVerPassword(false); setTocadoPass({ nueva: false, confirmacion: false });
    setDniTocado(false);
  };

  const abrir = () => {
    reiniciar();
    const sugerido = soloDigitos(dniSugerido ?? "").slice(-DNI_LARGO);
    setDni(sugerido.length === DNI_LARGO ? sugerido : "");
    setAbierto(true);
  };

  const cerrar = useCallback(() => {
    if (cargando) return;   // a media petición, cerrar deja el paso a medias
    setAbierto(false);
  }, [cargando]);

  // Escape cierra, el foco entra en el diálogo y la página de abajo no se mueve.
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    document.addEventListener("keydown", alPulsar);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alPulsar);
      document.body.style.overflow = previo;
    };
  }, [abierto, cerrar]);

  useEffect(() => {
    if (!abierto) return;
    const t = setTimeout(() => primerCampo.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [abierto, paso]);

  const pedir = async (ruta: string, cuerpo: object) =>
    fetch(`${API}/recuperar-password/${ruta}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });

  // --- Paso 1: el DNI -------------------------------------------------------
  const eDni = errorDeDni(dni);

  const consultar = async (e: React.FormEvent) => {
    e.preventDefault();
    setDniTocado(true);
    if (eDni || cargando) return;
    setCargando(true);
    setError(null);
    try {
      const res = await pedir("consultar", { dni });
      if (!res.ok) throw new Error(await leerError(res, "No pudimos revisar tu DNI. Inténtalo en unos minutos."));
      const datos = await res.json();
      const lista: Cuenta[] = Array.isArray(datos?.cuentas) ? datos.cuentas : [];
      if (!lista.length) throw new Error("No encontramos ninguna cuenta con ese DNI.");
      setCuentas(lista);
      if (lista.length === 1) {
        await elegir(lista[0], true);
      } else {
        setPaso("cuentas");
      }
    } catch (err) {
      setError(err instanceof TypeError ? SIN_CONEXION : (err as Error).message);
    } finally {
      setCargando(false);
    }
  };

  // --- Paso 2: qué hacer con la cuenta --------------------------------------
  const elegir = async (c: Cuenta, yaCargando = false) => {
    setElegida(c);
    setError(null);
    setPaso("estado");
    // El caso normal no necesita pararse: el código sale en cuanto se elige.
    if (c.estado === "CON_CORREO") await enviarCodigo(c, yaCargando);
  };

  const enviarCodigo = async (c: Cuenta | null = elegida, yaCargando = false) => {
    if (!c || (cargando && !yaCargando)) return;
    setCargando(true);
    setError(null);
    try {
      const res = await pedir("enviar-codigo", { dni, rol: c.rol });
      if (!res.ok) throw new Error(await leerError(res, "No pudimos enviarte el código. Inténtalo en unos minutos."));
      const datos = await res.json();
      const t = Date.now();
      setCorreoOculto(datos.correo_oculto || c.correo_oculto || "tu correo");
      setVenceCodigo(t + (Number(datos.vence_en) || 600) * 1000);
      setPuedeReenviar(t + (Number(datos.reenviar_en) || 60) * 1000);
      setAhora(t);
      setCodigo("");
      setCodigoMuerto(false);
      setPaso("codigo");
    } catch (err) {
      setError(err instanceof TypeError ? SIN_CONEXION : (err as Error).message);
    } finally {
      if (!yaCargando) setCargando(false);
    }
  };

  // --- Paso 3: el código ------------------------------------------------------
  const codigoVencido = paso === "codigo" && venceCodigo > 0 && ahora >= venceCodigo;

  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!elegida || cargando) return;
    if (codigo.length !== 6) { setError("El código son 6 cifras."); return; }
    setCargando(true);
    setError(null);
    try {
      const res = await pedir("verificar-codigo", { dni, rol: elegida.rol, codigo });
      if (!res.ok) {
        if (res.status === 410) setCodigoMuerto(true);
        throw new Error(await leerError(res, "No pudimos comprobar el código. Inténtalo de nuevo."));
      }
      const datos = await res.json();
      setToken(datos.token);
      setVencePermiso(Date.now() + (Number(datos.vence_en) || 600) * 1000);
      setAhora(Date.now());
      setPaso("nueva");
    } catch (err) {
      setError(err instanceof TypeError ? SIN_CONEXION : (err as Error).message);
      setCodigo("");
      primerCampo.current?.focus();
    } finally {
      setCargando(false);
    }
  };

  // --- Paso 4: la contraseña nueva -----------------------------------------------
  const bytes = (t: string) => new TextEncoder().encode(t).length;
  const eNueva = !nueva
    ? "Escribe tu nueva contraseña."
    : nueva !== nueva.trim()
      ? "No puede empezar ni terminar con espacios."
      : nueva.length < PASSWORD_MIN
        ? `Debe tener al menos ${PASSWORD_MIN} caracteres (llevas ${nueva.length}).`
        : bytes(nueva) > PASSWORD_MAX_BYTES
          ? "Es demasiado larga (máximo 72 caracteres)."
          : nueva === dni
            ? "No puede ser tu DNI. Elige una distinta."
            : null;
  const eConfirmacion = !confirmacion
    ? "Repite la contraseña."
    : confirmacion !== nueva ? "Las contraseñas no coinciden." : null;
  const permisoVencido = paso === "nueva" && vencePermiso > 0 && ahora >= vencePermiso;

  const fuerza = (() => {
    if (!nueva) return { ancho: "0%", color: "bg-gray-200", texto: "" };
    let p = 0;
    if (nueva.length >= PASSWORD_MIN) p++;
    if (nueva.length >= 12) p++;
    if (/[a-zA-Z]/.test(nueva) && /\d/.test(nueva)) p++;
    if (/[^a-zA-Z0-9]/.test(nueva) || (/[a-z]/.test(nueva) && /[A-Z]/.test(nueva))) p++;
    if (p <= 1) return { ancho: "33%", color: "bg-red-500", texto: "Débil" };
    if (p <= 2) return { ancho: "66%", color: "bg-amber-500", texto: "Media" };
    return { ancho: "100%", color: "bg-emerald-500", texto: "Fuerte" };
  })();

  const cambiar = async (e: React.FormEvent) => {
    e.preventDefault();
    setTocadoPass({ nueva: true, confirmacion: true });
    if (!elegida || cargando || eNueva || eConfirmacion) return;
    setCargando(true);
    setError(null);
    try {
      const res = await pedir("cambiar", { dni, rol: elegida.rol, token, nueva, confirmacion });
      if (!res.ok) {
        if (res.status === 410) setCodigoMuerto(true);
        throw new Error(await leerError(res, "No pudimos guardar tu contraseña. Inténtalo de nuevo."));
      }
      const datos = await res.json();
      setUsuarioFinal(datos.username || elegida.usuario);
      setNueva(""); setConfirmacion(""); setToken("");
      setPaso("listo");
    } catch (err) {
      setError(err instanceof TypeError ? SIN_CONEXION : (err as Error).message);
    } finally {
      setCargando(false);
    }
  };

  const irALogin = (usuario: string) => {
    setAbierto(false);
    onIrALogin(usuario);
  };

  const noPuedoEntrar = () => {
    setAbierto(false);
    onNoPuedoEntrar(dni);
  };

  // --- Pantalla ---------------------------------------------------------------------
  const numeroPaso = paso === "dni" || paso === "cuentas" || paso === "estado" ? 1 : paso === "codigo" ? 2 : 3;

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="w-full mt-4 text-sm font-bold text-[#093E7A] hover:text-[#701C32] hover:underline transition-colors"
      >
        ¿Olvidaste tu contraseña?
      </button>

      {!abierto ? null : (
        // Fondo oscuro SIN desenfoque: debajo late sin parar el punto de
        // «Plataforma Activa 24/7», y con backdrop-blur el navegador tenía que
        // volver a desenfocar la pantalla entera en cada cuadro. En equipos
        // modestos y celulares el formulario iba a tirones.
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) cerrar(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-recuperar"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl my-8"
          >
            <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-[#FFF1E3] text-[#701C32] shrink-0">
                  <KeyRound size={22} />
                </div>
                <div className="min-w-0">
                  <h2 id="titulo-recuperar" className="text-lg font-black text-[#701C32] leading-tight">
                    Restablecer contraseña
                  </h2>
                  {paso !== "listo" && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Paso {numeroPaso} de 3 · {numeroPaso === 1 ? "Tu DNI" : numeroPaso === 2 ? "Código de verificación" : "Contraseña nueva"}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={cerrar}
                disabled={cargando}
                aria-label="Cerrar"
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {paso !== "listo" && (
              <div className="flex gap-1.5 px-6 pt-4" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n <= numeroPaso ? "bg-[#093E7A]" : "bg-slate-200"}`} />
                ))}
              </div>
            )}

            <div className="p-6 space-y-5">
              {error && (
                <div role="alert" className="p-3.5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm font-medium">
                  {error}
                </div>
              )}

              {/* ---------- Paso 1: DNI ---------- */}
              {paso === "dni" && (
                <form onSubmit={consultar} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="rec-dni" className="block text-sm font-bold text-slate-700 mb-1.5">
                      Tu DNI <span className="text-[#701C32]">*</span>
                    </label>
                    <div className="relative">
                      <IdCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        ref={primerCampo}
                        id="rec-dni"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        maxLength={DNI_LARGO}
                        value={dni}
                        onChange={(e) => { setDni(soloDigitos(e.target.value).slice(0, DNI_LARGO)); setError(null); }}
                        onBlur={() => setDniTocado(true)}
                        placeholder="Las 8 cifras de tu DNI"
                        className={entrada(dniTocado && eDni)}
                      />
                    </div>
                    <p className={`text-xs mt-1.5 ${dniTocado && eDni ? "text-red-600 font-medium" : "text-slate-400"}`}>
                      {(dniTocado && eDni) || "Si eres alumno, escribe el DNI del alumno."}
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                    <Info size={16} className="text-[#093E7A] shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Te enviaremos un código al <b>correo registrado en tu cuenta</b>. Si eres alumno,
                      llega al correo de tu apoderado.
                    </p>
                  </div>
                  <Botones
                    cargando={cargando}
                    textoCargando="Buscando tu cuenta..."
                    texto="Continuar"
                    onCancelar={cerrar}
                  />
                </form>
              )}

              {/* ---------- Varias cuentas con el mismo DNI ---------- */}
              {paso === "cuentas" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Tu DNI tiene <b>{cuentas.length} cuentas</b>. ¿Cuál quieres recuperar?
                  </p>
                  <div className="space-y-2.5">
                    {cuentas.map((c) => (
                      <button
                        key={c.rol}
                        type="button"
                        disabled={cargando}
                        onClick={() => elegir(c)}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-[#093E7A] hover:bg-[#093E7A]/5 disabled:opacity-60 text-left transition-colors"
                      >
                        <UserRound size={20} className="text-[#093E7A] shrink-0" />
                        <span className="font-bold text-slate-800">Cuenta de {c.rol_nombre}</span>
                      </button>
                    ))}
                  </div>
                  <BotonVolver onClick={() => { setError(null); setPaso("dni"); }} disabled={cargando}>
                    Usar otro DNI
                  </BotonVolver>
                </div>
              )}

              {/* ---------- Qué pasa con la cuenta elegida ---------- */}
              {paso === "estado" && elegida && (
                <div className="space-y-4">
                  <InsigniaRol cuenta={elegida} />

                  {elegida.estado === "CON_CORREO" && (
                    cargando ? (
                      <div className="flex flex-col items-center text-center py-6 gap-3">
                        <Loader2 size={32} className="animate-spin text-[#093E7A]" />
                        <p className="text-sm text-slate-600">
                          Enviando un código a <b>{elegida.correo_oculto}</b>...
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => enviarCodigo()}
                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#701C32] hover:bg-[#5a1628] flex items-center justify-center gap-2 transition-colors"
                      >
                        <RefreshCw size={18} /> Volver a intentar el envío
                      </button>
                    )
                  )}

                  {(elegida.estado === "INICIAL_SIN_CORREO" || elegida.estado === "INICIAL_CON_CORREO") && (
                    <>
                      <Aviso tono="ambar" icono={<Info size={18} />}>
                        Esta cuenta <b>todavía usa la contraseña inicial</b> que entregó el colegio.
                        Entra con ella: al ingresar, el sistema te pedirá crear tu propia contraseña
                        y registrar tu correo.
                      </Aviso>
                      <button
                        type="button"
                        onClick={() => irALogin(elegida.usuario)}
                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#093E7A] hover:bg-[#072e5c] transition-colors"
                      >
                        Ir a iniciar sesión
                      </button>
                      {elegida.estado === "INICIAL_CON_CORREO" ? (
                        <button
                          type="button"
                          disabled={cargando}
                          onClick={() => enviarCodigo()}
                          className="w-full py-3 rounded-xl font-bold text-sm text-[#701C32] border-2 border-[#701C32]/20 hover:bg-[#701C32] hover:text-white hover:border-[#701C32] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors break-all"
                        >
                          {cargando ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} className="shrink-0" />}
                          {cargando ? "Enviando código..." : `Prefiero recibir un código en ${elegida.correo_oculto}`}
                        </button>
                      ) : (
                        <EnlaceNoPuedoEntrar onClick={noPuedoEntrar} texto="¿No la recuerdas? Usa «No puedo entrar»" />
                      )}
                    </>
                  )}

                  {elegida.estado === "SIN_CORREO" && (
                    <>
                      <Aviso tono="ambar" icono={<AlertTriangle size={18} />}>
                        Tu cuenta <b>no tiene un correo registrado</b>, así que no podemos enviarte
                        un código. Envía una solicitud y el colegio te ayudará a recuperar el acceso.
                      </Aviso>
                      <button
                        type="button"
                        onClick={noPuedoEntrar}
                        className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#701C32] hover:bg-[#5a1628] flex items-center justify-center gap-2 transition-colors"
                      >
                        <LifeBuoy size={18} /> Enviar solicitud de «No puedo entrar»
                      </button>
                    </>
                  )}

                  {elegida.estado === "DESACTIVADA" && (
                    <Aviso tono="rojo" icono={<AlertTriangle size={18} />}>
                      Esta cuenta <b>está desactivada</b>. Comunícate con la administración del colegio.
                    </Aviso>
                  )}

                  <BotonVolver
                    disabled={cargando}
                    onClick={() => { setError(null); setPaso(cuentas.length > 1 ? "cuentas" : "dni"); }}
                  >
                    {cuentas.length > 1 ? "Elegir otra cuenta" : "Usar otro DNI"}
                  </BotonVolver>
                </div>
              )}

              {/* ---------- Paso 2: código ---------- */}
              {paso === "codigo" && elegida && (
                <form onSubmit={verificar} className="space-y-5" noValidate>
                  <InsigniaRol cuenta={elegida} />
                  <div className="flex items-start gap-3 rounded-xl bg-[#093E7A]/5 border border-[#093E7A]/15 p-4">
                    <Mail size={20} className="text-[#093E7A] shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-700 leading-relaxed min-w-0">
                      Te enviamos un <b>código de verificación</b> a{" "}
                      <b className="break-all">{correoOculto}</b>. Si no lo ves, revisa también la
                      carpeta de correo no deseado.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="rec-codigo" className="block text-sm font-bold text-slate-700 mb-1.5">
                      Código de 6 cifras <span className="text-[#701C32]">*</span>
                    </label>
                    <input
                      ref={primerCampo}
                      id="rec-codigo"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={codigo}
                      disabled={codigoVencido || codigoMuerto}
                      onChange={(e) => { setCodigo(soloDigitos(e.target.value).slice(0, 6)); setError(null); }}
                      placeholder="••••••"
                      className="w-full py-3.5 bg-gray-50 border border-gray-300 rounded-xl outline-none text-center text-2xl font-black tracking-[0.5em] text-[#093E7A] focus:ring-2 focus:ring-[#093E7A] focus:border-transparent disabled:opacity-50 transition-all"
                    />
                    <p className={`text-xs mt-1.5 ${codigoVencido ? "text-red-600 font-medium" : "text-slate-400"}`}>
                      {codigoVencido
                        ? "El código venció. Pide uno nuevo."
                        : `Vence en ${mmss(venceCodigo - ahora)}. Solo sirve una vez.`}
                    </p>
                  </div>

                  {codigoVencido || codigoMuerto ? (
                    <button
                      type="button"
                      disabled={cargando || ahora < puedeReenviar}
                      onClick={() => enviarCodigo()}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#701C32] hover:bg-[#5a1628] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                    >
                      {cargando ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      {ahora < puedeReenviar ? `Pedir un código nuevo (${mmss(puedeReenviar - ahora)})` : "Pedir un código nuevo"}
                    </button>
                  ) : (
                    <>
                      <Botones
                        cargando={cargando}
                        textoCargando="Comprobando..."
                        texto="Verificar código"
                        icono={<ShieldCheck size={18} />}
                        deshabilitado={codigo.length !== 6}
                        onCancelar={cerrar}
                      />
                      <button
                        type="button"
                        disabled={cargando || ahora < puedeReenviar}
                        onClick={() => enviarCodigo()}
                        className="w-full text-sm font-bold text-[#093E7A] hover:text-[#701C32] disabled:text-slate-400 disabled:no-underline hover:underline transition-colors"
                      >
                        {ahora < puedeReenviar
                          ? `¿No te llegó? Podrás reenviarlo en ${mmss(puedeReenviar - ahora)}`
                          : "¿No te llegó? Reenviar el código"}
                      </button>
                    </>
                  )}
                </form>
              )}

              {/* ---------- Paso 3: contraseña nueva ---------- */}
              {paso === "nueva" && elegida && (
                <form onSubmit={cambiar} className="space-y-5" noValidate>
                  <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <CheckCircle2 size={18} className="shrink-0" /> Código verificado. Ya puedes poner tu nueva contraseña.
                  </div>

                  <CampoPassword
                    id="rec-nueva"
                    etiqueta="Nueva contraseña"
                    refInput={primerCampo}
                    valor={nueva}
                    ver={verPassword}
                    onVer={() => setVerPassword((v) => !v)}
                    onChange={(v) => { setNueva(v); setError(null); }}
                    onBlur={() => setTocadoPass((t) => ({ ...t, nueva: true }))}
                    error={tocadoPass.nueva ? eNueva : null}
                    ayuda={`Mínimo ${PASSWORD_MIN} caracteres y que no sea tu DNI.`}
                    autoComplete="new-password"
                  />
                  {nueva && (
                    <div className="-mt-3">
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${fuerza.color} transition-all`} style={{ width: fuerza.ancho }} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Seguridad: <b>{fuerza.texto}</b></p>
                    </div>
                  )}
                  <CampoPassword
                    id="rec-confirmacion"
                    etiqueta="Repite la contraseña"
                    valor={confirmacion}
                    ver={verPassword}
                    onVer={() => setVerPassword((v) => !v)}
                    onChange={(v) => { setConfirmacion(v); setError(null); }}
                    onBlur={() => setTocadoPass((t) => ({ ...t, confirmacion: true }))}
                    error={tocadoPass.confirmacion ? eConfirmacion : null}
                    ayuda="Escríbela otra vez para confirmar."
                    autoComplete="new-password"
                  />
                  <p className={`text-xs ${permisoVencido ? "text-red-600 font-medium" : "text-slate-400"}`}>
                    {permisoVencido
                      ? "Se acabó el tiempo para cambiarla. Vuelve a pedir un código."
                      : `Tienes ${mmss(vencePermiso - ahora)} para guardarla.`}
                  </p>

                  {permisoVencido || codigoMuerto ? (
                    <button
                      type="button"
                      disabled={cargando}
                      onClick={() => enviarCodigo()}
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#701C32] hover:bg-[#5a1628] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
                    >
                      {cargando ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                      Pedir un código nuevo
                    </button>
                  ) : (
                    <Botones
                      cargando={cargando}
                      textoCargando="Guardando..."
                      texto="Guardar contraseña"
                      icono={<Lock size={18} />}
                      onCancelar={cerrar}
                    />
                  )}
                </form>
              )}

              {/* ---------- Listo ---------- */}
              {paso === "listo" && (
                <div className="text-center py-2">
                  <CheckCircle2 size={52} className="mx-auto text-emerald-500 mb-4" />
                  <h3 className="font-black text-slate-800 text-lg mb-2">¡Contraseña cambiada!</h3>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                    Cambiaste tu contraseña exitosamente. Inicia sesión con tu nueva contraseña.
                  </p>
                  {usuarioFinal && (
                    <p className="text-xs text-slate-400 mt-3">
                      Tu usuario es <b className="font-mono text-slate-600">{usuarioFinal}</b>
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => irALogin(usuarioFinal)}
                    className="mt-6 w-full py-3.5 bg-[#093E7A] hover:bg-[#072e5c] text-white font-bold text-sm rounded-xl transition-colors"
                  >
                    Iniciar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------------- */

const entrada = (conError: string | null | false | undefined) =>
  `w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl outline-none transition-all text-sm ${
    conError
      ? "border-red-400 focus:ring-2 focus:ring-red-200"
      : "border-gray-300 focus:ring-2 focus:ring-[#093E7A] focus:border-transparent"
  }`;

function Botones({ cargando, texto, textoCargando, icono, deshabilitado, onCancelar }: {
  cargando: boolean;
  texto: string;
  textoCargando: string;
  icono?: React.ReactNode;
  deshabilitado?: boolean;
  onCancelar: () => void;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onCancelar}
        disabled={cargando}
        className="flex-1 py-3.5 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={cargando || deshabilitado}
        className="flex-[2] py-3.5 rounded-xl font-bold text-sm text-white bg-[#701C32] hover:bg-[#5a1628] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
      >
        {cargando ? <Loader2 size={18} className="animate-spin" /> : icono}
        {cargando ? textoCargando : texto}
      </button>
    </div>
  );
}

function BotonVolver({ onClick, disabled, children }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#093E7A] disabled:opacity-50 py-2 transition-colors"
    >
      <ArrowLeft size={16} /> {children}
    </button>
  );
}

function InsigniaRol({ cuenta }: { cuenta: Cuenta }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
      <div className="p-2 rounded-lg bg-[#093E7A] text-white shrink-0">
        <UserRound size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Cuenta encontrada</p>
        <p className="font-black text-slate-800">{cuenta.rol_nombre}</p>
      </div>
    </div>
  );
}

function Aviso({ tono, icono, children }: {
  tono: "ambar" | "rojo"; icono: React.ReactNode; children: React.ReactNode;
}) {
  const estilos = tono === "ambar"
    ? "bg-amber-50 border-amber-500 text-amber-800"
    : "bg-red-50 border-red-500 text-red-700";
  return (
    <div role="status" className={`flex items-start gap-3 p-4 border-l-4 rounded-md text-sm leading-relaxed ${estilos}`}>
      <span className="shrink-0 mt-0.5">{icono}</span>
      <p>{children}</p>
    </div>
  );
}

function EnlaceNoPuedoEntrar({ onClick, texto }: { onClick: () => void; texto: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-sm font-bold text-[#701C32] hover:underline py-1"
    >
      {texto}
    </button>
  );
}

function CampoPassword({ id, etiqueta, valor, ver, onVer, onChange, onBlur, error, ayuda, autoComplete, refInput }: {
  id: string;
  etiqueta: string;
  valor: string;
  ver: boolean;
  onVer: () => void;
  onChange: (v: string) => void;
  onBlur: () => void;
  error: string | null;
  ayuda: string;
  autoComplete: string;
  refInput?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700 mb-1.5">
        {etiqueta} <span className="text-[#701C32]">*</span>
      </label>
      <div className="relative">
        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          ref={refInput}
          id={id}
          type={ver ? "text" : "password"}
          autoComplete={autoComplete}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`${entrada(error)} !pr-11`}
        />
        <button
          type="button"
          onClick={onVer}
          aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#093E7A] p-1"
        >
          {ver ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <p className={`text-xs mt-1.5 ${error ? "text-red-600 font-medium" : "text-slate-400"}`}>
        {error ?? ayuda}
      </p>
    </div>
  );
}
