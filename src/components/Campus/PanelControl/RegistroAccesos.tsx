"use client";

/**
 * Registro de accesos al campus.
 *
 * Existe por un incidente concreto: alguien entró a una cuenta de
 * administrador y mandó un mensaje desde ella, y no hubo manera de saber
 * cuándo ni desde dónde, porque no se guardaba nada. Esta pantalla contesta
 * las tres preguntas que uno se hace entonces: quién ha entrado a mi cuenta,
 * desde qué sitios, y si antes alguien estuvo probando contraseñas.
 *
 * La señal más útil es la de arriba: una cuenta de administrador que ha
 * entrado desde varias IPs distintas. Si tú siempre entras desde el colegio y
 * aparecen dos, la segunda no eres tú.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2, History, MapPin, AlertTriangle, CheckCircle2, XCircle, Search, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";

/** Dígitos mínimos para buscar. Con menos, casi cualquier DNI coincide. */
const MIN_DIGITOS_DNI = 3;
/** Accesos por página. */
const POR_PAGINA = 50;

interface Acceso {
  id_intento: number;
  username: string;
  rol: string | null;
  exito: boolean;
  motivo: string | null;
  ip: string | null;
  user_agent: string | null;
  fecha: string | null;
}

interface Resumen {
  aciertos: number;
  fallos: number;
  cuentas_mas_tanteadas: { username: string; fallos: number }[];
  admins_por_ip: { username: string; ips_distintas: number; entradas: number }[];
}

const MOTIVOS: Record<string, string> = {
  USUARIO_NO_EXISTE: "Ese usuario no existe",
  PASSWORD_INCORRECTA: "Contraseña incorrecta",
  CUENTA_DESACTIVADA: "Cuenta desactivada",
  BLOQUEADO: "Bloqueado por intentos",
};

export function RegistroAccesos() {
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [dias, setDias] = useState(7);
  const [filtro, setFiltro] = useState<"todos" | "aciertos" | "fallos">("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Paginación del periodo completo. Antes solo llegaban los 200 accesos más
  // recientes, y con cientos de entradas al día eran los mismos en «Hoy» que
  // en «90 días»: cambiaban los contadores pero no la lista.
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState({ total: 0, paginas: 1, porPagina: POR_PAGINA, desde: "" });

  // Lo que se escribe y lo que se busca van separados: se espera a que se deje
  // de teclear para no lanzar una consulta por cada número.
  const [textoDni, setTextoDni] = useState("");
  const [dni, setDni] = useState("");
  const [totalesDni, setTotalesDni] = useState<{ aciertos: number; fallos: number } | null>(null);

  // Si se escribe rápido, una respuesta vieja puede llegar después de la nueva
  // y pintar resultados de otro DNI. Solo vale la de la última petición.
  const ultimaPeticion = useRef(0);
  const dniBuscado = useRef("");

  useEffect(() => {
    const limpio = textoDni.trim();
    const destino = limpio.length >= MIN_DIGITOS_DNI ? limpio : "";
    const t = setTimeout(() => {
      if (dniBuscado.current === destino) return;
      dniBuscado.current = destino;
      // Otra búsqueda empieza por la primera página. Las dos actualizaciones
      // van juntas, así que sale una sola consulta.
      setDni(destino);
      setPagina(1);
    }, 400);
    return () => clearTimeout(t);
  }, [textoDni]);

  const cargar = useCallback(async () => {
    const id = ++ultimaPeticion.current;
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        dias: String(dias), pagina: String(pagina), por_pagina: String(POR_PAGINA),
      });
      if (filtro === "fallos") params.set("solo_fallos", "true");
      if (filtro === "aciertos") params.set("solo_aciertos", "true");
      if (dni) params.set("dni", dni);

      const [rA, rR] = await Promise.all([
        apiFetch(`/seguridad/accesos?${params}`),
        apiFetch(`/seguridad/resumen?dias=${dias}`),
      ]);
      if (id !== ultimaPeticion.current) return;

      if (!rA.ok) {
        const cuerpo = await rA.json().catch(() => null);
        throw new Error(typeof cuerpo?.detail === "string"
          ? cuerpo.detail
          : "No se pudo cargar el registro de accesos.");
      }
      const datos = await rA.json();
      if (id !== ultimaPeticion.current) return;
      setAccesos(Array.isArray(datos?.accesos) ? datos.accesos : []);
      setTotalesDni(datos?.totales_busqueda ?? null);
      const paginas = Math.max(1, Number(datos?.paginas) || 1);
      setPaginacion({
        total: Number(datos?.total) || 0,
        paginas,
        porPagina: Number(datos?.por_pagina) || POR_PAGINA,
        desde: typeof datos?.desde === "string" ? datos.desde : "",
      });
      // El servidor corrige una página que ya no existe; se sigue su criterio.
      if (Number(datos?.pagina) && Number(datos.pagina) !== pagina) setPagina(Number(datos.pagina));
      // El resumen es secundario: si falla, la tabla se muestra igual.
      if (rR.ok) setResumen(await rR.json());
    } catch (e) {
      if (id !== ultimaPeticion.current) return;
      setAccesos([]);
      setTotalesDni(null);
      setError(e instanceof Error && e.message !== "Failed to fetch"
        ? e.message
        : "No hay conexión con el servidor.");
    } finally {
      if (id === ultimaPeticion.current) setCargando(false);
    }
  }, [dias, filtro, dni, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarDni = (valor: string) => {
    // Solo números: el DNI no lleva letras, y así no se envía nada raro.
    setTextoDni(valor.replace(/\D/g, "").slice(0, 12));
  };
  const faltanDigitos = textoDni.length > 0 && textoDni.length < MIN_DIGITOS_DNI;

  // Con un DNI buscado, las tarjetas cuentan solo ese DNI.
  const aciertos = dni ? totalesDni?.aciertos : resumen?.aciertos;
  const fallos = dni ? totalesDni?.fallos : resumen?.fallos;

  const sospechosos = (resumen?.admins_por_ip ?? []).filter((a) => a.ips_distintas > 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <History size={16} className="text-[#701C32]" />
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
            Registro de accesos
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative w-full sm:w-52">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              value={textoDni}
              onChange={(e) => cambiarDni(e.target.value)}
              placeholder="Buscar por DNI"
              aria-label="Buscar accesos por DNI"
              className="w-full text-xs font-bold border border-gray-200 rounded-lg pl-8 pr-8 py-1.5 outline-none focus:border-[#701C32] focus:ring-2 focus:ring-[#701C32]/10 bg-white"
            />
            {textoDni && (
              <button
                type="button"
                onClick={() => setTextoDni("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <select
            value={filtro}
            onChange={(e) => { setFiltro(e.target.value as typeof filtro); setPagina(1); }}
            className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
          >
            <option value="todos">Todos</option>
            <option value="aciertos">Solo entradas</option>
            <option value="fallos">Solo fallos</option>
          </select>
          <select
            value={dias}
            onChange={(e) => { setDias(Number(e.target.value)); setPagina(1); }}
            className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
          >
            <option value={1}>Hoy</option>
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </select>
        </div>
        {faltanDigitos && (
          <p className="w-full text-[11px] text-gray-400 sm:text-right">
            Escribe al menos {MIN_DIGITOS_DNI} números para buscar.
          </p>
        )}
      </div>

      {/* AVISO: un administrador que entra desde varios sitios */}
      {sospechosos.length > 0 && (
        <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">
              Hay administradores que entraron desde más de un sitio
            </p>
            <ul className="mt-1 space-y-0.5 text-amber-800">
              {sospechosos.map((a) => (
                <li key={a.username}>
                  <span className="font-mono font-bold">{a.username}</span>{" "}
                  — {a.entradas} entradas desde {a.ips_distintas} direcciones distintas
                </li>
              ))}
            </ul>
            <p className="mt-2 text-amber-700 text-xs">
              Puede ser normal (casa y colegio, o datos del móvil). Si no
              reconoces alguna, cambia la contraseña de esa cuenta.
            </p>
          </div>
        </div>
      )}

      {/* El spinner grande solo en la primera carga. Al cambiar de página o de
          filtro se atenúa lo que ya había, para que la tabla no desaparezca y
          la pantalla no salte hacia arriba. */}
      {cargando && accesos.length === 0 && !error ? (
        <div className="p-14 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[#701C32]" />
        </div>
      ) : error ? (
        <div className="p-10 text-center space-y-3">
          <XCircle size={28} className="mx-auto text-red-500" />
          <p className="text-sm text-gray-600">{error}</p>
          <button
            type="button"
            onClick={cargar}
            className="text-xs font-bold bg-[#701C32] text-white px-4 py-2 rounded-lg hover:bg-[#5a1628] transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div
          className={`p-4 sm:p-6 space-y-5 transition-opacity ${cargando ? "opacity-50 pointer-events-none" : ""}`}
          aria-busy={cargando}
        >
          {paginacion.desde && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
              {cargando && <Loader2 size={12} className="animate-spin text-[#701C32]" />}
              <span>
                {dias === 1 ? "Hoy" : `Desde el ${paginacion.desde}`}:{" "}
                <b className="text-gray-700">{paginacion.total}</b>{" "}
                {paginacion.total === 1 ? "registro" : "registros"}
                {filtro === "fallos" ? " fallidos" : filtro === "aciertos" ? " de entrada" : ""}
                {dni ? <> del DNI <span className="font-mono font-bold text-gray-700">{dni}</span></> : ""}
              </span>
            </p>
          )}

          {aciertos !== undefined && fallos !== undefined && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-black text-emerald-600">{aciertos}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  Entradas correctas{dni ? " · este DNI" : ""}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-black text-red-600">{fallos}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  Intentos fallidos{dni ? " · este DNI" : ""}
                </p>
              </div>
            </div>
          )}

          {accesos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {dni ? (
                <>No hay accesos con el DNI <span className="font-mono font-bold text-gray-600">{dni}</span> en este periodo. Prueba con más días.</>
              ) : (
                <>No hay accesos registrados en este periodo. El registro empieza a
                llenarse desde que se activó: lo anterior no quedó guardado.</>
              )}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 pr-3">Resultado</th>
                    <th className="py-2 pr-3">Desde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accesos.map((a) => (
                    <tr key={a.id_intento} className="hover:bg-gray-50/60">
                      <td className="py-2.5 pr-3 whitespace-nowrap text-gray-500 text-xs">
                        {a.fecha}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs font-bold text-gray-800">
                        {a.username}
                        {a.rol && (
                          <span className="ml-2 font-sans font-medium text-[10px] text-gray-400">
                            {a.rol}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {a.exito ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 size={13} /> Entró
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs">
                            <XCircle size={13} />
                            {MOTIVOS[a.motivo ?? ""] ?? "Falló"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-gray-300" />
                          {a.ip ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {paginacion.paginas > 1 && accesos.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <p className="text-xs text-gray-500">
                Mostrando{" "}
                <b className="text-gray-700">
                  {(pagina - 1) * paginacion.porPagina + 1}–{(pagina - 1) * paginacion.porPagina + accesos.length}
                </b>{" "}
                de <b className="text-gray-700">{paginacion.total}</b>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina <= 1 || cargando}
                  className="inline-flex items-center gap-1 text-xs font-bold border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <span className="text-xs font-bold text-gray-500 whitespace-nowrap">
                  {pagina} / {paginacion.paginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina((p) => Math.min(paginacion.paginas, p + 1))}
                  disabled={pagina >= paginacion.paginas || cargando}
                  className="inline-flex items-center gap-1 text-xs font-bold border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {(resumen?.cuentas_mas_tanteadas?.length ?? 0) > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Cuentas con más fallos
              </p>
              <div className="flex flex-wrap gap-2">
                {resumen!.cuentas_mas_tanteadas.map((c) => (
                  <span key={c.username}
                        className="text-xs font-mono bg-gray-100 text-gray-700 rounded-lg px-2.5 py-1">
                    {c.username} · {c.fallos}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
