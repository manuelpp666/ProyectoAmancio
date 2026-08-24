"use client";

/**
 * Configuración de la rejilla de horarios.
 *
 * Aquí se define, para cada nivel y modalidad, cuánto dura un bloque de clase,
 * a qué hora empieza y termina la jornada, y dónde caen los recesos. Antes el
 * bloque era de 50 minutos y los recesos estaban clavados a las 10:50 y las
 * 17:30 dentro del código; cambiarlos obligaba a recompilar.
 *
 * La Pre Academia solo aparece en verano, que es cuando existe.
 */

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { SelectorHora } from "@/src/components/utils/SelectorHora";
import {
  AmbitoHorario,
  ConfiguracionHorario,
  ModalidadHorario,
} from "@/src/interfaces/academic";

const ETIQUETA_AMBITO: Record<AmbitoHorario, string> = {
  PRIMARIA: "Primaria",
  SECUNDARIA: "Secundaria",
  PRE_ACADEMIA: "Pre Academia",
};

const AMBITOS: Record<ModalidadHorario, AmbitoHorario[]> = {
  REGULAR: ["PRIMARIA", "SECUNDARIA"],
  VERANO: ["PRIMARIA", "SECUNDARIA", "PRE_ACADEMIA"],
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Se llama al guardar, para que la pantalla de atrás recargue su rejilla. */
  onGuardado: () => void;
}

/** Aviso que manda el servidor (409) cuando el cambio dejaría clases al aire. */
interface Aviso {
  mensaje: string;
  ejemplos: string;
  onAceptar: () => void;
}

/**
 * Lee el cuerpo de un 409. El servidor manda `detail` como objeto con el
 * recuento y unos ejemplos; `mensajeDeError` solo entiende textos y listas,
 * así que aquí se saca a mano.
 */
const leerAviso = async (res: Response): Promise<{ mensaje: string; ejemplos: string }> => {
  try {
    const cuerpo = await res.json();
    const detalle = cuerpo?.detail;
    if (detalle && typeof detalle === "object" && typeof detalle.mensaje === "string") {
      return { mensaje: detalle.mensaje, ejemplos: detalle.ejemplos ?? "" };
    }
  } catch {
    // Sin JSON utilizable: se avisa igual, aunque sea en genérico.
  }
  return {
    mensaje: "Este cambio borrará el horario que ya está asignado en este nivel.",
    ejemplos: "",
  };
};

export function ModalConfiguracionHorario({ isOpen, onClose, onGuardado }: Props) {
  const [configs, setConfigs] = useState<ConfiguracionHorario[]>([]);
  const [modalidad, setModalidad] = useState<ModalidadHorario>("REGULAR");
  const [ambito, setAmbito] = useState<AmbitoHorario>("PRIMARIA");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Aviso | null>(null);

  // Los minutos se guardan como texto, no como número. Con `Number(...)` en el
  // onChange, borrar el campo lo dejaba en 0 y ya no se podía vaciar para
  // teclear otra cifra. Se convierten al enviar; el `required` del input impide
  // mandarlos en blanco.
  const [duracion, setDuracion] = useState("45");
  const [horaInicio, setHoraInicio] = useState("07:30");
  const [horaFin, setHoraFin] = useState("13:30");

  // Campos del receso nuevo
  const [recesoNombre, setRecesoNombre] = useState("Recreo");
  const [recesoInicio, setRecesoInicio] = useState("10:00");
  const [recesoDuracion, setRecesoDuracion] = useState("30");

  const actual = useMemo(
    () => configs.find((c) => c.ambito === ambito && c.modalidad === modalidad),
    [configs, ambito, modalidad]
  );

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await apiFetch("/horarios/configuracion");
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo cargar la configuración"));
        return;
      }
      const datos = await res.json();
      setConfigs(Array.isArray(datos) ? datos : []);
    } catch {
      toast.error("Error de conexión al cargar la configuración");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) cargar();
    // Un aviso a medias no debe seguir ahí la próxima vez que se abra
    setConfirmacion(null);
  }, [isOpen]);

  // Al cambiar de pestaña, el formulario refleja lo que hay guardado
  useEffect(() => {
    if (!actual) return;
    setDuracion(String(actual.duracion_bloque));
    setHoraInicio(actual.hora_inicio);
    setHoraFin(actual.hora_fin);
  }, [actual]);

  // Si se pasa a Regular estando en Pre Academia, que no quede en un ámbito inexistente
  useEffect(() => {
    if (!AMBITOS[modalidad].includes(ambito)) setAmbito("PRIMARIA");
  }, [modalidad, ambito]);

  const reemplazar = (nueva: ConfiguracionHorario) => {
    setConfigs((prev) =>
      prev.map((c) => (c.id_configuracion === nueva.id_configuracion ? nueva : c))
    );
  };

  /**
   * Guarda la jornada. Si el cambio dejaría clases en horas que dejan de
   * existir, el servidor responde 409 sin tocar nada; entonces se pregunta y,
   * solo si el administrador acepta, se reenvía con `confirmar` para que borre
   * el horario del nivel.
   */
  const guardarJornada = async (confirmar: boolean) => {
    setGuardando(true);
    try {
      const res = await apiFetch(`/horarios/configuracion/${ambito}/${modalidad}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duracion_bloque: Number(duracion),
          hora_inicio: horaInicio,
          hora_fin: horaFin,
          confirmar,
        }),
      });
      if (res.status === 409) {
        const aviso = await leerAviso(res);
        setConfirmacion({
          ...aviso,
          onAceptar: () => {
            setConfirmacion(null);
            guardarJornada(true);
          },
        });
        return;
      }
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo guardar"), { duration: 8000 });
        return;
      }
      reemplazar(await res.json());
      toast.success(`${ETIQUETA_AMBITO[ambito]} actualizada`);
      onGuardado();
    } catch {
      toast.error("Error de conexión al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const agregarReceso = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await apiFetch(
        `/horarios/configuracion/${ambito}/${modalidad}/recesos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: recesoNombre.trim() || "Recreo",
            hora_inicio: recesoInicio,
            duracion: Number(recesoDuracion),
          }),
        }
      );
      if (!res.ok) {
        // El servidor rechaza el receso si se cruza con clases ya colocadas y
        // dice con cuáles: el mensaje es largo, por eso se deja más tiempo.
        toast.error(await mensajeDeError(res, "No se pudo añadir el receso"), {
          duration: 10000,
        });
        return;
      }
      reemplazar(await res.json());
      toast.success("Receso añadido");
      onGuardado();
    } catch {
      toast.error("Error de conexión al añadir el receso");
    } finally {
      setGuardando(false);
    }
  };

  /** Quitar un receso corre el resto de la jornada, así que avisa igual. */
  const quitarReceso = async (id: number, confirmar = false) => {
    try {
      const res = await apiFetch(
        `/horarios/recesos/${id}${confirmar ? "?confirmar=true" : ""}`,
        { method: "DELETE" }
      );
      if (res.status === 409) {
        const aviso = await leerAviso(res);
        setConfirmacion({
          ...aviso,
          onAceptar: () => {
            setConfirmacion(null);
            quitarReceso(id, true);
          },
        });
        return;
      }
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo quitar el receso"));
        return;
      }
      reemplazar(await res.json());
      toast.success("Receso quitado");
      onGuardado();
    } catch {
      toast.error("Error de conexión al quitar el receso");
    }
  };

  if (!isOpen) return null;

  const bloquesClase = actual?.bloques.filter((b) => b.tipo === "clase").length ?? 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* `relative` sostiene el panel de confirmación, que se pinta encima */}
      <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col animate-in zoom-in duration-200">
        {/* Cabecera */}
        <div className="bg-[#093E7A] px-6 py-5 flex justify-between items-start text-white rounded-t-2xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight">Configurar la rejilla</h3>
              <p className="text-[11px] text-white/70 mt-0.5">
                Duración del bloque, jornada y recesos, por nivel y modalidad.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="hover:text-gray-300 mt-0.5">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Selector de modalidad y ámbito */}
        <div className="px-6 pt-4 shrink-0 border-b">
          <div className="flex gap-1 mb-3 bg-gray-100 p-1 rounded-lg w-fit">
            {(["REGULAR", "VERANO"] as ModalidadHorario[]).map((m) => (
              <button
                key={m}
                onClick={() => setModalidad(m)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  modalidad === m ? "bg-white text-[#093E7A] shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "REGULAR" ? "Año regular" : "Verano"}
              </button>
            ))}
          </div>
          <div className="flex gap-5 overflow-x-auto">
            {AMBITOS[modalidad].map((a) => (
              <button
                key={a}
                onClick={() => setAmbito(a)}
                className={`pb-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                  ambito === a
                    ? "text-[#093E7A] border-[#093E7A]"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {ETIQUETA_AMBITO[a]}
              </button>
            ))}
          </div>
        </div>

        {/* Cuerpo */}
        <div className="flex-1 overflow-y-auto p-6">
          {cargando || !actual ? (
            <div className="py-16 text-center text-gray-400 animate-pulse font-bold">
              Cargando configuración…
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Columna izquierda: jornada y recesos */}
              <div className="space-y-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    guardarJornada(false);
                  }}
                  className="space-y-3"
                >
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Jornada y bloque
                  </h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">
                      Minutos por bloque
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={240}
                      required
                      value={duracion}
                      onChange={(e) => setDuracion(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#093E7A]/20"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Empieza</label>
                      <SelectorHora
                        required
                        etiqueta="La jornada empieza"
                        value={horaInicio}
                        onChange={setHoraInicio}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Termina</label>
                      <SelectorHora
                        required
                        etiqueta="La jornada termina"
                        value={horaFin}
                        onChange={setHoraFin}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full px-4 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm hover:bg-[#062d59] transition-all disabled:opacity-50"
                  >
                    Guardar jornada
                  </button>
                </form>

                <div className="space-y-3 pt-2 border-t">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest pt-3">
                    Recesos
                  </h4>

                  {actual.recesos.length === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      Sin recesos. La jornada es continua.
                    </p>
                  )}
                  <div className="space-y-2">
                    {actual.recesos.map((r) => (
                      <div
                        key={r.id_receso}
                        className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="text-xs font-black text-amber-800">{r.nombre}</p>
                          <p className="text-[11px] text-amber-700/80">
                            {r.hora_inicio} · {r.duracion} min
                          </p>
                        </div>
                        <button
                          onClick={() => quitarReceso(r.id_receso)}
                          title="Quitar receso"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={agregarReceso} className="grid grid-cols-12 gap-2 items-end pt-1">
                    <div className="col-span-12">
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Nombre</label>
                      <input
                        type="text"
                        maxLength={40}
                        value={recesoNombre}
                        onChange={(e) => setRecesoNombre(e.target.value)}
                        className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#093E7A]/20"
                      />
                    </div>
                    <div className="col-span-8">
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Empieza</label>
                      <SelectorHora
                        required
                        tam="sm"
                        etiqueta="El receso empieza"
                        value={recesoInicio}
                        onChange={setRecesoInicio}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Min</label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        required
                        value={recesoDuracion}
                        onChange={(e) => setRecesoDuracion(e.target.value)}
                        className="w-full p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#093E7A]/20"
                      />
                    </div>
                    <div className="col-span-12">
                      <button
                        type="submit"
                        disabled={guardando}
                        className="w-full px-4 py-2 border border-[#093E7A] text-[#093E7A] rounded-lg font-bold text-sm hover:bg-blue-50 transition-all disabled:opacity-50"
                      >
                        + Añadir receso
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Columna derecha: cómo queda */}
              <div>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                  Así queda ({bloquesClase} bloques de clase)
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[420px] overflow-y-auto">
                  {actual.bloques.map((b, i) => (
                    <div
                      key={`${b.hora_inicio}-${i}`}
                      className={`flex items-center justify-between px-3 py-1.5 text-xs border-b last:border-b-0 ${
                        b.tipo === "receso" ? "bg-amber-50" : "bg-white"
                      }`}
                    >
                      <span className="font-mono text-gray-600">
                        {b.hora_inicio} – {b.hora_fin}
                      </span>
                      <span
                        className={`font-bold ${
                          b.tipo === "receso" ? "text-amber-700" : "text-gray-400"
                        }`}
                      >
                        {b.tipo === "receso" ? b.nombre || "Receso" : `${b.duracion} min`}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                  Un bloque que chocaría con un receso o con el fin de la jornada se
                  recorta, para que nunca se solapen.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm hover:bg-[#062d59] transition-all"
          >
            Listo
          </button>
        </div>

        {/* Confirmación de un cambio que borra el horario ya armado */}
        {confirmacion && (
          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center p-6 z-10">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
              <div className="flex items-start gap-3 p-5">
                <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-red-600">warning</span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-gray-800 text-sm">
                    Esto borrará el horario asignado
                  </h4>
                  <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                    {confirmacion.mensaje}
                  </p>
                  {confirmacion.ejemplos && (
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed break-words">
                      Por ejemplo: {confirmacion.ejemplos}.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end px-5 py-3 bg-gray-50 border-t">
                <button
                  type="button"
                  onClick={() => setConfirmacion(null)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmacion.onAceptar}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
                >
                  Borrar y continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
