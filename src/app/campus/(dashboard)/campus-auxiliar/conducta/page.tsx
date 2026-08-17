"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Award,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  X,
  RotateCcw,
  Save,
  Loader2,
  FileWarning,
  UserCheck,
  Edit3,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";

interface SeccionFiltro {
  id_seccion: number;
  seccion: string;
  id_grado: number;
  grado: string;
  orden: number;
  nivel: string;
}

interface FiltrosConducta {
  anios: { id: string; tipo: string; activo: boolean }[];
  anio: string;
  bimestres: number[];
  bimestre_actual: number;
  // El año de verano es un periodo continuo, sin bimestres.
  es_verano?: boolean;
  secciones: SeccionFiltro[];
}

interface AlumnoConducta {
  id_matricula: number;
  id_alumno: number;
  dni: string;
  alumno: string;
  nivel: string;
  grado: string;
  id_grado: number;
  seccion: string;
  id_seccion: number;
  total_reportes: number;
  puntos_descontados: number;
  nota_calculada: number;
  nota_manual: number | null;
  nota_final: number;
  origen: string;
  es_modificado: boolean;
  cuadra_con_calculo: boolean;
}

interface RespuestaConducta {
  anio: string;
  bimestre: number;
  total: number;
  pagina: number;
  por_pagina: number;
  alumnos: AlumnoConducta[];
}

const POR_PAGINA = 25;

const colorNota = (n: number) => {
  if (n >= 18) return "text-emerald-700 font-bold";
  if (n >= 14) return "text-slate-800 font-semibold";
  if (n >= 11) return "text-amber-700 font-semibold";
  return "text-red-600 font-bold";
};

export default function GestionConductaAuxiliarPage() {
  const [filtros, setFiltros] = useState<FiltrosConducta | null>(null);
  const [anio, setAnio] = useState<string>("");
  const [bimestre, setBimestre] = useState<number>(1);
  const [nivel, setNivel] = useState<string>("");
  const [idGrado, setIdGrado] = useState<string>("");
  const [idSeccion, setIdSeccion] = useState<string>("");
  const [busqueda, setBusqueda] = useState<string>("");
  const [busquedaDebounced, setBusquedaDebounced] = useState<string>("");
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] = useState<RespuestaConducta | null>(null);
  const [cargando, setCargando] = useState(true);

  // Estados de edición local en la tabla
  const [notasLocales, setNotasLocales] = useState<Record<number, string>>({});
  const [guardandoId, setGuardandoId] = useState<number | null>(null);

  // Modal de confirmación cuando no coincide la nota
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    abierto: boolean;
    alumno: AlumnoConducta | null;
    nuevaNota: number;
  }>({
    abierto: false,
    alumno: null,
    nuevaNota: 20,
  });

  // 1. Cargar opciones de filtros.
  //
  // Depende del año porque los periodos cambian con él: un año de verano no
  // tiene bimestres sino un único periodo. Cargándolos solo al montar, al
  // cambiar de año se seguían ofreciendo los cuatro bimestres del año regular.
  // La primera vuelta va sin año (el backend elige el activo) y la segunda ya
  // con el que devolvió.
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(`/conducta/filtros${anio ? `?anio=${anio}` : ""}`);
        if (!res.ok) throw new Error();
        const f: FiltrosConducta = await res.json();
        setFiltros(f);
        if (!anio) setAnio(f.anio || "2026");
        // Si el periodo elegido no existe en este año (pasar de un año regular
        // a uno de verano), se cae al que el backend marca como actual.
        setBimestre((prev) =>
          f.bimestres?.includes(prev) ? prev : (f.bimestre_actual || 1)
        );
      } catch {
        toast.error("No se pudieron cargar los filtros de conducta");
      }
    })();
  }, [anio]);

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // 2. Cargar listado de notas
  const cargarNotas = useCallback(async () => {
    if (!anio) return;
    setCargando(true);
    try {
      const p = new URLSearchParams({
        anio,
        bimestre: String(bimestre),
        pagina: String(pagina),
        por_pagina: String(POR_PAGINA),
      });
      if (nivel) p.append("nivel", nivel);
      if (idGrado) p.append("id_grado", idGrado);
      if (idSeccion) p.append("id_seccion", idSeccion);
      if (busquedaDebounced) p.append("q", busquedaDebounced);

      const res = await apiFetch(`/conducta/notas?${p.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Error al cargar las notas de conducta");
      }
      const data: RespuestaConducta = await res.json();
      setDatos(data);

      // Inicializar notas locales para edición rápida
      const iniciales: Record<number, string> = {};
      data.alumnos.forEach((a) => {
        iniciales[a.id_matricula] = String(a.nota_final);
      });
      setNotasLocales(iniciales);
    } catch (e: any) {
      toast.error(e?.message || "No se pudieron obtener las notas de conducta");
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, [anio, bimestre, nivel, idGrado, idSeccion, busquedaDebounced, pagina]);

  useEffect(() => {
    cargarNotas();
  }, [cargarNotas]);

  // Secciones dependientes del nivel y grado
  const secciones = filtros?.secciones ?? [];
  const niveles = useMemo(
    () => Array.from(new Set(secciones.map((s) => s.nivel))),
    [secciones]
  );

  const grados = useMemo(() => {
    const vistos = new Map<number, { id: number; nombre: string; orden: number }>();
    secciones
      .filter((s) => !nivel || s.nivel === nivel)
      .forEach((s) =>
        vistos.set(s.id_grado, { id: s.id_grado, nombre: s.grado, orden: s.orden })
      );
    return Array.from(vistos.values()).sort((a, b) => a.orden - b.orden);
  }, [secciones, nivel]);

  const seccionesVisibles = useMemo(
    () =>
      secciones.filter(
        (s) =>
          (!nivel || s.nivel === nivel) &&
          (!idGrado || String(s.id_grado) === idGrado)
      ),
    [secciones, nivel, idGrado]
  );

  const cambiarFiltro = (fn: () => void) => {
    fn();
    setPagina(1);
  };

  const totalPaginas = datos
    ? Math.max(1, Math.ceil(datos.total / datos.por_pagina))
    : 1;

  // 3. Manejo de edición y guardado de nota
  const manejarGuardarNota = async (
    alumno: AlumnoConducta,
    notaValor: number,
    forzar: boolean = false
  ) => {
    if (isNaN(notaValor) || notaValor < 0 || notaValor > 20) {
      toast.error("La nota de conducta debe estar entre 0 y 20");
      return;
    }

    // Validación de discrepancia con los reportes
    if (!forzar && Math.round(notaValor) !== alumno.nota_calculada) {
      setModalConfirmacion({
        abierto: true,
        alumno,
        nuevaNota: notaValor,
      });
      return;
    }

    setGuardandoId(alumno.id_matricula);
    try {
      const res = await apiFetch("/conducta/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_matricula: alumno.id_matricula,
          bimestre,
          nota: notaValor,
          forzar: true,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "No se pudo guardar la nota de conducta");
      }

      toast.success(`Nota de conducta actualizada para ${alumno.alumno}`);
      setModalConfirmacion({ abierto: false, alumno: null, nuevaNota: 20 });
      cargarNotas();
    } catch (e: any) {
      toast.error(e?.message || "Error al guardar la nota");
    } finally {
      setGuardandoId(null);
    }
  };

  // 4. Restablecer al cálculo automático
  const manejarRestablecer = async (alumno: AlumnoConducta) => {
    if (!confirm(`¿Restablecer la nota de ${alumno.alumno} al cálculo automático según sus reportes?`)) {
      return;
    }

    setGuardandoId(alumno.id_matricula);
    try {
      const res = await apiFetch(
        `/conducta/nota/${alumno.id_matricula}/${bimestre}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        throw new Error("No se pudo restablecer la nota de conducta");
      }
      toast.success("Nota restablecida al cálculo automático");
      cargarNotas();
    } catch (e: any) {
      toast.error(e?.message || "Error al restablecer nota");
    } finally {
      setGuardandoId(null);
    }
  };

  // Estadísticas rápidas de la página actual
  const stats = useMemo(() => {
    if (!datos || !datos.alumnos.length) {
      return { total: 0, modificadas: 0, conReportes: 0 };
    }
    const modificadas = datos.alumnos.filter((a) => a.es_modificado).length;
    const conReportes = datos.alumnos.filter((a) => a.total_reportes > 0).length;
    return {
      total: datos.total,
      modificadas,
      conReportes,
    };
  }, [datos]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#701C32]/10 text-[#701C32] rounded-xl">
            <Award size={28} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Notas de Conducta
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Supervisa y ajusta las calificaciones de conducta por bimestre y sección
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => cargarNotas()}
            disabled={cargando}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors disabled:opacity-50"
            title="Recargar datos"
          >
            <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
          <Filter size={15} className="text-[#701C32]" />
          Filtros de Búsqueda
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Año Escolar */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Año Escolar
            </label>
            <select
              value={anio}
              onChange={(e) =>
                cambiarFiltro(() => {
                  setAnio(e.target.value);
                  setIdGrado("");
                  setIdSeccion("");
                })
              }
              className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701C32]/30"
            >
              {(filtros?.anios ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} {a.activo ? "(Activo)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Periodo. Los valores los manda el backend: en un año de verano hay
              uno solo, porque las clases son continuas y no hay bimestres. */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              {filtros?.es_verano ? "Periodo" : "Bimestre"}
            </label>
            <select
              value={bimestre}
              onChange={(e) =>
                cambiarFiltro(() => setBimestre(Number(e.target.value)))
              }
              disabled={!!filtros?.es_verano}
              className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg font-bold text-[#701C32] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701C32]/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {(filtros?.bimestres?.length ? filtros.bimestres : [1, 2, 3, 4]).map((b) => (
                <option key={b} value={b}>
                  {filtros?.es_verano ? "Verano" : `${b}º Bimestre`}
                </option>
              ))}
            </select>
          </div>

          {/* Nivel */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Nivel
            </label>
            <select
              value={nivel}
              onChange={(e) =>
                cambiarFiltro(() => {
                  setNivel(e.target.value);
                  setIdGrado("");
                  setIdSeccion("");
                })
              }
              className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701C32]/30"
            >
              <option value="">Todos los niveles</option>
              {niveles.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Grado */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Grado
            </label>
            <select
              value={idGrado}
              onChange={(e) =>
                cambiarFiltro(() => {
                  setIdGrado(e.target.value);
                  setIdSeccion("");
                })
              }
              className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701C32]/30"
            >
              <option value="">Todos los grados</option>
              {grados.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sección */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Sección
            </label>
            <select
              value={idSeccion}
              onChange={(e) =>
                cambiarFiltro(() => setIdSeccion(e.target.value))
              }
              className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701C32]/30"
            >
              <option value="">Todas las secciones</option>
              {seccionesVisibles.map((s) => (
                <option key={s.id_seccion} value={s.id_seccion}>
                  {s.seccion} {!idGrado ? `· ${s.grado}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Buscador de Alumno / DNI */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Estudiante / DNI
            </label>
            <div className="relative">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre o DNI..."
                className="w-full h-9 pl-8 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-lg font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#701C32]/30"
              />
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>

        {(nivel || idGrado || idSeccion || busqueda) && (
          <button
            type="button"
            onClick={() =>
              cambiarFiltro(() => {
                setNivel("");
                setIdGrado("");
                setIdSeccion("");
                setBusqueda("");
              })
            }
            className="text-[11px] font-bold text-[#701C32] hover:underline inline-flex items-center gap-1"
          >
            <X size={12} /> Quitar todos los filtros
          </button>
        )}
      </div>

      {/* METRICAS DE RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg">
            <UserCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase">
              Total Estudiantes
            </p>
            <p className="text-lg font-black text-gray-800">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
            <FileWarning size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase">
              Con Reportes en Bimestre
            </p>
            <p className="text-lg font-black text-amber-700">
              {stats.conReportes}
            </p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <Edit3 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase">
              Notas Modificadas Manualmente
            </p>
            <p className="text-lg font-black text-indigo-700">
              {stats.modificadas}
            </p>
          </div>
        </div>
      </div>

      {/* TABLA PRINCIPAL DE NOTAS DE CONDUCTA */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
          <div>
            <p className="text-xs font-bold text-gray-700">
              {cargando ? (
                "Cargando estudiantes..."
              ) : datos ? (
                <>
                  Mostrando {datos.alumnos.length} de {datos.total} estudiantes ·{" "}
                  <span className="text-[#701C32]">{filtros?.es_verano ? "Periodo de verano" : `${bimestre}º Bimestre`}</span>
                </>
              ) : (
                "Sin datos"
              )}
            </p>
          </div>

          {datos && datos.total > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                disabled={pagina <= 1 || cargando}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="font-bold text-gray-600 px-1">
                {pagina} / {totalPaginas}
              </span>
              <button
                type="button"
                disabled={pagina >= totalPaginas || cargando}
                onClick={() => setPagina((p) => p + 1)}
                className="px-2.5 py-1 font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* TABLA */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 uppercase font-black tracking-tight text-[10px]">
                <th className="py-3 px-4 min-w-[14rem]">Estudiante</th>
                <th className="py-3 px-3 min-w-[10rem]">Sección</th>
                <th className="py-3 px-3 text-center min-w-[6rem]">
                  Incidencias
                </th>
                <th className="py-3 px-3 text-center min-w-[6rem]">
                  Puntos Restados
                </th>
                <th className="py-3 px-3 text-center min-w-[7rem]">
                  Nota Calculada
                </th>
                <th className="py-3 px-4 text-center min-w-[8.5rem]">
                  Nota Final
                </th>
                <th className="py-3 px-3 text-center min-w-[7.5rem]">Origen</th>
                <th className="py-3 px-3 text-center min-w-[7rem]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Loader2 className="animate-spin inline-block mr-2" size={18} />
                    Cargando notas de conducta...
                  </td>
                </tr>
              ) : datos && datos.alumnos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    No se encontraron estudiantes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                (datos?.alumnos ?? []).map((a) => {
                  const valorInput = notasLocales[a.id_matricula] ?? String(a.nota_final);
                  const valorNum = parseFloat(valorInput);
                  const haCambiado = !isNaN(valorNum) && valorNum !== a.nota_final;
                  const guardandoEste = guardandoId === a.id_matricula;

                  return (
                    <tr
                      key={a.id_matricula}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Estudiante */}
                      <td className="py-3 px-4">
                        <p className="font-bold text-gray-900 leading-tight">
                          {a.alumno}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          DNI: {a.dni}
                        </p>
                      </td>

                      {/* Sección */}
                      <td className="py-3 px-3 text-gray-700">
                        <p className="font-semibold">
                          {a.grado} · {a.seccion}
                        </p>
                        <span className="text-[10px] text-gray-400 block">
                          {a.nivel}
                        </span>
                      </td>

                      {/* Incidencias */}
                      <td className="py-3 px-3 text-center">
                        {a.total_reportes > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            {a.total_reportes} reporte{a.total_reportes !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium">0</span>
                        )}
                      </td>

                      {/* Puntos Restados */}
                      <td className="py-3 px-3 text-center font-bold">
                        {a.puntos_descontados > 0 ? (
                          <span className="text-red-600">
                            -{a.puntos_descontados} pts
                          </span>
                        ) : (
                          <span className="text-gray-400">0 pts</span>
                        )}
                      </td>

                      {/* Nota Calculada */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-black ${colorNota(a.nota_calculada)}`}
                          title={`Base 20 - ${a.puntos_descontados} puntos de reportes`}
                        >
                          {a.nota_calculada}
                        </span>
                      </td>

                      {/* Nota Final (Editable Input) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={valorInput}
                            onChange={(e) =>
                              setNotasLocales((prev) => ({
                                ...prev,
                                [a.id_matricula]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && haCambiado) {
                                manejarGuardarNota(a, valorNum);
                              }
                            }}
                            className={`w-16 h-8 text-center text-xs font-black rounded-lg border focus:outline-none focus:ring-2 ${
                              haCambiado
                                ? "border-indigo-500 bg-indigo-50/40 text-indigo-900 focus:ring-indigo-300"
                                : a.es_modificado
                                ? "border-amber-300 bg-amber-50/30 text-amber-900 focus:ring-amber-200"
                                : "border-gray-200 bg-white text-gray-800 focus:ring-[#701C32]/30"
                            }`}
                          />
                          {haCambiado && (
                            <button
                              type="button"
                              onClick={() => manejarGuardarNota(a, valorNum)}
                              disabled={guardandoEste}
                              title="Guardar nota ingresada"
                              className="p-1.5 bg-[#701C32] text-white rounded-lg hover:bg-[#591628] transition-colors disabled:opacity-50"
                            >
                              {guardandoEste ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Save size={13} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Origen */}
                      <td className="py-3 px-3 text-center">
                        {a.es_modificado ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800"
                            title="Nota asignada o modificada manualmente"
                          >
                            Manual
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
                            title="Calculada automáticamente a partir de reportes"
                          >
                            Automática
                          </span>
                        )}
                        {!a.cuadra_con_calculo && (
                          <span
                            className="block text-[9px] font-bold text-amber-600 mt-0.5"
                            title={`Difiere de la nota calculada (${a.nota_calculada})`}
                          >
                            (Ajustada)
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {a.es_modificado && (
                            <button
                              type="button"
                              onClick={() => manejarRestablecer(a)}
                              disabled={guardandoEste}
                              title="Restablecer al cálculo automático"
                              className="p-1.5 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMACIÓN POR DISCREPANCIA                   */}
      {/* ========================================================= */}
      {modalConfirmacion.abierto && modalConfirmacion.alumno && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in duration-150">
            {/* Header del Modal */}
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                <AlertTriangle size={26} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  Confirmar Modificación Manual
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  La nota no coincide con los reportes de conducta
                </p>
              </div>
            </div>

            {/* Detalles del Alumno y Discrepancia */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between border-b border-amber-200/50 pb-1.5">
                <span className="font-bold text-gray-600">Estudiante:</span>
                <span className="font-bold text-gray-900">
                  {modalConfirmacion.alumno.alumno}
                </span>
              </div>
              <div className="flex justify-between border-b border-amber-200/50 pb-1.5">
                <span className="font-bold text-gray-600">Periodo:</span>
                <span className="text-gray-800">
                  {filtros?.es_verano ? "Verano" : `${bimestre}º Bimestre`} · {anio}
                </span>
              </div>
              <div className="flex justify-between border-b border-amber-200/50 pb-1.5">
                <span className="font-bold text-gray-600">Reportes en Bimestre:</span>
                <span className="font-bold text-amber-800">
                  {modalConfirmacion.alumno.total_reportes} reportes (
                  -{modalConfirmacion.alumno.puntos_descontados} pts)
                </span>
              </div>
              <div className="flex justify-between border-b border-amber-200/50 pb-1.5">
                <span className="font-bold text-gray-600">Nota Calculada:</span>
                <span className="font-black text-gray-800">
                  {modalConfirmacion.alumno.nota_calculada}
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="font-bold text-[#701C32]">Nueva Nota Manual:</span>
                <span className="font-black text-base text-[#701C32]">
                  {modalConfirmacion.nuevaNota}
                </span>
              </div>
            </div>

            {/* Mensaje de Explicación */}
            <p className="text-xs text-gray-600 leading-relaxed">
              La nota que deseas asignar (
              <span className="font-bold text-[#701C32]">
                {modalConfirmacion.nuevaNota}
              </span>
              ) no coincide con los puntos descontados por sus reportes de conducta (
              <span className="font-bold text-amber-700">
                {modalConfirmacion.alumno.puntos_descontados} pts restados
              </span>
              ).
              <br />
              ¿Deseas confirmar y sobrescribir la nota de conducta manualmente de todos modos?
            </p>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  setModalConfirmacion({
                    abierto: false,
                    alumno: null,
                    nuevaNota: 20,
                  })
                }
                className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() =>
                  modalConfirmacion.alumno &&
                  manejarGuardarNota(
                    modalConfirmacion.alumno,
                    modalConfirmacion.nuevaNota,
                    true
                  )
                }
                className="px-4 py-2 text-xs font-bold text-white bg-[#701C32] hover:bg-[#591628] rounded-xl shadow-sm transition-colors"
              >
                Sí, guardar nota manual
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
