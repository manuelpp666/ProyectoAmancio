"use client";
import { useEffect, useMemo, useState } from "react";

/**
 * Selectores de hora en formato de 12 horas.
 *
 * Sustituyen a los <input type="time"> y <input type="datetime-local"> nativos.
 * Los nativos daban dos problemas: el formato dependía del idioma del navegador
 * (a veces salía de 24 horas) y para escribir la hora había que acertar en el
 * trocito exacto del campo, con lo que era fácil quedarse con los minutos a
 * medias sin darse cuenta.
 *
 * Aquí son tres desplegables: hora, minuto y a. m./p. m. Los minutos van de
 * cinco en cinco, que es como se citan las horas en el colegio; una lista con
 * los sesenta se desplegaba tan larga que tapaba la pantalla entera.
 *
 * Hacia fuera no cambia nada: el valor sigue siendo "HH:MM" en 24 horas
 * (o "YYYY-MM-DDTHH:MM" en el de fecha y hora), que es lo que ya esperaba el
 * resto de la aplicación y la API.
 */

const HORAS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTOS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));

type Partes = { hora: string; minuto: string; meridiano: "AM" | "PM" | "" };

const VACIO: Partes = { hora: "", minuto: "", meridiano: "" };

/** "14:30" o "14:30:00" -> { hora: "2", minuto: "30", meridiano: "PM" } */
export function aPartes(valor?: string | null): Partes {
  if (!valor) return VACIO;
  const m = valor.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return VACIO;
  const h24 = Number(m[1]);
  if (Number.isNaN(h24) || h24 > 23) return VACIO;
  const meridiano: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hora: String(h12), minuto: m[2], meridiano };
}

/** { hora: "2", minuto: "30", meridiano: "PM" } -> "14:30" */
export function aHora24(p: Partes): string {
  if (!p.hora || !p.minuto || !p.meridiano) return "";
  let h = Number(p.hora) % 12;
  if (p.meridiano === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${p.minuto}`;
}

const CLASE_SELECT =
  "bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 " +
  "focus:ring-[#093E7A]/20 focus:border-[#093E7A] cursor-pointer transition-colors";

interface SelectorHoraProps {
  /** Hora en formato 24 h, "HH:MM". Cadena vacía si aún no hay nada elegido. */
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Tamaño de los desplegables; "sm" para formularios apretados. */
  tam?: "sm" | "md";
  /** Texto para lectores de pantalla, p. ej. "Hora de inicio". */
  etiqueta?: string;
  className?: string;
}

export function SelectorHora({
  value,
  onChange,
  required = false,
  disabled = false,
  tam = "md",
  etiqueta = "Hora",
  className = "",
}: SelectorHoraProps) {
  // Las partes viven aquí porque el usuario elige de una en una: hasta que las
  // tres no están, hacia fuera se manda cadena vacía y el `required` de los
  // desplegables impide enviar el formulario a medias.
  const [partes, setPartes] = useState<Partes>(() => aPartes(value));

  // Si el valor cambia desde fuera (al abrir el modal con una cita ya creada,
  // o al reiniciar el formulario) hay que recoger ese cambio. Se compara con lo
  // que representan las partes actuales para no entrar en bucle.
  useEffect(() => {
    if (aHora24(partes) !== (value || "")) setPartes(aPartes(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const actualizar = (cambio: Partial<Partes>) => {
    const nuevas: Partes = { ...partes, ...cambio };
    // Al elegir la hora, los minutos se ponen en punto: es lo habitual y ahorra
    // un paso. El a. m./p. m. no se rellena solo a propósito, porque acertar por
    // defecto significaría mandar las tres de la mañana cuando eran las tres de
    // la tarde sin que nadie lo note.
    if (cambio.hora && !nuevas.minuto) nuevas.minuto = "00";
    setPartes(nuevas);
    onChange(aHora24(nuevas));
  };

  // Si lo guardado no cae en un múltiplo de cinco —un registro antiguo, o algo
  // creado antes de este cambio— ese minuto se añade a la lista. Si no, el
  // desplegable saldría en blanco y parecería que la cita perdió la hora.
  const minutos = useMemo(() => {
    if (partes.minuto && !MINUTOS.includes(partes.minuto)) {
      return [...MINUTOS, partes.minuto].sort();
    }
    return MINUTOS;
  }, [partes.minuto]);

  // Altura fija en vez de relleno: por dentro el campo de fecha y los
  // desplegables no miden lo mismo (46 px contra 43) y la fila salía descuadrada.
  const alto = tam === "sm" ? "px-2 h-[38px] text-sm" : "px-3 h-[46px]";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <select
        aria-label={`${etiqueta}: hora`}
        required={required}
        disabled={disabled}
        value={partes.hora}
        onChange={(e) => actualizar({ hora: e.target.value })}
        className={`${CLASE_SELECT} ${alto} flex-1 min-w-0 disabled:opacity-50`}
      >
        <option value="">--</option>
        {HORAS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>

      <span className="font-bold text-gray-400 select-none">:</span>

      <select
        aria-label={`${etiqueta}: minutos`}
        required={required}
        disabled={disabled}
        value={partes.minuto}
        onChange={(e) => actualizar({ minuto: e.target.value })}
        className={`${CLASE_SELECT} ${alto} flex-1 min-w-0 disabled:opacity-50`}
      >
        <option value="">--</option>
        {minutos.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <select
        aria-label={`${etiqueta}: a. m. o p. m.`}
        required={required}
        disabled={disabled}
        value={partes.meridiano}
        onChange={(e) => actualizar({ meridiano: e.target.value as "AM" | "PM" | "" })}
        className={`${CLASE_SELECT} ${alto} flex-1 min-w-0 disabled:opacity-50`}
      >
        <option value="">--</option>
        <option value="AM">a. m.</option>
        <option value="PM">p. m.</option>
      </select>
    </div>
  );
}

interface SelectorFechaHoraProps {
  /** "YYYY-MM-DDTHH:MM". Cadena vacía si aún no hay nada elegido. */
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Fecha mínima seleccionable, "YYYY-MM-DD". */
  min?: string;
  tam?: "sm" | "md";
  etiqueta?: string;
  className?: string;
}

export function SelectorFechaHora({
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  tam = "md",
  etiqueta = "Fecha y hora",
  className = "",
}: SelectorFechaHoraProps) {
  // La fecha y la hora se guardan aquí por separado. Si se derivaran del `value`
  // compuesto, elegir primero la fecha la borraría: como todavía no hay hora, el
  // valor compuesto sería cadena vacía y el campo volvería a quedarse en blanco.
  const [fecha, setFecha] = useState(() => (value || "").split("T")[0] || "");
  const [hora, setHora] = useState(() => ((value || "").split("T")[1] || "").slice(0, 5));

  // Cambios que vienen de fuera: abrir el modal con una cita ya creada, o que el
  // formulario se reinicie tras guardar.
  useEffect(() => {
    const compuesto = fecha && hora ? `${fecha}T${hora}` : "";
    if (compuesto !== (value || "")) {
      setFecha((value || "").split("T")[0] || "");
      setHora(((value || "").split("T")[1] || "").slice(0, 5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emitir = (f: string, h: string) => onChange(f && h ? `${f}T${h}` : "");

  const alto = tam === "sm" ? "px-2 h-[38px] text-sm" : "px-3 h-[46px]";

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <input
        type="date"
        aria-label={`${etiqueta}: fecha`}
        required={required}
        disabled={disabled}
        min={min}
        value={fecha}
        onChange={(e) => { setFecha(e.target.value); emitir(e.target.value, hora); }}
        className={`${CLASE_SELECT} ${alto} sm:flex-1 min-w-0 disabled:opacity-50`}
      />
      <SelectorHora
        value={hora}
        onChange={(h) => { setHora(h); emitir(fecha, h); }}
        required={required}
        disabled={disabled}
        tam={tam}
        etiqueta={etiqueta}
        className="sm:flex-1"
      />
    </div>
  );
}
