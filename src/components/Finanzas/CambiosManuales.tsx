"use client";

/**
 * Los cambios que se hacen a mano sobre las cuotas.
 *
 * POR QUÉ ESTÁ AQUÍ
 * El archivo CREP se arma leyendo las cuotas en vivo, así que rebajar un
 * importe o cobrar en caja ya se refleja en la siguiente descarga. Lo que no
 * había forma de saber es CUÁLES fueron esos cambios: al comparar el archivo
 * de un mes con el del anterior salían diferencias que nadie sabía justificar.
 *
 * Esta tabla es ese parte. Y la columna que de verdad importa no es el importe
 * sino la última: si el banco ya tiene el cambio o todavía no.
 */

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { apiFetch, mensajeDeError } from "@/src/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface CambioManual {
  id_ajuste: number;
  id_pago: number | null;
  tipo: string;
  tipo_texto: string;
  efecto_crep: string;
  efecto_texto: string;
  documento: string | null;
  nombre: string | null;
  concepto: string | null;
  fecha_vencimiento: string | null;
  monto_anterior: number | null;
  monto_nuevo: number | null;
  mora_anterior: number | null;
  mora_nueva: number | null;
  total_anterior: number | null;
  total_nuevo: number | null;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  detalle: string | null;
  usuario: string | null;
  fecha: string | null;
  incorporado: boolean;
  id_registro_crep: number | null;
  fecha_incorporacion: string | null;
}

interface Respuesta {
  ajustes: CambioManual[];
  total: number;
  mostrados: number;
  recortado: boolean;
  pendientes: number;
  pendientes_por_efecto: Record<string, number>;
}

const SOLES = (n: number | null) =>
  n === null || n === undefined
    ? "—"
    : `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FECHA = (iso: string | null) => {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

const FECHA_HORA = (iso: string | null) => {
  if (!iso) return "—";
  const [fecha, resto] = iso.split("T");
  const [a, m, d] = fecha.split("-");
  return `${d}/${m}/${a} ${(resto ?? "").slice(0, 5)}`;
};

/** Colores por lo que el cambio le hace al archivo del banco, que es el
 *  criterio con el que se revisa: lo que entra, lo que sale y lo que cambia
 *  de precio son tres revisiones distintas. */
const COLOR_EFECTO: Record<string, string> = {
  ALTA: "bg-green-50 text-green-700 border-green-200",
  BAJA: "bg-red-50 text-red-700 border-red-200",
  IMPORTE: "bg-amber-50 text-amber-700 border-amber-200",
  NINGUNO: "bg-gray-100 text-gray-500 border-gray-200",
};

const ETIQUETA_EFECTO: Record<string, string> = {
  ALTA: "Entra al archivo",
  BAJA: "Sale del archivo",
  IMPORTE: "Cambia de importe",
  NINGUNO: "No afecta al archivo",
};

const COLOR_TIPO: Record<string, string> = {
  ALTA: "bg-green-100 text-green-800",
  MONTO: "bg-amber-100 text-amber-800",
  MORA: "bg-amber-100 text-amber-800",
  VENCIMIENTO: "bg-sky-100 text-sky-800",
  ESTADO: "bg-violet-100 text-violet-800",
  PAGO_MANUAL: "bg-blue-100 text-blue-800",
  ELIMINACION: "bg-red-100 text-red-800",
  PRECIO_MASIVO: "bg-orange-100 text-orange-800",
};

const FILTROS = [
  { id: "pendientes", label: "Pendientes de enviar" },
  { id: "incorporados", label: "Ya enviados al banco" },
  { id: "todos", label: "Todos" },
] as const;

type Filtro = (typeof FILTROS)[number]["id"];

export function CambiosManuales({ recargar = 0 }: { recargar?: number }) {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("pendientes");
  const [cargando, setCargando] = useState(true);
  // Cuando falta el script 26 la respuesta es un 503 con el motivo dentro. Se
  // guarda para explicarlo en pantalla en vez de dejar la tabla vacía sin más,
  // que parecería que no se ha tocado nada.
  const [problema, setProblema] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const res = await apiFetch(`/finance/crep/ajustes-manuales?estado=${filtro}&limite=200`);
      if (!res.ok) {
        setProblema(await mensajeDeError(res, "No se pudieron cargar los cambios manuales"));
        setDatos(null);
        return;
      }
      setProblema(null);
      setDatos(await res.json());
    } catch {
      setProblema("No se pudo conectar con el servidor");
      setDatos(null);
    } finally {
      setCargando(false);
    }
    // `recargar` cambia cuando el padre incorpora los cambios al CREP: sin
    // esta dependencia la tabla seguiría enseñándolos como pendientes hasta
    // que alguien recargara la pagina.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, recargar]);

  useEffect(() => { cargar(); }, [cargar]);

  const descargar = () => {
    if (!datos?.ajustes.length) {
      toast.error("No hay ningún cambio que exportar");
      return;
    }
    window.open(`${API_URL}/finance/crep/ajustes-manuales.xlsx?estado=${filtro}`, "_blank");
  };

  const porEfecto = datos?.pendientes_por_efecto ?? {};
  const pendientes = datos?.pendientes ?? 0;
  const filas = datos?.ajustes ?? [];

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------ estado de un vistazo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#701C32]/10 text-[#701C32] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">edit_note</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              Cambios hechos a mano
            </p>
            {pendientes > 0 ? (
              <p className="text-sm font-black text-gray-800">
                {pendientes} sin enviar al banco
                <span className="font-semibold text-gray-500">
                  {" · "}
                  {[
                    porEfecto.ALTA ? `${porEfecto.ALTA} entran` : null,
                    porEfecto.BAJA ? `${porEfecto.BAJA} salen` : null,
                    porEfecto.IMPORTE ? `${porEfecto.IMPORTE} cambian de importe` : null,
                    porEfecto.NINGUNO ? `${porEfecto.NINGUNO} no afectan` : null,
                  ].filter(Boolean).join(" · ") || "sin efecto en el archivo"}
                </span>
              </p>
            ) : (
              <p className="text-sm font-black text-gray-800">
                Nada pendiente: el banco tiene todos los cambios
              </p>
            )}
          </div>
        </div>
        <button type="button" onClick={descargar}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-white flex items-center gap-1.5 shrink-0 transition-all">
          <span className="material-symbols-outlined text-[16px]">table_view</span>
          Descargar en Excel
        </button>
      </div>

      {/* ------------------------------------------------------------ filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    filtro === f.id
                      ? "bg-[#093E7A] text-white border-[#093E7A]"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}>
            {f.label}
            {f.id === "pendientes" && pendientes > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                filtro === f.id ? "bg-white/25" : "bg-amber-100 text-amber-800"
              }`}>
                {pendientes}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- tabla */}
      {problema ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">warning</span>
            No se pudo leer el registro de cambios
          </p>
          <p className="text-xs text-amber-800 mt-1">{problema}</p>
          <p className="text-[11px] text-amber-700 mt-2">
            Los pagos siguen funcionando con normalidad: cobrar, editar y borrar
            no dependen de este registro.
          </p>
        </div>
      ) : cargando ? (
        <div className="py-10 text-center text-gray-400 animate-pulse font-bold text-sm">
          Cargando los cambios…
        </div>
      ) : filas.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-gray-200 rounded-xl">
          <span className="material-symbols-outlined text-3xl text-gray-300">history</span>
          <p className="text-sm font-bold text-gray-500 mt-1">
            {filtro === "pendientes"
              ? "No hay cambios manuales sin enviar al banco"
              : "Todavía no se ha registrado ningún cambio manual"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Aquí aparecen los importes que se modifican y los cobros que se
            registran en caja.
          </p>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            <div className="overflow-x-auto max-h-[26rem] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 sticky top-0 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 whitespace-nowrap">Cuándo</th>
                    <th className="px-3 py-2 whitespace-nowrap">Quién</th>
                    <th className="px-3 py-2 whitespace-nowrap">Qué hizo</th>
                    <th className="px-3 py-2 whitespace-nowrap">En el archivo del BCP</th>
                    <th className="px-3 py-2">Estudiante</th>
                    <th className="px-3 py-2">Cuota</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Antes</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Después</th>
                    <th className="px-3 py-2 whitespace-nowrap">¿Enviado?</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filas.map((c) => (
                    <tr key={c.id_ajuste} className="hover:bg-gray-50/70 align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                        {FECHA_HORA(c.fecha)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-semibold text-gray-600">
                        {c.usuario || "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          COLOR_TIPO[c.tipo] ?? "bg-gray-100 text-gray-700"
                        }`}>
                          {c.tipo_texto}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                          COLOR_EFECTO[c.efecto_crep] ?? COLOR_EFECTO.NINGUNO
                        }`}>
                          {ETIQUETA_EFECTO[c.efecto_crep] ?? c.efecto_texto}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-bold text-gray-800">{c.nombre || "—"}</span>
                        {c.documento && (
                          <span className="block text-[11px] text-gray-400">{c.documento}</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-gray-700">{c.concepto || "—"}</span>
                        {c.fecha_vencimiento && (
                          <span className="block text-[11px] text-gray-400">
                            vence {FECHA(c.fecha_vencimiento)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap text-gray-500">
                        {SOLES(c.total_anterior)}
                        {c.estado_anterior && (
                          <span className="block text-[10px] text-gray-400">
                            {c.estado_anterior}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-bold text-gray-800">
                        {c.total_nuevo === null ? "eliminada" : SOLES(c.total_nuevo)}
                        {c.estado_nuevo && (
                          <span className="block text-[10px] font-semibold text-gray-400">
                            {c.estado_nuevo}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {c.incorporado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            {FECHA(c.fecha_incorporacion)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Sin enviar
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {datos?.recortado && (
            <p className="text-[11px] text-gray-400">
              Se enseñan los {datos.mostrados} más recientes de {datos.total}. El
              Excel trae la misma cantidad; para ver más, filtra por fechas desde
              la exportación.
            </p>
          )}
        </>
      )}

      <p className="text-[11px] text-gray-400 leading-relaxed">
        Los cambios pendientes YA salen en el CREP que descargas: el archivo se
        arma leyendo las cuotas tal como están ahora mismo. «Sin enviar» quiere
        decir que todavía no se han dado por incorporados aquí abajo, que es lo
        que fija la foto contra la que se comparará el mes que viene.
      </p>
    </div>
  );
}
