"use client";

/**
 * Reporte resumen de asistencia: presentes, tardanzas, faltas y justificadas
 * de cada alumno, con su porcentaje.
 *
 * POR QUÉ ES UN COMPONENTE APARTE
 *   La misma tabla la miran el auxiliar (dentro de su pantalla de Asistencia)
 *   y el administrador (en Gestión de Estudiantes). Tenerla dos veces llevaría
 *   a que una se arregle y la otra no, y son el mismo dato.
 *
 * LA DIFERENCIA ENTRE LOS DOS
 *   El auxiliar trabaja sobre el año que tiene elegido en su pantalla, así que
 *   recibe `anioId` y aquí no se dibuja el selector. El administrador entra a
 *   consultar, muchas veces años anteriores, y por eso `mostrarSelectorAnio`
 *   le da el desplegable de años.
 *
 * SOLO LEE. No hay nada aquí que escriba en la base.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, FileText, Percent, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { Nivel, Grado, Seccion } from "@/src/interfaces/academic";

export interface AlumnoReporteAsistencia {
  id_matricula: number;
  id_alumno: number;
  alumno: string;
  dni: string;
  nivel: string;
  grado: string;
  id_grado: number;
  seccion: string;
  id_seccion: number;
  presentes: number;
  tardanzas: number;
  faltas: number;
  justificaciones: number;
  total_dias: number;
  porcentaje_asistencia: number;
}

interface BimestreInfo {
  numero: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
}

/** Reserva para el desplegable mientras el servidor no manda el calendario. */
const BIMESTRES_POR_DEFECTO: BimestreInfo[] = [1, 2, 3, 4].map((n) => ({
  numero: n,
  nombre: `${n}° Bimestre`,
  fecha_inicio: "",
  fecha_fin: "",
}));

interface Props {
  /** Año escolar sobre el que se consulta. Si no llega, se usa el activo. */
  anioId?: string;
  /** Añade el desplegable de años (el administrador consulta años pasados). */
  mostrarSelectorAnio?: boolean;
}

export function ReporteAsistencia({ anioId, mostrarSelectorAnio = false }: Props) {
  // El hook solo se usa cuando esta pantalla manda sobre el año; si el año
  // viene de fuera, su lista de años no se dibuja.
  const { anioPlanificacion, setAnioPlanificacion, listaAnios, loadingAnios } = useAnioAcademico();
  const anioEfectivo = anioId ?? anioPlanificacion;

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [cargandoNiveles, setCargandoNiveles] = useState(true);

  const [nivel, setNivel] = useState("");
  const [grado, setGrado] = useState("");
  const [seccion, setSeccion] = useState("");
  const [bimestre, setBimestre] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [bimestres, setBimestres] = useState<BimestreInfo[]>(BIMESTRES_POR_DEFECTO);
  const [alumnos, setAlumnos] = useState<AlumnoReporteAsistencia[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(false);

  // Cada petición lleva número: si el usuario cambia de filtro mientras una va
  // en camino, la que vuelva tarde no puede pisar a la más reciente.
  const peticion = useRef(0);

  // --- Niveles ---
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await apiFetch("/academic/niveles/");
        if (!vivo) return;
        if (res.ok) setNiveles(await res.json());
        else toast.error("No se pudieron cargar los niveles");
      } catch {
        if (vivo) toast.error("Error de conexión al cargar los niveles");
      } finally {
        if (vivo) setCargandoNiveles(false);
      }
    })();
    return () => { vivo = false; };
  }, []);

  // --- Grados del nivel elegido ---
  useEffect(() => {
    setGrado("");
    setSeccion("");
    if (!nivel) {
      setGrados([]);
      return;
    }
    let vivo = true;
    (async () => {
      try {
        const res = await apiFetch(`/academic/grados/?nivel_id=${nivel}`);
        if (!vivo) return;
        if (res.ok) setGrados(await res.json());
        else toast.error("No se pudieron cargar los grados");
      } catch {
        if (vivo) toast.error("Error de conexión al cargar los grados");
      }
    })();
    return () => { vivo = false; };
  }, [nivel]);

  // --- Secciones del grado elegido ---
  useEffect(() => {
    setSeccion("");
    if (!grado || !anioEfectivo) {
      setSecciones([]);
      return;
    }
    let vivo = true;
    (async () => {
      try {
        const res = await apiFetch(`/academic/secciones/?grado_id=${grado}&anio_id=${anioEfectivo}`);
        if (!vivo) return;
        if (res.ok) setSecciones(await res.json());
        else toast.error("No se pudieron cargar las secciones");
      } catch {
        if (vivo) toast.error("Error de conexión al cargar las secciones");
      }
    })();
    return () => { vivo = false; };
  }, [grado, anioEfectivo]);

  // --- El reporte ---
  const cargar = useCallback(async () => {
    const id = ++peticion.current;
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (anioEfectivo) params.set("anio_id", anioEfectivo);
      if (bimestre) params.set("bimestre", bimestre);
      if (nivel) params.set("nivel_id", nivel);
      if (grado) params.set("grado_id", grado);
      if (seccion) params.set("seccion_id", seccion);
      if (busqueda.trim()) params.set("q", busqueda.trim());

      const res = await apiFetch(`/gestion/asistencia/reporte-resumen?${params.toString()}`);
      if (id !== peticion.current) return;

      if (!res.ok) {
        const cuerpo = await res.json().catch(() => null);
        throw new Error(cuerpo?.detail || "No se pudo cargar el reporte de asistencia");
      }

      const data = await res.json();
      setAlumnos(Array.isArray(data?.alumnos) ? data.alumnos : []);
      setTotal(Number(data?.total) || 0);
      if (Array.isArray(data?.bimestres) && data.bimestres.length > 0) {
        setBimestres(data.bimestres);
      }
    } catch (e: unknown) {
      if (id !== peticion.current) return;
      setAlumnos([]);
      setTotal(0);
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el reporte de asistencia");
    } finally {
      if (id === peticion.current) setCargando(false);
    }
  }, [anioEfectivo, bimestre, nivel, grado, seccion, busqueda]);

  // La búsqueda espera a que se deje de escribir; el resto de filtros no.
  useEffect(() => {
    const t = setTimeout(cargar, busqueda ? 350 : 0);
    return () => clearTimeout(t);
  }, [cargar, busqueda]);

  const claseSelect =
    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <SlidersHorizontal size={13} aria-hidden="true" /> Filtros de búsqueda
          </h3>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {mostrarSelectorAnio && (
              <AnioSelector
                value={anioPlanificacion}
                onChange={setAnioPlanificacion}
                anios={listaAnios}
                loading={loadingAnios}
              />
            )}
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <label htmlFor="reporte-asistencia-busqueda" className="sr-only">
                Buscar estudiante
              </label>
              <input
                id="reporte-asistencia-busqueda"
                type="text"
                placeholder="Buscar por DNI o apellidos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="reporte-bimestre" className="text-xs font-bold text-gray-700">Bimestre</label>
            <select
              id="reporte-bimestre"
              value={bimestre}
              onChange={(e) => setBimestre(e.target.value)}
              className={`${claseSelect} font-semibold cursor-pointer`}
            >
              <option value="">Todos los bimestres</option>
              {bimestres.map((b) => (
                <option key={b.numero} value={b.numero}>{b.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reporte-nivel" className="text-xs font-bold text-gray-700">Nivel</label>
            <select
              id="reporte-nivel"
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              disabled={cargandoNiveles}
              className={claseSelect}
            >
              <option value="">Todos los niveles</option>
              {niveles.map((n) => (
                <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reporte-grado" className="text-xs font-bold text-gray-700">Grado</label>
            <select
              id="reporte-grado"
              value={grado}
              onChange={(e) => setGrado(e.target.value)}
              disabled={!nivel}
              className={claseSelect}
            >
              <option value="">Todos los grados</option>
              {grados.map((g) => (
                <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="reporte-seccion" className="text-xs font-bold text-gray-700">Sección</label>
            <select
              id="reporte-seccion"
              value={seccion}
              onChange={(e) => setSeccion(e.target.value)}
              disabled={!grado}
              className={claseSelect}
            >
              <option value="">Todas las secciones</option>
              {secciones.map((s) => (
                <option key={s.id_seccion} value={s.id_seccion}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden surface-in">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-blue-50/50">
          <div className="flex items-center gap-2 text-[#093E7A] font-black">
            <BarChart3 size={20} aria-hidden="true" />
            <span>
              Reporte general de asistencia
              {bimestre ? ` — ${bimestre}° Bimestre` : " — Acumulado anual"}
            </span>
          </div>
          <span className="text-xs font-bold text-gray-600 tabular-nums">
            {alumnos.length} de {total} estudiantes
          </span>
        </div>

        {cargando ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 flex items-center gap-4">
                <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 flex-1 max-w-[200px] bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        ) : alumnos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-3">
              <FileText size={24} aria-hidden="true" />
            </div>
            <h4 className="font-bold text-gray-800">No se encontraron estudiantes</h4>
            <p className="text-xs text-gray-500 mt-1">
              Pruebe ajustando los filtros de bimestre, nivel, grado o sección.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th scope="col" className="px-5 py-3.5 text-xs font-black text-gray-600 uppercase">N°</th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-black text-gray-600 uppercase">Estudiante</th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-black text-gray-600 uppercase">DNI</th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-black text-gray-600 uppercase">Grado / Sección</th>
                  <th scope="col" className="px-3 py-3.5 text-xs font-black text-emerald-700 uppercase text-center">Presentes (P)</th>
                  <th scope="col" className="px-3 py-3.5 text-xs font-black text-amber-700 uppercase text-center">Tardanzas (T)</th>
                  <th scope="col" className="px-3 py-3.5 text-xs font-black text-red-700 uppercase text-center">Faltas (F)</th>
                  <th scope="col" className="px-3 py-3.5 text-xs font-black text-slate-700 uppercase text-center">Justificadas (J)</th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-black text-[#093E7A] uppercase text-center">% Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alumnos.map((a, idx) => {
                  const porc = a.porcentaje_asistencia;
                  const badge =
                    porc >= 90
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : porc >= 75
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200";

                  return (
                    <tr key={a.id_matricula} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-3.5 text-xs font-bold text-gray-500 tabular-nums">{idx + 1}</td>
                      <td className="px-5 py-3.5 font-bold text-gray-800 text-sm">{a.alumno}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 font-medium tabular-nums">{a.dni}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-600">
                        <span className="font-semibold text-gray-700">{a.grado}</span> &quot;{a.seccion}&quot;
                        <span className="text-[10px] text-gray-400 block">{a.nivel}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs tabular-nums">
                          {a.presentes}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-black text-xs tabular-nums">
                          {a.tardanzas}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-black text-xs tabular-nums">
                          {a.faltas}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-black text-xs tabular-nums">
                          {a.justificaciones}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-black tabular-nums ${badge}`}>
                          <Percent size={12} aria-hidden="true" />
                          {a.porcentaje_asistencia}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
