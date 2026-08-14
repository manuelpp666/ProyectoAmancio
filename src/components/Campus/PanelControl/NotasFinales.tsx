"use client";

/**
 * Notas finales de cada curso, por bimestre y por alumno.
 *
 * Solo lee. No hay ningún botón que escriba: esta pantalla no puede alterar
 * una nota ni por accidente.
 *
 * La tabla puede tener 26 columnas y cientos de filas, así que:
 *   - se pagina por alumno (el servidor manda 25 por vez)
 *   - las dos primeras columnas quedan fijas al desplazar en horizontal
 *   - las columnas las decide el servidor sobre TODO el conjunto filtrado,
 *     de modo que no bailan al cambiar de página
 *
 * Las columnas vienen agrupadas y ordenadas por área en el mismo orden que la
 * libreta impresa, y el promedio es el ponderado de áreas, no la media de las
 * notas sueltas: lo que se lee aquí tiene que ser exactamente lo que sale en
 * el PDF, porque el colegio compara las dos cosas.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { generarPDFLibreta, type DatosLibreta } from "@/src/lib/pdfLibreta";

interface Columna {
  id_curso: number; curso: string;
  id_area?: number | null;
  area: string | null;
}
interface FilaAlumno {
  id_matricula: number; dni: string; alumno: string;
  nivel: string; grado: string; seccion: string;
  notas: Record<string, number>;
  /** Ids de curso de los que el alumno está exonerado, como texto para poder
   *  cruzarlos con las claves de `notas`. Opcional: un backend anterior al
   *  cambio no lo manda y la tabla sigue funcionando. */
  exonerados?: string[];
  cursos_con_nota: number;
  /** Suma de los promedios de área: el "puntaje acumulado" de la libreta. */
  puntaje_acumulado?: number | null;
  /** Áreas que entran en el promedio (las que tienen al menos una nota). */
  num_areas?: number;
  promedio: number | null;
}
interface Respuesta {
  anio: string; es_verano: boolean; bimestre: number | null;
  columnas: Columna[]; alumnos: FilaAlumno[];
  total: number; pagina: number; por_pagina: number;
}
interface Seccion {
  id_seccion: number; seccion: string; id_grado: number;
  grado: string; orden: number; nivel: string;
}
interface Filtros {
  anios: { id: string; tipo: string; activo: boolean }[];
  anio: string | null;
  secciones: Seccion[];
  bimestres: number[];
}

const POR_PAGINA = 25;

// Escala del colegio. Se usa solo para el color: el número siempre se muestra.
const color = (n: number) =>
  n >= 18 ? "text-emerald-700 font-bold"
    : n >= 14 ? "text-slate-800"
      : n >= 11 ? "text-amber-700"
        : "text-red-600 font-bold";

export function NotasFinales() {
  const [filtros, setFiltros] = useState<Filtros | null>(null);
  const [anio, setAnio] = useState<string>("");
  const [bimestre, setBimestre] = useState<string>("");
  const [nivel, setNivel] = useState<string>("");
  const [idGrado, setIdGrado] = useState<string>("");
  const [idSeccion, setIdSeccion] = useState<string>("");
  const [dni, setDni] = useState<string>("");
  const [dniBuscado, setDniBuscado] = useState<string>("");
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [cargando, setCargando] = useState(false);
  // id_matricula de la libreta que se está descargando en este momento, para
  // deshabilitar solo ese botón y no toda la tabla.
  const [descargando, setDescargando] = useState<number | null>(null);

  // --- opciones de los desplegables ---
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/academic/notas-finales/filtros");
        if (!res.ok) throw new Error();
        const f: Filtros = await res.json();
        setFiltros(f);
        setAnio((a) => a || f.anio || "");
        // Si el año tiene bimestres, se abre por el primero; en verano no hay.
        setBimestre((b) => b || (f.bimestres.length ? String(f.bimestres[0]) : ""));
      } catch {
        toast.error("No se pudieron cargar los filtros");
      }
    })();
  }, []);

  // El buscador de DNI espera a que dejes de escribir, para no lanzar una
  // consulta por cada tecla.
  useEffect(() => {
    const t = setTimeout(() => { setDniBuscado(dni.trim()); setPagina(1); }, 400);
    return () => clearTimeout(t);
  }, [dni]);

  const cargar = useCallback(async () => {
    if (!anio) return;
    setCargando(true);
    try {
      const p = new URLSearchParams({ anio, pagina: String(pagina), por_pagina: String(POR_PAGINA) });
      if (bimestre) p.append("bimestre", bimestre);
      if (nivel) p.append("nivel", nivel);
      if (idGrado) p.append("id_grado", idGrado);
      if (idSeccion) p.append("id_seccion", idSeccion);
      if (dniBuscado) p.append("dni", dniBuscado);

      const res = await apiFetch(`/academic/notas-finales?${p.toString()}`);
      if (!res.ok) {
        const cuerpo = await res.json().catch(() => null);
        throw new Error(cuerpo?.detail || "No se pudieron cargar las notas");
      }
      setDatos(await res.json());
    } catch (e: any) {
      toast.error(e?.message || "No se pudieron cargar las notas");
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [anio, bimestre, nivel, idGrado, idSeccion, dniBuscado, pagina]);

  useEffect(() => { cargar(); }, [cargar]);

  // Descarga la libreta de UN alumno. Usa el bimestre que esté seleccionado
  // en el filtro (si hay uno): es el mismo criterio con el que se está
  // mirando la tabla en pantalla. Si algo falla —red caída, alumno sin
  // matrícula válida— se avisa con un toast y no se rompe la pantalla.
  const descargarLibreta = useCallback(async (idMatricula: number) => {
    setDescargando(idMatricula);
    try {
      const p = new URLSearchParams();
      if (bimestre) p.append("bimestre", bimestre);
      const qs = p.toString();
      const res = await apiFetch(`/academic/libreta/${idMatricula}${qs ? `?${qs}` : ""}`);
      if (!res.ok) {
        throw new Error(await mensajeDeError(res, "No se pudo generar la libreta"));
      }
      const datosLibreta: DatosLibreta = await res.json();
      await generarPDFLibreta(datosLibreta);
    } catch (e: any) {
      toast.error(e?.message || "No se pudo descargar la libreta");
    } finally {
      setDescargando(null);
    }
  }, [bimestre]);

  // Al cambiar cualquier filtro se vuelve a la primera página: si no, se
  // podría quedar en la página 7 de un resultado que ahora tiene 2.
  const cambiar = (fn: () => void) => { fn(); setPagina(1); };

  const esVerano = datos?.es_verano ?? false;
  const secciones = filtros?.secciones ?? [];

  const niveles = useMemo(
    () => Array.from(new Set(secciones.map((s) => s.nivel))), [secciones]);

  const grados = useMemo(() => {
    const vistos = new Map<number, { id: number; nombre: string; orden: number }>();
    secciones.filter((s) => !nivel || s.nivel === nivel)
      .forEach((s) => vistos.set(s.id_grado, { id: s.id_grado, nombre: s.grado, orden: s.orden }));
    return Array.from(vistos.values()).sort((a, b) => a.orden - b.orden);
  }, [secciones, nivel]);

  const seccionesVisibles = useMemo(
    () => secciones.filter((s) => (!nivel || s.nivel === nivel)
      && (!idGrado || String(s.id_grado) === idGrado)), [secciones, nivel, idGrado]);

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.por_pagina)) : 1;

  // Cabecera de áreas. El servidor ya manda las columnas en el orden de la
  // libreta, así que basta con agrupar las consecutivas que comparten área;
  // no hay que reordenar nada aquí (si se hiciera, la tabla y el PDF podrían
  // acabar discrepando).
  const gruposArea = useMemo(() => {
    const grupos: { area: string; cursos: Columna[] }[] = [];
    (datos?.columnas ?? []).forEach((c) => {
      const nombre = c.area ?? "Sin área";
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.area === nombre) ultimo.cursos.push(c);
      else grupos.push({ area: nombre, cursos: [c] });
    });
    return grupos;
  }, [datos]);

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* ------------------------------------------------------ filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Campo etiqueta="Año escolar">
            <select value={anio} className={ENTRADA}
                    onChange={(e) => cambiar(() => {
                      setAnio(e.target.value); setBimestre(""); setIdGrado(""); setIdSeccion("");
                    })}>
              {(filtros?.anios ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id}{a.tipo === "VERANO" ? " · verano" : ""}{a.activo ? " (activo)" : ""}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Bimestre">
            <select value={bimestre} className={ENTRADA} disabled={esVerano}
                    onChange={(e) => cambiar(() => setBimestre(e.target.value))}>
              <option value="">{esVerano ? "No aplica en verano" : "Todos"}</option>
              {(filtros?.bimestres ?? []).map((b) => (
                <option key={b} value={b}>{b}º bimestre</option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Nivel">
            <select value={nivel} className={ENTRADA}
                    onChange={(e) => cambiar(() => {
                      setNivel(e.target.value); setIdGrado(""); setIdSeccion("");
                    })}>
              <option value="">Todos</option>
              {niveles.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Campo>

          <Campo etiqueta="Grado">
            <select value={idGrado} className={ENTRADA}
                    onChange={(e) => cambiar(() => { setIdGrado(e.target.value); setIdSeccion(""); })}>
              <option value="">Todos</option>
              {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
            </select>
          </Campo>

          <Campo etiqueta="Sección">
            <select value={idSeccion} className={ENTRADA}
                    onChange={(e) => cambiar(() => setIdSeccion(e.target.value))}>
              <option value="">Todas</option>
              {seccionesVisibles.map((s) => (
                <option key={s.id_seccion} value={s.id_seccion}>
                  {s.seccion}{!idGrado ? ` · ${s.grado}` : ""}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="DNI del estudiante">
            <input value={dni} onChange={(e) => setDni(e.target.value)}
                   placeholder="Escribe el DNI" inputMode="numeric"
                   className={ENTRADA} />
          </Campo>
        </div>

        {(nivel || idGrado || idSeccion || dni) && (
          <button type="button"
                  onClick={() => cambiar(() => {
                    setNivel(""); setIdGrado(""); setIdSeccion(""); setDni("");
                  })}
                  className="mt-3 text-[11px] font-bold text-[#093E7A] hover:underline">
            Quitar filtros
          </button>
        )}
      </div>

      {/* ------------------------------------------------------- tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-black text-gray-700">
            {cargando ? "Cargando…"
              : datos ? `${datos.total} estudiante${datos.total !== 1 ? "s" : ""}`
                : "Sin datos"}
            {datos && !esVerano && bimestre && (
              <span className="font-normal text-gray-500"> · {bimestre}º bimestre</span>
            )}
            {datos && esVerano && (
              <span className="font-normal text-gray-500"> · verano (nota única)</span>
            )}
          </p>
          {datos && datos.total > 0 && (
            <div className="flex items-center gap-2 text-[11px]">
              <button type="button" disabled={pagina <= 1 || cargando}
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      className={BOTON_PAG}>Anterior</button>
              <span className="text-gray-500 font-bold">{pagina} / {totalPaginas}</span>
              <button type="button" disabled={pagina >= totalPaginas || cargando}
                      onClick={() => setPagina((p) => p + 1)}
                      className={BOTON_PAG}>Siguiente</button>
            </div>
          )}
        </div>

        {!cargando && datos && datos.alumnos.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-gray-400">
            Ningún estudiante coincide con esos filtros.
          </p>
        )}

        {datos && datos.alumnos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] border-collapse">
              <thead className="bg-gray-50">
                {/* Fila de áreas: agrupa las columnas igual que la libreta. */}
                <tr>
                  <th rowSpan={2}
                      className="sticky left-0 z-20 bg-gray-50 text-left px-3 py-2 font-bold
                                 border-r border-gray-200 min-w-[13rem]">Estudiante</th>
                  <th rowSpan={2}
                      className="sticky left-[13rem] z-20 bg-gray-50 text-left px-2 py-2
                                 font-bold border-r border-gray-200 whitespace-nowrap">Sección</th>
                  {gruposArea.map((g, i) => (
                    <th key={`${g.area}-${i}`} colSpan={g.cursos.length} title={g.area}
                        className="px-2 py-1.5 text-center font-black uppercase tracking-tight
                                   text-[9px] text-[#701C32] bg-[#701C32]/[0.06]
                                   border-l border-gray-200 whitespace-nowrap">
                      {g.area}
                    </th>
                  ))}
                  <th rowSpan={2}
                      className="px-3 py-2 font-black text-gray-700 text-center
                                 border-l border-gray-200 whitespace-nowrap">Prom.</th>
                  <th rowSpan={2}
                      className="px-3 py-2 font-black text-gray-700 text-center
                                 border-l border-gray-200 whitespace-nowrap">Libreta</th>
                </tr>
                <tr>
                  {gruposArea.map((g, gi) =>
                    g.cursos.map((c, ci) => (
                      <th key={c.id_curso} title={`${c.curso} · ${g.area}`}
                          className={`px-2 py-2 font-bold text-gray-600 whitespace-nowrap
                                      text-center min-w-[4.5rem]
                                      ${ci === 0 && gi > 0 ? "border-l border-gray-200" : ""}`}>
                        {c.curso}
                      </th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {datos.alumnos.map((a) => (
                  <tr key={a.id_matricula} className="hover:bg-slate-50">
                    <td className="sticky left-0 z-10 bg-white hover:bg-slate-50 px-3 py-1.5
                                   border-r border-gray-200">
                      <p className="font-bold text-gray-800 truncate max-w-[12rem]"
                         title={a.alumno}>{a.alumno}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{a.dni}</p>
                    </td>
                    <td className="sticky left-[13rem] z-10 bg-white hover:bg-slate-50 px-2 py-1.5
                                   border-r border-gray-200 text-gray-600 whitespace-nowrap">
                      {a.grado} · {a.seccion}
                      <span className="block text-[9px] text-gray-400">{a.nivel}</span>
                    </td>
                    {gruposArea.map((g, gi) => g.cursos.map((c, ci) => {
                      const clave = String(c.id_curso);
                      const v = a.notas[clave];
                      /* Una casilla vacía puede ser un exonerado o una nota que
                         nadie cargó todavía. Son cosas distintas y se pintan
                         distinto: EXO es definitivo, el guion está pendiente. */
                      const exonerado = a.exonerados?.includes(clave);
                      return (
                        <td key={c.id_curso}
                            className={`px-2 py-1.5 text-center
                                        ${ci === 0 && gi > 0 ? "border-l border-gray-200" : ""}`}>
                          {exonerado
                            ? <span className="text-[9px] font-bold text-indigo-500
                                               bg-indigo-50 px-1 py-0.5 rounded"
                                    title="Exonerado del curso: no cuenta en el promedio">
                                EXO
                              </span>
                            : v === undefined
                              /* Sin nota no es un cero: no entra en el promedio. */
                              ? <span className="text-gray-300" title="Sin nota registrada">—</span>
                              : <span className={color(v)}>{v}</span>}
                        </td>
                      );
                    }))}
                    <td className="px-3 py-1.5 text-center border-l border-gray-200">
                      {a.promedio === null
                        ? <span className="text-gray-300">—</span>
                        : <span className={`font-black ${color(a.promedio)}`}
                                title={a.puntaje_acumulado != null
                                  ? `${a.puntaje_acumulado} puntos entre ${a.num_areas} áreas`
                                  : undefined}>
                            {a.promedio.toFixed(2)}
                          </span>}
                      <span className="block text-[9px] text-gray-400 font-normal">
                        {a.num_areas != null
                          ? `${a.puntaje_acumulado} pts · ${a.num_areas} área${a.num_areas !== 1 ? "s" : ""}`
                          : `${a.cursos_con_nota} curso${a.cursos_con_nota !== 1 ? "s" : ""}`}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-center border-l border-gray-200">
                      <button type="button"
                              disabled={descargando === a.id_matricula}
                              onClick={() => descargarLibreta(a.id_matricula)}
                              title="Descargar la libreta de este alumno en PDF"
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg
                                         text-[#093E7A] hover:bg-[#093E7A]/10
                                         disabled:opacity-40 disabled:hover:bg-transparent">
                        {descargando === a.id_matricula
                          ? <Loader2 size={15} className="animate-spin" />
                          : <Download size={15} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-2 bg-gray-50 border-t text-[10px] text-gray-500 space-y-1">
          <p>
            <b className="text-indigo-500">EXO</b> = exonerado del curso: el docente lo
            marcó desde su sábana de notas y ese curso no cuenta en el promedio.
            El guion (—) es distinto: significa que la nota todavía no está cargada,
            no un cero.
          </p>
          <p>
            <b>Prom.</b> es el ponderado de la libreta, no la media de las notas: se
            promedia dentro de cada área, se redondea a entero y esos enteros se
            promedian entre sí. Por eso coincide con el PDF y no con el promedio
            simple de la fila.
          </p>
          {bimestre && (
            <p>
              La libreta que se descargue será <b>acumulativa hasta el {bimestre}º
              bimestre</b>: incluye también los anteriores, como la de papel.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const ENTRADA = "w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs " +
  "focus:outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] " +
  "disabled:bg-gray-100 disabled:text-gray-400";

const BOTON_PAG = "px-2 py-1 border border-gray-300 rounded-lg font-bold text-gray-600 " +
  "hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent";

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}
