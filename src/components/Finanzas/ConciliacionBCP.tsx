"use client";

/**
 * Conciliación de pagos con el BCP (servicio CREP).
 *
 * Reemplaza el circuito que antes se hacía a mano con el .xlsm de macros:
 * se suben los "Reporte de cobros" del banco, el sistema marca las cuotas
 * pagadas, carga la mora a las que vencieron sin pagar y genera el archivo
 * CREP listo para volver a subirlo al BCP.
 *
 * Todo lo que escribe en la base se puede simular antes. La pantalla siempre
 * enseña primero lo que va a pasar y solo aplica cuando se confirma: dar por
 * pagada una cuota que nadie pagó es difícil de descubrir después.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { CambiosManuales } from "@/src/components/Finanzas/CambiosManuales";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface SincronizacionCREP {
  fecha_ultimo_crep: string | null;
  nombre_archivo_ultimo_crep: string | null;
  total_cuotas_ultimo_crep: number;
  monto_ultimo_crep: number;
  mora_ultimo_crep?: number;
  total_cambios_pendientes: number;
  bajas: {
    documento: string;
    nombre: string;
    vencimiento: string;
    monto: number;
    mora: number;
    tipo: string;
    motivo: string;
  }[];
  altas: {
    documento: string;
    nombre: string;
    vencimiento: string;
    monto: number;
    mora: number;
    tipo: string;
    motivo: string;
  }[];
  modificaciones: {
    documento: string;
    nombre: string;
    vencimiento: string;
    monto_anterior: number;
    monto_actual: number;
    mora_anterior: number;
    mora_actual: number;
    tipo: string;
    motivo: string;
  }[];
  al_dia: boolean;
}

interface Resumen {
  cuotas_pendientes: number;
  de_alumnos: number;
  deuda_historica: number;
  deuda: number;
  mora: number;
  vencimientos_sin_mora: { fecha: string; impagas: number; sin_mora: number; importe: number }[];
  cobros_por_revisar: number;
  /** La puesta en marcha es de una sola vez: si ya se hizo, viene con cuándo
   *  y con qué archivo. Null mientras esté pendiente. */
  importacion_inicial: {
    archivo: string | null; fecha: string | null; cuotas: number | null;
    cuadraron: number | null; deuda_historica: number;
    /** True si quedó anotada al hacerla. False si se dedujo del rastro que
     *  dejó en los datos (las que se hicieron antes de que se anotaran). */
    registrada: boolean;
    sincronizadas?: number;
  } | null;
  ultimo_lote: {
    id_lote: number; archivo: string; fecha_reporte: string | null;
    fecha_carga: string | null; aplicados: number; sin_coincidencia: number;
  } | null;
  sincronizacion_crep?: SincronizacionCREP | null;
  /** Cambios hechos a mano que todavía no se han dado por enviados al
   *  banco. Va aparte de `sincronizacion_crep`: aquello compara dos fotos
   *  y esto es el parte de quién tocó qué. */
  ajustes_manuales_pendientes?: number;
}

interface Lote {
  id_lote: number; archivo: string; fecha_reporte: string | null;
  fecha_carga: string | null; registros: number; monto: number;
  aplicados: number; sin_coincidencia: number; extornados: number;
}

interface Movimiento {
  id_movimiento: number; documento: string; alumno: string | null;
  fecha_vencimiento: string | null; fecha_pago: string | null;
  monto_pagado: number; monto_total: number; operacion: string | null;
  medio: string | null; resultado: string; detalle: string | null;
}

const SOLES = (n: number) =>
  `S/ ${(n ?? 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FECHA = (iso: string | null) => {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

const FECHA_HORA = (iso: string | null) => {
  if (!iso) return "Aún no registrado";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

/** Cada resultado con su color, para reconocerlo de un vistazo en la tabla. */
const COLOR_RESULTADO: Record<string, string> = {
  APLICADO: "bg-green-50 text-green-700 border-green-200",
  EXTORNADO: "bg-amber-50 text-amber-700 border-amber-200",
  SIN_COINCIDENCIA: "bg-red-50 text-red-700 border-red-200",
  MONTO_DISTINTO: "bg-orange-50 text-orange-700 border-orange-200",
  AMBIGUO: "bg-purple-50 text-purple-700 border-purple-200",
  REPETIDO: "bg-gray-100 text-gray-600 border-gray-200",
  YA_PAGADO: "bg-sky-50 text-sky-700 border-sky-200",
};

const ETIQUETA_RESULTADO: Record<string, string> = {
  APLICADO: "Aplicado",
  EXTORNADO: "Extornado",
  SIN_COINCIDENCIA: "Sin coincidencia",
  MONTO_DISTINTO: "Monto distinto",
  AMBIGUO: "Ambiguo",
  REPETIDO: "Repetido",
  YA_PAGADO: "Ya estaba pagada",
};

/** Los que necesitan que alguien decida algo. El resto se cierra solo: el
 *  aplicado, el extornado (lo decidió el banco) y los que solo confirman un
 *  cobro que el sistema ya tenía registrado. */
const HAY_QUE_MIRARLO = new Set(["SIN_COINCIDENCIA", "MONTO_DISTINTO", "AMBIGUO"]);

export function ConciliacionBCP() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState(false);

  const [archivos, setArchivos] = useState<File[]>([]);
  const [previo, setPrevio] = useState<any>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const [loteAbierto, setLoteAbierto] = useState<number | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filtro, setFiltro] = useState<string>("");

  const [pendientes, setPendientes] = useState<any[]>([]);
  const [revisando, setRevisando] = useState<any | null>(null);
  const [candidatos, setCandidatos] = useState<any[] | null>(null);
  const [elegida, setElegida] = useState<any | null>(null);
  const [nota, setNota] = useState("");

  const [inicial, setInicial] = useState<File | null>(null);
  const [previoInicial, setPrevioInicial] = useState<any>(null);
  const entradaInicial = useRef<HTMLInputElement>(null);

  // --- Sincronización y Control de Cambios del CREP ---
  const [modalConfirmarIncorporacion, setModalConfirmarIncorporacion] = useState(false);
  const [verDetalleCambios, setVerDetalleCambios] = useState(false);
  const [incorporando, setIncorporando] = useState(false);
  // Se incrementa al incorporar: la tabla de cambios manuales lo mira para
  // volver a preguntar, porque los suyos acaban de pasar a «ya enviados».
  const [tokenCambios, setTokenCambios] = useState(0);

  const ejecutarIncorporacion = async () => {
    setIncorporando(true);
    try {
      const res = await apiFetch("/finance/crep/incorporar-cambios", {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "No se pudieron incorporar los cambios al CREP");
      }
      const data = await res.json();
      const manuales = data.ajustes_manuales_incorporados ?? 0;
      toast.success(
        (data.message || "Cambios incorporados exitosamente al CREP oficial")
        + (manuales ? ` · ${manuales} cambio(s) manual(es) marcado(s) como enviados` : ""));
      setModalConfirmarIncorporacion(false);
      setVerDetalleCambios(false);
      setTokenCambios((n) => n + 1);
      cargar();
    } catch (error: any) {
      toast.error(error.message || "Error al incorporar cambios");
    } finally {
      setIncorporando(false);
    }
  };

  // ---------------------------------------------------------------- cargar
  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        apiFetch("/finance/crep/resumen"),
        apiFetch("/finance/crep/lotes?limite=30"),
        apiFetch("/finance/crep/pendientes?limite=200"),
      ]);
      if (!r1.ok) {
        toast.error(await mensajeDeError(r1, "No se pudo cargar el estado"), { duration: 9000 });
      } else {
        setResumen(await r1.json());
      }
      if (r2.ok) setLotes(await r2.json());
      if (r3.ok) setPendientes(await r3.json());
    } catch {
      toast.error("Error de conexión al cargar la conciliación");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ------------------------------------------------- reportes de cobros
  const enviarReportes = async (simular: boolean) => {
    if (!archivos.length) {
      toast.error("Elige al menos un archivo de reporte de cobros");
      return;
    }
    setTrabajando(true);
    try {
      const cuerpo = new FormData();
      archivos.forEach((a) => cuerpo.append("archivos", a));
      cuerpo.append("simular", String(simular));
      const res = await apiFetch("/finance/crep/reportes", { method: "POST", body: cuerpo });
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo procesar"), { duration: 12000 });
        return;
      }
      const datos = await res.json();
      if (simular) {
        setPrevio(datos);
        toast.success("Simulación lista: revisa antes de aplicar");
      } else {
        setPrevio(null);
        setArchivos([]);
        if (entrada.current) entrada.current.value = "";
        toast.success(`${datos.totales.APLICADO} cobros aplicados`);
        cargar();
      }
    } catch {
      toast.error("Error de conexión al procesar los reportes");
    } finally {
      setTrabajando(false);
    }
  };

  // ------------------------------------------------------ importación inicial
  const enviarInicial = async (simular: boolean) => {
    if (!inicial) {
      toast.error("Elige el archivo CREP que usa hoy el colegio");
      return;
    }
    setTrabajando(true);
    try {
      const cuerpo = new FormData();
      cuerpo.append("archivo", inicial);
      cuerpo.append("simular", String(simular));
      cuerpo.append("sincronizar_pagadas", "true");
      const res = await apiFetch("/finance/crep/importacion-inicial",
                                 { method: "POST", body: cuerpo });
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo importar"), { duration: 12000 });
        return;
      }
      const datos = await res.json();
      if (simular) {
        setPrevioInicial(datos);
        toast.success("Simulación lista");
      } else {
        setPrevioInicial(null);
        setInicial(null);
        if (entradaInicial.current) entradaInicial.current.value = "";
        toast.success("Base alineada con el archivo del BCP");
        cargar();
      }
    } catch {
      toast.error("Error de conexión al importar");
    } finally {
      setTrabajando(false);
    }
  };

  // -------------------------------------------------- resolver un cobro suelto
  const abrirRevision = async (p: any) => {
    setRevisando(p);
    setCandidatos(null);
    setElegida(null);
    setNota("");
    try {
      const res = await apiFetch(`/finance/crep/pendientes/${p.id_movimiento}/candidatos`);
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudieron buscar las cuotas"));
        return;
      }
      const d = await res.json();
      setCandidatos(d.candidatos ?? []);
      // La primera es la más probable (mismo vencimiento e importe), pero se
      // deja sin marcar a propósito: quien revisa tiene que elegir.
    } catch {
      toast.error("Error de conexión al buscar las cuotas");
    }
  };

  const resolver = async (accion: "aplicar" | "descartar") => {
    if (!revisando) return;
    if (accion === "aplicar" && !elegida) {
      toast.error("Elige a qué cuota se aplica el cobro");
      return;
    }
    setTrabajando(true);
    try {
      const cuerpo = new FormData();
      cuerpo.append("accion", accion);
      if (accion === "aplicar") {
        if (elegida.tipo === "pago") cuerpo.append("id_pago", String(elegida.id));
        else cuerpo.append("id_cuota_externa", String(elegida.id));
      }
      if (nota.trim()) cuerpo.append("nota", nota.trim());
      const res = await apiFetch(
        `/finance/crep/pendientes/${revisando.id_movimiento}/resolver`,
        { method: "POST", body: cuerpo });
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo resolver"), { duration: 9000 });
        return;
      }
      const d = await res.json();
      toast.success(accion === "aplicar"
        ? `Cuota marcada como pagada: ${d.cuota_afectada?.concepto ?? ""}. Sale del próximo archivo.`
        : "Cobro descartado. No se tocó ninguna cuota.");
      setRevisando(null);
      setCandidatos(null);
      cargar();
    } catch {
      toast.error("Error de conexión al resolver el cobro");
    } finally {
      setTrabajando(false);
    }
  };

  // -------------------------------------------------------------------- mora
  const cargarMora = async (fecha: string, simular: boolean) => {
    setTrabajando(true);
    try {
      const cuerpo = new FormData();
      cuerpo.append("fecha_vencimiento", fecha);
      cuerpo.append("simular", String(simular));
      const res = await apiFetch("/finance/crep/mora", { method: "POST", body: cuerpo });
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo aplicar la mora"), { duration: 9000 });
        return;
      }
      const d = await res.json();
      if (simular) {
        toast.info(`Se cargaría mora a ${d.con_mora_aplicada} cuotas por ${SOLES(d.importe_total)}. ` +
                   `${d.ya_tenian_mora} ya la tienen.`, { duration: 9000 });
      } else {
        toast.success(`Mora aplicada a ${d.con_mora_aplicada} cuotas (${SOLES(d.importe_total)})`);
        cargar();
      }
    } catch {
      toast.error("Error de conexión al aplicar la mora");
    } finally {
      setTrabajando(false);
    }
  };

  // ------------------------------------------------------------- movimientos
  const abrirLote = async (id: number) => {
    if (loteAbierto === id) { setLoteAbierto(null); setMovimientos([]); return; }
    setLoteAbierto(id);
    setMovimientos([]);
    try {
      const res = await apiFetch(`/finance/crep/lotes/${id}/movimientos`);
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudieron cargar los movimientos"));
        return;
      }
      setMovimientos(await res.json());
    } catch {
      toast.error("Error de conexión al abrir el lote");
    }
  };

  const descargar = (ruta: string) => {
    // La descarga usa la cookie de sesión; abrirla en otra pestaña la conserva.
    window.open(`${API_URL}${ruta}`, "_blank");
  };

  const visibles = filtro
    ? movimientos.filter((m) => m.resultado === filtro)
    : movimientos;

  // La puesta en marcha ya aplicada, si la hay. Manda el resumen del servidor;
  // si se acaba de aplicar en esta misma pantalla, se refleja al recargar.
  const yaHecha = resumen?.importacion_inicial ?? null;

  // Dos formas distintas de contar lo mismo, y ninguna sirve sola:
  //   · `cambiosSnapshot` compara el último CREP oficial con la base de hoy.
  //     Ve altas, bajas e importes, pero NO ve un cobro en caja: al mirar solo
  //     el resultado final, una cuota cobrada a mano le parece una baja normal
  //     y la omite a propósito.
  //   · `cambiosManuales` son los apuntes de quién tocó qué, uno por acción.
  // El sello tiene que ofrecerse si cualquiera de los dos tiene algo, o el
  // «Sin enviar» del paso 4 se quedaría sin botón que lo quite.
  const cambiosSnapshot = resumen?.sincronizacion_crep?.total_cambios_pendientes ?? 0;
  const cambiosManuales = resumen?.ajustes_manuales_pendientes ?? 0;
  const haySelloPendiente = cambiosSnapshot > 0 || cambiosManuales > 0;

  if (cargando) {
    return <div className="py-20 text-center text-gray-400 animate-pulse font-bold">
      Cargando la conciliación…
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------ estado actual */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Tarjeta titulo="Cuotas por cobrar" valor={String(resumen?.cuotas_pendientes ?? 0)}
                 pie={`${resumen?.de_alumnos ?? 0} de alumnos · ${resumen?.deuda_historica ?? 0} de deuda anterior`}
                 icono="receipt_long" />
        <Tarjeta titulo="Deuda" valor={SOLES(resumen?.deuda ?? 0)}
                 pie="Sin contar la mora" icono="account_balance_wallet" />
        <Tarjeta titulo="Mora acumulada" valor={SOLES(resumen?.mora ?? 0)}
                 pie="Ya cargada a las cuotas" icono="schedule" />
        <Tarjeta titulo="Por revisar"
                 valor={String(resumen?.cobros_por_revisar ?? 0)}
                 pie={resumen?.cobros_por_revisar
                   ? "Cobros que no se pudieron aplicar solos"
                   : "Nada pendiente"}
                 icono="rule" />
        <Tarjeta titulo="Último reporte"
                 valor={resumen?.ultimo_lote ? FECHA(resumen.ultimo_lote.fecha_reporte) : "—"}
                 pie={resumen?.ultimo_lote
                   ? `${resumen.ultimo_lote.aplicados} aplicados · ${resumen.ultimo_lote.sin_coincidencia} sin coincidencia`
                   : "Todavía no se ha procesado ninguno"}
                 icono="event_available" />
      </div>

      {/* ------------------------------------------- 1. subir reportes */}
      <Bloque numero={1} titulo="Cargar los reportes de cobros del BCP"
              descripcion="Puedes subir varios días a la vez. Se aplican solos en orden cronológico, no en el orden en que los elijas.">
        <input ref={entrada} type="file" multiple accept=".txt"
               onChange={(e) => { setArchivos(Array.from(e.target.files ?? [])); setPrevio(null); }}
               className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4
                          file:rounded-lg file:border-0 file:text-sm file:font-bold
                          file:bg-[#093E7A] file:text-white hover:file:bg-[#062d59]" />
        {archivos.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {archivos.length} archivo{archivos.length > 1 ? "s" : ""} elegido{archivos.length > 1 ? "s" : ""}:{" "}
            {archivos.map((a) => a.name).join(", ")}
          </p>
        )}

        <div className="flex gap-2 mt-3">
          <button type="button" disabled={trabajando || !archivos.length}
                  onClick={() => enviarReportes(true)}
                  className="px-4 py-2 border border-[#093E7A] text-[#093E7A] rounded-lg font-bold text-sm hover:bg-blue-50 disabled:opacity-50">
            Simular
          </button>
          <button type="button" disabled={trabajando || !previo}
                  onClick={() => enviarReportes(false)}
                  className="px-4 py-2 bg-[#093E7A] text-white rounded-lg font-bold text-sm hover:bg-[#062d59] disabled:opacity-50">
            Aplicar
          </button>
        </div>
        {!previo && archivos.length > 0 && (
          <p className="text-[11px] text-gray-400 mt-2">
            Primero simula: «Aplicar» se habilita cuando hayas visto el resultado.
          </p>
        )}

        {previo && <ResultadoProceso datos={previo} />}
      </Bloque>

      {/* ------------------------------------- 2. cobros que no cuadraron */}
      <Bloque numero={2} titulo="Cobros por revisar"
              descripcion="Cobros que llegaron del banco pero el sistema no pudo aplicar solo. Mientras no se resuelvan, esas cuotas siguen saliendo en el archivo de cobranza.">
        {!pendientes.length ? (
          <p className="text-sm text-gray-500">
            No hay ningún cobro pendiente de revisar.
          </p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[22rem] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="text-left px-3 py-2 font-bold">Pagó</th>
                  <th className="text-left px-3 py-2 font-bold">Documento</th>
                  <th className="text-left px-3 py-2 font-bold">Alumno</th>
                  <th className="text-left px-3 py-2 font-bold">Cuota del banco</th>
                  <th className="text-right px-3 py-2 font-bold">Importe</th>
                  <th className="text-left px-3 py-2 font-bold">Motivo</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendientes.map((p) => (
                  <tr key={p.id_movimiento} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">{FECHA(p.fecha_pago)}</td>
                    <td className="px-3 py-1.5 font-mono text-gray-700">{p.documento}</td>
                    <td className="px-3 py-1.5 text-gray-700 max-w-[15rem] truncate" title={p.alumno ?? ""}>
                      {p.alumno ?? <span className="text-gray-400 italic">no identificado</span>}
                    </td>
                    <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{FECHA(p.fecha_vencimiento)}</td>
                    <td className="px-3 py-1.5 text-right font-medium text-gray-800 whitespace-nowrap">
                      {SOLES(p.monto_total)}
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${COLOR_RESULTADO[p.resultado] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                            title={p.detalle ?? ""}>
                        {ETIQUETA_RESULTADO[p.resultado] ?? p.resultado}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <button type="button" onClick={() => abrirRevision(p)}
                              className="text-[#093E7A] text-[11px] font-bold hover:underline whitespace-nowrap">
                        Resolver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloque>

      {/* --------------------------------------------------- 3. mora */}
      <Bloque numero={3} titulo="Mora de las cuotas vencidas"
              descripcion="Solo entra en las cuotas que ya vencieron y siguen impagas. Nunca se duplica: las que ya tienen mora se dejan como están.">
        {!resumen?.vencimientos_sin_mora?.length ? (
          <p className="text-sm text-gray-500">
            No hay ninguna fecha vencida con cuotas impagas sin mora.
          </p>
        ) : (
          <div className="space-y-2">
            {resumen.vencimientos_sin_mora.map((v) => (
              <div key={v.fecha}
                   className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-black text-amber-800">
                    Vencimiento {FECHA(v.fecha)}
                  </p>
                  <p className="text-[11px] text-amber-700/80">
                    {v.sin_mora} cuota{v.sin_mora !== 1 ? "s" : ""} sin mora de {v.impagas} impagas ·
                    sumarían {SOLES(v.importe)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={trabajando}
                          onClick={() => cargarMora(v.fecha, true)}
                          className="px-3 py-1.5 border border-amber-600 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 disabled:opacity-50">
                    Simular
                  </button>
                  <button type="button" disabled={trabajando}
                          onClick={() => cargarMora(v.fecha, false)}
                          className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 disabled:opacity-50">
                    Aplicar mora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Bloque>

      {/* -------------------------------------- 4. cambios hechos a mano */}
      <Bloque numero={4} titulo="Cambios manuales en las cuotas"
              descripcion="Los importes que se han modificado a mano y los cobros registrados en caja, con lo que cada uno le hace al archivo del banco.">
        <CambiosManuales recargar={tokenCambios} />
      </Bloque>

      {/* ------------------------------------------- 5. generar el CREP */}
      <Bloque numero={5} titulo="Generar y sincronizar archivo para el BCP"
              descripcion="Gestiona las altas, bajas por retiros de alumnos y cambios en cuotas para emitir el archivo CREP oficial que espera el banco.">
        
        {/* Banner de Estado del CREP y Fecha de Última Generación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#093E7A]/10 text-[#093E7A] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">event_available</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Última Generación Oficial del CREP
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-gray-800">
                  {FECHA_HORA(resumen?.sincronizacion_crep?.fecha_ultimo_crep || null)}
                </span>
                {resumen?.sincronizacion_crep?.nombre_archivo_ultimo_crep && (
                  <span className="text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                    {resumen.sincronizacion_crep.nombre_archivo_ultimo_crep}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            {haySelloPendiente ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                {Math.max(cambiosSnapshot, cambiosManuales)} cambio(s) pendiente(s) de incorporar
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                CREP al día con la base de datos
              </span>
            )}
          </div>
        </div>

        {/* Los cambios hechos a mano cuentan aparte: la comparación de arriba
            solo ve el resultado final, así que una cuota editada tres veces y
            devuelta a su importe original no aparecería en ella. */}
        {(resumen?.ajustes_manuales_pendientes ?? 0) > 0 && (
          <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-gray-400">edit_note</span>
            Además hay {resumen?.ajustes_manuales_pendientes} cambio(s) manual(es)
            sin marcar como enviados; se detallan en el paso 4 y se sellan al
            incorporar aquí.
          </p>
        )}

        {/* Panel de Cambios Pendientes de Incorporar */}
        {haySelloPendiente ? (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-lg">sync_problem</span>
                  Cambios del sistema pendientes de incorporar al CREP
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  {cambiosSnapshot > 0 && (
                    <>Hay {resumen?.sincronizacion_crep?.bajas.length || 0} baja(s) por retiros o eliminaciones y {resumen?.sincronizacion_crep?.altas.length || 0} alta(s) nuevas detectadas desde la última generación. </>
                  )}
                  {cambiosManuales > 0 && (
                    <>{cambiosSnapshot > 0 ? "Además hay" : "Hay"} {cambiosManuales} cambio(s) hecho(s) a mano sin marcar como enviados (paso 4).</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {cambiosSnapshot > 0 && (
                  <button
                    type="button"
                    onClick={() => setVerDetalleCambios(!verDetalleCambios)}
                    className="px-3 py-1.5 border border-amber-300 text-amber-900 bg-white hover:bg-amber-100 rounded-lg text-xs font-bold transition-all"
                  >
                    {verDetalleCambios ? "Ocultar detalle" : "Ver lista de cambios"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalConfirmarIncorporacion(true)}
                  className="px-4 py-2 bg-[#093E7A] hover:bg-[#072d5a] text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  Incorporar Cambios al CREP
                </button>
              </div>
            </div>

            {verDetalleCambios && (
              <div className="mt-3 border border-amber-200 rounded-lg overflow-hidden bg-white shadow-inner max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-amber-100/60 sticky top-0 text-amber-900 font-bold border-b border-amber-200">
                    <tr>
                      <th className="px-3 py-2">Tipo</th>
                      <th className="px-3 py-2">Estudiante</th>
                      <th className="px-3 py-2">DNI</th>
                      <th className="px-3 py-2">Vencimiento</th>
                      <th className="px-3 py-2 text-right">Importe</th>
                      <th className="px-3 py-2">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {resumen?.sincronizacion_crep?.bajas.map((b, idx) => (
                      <tr key={`b-${idx}`} className="hover:bg-red-50/40">
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            {b.tipo === "BAJA_RETIRO" ? "BAJA (RETIRO)" : "BAJA"}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-800">{b.nombre}</td>
                        <td className="px-3 py-2 text-gray-500">{b.documento}</td>
                        <td className="px-3 py-2">{FECHA(b.vencimiento)}</td>
                        <td className="px-3 py-2 text-right font-bold text-red-600">{SOLES(b.monto + b.mora)}</td>
                        <td className="px-3 py-2 text-gray-500 text-[11px]">{b.motivo}</td>
                      </tr>
                    ))}
                    {resumen?.sincronizacion_crep?.altas.map((a, idx) => (
                      <tr key={`a-${idx}`} className="hover:bg-green-50/40">
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                            ALTA
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-800">{a.nombre}</td>
                        <td className="px-3 py-2 text-gray-500">{a.documento}</td>
                        <td className="px-3 py-2">{FECHA(a.vencimiento)}</td>
                        <td className="px-3 py-2 text-right font-bold text-green-700">{SOLES(a.monto + a.mora)}</td>
                        <td className="px-3 py-2 text-gray-500 text-[11px]">{a.motivo}</td>
                      </tr>
                    ))}
                    {resumen?.sincronizacion_crep?.modificaciones.map((m, idx) => (
                      <tr key={`m-${idx}`} className="hover:bg-amber-50/40">
                        <td className="px-3 py-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                            MODIFICACIÓN
                          </span>
                        </td>
                        <td className="px-3 py-2 font-bold text-gray-800">{m.nombre}</td>
                        <td className="px-3 py-2 text-gray-500">{m.documento}</td>
                        <td className="px-3 py-2">{FECHA(m.vencimiento)}</td>
                        <td className="px-3 py-2 text-right font-bold text-amber-800">{SOLES(m.monto_actual + m.mora_actual)}</td>
                        <td className="px-3 py-2 text-gray-500 text-[11px]">{m.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => descargar("/finance/crep/descargar")}
                  className="px-4 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm hover:bg-[#062d59] flex items-center gap-2 shadow-sm transition-all">
            <span className="material-symbols-outlined text-lg">download</span>
            Descargar CREP (.txt)
          </button>
          <button type="button" onClick={() => descargar("/finance/crep/descargar-excel")}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-lg">table_view</span>
            Descargar en Excel
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
          El .txt es el que se sube al BCP. El Excel es solo para revisarlo o
          guardarlo de respaldo: no lleva las macros del banco porque ya no
          hacen falta.
        </p>
      </Bloque>

      {/* ------------------------------------------ 6. reporte de deudores */}
      <Bloque numero={6} titulo="Lista de deudores"
              descripcion="Quién debe, cuánto y desde cuándo. Es el reporte que antes se sacaba a mano del Excel de macros.">
        <button type="button" onClick={() => descargar("/finance/crep/deudores.xlsx")}
                className="px-4 py-2.5 bg-[#701C32] text-white rounded-lg font-bold text-sm hover:bg-[#5a1628] flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">group</span>
          Descargar deudores (.xlsx)
        </button>
        <div className="text-[11px] text-gray-500 mt-3 leading-relaxed space-y-1">
          <p>El archivo trae varias hojas:</p>
          <p>· <b>Resumen</b> — cuánto debe cada sección, para ver dónde está el grueso.</p>
          <p>· <b>Deudores</b> — un alumno por fila, con su total y sus días de atraso.</p>
          <p>· <b>Detalle por cuota</b> — una cuota por fila, para cuadrar importe a importe.</p>
          <p>· <b>Una hoja por sección</b> — con su total al pie, lista para pasársela al tutor.</p>
          <p>· <b>Deuda anterior</b> — retirados y trasladados, que ya no tienen sección.</p>
          <p className="text-gray-400 pt-1">
            La sección es la de la matrícula de este año, no la que tenía cuando se
            generó la cuota: el que reclama es el tutor de ahora.
          </p>
        </div>
      </Bloque>

      {/* ------------------------------------------------ historial */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h4 className="text-sm font-black text-gray-700">Reportes ya procesados</h4>
        </div>
        {!lotes.length ? (
          <p className="p-6 text-sm text-gray-400 text-center">
            Todavía no se ha procesado ningún reporte.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="text-left px-4 py-2 font-bold">Archivo</th>
                  <th className="text-left px-3 py-2 font-bold">Del día</th>
                  <th className="text-right px-3 py-2 font-bold">Cobros</th>
                  <th className="text-right px-3 py-2 font-bold">Monto</th>
                  <th className="text-right px-3 py-2 font-bold">Aplicados</th>
                  <th className="text-right px-3 py-2 font-bold">Sin cruzar</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lotes.map((l) => (
                  <tr key={l.id_lote} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-700 max-w-[16rem] truncate"
                        title={l.archivo}>{l.archivo}</td>
                    <td className="px-3 py-2 text-gray-600">{FECHA(l.fecha_reporte)}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{l.registros}</td>
                    <td className="px-3 py-2 text-right text-gray-600">{SOLES(l.monto)}</td>
                    <td className="px-3 py-2 text-right font-bold text-green-700">{l.aplicados}</td>
                    <td className={`px-3 py-2 text-right font-bold ${l.sin_coincidencia ? "text-red-600" : "text-gray-400"}`}>
                      {l.sin_coincidencia}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => abrirLote(l.id_lote)}
                              className="text-[#093E7A] text-xs font-bold hover:underline">
                        {loteAbierto === l.id_lote ? "Ocultar" : "Ver detalle"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loteAbierto && (
          <div className="border-t bg-gray-50/60 p-4">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Chip activo={filtro === ""} onClick={() => setFiltro("")}>
                Todos ({movimientos.length})
              </Chip>
              {Object.keys(ETIQUETA_RESULTADO).map((r) => {
                const n = movimientos.filter((m) => m.resultado === r).length;
                if (!n) return null;
                return (
                  <Chip key={r} activo={filtro === r} onClick={() => setFiltro(r)}>
                    {ETIQUETA_RESULTADO[r]} ({n})
                  </Chip>
                );
              })}
            </div>
            <div className="overflow-x-auto max-h-[26rem] overflow-y-auto bg-white rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-gray-100 sticky top-0">
                  <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                    <th className="text-left px-3 py-2 font-bold">Documento</th>
                    <th className="text-left px-3 py-2 font-bold">Alumno</th>
                    <th className="text-left px-3 py-2 font-bold">Vence</th>
                    <th className="text-right px-3 py-2 font-bold">Pagó</th>
                    <th className="text-left px-3 py-2 font-bold">Operación</th>
                    <th className="text-left px-3 py-2 font-bold">Resultado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibles.map((m) => (
                    <tr key={m.id_movimiento} className="hover:bg-gray-50">
                      <td className="px-3 py-1.5 font-mono text-gray-700">{m.documento}</td>
                      <td className="px-3 py-1.5 text-gray-600 max-w-[16rem] truncate"
                          title={m.alumno ?? ""}>{m.alumno ?? "—"}</td>
                      <td className="px-3 py-1.5 text-gray-600">{FECHA(m.fecha_vencimiento)}</td>
                      <td className="px-3 py-1.5 text-right text-gray-700">{SOLES(m.monto_total)}</td>
                      <td className="px-3 py-1.5 font-mono text-gray-500">{m.operacion ?? "—"}</td>
                      <td className="px-3 py-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${COLOR_RESULTADO[m.resultado] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                              title={m.detalle ?? ""}>
                          {ETIQUETA_RESULTADO[m.resultado] ?? m.resultado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {visibles.some((m) => m.detalle) && (
              <p className="text-[11px] text-gray-400 mt-2">
                Pasa el cursor por la etiqueta de resultado para ver el motivo.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------- puesta en marcha (una sola vez) */}
      <details className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <summary className="px-4 py-3 cursor-pointer text-sm font-black text-gray-700 hover:bg-gray-50 flex flex-wrap items-center gap-2">
          Puesta en marcha · importar el CREP que usa hoy el colegio
          {yaHecha ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              ✓ Hecha el {FECHA(yaHecha.fecha)}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
              Pendiente
            </span>
          )}
        </summary>
        <div className="p-4 border-t space-y-3">
          {yaHecha ? (
            /* Ya está hecha: lo que hay que decir es que no hay que repetirla.
               Antes la pantalla se veía igual antes y después, y no había forma
               de saber si el paso estaba dado. */
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 space-y-1">
              <p className="font-bold">Esta puesta en marcha ya está hecha.</p>
              {yaHecha.registrada ? (
                <p>
                  Se importó <b>{yaHecha.archivo}</b> el <b>{FECHA(yaHecha.fecha)}</b>:{" "}
                  {yaHecha.cuotas} cuotas del archivo, {yaHecha.cuadraron} cuadraron con
                  el sistema y {yaHecha.deuda_historica} se guardaron como deuda anterior.
                </p>
              ) : (
                /* Se hizo antes de que el sistema lo anotara: se reconoce por el
                   rastro que deja, así que se dice lo que se sabe y nada más. */
                <p>
                  Se hizo antes de que el sistema lo anotara, así que no hay ficha de
                  aquella carga; se reconoce por lo que dejó en los datos:{" "}
                  {!!yaHecha.sincronizadas && (
                    <><b>{yaHecha.sincronizadas} cuotas</b> dadas por pagadas al
                    sincronizar con el archivo del BCP{yaHecha.deuda_historica ? " y " : ""}</>
                  )}
                  {!!yaHecha.deuda_historica && (
                    <><b>{yaHecha.deuda_historica} cuotas</b> de deuda anterior</>
                  )}
                  {yaHecha.fecha ? <> · alrededor del <b>{FECHA(yaHecha.fecha)}</b></> : null}.
                </p>
              )}
              <p className="text-emerald-800">
                <b>No hace falta repetirla.</b> A partir de aquí lo que se sube son los
                reportes de cobros del día, arriba.
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-600 leading-relaxed">
              Esto se hace <strong>una sola vez</strong>, al empezar a usar el módulo.
              Toma el archivo de cobranza vigente como foto de la deuda real: da de
              alta la deuda de quien ya no está matriculado, iguala la mora a la del
              archivo y marca como pagadas las cuotas que el archivo ya no trae.
            </p>
          )}
          <input ref={entradaInicial} type="file" accept=".txt"
                 onChange={(e) => { setInicial(e.target.files?.[0] ?? null); setPrevioInicial(null); }}
                 className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4
                            file:rounded-lg file:border-0 file:text-sm file:font-bold
                            file:bg-gray-700 file:text-white hover:file:bg-gray-800" />
          <div className="flex gap-2">
            <button type="button" disabled={trabajando || !inicial}
                    onClick={() => enviarInicial(true)}
                    className="px-4 py-2 border border-gray-400 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 disabled:opacity-50">
              Simular
            </button>
            <button type="button" disabled={trabajando || !previoInicial}
                    onClick={() => enviarInicial(false)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm hover:bg-black disabled:opacity-50">
              Aplicar
            </button>
          </div>
          {previoInicial && <ResultadoInicial datos={previoInicial} />}
        </div>
      </details>

      {/* ------------------------------------ diálogo para resolver un cobro */}
      {revisando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] shadow-2xl flex flex-col">
            <div className="bg-[#093E7A] px-5 py-4 text-white rounded-t-2xl flex justify-between items-start shrink-0">
              <div>
                <h3 className="font-black text-base">Resolver un cobro</h3>
                <p className="text-[11px] text-white/70 mt-0.5">
                  {revisando.alumno ?? "Alumno no identificado"} · documento {revisando.documento}
                </p>
              </div>
              <button type="button" onClick={() => { setRevisando(null); setCandidatos(null); }}
                      className="hover:text-gray-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Dato etiqueta="Pagó el" valor={FECHA(revisando.fecha_pago)} />
                <Dato etiqueta="Importe" valor={SOLES(revisando.monto_total)} />
                <Dato etiqueta="Cuota del banco" valor={FECHA(revisando.fecha_vencimiento)} />
                <Dato etiqueta="Operación" valor={revisando.operacion ?? "—"} />
              </div>
              {revisando.detalle && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {revisando.detalle}
                </p>
              )}

              <div>
                <p className="text-xs font-black text-gray-700 mb-2">
                  ¿A qué cuota corresponde?
                </p>
                {candidatos === null ? (
                  <p className="text-sm text-gray-400 animate-pulse">Buscando cuotas…</p>
                ) : !candidatos.length ? (
                  <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Este documento no tiene ninguna cuota pendiente. Si el dinero
                    no corresponde a una deuda, descártalo dejando una nota.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {candidatos.map((c) => (
                      <label key={`${c.tipo}-${c.id}`}
                             className={`flex items-center gap-3 border rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                               elegida?.id === c.id && elegida?.tipo === c.tipo
                                 ? "border-[#093E7A] bg-blue-50"
                                 : "border-gray-200 hover:bg-gray-50"}`}>
                        <input type="radio" name="cuota" className="accent-[#093E7A]"
                               checked={elegida?.id === c.id && elegida?.tipo === c.tipo}
                               onChange={() => setElegida(c)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {c.concepto ?? "Cuota"}
                            {c.tipo === "externa" && (
                              <span className="ml-1 text-[10px] font-normal text-gray-500">(deuda anterior)</span>
                            )}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            Vence {FECHA(c.fecha_vencimiento)} · {SOLES(c.monto)}
                            {c.mora > 0 && ` + ${SOLES(c.mora)} mora`}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {c.mismo_vencimiento ? (
                            <span className="text-[9px] font-bold bg-green-100 text-green-700 rounded px-1.5 py-0.5">
                              misma fecha
                            </span>
                          ) : c.mismo_mes ? (
                            /* En diciembre la fecha del sistema y la del banco
                               no coinciden nunca, así que el mes ya es pista. */
                            <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5">
                              mismo mes
                            </span>
                          ) : null}
                          {c.coincide_importe && (
                            <span className="text-[9px] font-bold bg-blue-100 text-blue-700 rounded px-1.5 py-0.5">
                              mismo importe
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  Nota (por qué se decidió esto)
                </label>
                <input type="text" maxLength={200} value={nota}
                       onChange={(e) => setNota(e.target.value)}
                       placeholder="Ej.: pagó de más, se acepta como cancelada"
                       className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-[#093E7A]/20" />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex flex-wrap justify-between gap-2 rounded-b-2xl shrink-0">
              <button type="button" disabled={trabajando}
                      onClick={() => resolver("descartar")}
                      className="px-4 py-2.5 border border-gray-400 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-100 disabled:opacity-50">
                Descartar sin aplicar
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setRevisando(null); setCandidatos(null); }}
                        className="px-4 py-2.5 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-200">
                  Cancelar
                </button>
                <button type="button" disabled={trabajando || !elegida}
                        onClick={() => resolver("aplicar")}
                        className="px-4 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm hover:bg-[#062d59] disabled:opacity-50">
                  Marcar como pagada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------ modal confirmar incorporacion al CREP */}
      {modalConfirmarIncorporacion && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="p-5 text-white flex items-center justify-between bg-[#093E7A]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-2xl">sync</span>
                <div>
                  <h3 className="font-black text-lg">Incorporar Cambios al CREP</h3>
                  <p className="text-xs text-white/80">Sincronización oficial del padrón de cobranza</p>
                </div>
              </div>
              <button
                onClick={() => setModalConfirmarIncorporacion(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
                  <span className="material-symbols-outlined text-amber-600 text-xl">help</span>
                  ¿Ya subiste y procesaste los últimos archivos de Reportes de Cobros del BCP?
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Es indispensable que primero proceses los reportes de cobros recibidos hoy. Si incorporas las <b>bajas de cuotas (por retiros de estudiantes)</b> antes de conciliar los pagos de hoy, el banco podría haber cobrado alguna de ellas y no se registrará automáticamente en el sistema.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs space-y-2">
                <p className="font-bold text-gray-700">Resumen de la actualización a incorporar:</p>
                <ul className="list-disc pl-4 text-gray-600 space-y-1">
                  <li><b>{resumen?.sincronizacion_crep?.bajas.length || 0} cuotas</b> dadas de baja por retiros de alumnos o eliminaciones.</li>
                  <li><b>{resumen?.sincronizacion_crep?.altas.length || 0} cuotas nuevas</b> generadas en el sistema.</li>
                  <li><b>{resumen?.sincronizacion_crep?.modificaciones.length || 0} cuotas modificadas</b> en importe o mora.</li>
                  <li><b>{cambiosManuales} cambio(s) hecho(s) a mano</b> que quedarán marcados como enviados.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                disabled={incorporando}
                onClick={() => setModalConfirmarIncorporacion(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar / Mantener pendientes
              </button>
              <button
                type="button"
                disabled={incorporando}
                onClick={ejecutarIncorporacion}
                className="px-5 py-2.5 bg-[#093E7A] hover:bg-[#072d5a] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
              >
                {incorporando ? (
                  <span>Incorporando...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Sí, ya procesé los cobros e Incorporar al CREP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ auxiliares */

function Tarjeta({ titulo, valor, pie, icono }: {
  titulo: string; valor: string; pie: string; icono: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        <span className="material-symbols-outlined text-lg">{icono}</span>
        <p className="text-[11px] font-bold uppercase tracking-wider">{titulo}</p>
      </div>
      <p className="text-2xl font-black text-[#093E7A] leading-tight">{valor}</p>
      <p className="text-[11px] text-gray-400 mt-1 leading-snug">{pie}</p>
    </div>
  );
}

function Bloque({ numero, titulo, descripcion, children }: {
  numero: number; titulo: string; descripcion: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-7 h-7 rounded-lg bg-[#093E7A] text-white text-sm font-black flex items-center justify-center shrink-0">
          {numero}
        </span>
        <div>
          <h4 className="text-sm font-black text-gray-800">{titulo}</h4>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{descripcion}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Chip({ activo, onClick, children }: {
  activo: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
              activo ? "bg-[#093E7A] text-white" : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"}`}>
      {children}
    </button>
  );
}

function Dato({ etiqueta, valor, resaltar }: {
  etiqueta: string; valor: string | number; resaltar?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">{etiqueta}</p>
      <p className={`text-lg font-black ${resaltar ? "text-red-600" : "text-gray-800"}`}>{valor}</p>
    </div>
  );
}

function ResultadoProceso({ datos }: { datos: any }) {
  const t = datos.totales ?? {};
  const problemas = (t.SIN_COINCIDENCIA ?? 0) + (t.MONTO_DISTINTO ?? 0) + (t.AMBIGUO ?? 0);
  // Cobros de algo que el sistema ya daba por cobrado. No son un problema:
  // solo confirman lo que ya había, o repiten un cobro ya aplicado.
  const yaEstaban = (t.YA_PAGADO ?? 0) + (t.REPETIDO ?? 0);
  const cobros: any[] = datos.cobros ?? [];
  const [soloProblemas, setSoloProblemas] = useState(false);
  const lista = soloProblemas
    ? cobros.filter((c) => HAY_QUE_MIRARLO.has(c.resultado))
    : cobros;
  return (
    <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <p className="text-xs font-black text-[#093E7A]">
          {datos.simulado ? "Esto es lo que pasaría (todavía no se ha guardado nada)" : "Aplicado"}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
        <Dato etiqueta="Se aplican" valor={t.APLICADO ?? 0} />
        <Dato etiqueta="Sin coincidencia" valor={t.SIN_COINCIDENCIA ?? 0} resaltar={!!t.SIN_COINCIDENCIA} />
        <Dato etiqueta="Extornados" valor={t.EXTORNADO ?? 0} />
        <Dato etiqueta="Monto distinto" valor={t.MONTO_DISTINTO ?? 0} resaltar={!!t.MONTO_DISTINTO} />
      </div>
      <div className="border-t divide-y divide-gray-100">
        {(datos.archivos ?? []).map((a: any, i: number) => (
          <div key={i} className="px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-gray-700">
              {a.archivo}
              <span className="text-gray-400 font-normal"> · {FECHA(a.fecha_reporte)}</span>
            </span>
            {a.omitido ? (
              <span className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                {a.motivo}
              </span>
            ) : (
              <span className="text-gray-500">
                {a.cobros} cobros · {a.aplicado ?? 0} aplicados
                {a.sin_coincidencia ? ` · ${a.sin_coincidencia} sin cruzar` : ""}
              </span>
            )}
          </div>
        ))}
      </div>
      {problemas > 0 && (
        <p className="px-4 py-2 text-[11px] text-red-700 bg-red-50 border-t border-red-100">
          {problemas} cobro{problemas > 1 ? "s" : ""} no se {problemas > 1 ? "pudieron" : "pudo"} aplicar.
          Están marcados abajo, con el motivo en la etiqueta.
        </p>
      )}
      {yaEstaban > 0 && (
        <p className="px-4 py-2 text-[11px] text-sky-800 bg-sky-50 border-t border-sky-100">
          {yaEstaban} cobro{yaEstaban > 1 ? "s corresponden" : " corresponde"} a cuotas que
          el sistema <b>ya tenía por pagadas</b>. No hace falta hacer nada: normalmente es
          la puesta en marcha, que las dio por cobradas sin ver el cobro, y este reporte lo
          confirma. Pasa el cursor por la etiqueta para ver cada caso.
        </p>
      )}

      {/* Quién pagó, en el orden en que se cobró. Se ve ANTES de aplicar nada,
          que es lo que permite revisar el día antes de tocar la base. */}
      {cobros.length > 0 && (
        <div className="border-t">
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-gray-50 border-b">
            <p className="text-xs font-black text-gray-700">
              Cobros del banco, en orden de hora
              <span className="font-normal text-gray-500"> · {cobros.length} de {datos.cobros_totales}</span>
            </p>
            {problemas > 0 && (
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 cursor-pointer">
                <input type="checkbox" checked={soloProblemas}
                       onChange={(e) => setSoloProblemas(e.target.checked)}
                       className="accent-[#093E7A]" />
                Ver solo los que no se aplican ({problemas})
              </label>
            )}
          </div>
          <div className="overflow-x-auto max-h-[24rem] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 sticky top-0">
                <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="text-left px-3 py-2 font-bold">Pagó</th>
                  <th className="text-left px-3 py-2 font-bold">Documento</th>
                  <th className="text-left px-3 py-2 font-bold">Alumno</th>
                  <th className="text-left px-3 py-2 font-bold">Cuota</th>
                  <th className="text-right px-3 py-2 font-bold">Importe</th>
                  <th className="text-left px-3 py-2 font-bold">Canal</th>
                  <th className="text-left px-3 py-2 font-bold">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((c, i) => (
                  <tr key={`${c.archivo}-${c.linea}-${i}`}
                      className={HAY_QUE_MIRARLO.has(c.resultado)
                        ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"}>
                    <td className="px-3 py-1.5 whitespace-nowrap text-gray-600">
                      {FECHA(c.fecha_pago)}
                      <span className="text-gray-400"> {c.hora}</span>
                    </td>
                    <td className="px-3 py-1.5 font-mono text-gray-700">{c.documento}</td>
                    <td className="px-3 py-1.5 text-gray-700 max-w-[18rem] truncate"
                        title={c.alumno ?? ""}>
                      {c.alumno ?? <span className="text-gray-400 italic">no identificado</span>}
                    </td>
                    <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">
                      {FECHA(c.fecha_vencimiento)}
                      {/* La fecha del banco y la del sistema no eran idénticas
                          pero se aceptaron igual; se dice por qué vía. */}
                      {c.cruce_por_fecha && (
                        <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-bold align-middle"
                              title={c.detalle ?? ""}>
                          {c.cruce_por_fecha === "fin_de_mes" ? "fin de mes" : "único del mes"}
                        </span>
                      )}
                      {c.concepto && <span className="text-gray-400"> · {c.concepto}</span>}
                    </td>
                    <td className="px-3 py-1.5 text-right text-gray-800 font-medium whitespace-nowrap">
                      {SOLES(c.monto_total)}
                      {c.mora_pagada > 0 && (
                        <span className="text-[10px] text-amber-600"> (+{SOLES(c.mora_pagada)} mora)</span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-gray-500">{c.medio || "—"}</td>
                    <td className="px-3 py-1.5">
                      <span className={`inline-block px-2 py-0.5 rounded border text-[10px] font-bold ${COLOR_RESULTADO[c.resultado] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}
                            title={c.detalle ?? ""}>
                        {ETIQUETA_RESULTADO[c.resultado] ?? c.resultado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t flex flex-wrap justify-between gap-2 text-[11px] text-gray-500">
            <span>
              {lista.length} cobro{lista.length !== 1 ? "s" : ""} ·{" "}
              {SOLES(lista.reduce((s, c) => s + (c.monto_total ?? 0), 0))}
            </span>
            {datos.cobros_totales > cobros.length && (
              <span className="text-amber-700">
                Se muestran los primeros {cobros.length} de {datos.cobros_totales}.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultadoInicial({ datos }: { datos: any }) {
  // Qué se decidió en cada fila de «importe distinto», por cuota.
  //   "archivo" -> ya se guardó el precio del banco (esto SÍ escribió)
  //   "sistema" -> se deja como está; no toca nada, solo quita el aviso
  const [decidido, setDecidido] = useState<Record<string, "archivo" | "sistema">>({});
  const [guardando, setGuardando] = useState<string | null>(null);

  const usarElDelArchivo = async (d: any) => {
    const clave = `${d.tipo}-${d.id}`;
    setGuardando(clave);
    try {
      const cuerpo = new FormData();
      cuerpo.append("tipo", d.tipo);
      cuerpo.append("id_cuota", String(d.id));
      cuerpo.append("monto", String(d.en_el_archivo));
      const res = await apiFetch("/finance/crep/ajustar-importe",
                                 { method: "POST", body: cuerpo });
      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo cambiar el importe"),
                    { duration: 10000 });
        return;
      }
      const r = await res.json();
      setDecidido((p) => ({ ...p, [clave]: "archivo" }));
      toast.success(`${r.concepto ?? "Cuota"} de ${r.alumno ?? d.dni}: ` +
                    `${SOLES(r.antes)} → ${SOLES(r.ahora)}`);
    } catch {
      toast.error("Error de conexión al cambiar el importe");
    } finally {
      setGuardando(null);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 border-b px-4 py-2">
        <p className="text-xs font-black text-gray-700">
          {datos.simulado ? "Esto es lo que pasaría (nada guardado todavía)" : "Importación aplicada"}
        </p>
      </div>
      {datos.ya_se_habia_hecho && (
        <p className="px-4 py-2 text-[11px] text-amber-800 bg-amber-50 border-b border-amber-200">
          <b>Ojo:</b> la puesta en marcha ya se hizo el{" "}
          {FECHA(datos.ya_se_habia_hecho.fecha)} con «{datos.ya_se_habia_hecho.archivo}».{" "}
          {datos.ya_se_habia_hecho.mismo_archivo
            ? "Es el mismo archivo: aplicarlo otra vez está bloqueado porque no cambiaría nada."
            : "Este es otro archivo. Solo tiene sentido volver a hacerla si la primera se hizo con un CREP equivocado."}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
        <Dato etiqueta="En el archivo" valor={datos.cuotas_en_el_archivo} />
        <Dato etiqueta="Cuadran" valor={datos.coinciden} />
        <Dato etiqueta="Deuda anterior" valor={datos.deuda_historica_creada} />
        <Dato etiqueta="Se dan por pagadas" valor={datos.marcadas_como_pagadas}
              resaltar={!!datos.marcadas_como_pagadas} />
      </div>
      <div className="px-4 pb-4 text-[11px] text-gray-600 space-y-1">
        <p>· Se iguala la mora de {datos.mora_ajustada} cuotas a la del archivo del banco.</p>
        {datos.importes_que_no_cuadran > 0 && (
          <details className="group">
            <summary className="text-orange-700 cursor-pointer list-none marker:content-none">
              · {datos.importes_que_no_cuadran} cuota{datos.importes_que_no_cuadran > 1 ? "s" : ""} con
              importe distinto al del archivo. No se toca el precio: revísalas a mano.
              <span className="ml-1 font-bold underline group-open:hidden">ver cuál{datos.importes_que_no_cuadran > 1 ? "es" : ""}</span>
              <span className="ml-1 font-bold underline hidden group-open:inline">ocultar</span>
            </summary>
            {/* Quién es y cuánto baila. La diferencia suele ser una beca, media
                pensión o un convenio que está en el archivo del banco pero no en
                la cuota del sistema (o al revés). Se decide a mano. */}
            <div className="mt-2 overflow-x-auto border border-orange-200 rounded">
              <table className="w-full text-[11px]">
                <thead className="bg-orange-50">
                  <tr className="text-[10px] uppercase tracking-wider text-orange-800">
                    <th className="text-left px-2 py-1.5 font-bold">Alumno</th>
                    <th className="text-left px-2 py-1.5 font-bold">DNI</th>
                    <th className="text-left px-2 py-1.5 font-bold">Cuota</th>
                    <th className="text-left px-2 py-1.5 font-bold">Vence</th>
                    <th className="text-right px-2 py-1.5 font-bold">En el sistema</th>
                    <th className="text-right px-2 py-1.5 font-bold">En el archivo</th>
                    <th className="text-right px-2 py-1.5 font-bold">Diferencia</th>
                    <th className="text-left px-2 py-1.5 font-bold">¿Cuál es el bueno?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100 bg-white">
                  {(datos.detalle_importes ?? []).map((d: any, i: number) => {
                    const dif = (d.en_el_archivo ?? 0) - (d.en_el_sistema ?? 0);
                    const clave = `${d.tipo}-${d.id}`;
                    const yaEstá = decidido[clave];
                    return (
                      <tr key={`${d.dni}-${d.vencimiento}-${i}`}
                          className={yaEstá ? "bg-gray-50 text-gray-400" : undefined}>
                        <td className="px-2 py-1.5 text-gray-700 max-w-[16rem] truncate"
                            title={d.alumno ?? ""}>
                          {d.alumno ?? <span className="text-gray-400 italic">sin nombre</span>}
                        </td>
                        <td className="px-2 py-1.5 font-mono text-gray-600">{d.dni}</td>
                        <td className="px-2 py-1.5 text-gray-600">{d.concepto ?? "—"}</td>
                        <td className="px-2 py-1.5 text-gray-600 whitespace-nowrap">
                          {FECHA(d.vencimiento)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-gray-800 whitespace-nowrap">
                          {SOLES(d.en_el_sistema)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-gray-800 whitespace-nowrap">
                          {SOLES(d.en_el_archivo)}
                        </td>
                        <td className={`px-2 py-1.5 text-right font-bold whitespace-nowrap ${
                              yaEstá ? "text-gray-400" : dif > 0 ? "text-red-600" : "text-emerald-700"}`}>
                          {dif > 0 ? "+" : "−"}{SOLES(Math.abs(dif))}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          {yaEstá === "archivo" ? (
                            <span className="text-emerald-700 font-bold">
                              ✓ Guardado en {SOLES(d.en_el_archivo)}
                            </span>
                          ) : yaEstá === "sistema" ? (
                            <span className="text-gray-500">
                              Se deja en {SOLES(d.en_el_sistema)}
                              <button type="button"
                                      onClick={() => setDecidido(({ [clave]: _, ...resto }) => resto)}
                                      className="ml-2 underline hover:text-gray-700">
                                deshacer
                              </button>
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              {/* Único botón de toda la importación que escribe
                                  sin simular: se pulsa fila a fila, después de
                                  mirar los dos importes. */}
                              <button type="button" disabled={!d.id || guardando === clave}
                                      onClick={() => usarElDelArchivo(d)}
                                      className="px-2 py-1 rounded bg-[#093E7A] text-white font-bold hover:bg-[#062d59] disabled:opacity-40">
                                {guardando === clave ? "Guardando..." : "Usar el del archivo"}
                              </button>
                              <button type="button" disabled={guardando === clave}
                                      onClick={() => setDecidido((p) => ({ ...p, [clave]: "sistema" }))}
                                      className="px-2 py-1 rounded border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 disabled:opacity-40">
                                Dejar el del sistema
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-1.5 text-[10px] text-gray-500">
              <b>Usar el del archivo</b> cambia el precio de la cuota ahora mismo (esto sí
              se guarda, no es simulación) y la mora se respeta.{" "}
              <b>Dejar el del sistema</b> no toca nada: el precio se manda tal cual en el
              próximo CREP que generes y el banco se alinea solo.
            </p>
          </details>
        )}
        {datos.marcadas_como_pagadas > 0 && (
          <p className="text-amber-700">
            · Las {datos.marcadas_como_pagadas} que se dan por pagadas son cuotas que el
            archivo del BCP ya no trae. Si alguna no debería estarlo, corrígela después.
          </p>
        )}
      </div>
    </div>
  );
}
