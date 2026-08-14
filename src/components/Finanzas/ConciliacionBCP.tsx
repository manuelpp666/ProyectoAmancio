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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Resumen {
  cuotas_pendientes: number;
  de_alumnos: number;
  deuda_historica: number;
  deuda: number;
  mora: number;
  vencimientos_sin_mora: { fecha: string; impagas: number; sin_mora: number; importe: number }[];
  cobros_por_revisar: number;
  ultimo_lote: {
    id_lote: number; archivo: string; fecha_reporte: string | null;
    fecha_carga: string | null; aplicados: number; sin_coincidencia: number;
  } | null;
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

/** Cada resultado con su color, para reconocerlo de un vistazo en la tabla. */
const COLOR_RESULTADO: Record<string, string> = {
  APLICADO: "bg-green-50 text-green-700 border-green-200",
  EXTORNADO: "bg-amber-50 text-amber-700 border-amber-200",
  SIN_COINCIDENCIA: "bg-red-50 text-red-700 border-red-200",
  MONTO_DISTINTO: "bg-orange-50 text-orange-700 border-orange-200",
  AMBIGUO: "bg-purple-50 text-purple-700 border-purple-200",
  REPETIDO: "bg-gray-100 text-gray-600 border-gray-200",
};

const ETIQUETA_RESULTADO: Record<string, string> = {
  APLICADO: "Aplicado",
  EXTORNADO: "Extornado",
  SIN_COINCIDENCIA: "Sin coincidencia",
  MONTO_DISTINTO: "Monto distinto",
  AMBIGUO: "Ambiguo",
  REPETIDO: "Repetido",
};

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

      {/* ------------------------------------------- 4. generar el CREP */}
      <Bloque numero={4} titulo="Generar el archivo para el BCP"
              descripcion="Sale con todo lo que sigue por cobrar en este momento, con el mismo formato que el banco espera.">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => descargar("/finance/crep/descargar")}
                  className="px-4 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm hover:bg-[#062d59] flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Descargar CREP (.txt)
          </button>
          <button type="button" onClick={() => descargar("/finance/crep/descargar-excel")}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center gap-2">
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
        <summary className="px-4 py-3 cursor-pointer text-sm font-black text-gray-700 hover:bg-gray-50">
          Puesta en marcha · importar el CREP que usa hoy el colegio
        </summary>
        <div className="p-4 border-t space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">
            Esto se hace <strong>una sola vez</strong>, al empezar a usar el módulo.
            Toma el archivo de cobranza vigente como foto de la deuda real: da de
            alta la deuda de quien ya no está matriculado, iguala la mora a la del
            archivo y marca como pagadas las cuotas que el archivo ya no trae.
          </p>
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
  const cobros: any[] = datos.cobros ?? [];
  const [soloProblemas, setSoloProblemas] = useState(false);
  const lista = soloProblemas
    ? cobros.filter((c) => c.resultado !== "APLICADO")
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
                      className={c.resultado === "APLICADO" ? "hover:bg-gray-50" : "bg-red-50/40 hover:bg-red-50"}>
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
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-100 border-b px-4 py-2">
        <p className="text-xs font-black text-gray-700">
          {datos.simulado ? "Esto es lo que pasaría (nada guardado todavía)" : "Importación aplicada"}
        </p>
      </div>
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
          <p className="text-orange-700">
            · {datos.importes_que_no_cuadran} cuota{datos.importes_que_no_cuadran > 1 ? "s" : ""} con
            importe distinto al del archivo. No se toca el precio: revísalas a mano.
          </p>
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
