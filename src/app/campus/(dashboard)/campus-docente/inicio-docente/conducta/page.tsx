"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  Award,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCcw,
  Save,
  Loader2,
  FileWarning,
  UserCheck,
  Edit3,
  ShieldAlert,
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
  secciones: SeccionFiltro[];
  es_tutor?: boolean;
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

const POR_PAGINA = 50;

const colorNota = (n: number) => {
  if (n >= 18) return "text-emerald-700 font-bold";
  if (n >= 14) return "text-slate-800 font-semibold";
  if (n >= 11) return "text-amber-700 font-semibold";
  return "text-red-600 font-bold";
};

export default function GestionConductaDocentePage() {
  const [filtros, setFiltros] = useState<FiltrosConducta | null>(null);
  const [anio, setAnio] = useState<string>("");
  const [bimestre, setBimestre] = useState<number>(1);
  const [idSeccion, setIdSeccion] = useState<string>("");
  const [busqueda, setBusqueda] = useState<string>("");
  const [busquedaDebounced, setBusquedaDebounced] = useState<string>("");
  const [pagina, setPagina] = useState(1);

  const [datos, setDatos] = useState<RespuestaConducta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoFiltros, setCargandoFiltros] = useState(true);

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

  // 1. Cargar opciones de filtros y verificar si es tutor
  useEffect(() => {
    (async () => {
      setCargandoFiltros(true);
      try {
        const res = await apiFetch("/conducta/filtros");
        if (!res.ok) throw new Error();
        const f: FiltrosConducta = await res.json();
        setFiltros(f);
        setAnio(f.anio || "2026");
        setBimestre(f.bimestre_actual || 1);

        if (f.secciones && f.secciones.length > 0) {
          setIdSeccion(String(f.secciones[0].id_seccion));
        }
      } catch {
        toast.error("No se pudieron cargar los datos de tutoría");
      } finally {
        setCargandoFiltros(false);
      }
    })();
  }, []);

  // Debounce de búsqueda
  useEffect(() => {
    const t = setTimeout(() => {
      setBusquedaDebounced(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  // 2. Cargar listado de notas de la sección tutoreada
  const cargarNotas = useCallback(async () => {
    if (!anio || !filtros?.secciones?.length) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const p = new URLSearchParams({
        anio,
        bimestre: String(bimestre),
        pagina: String(pagina),
        por_pagina: String(POR_PAGINA),
      });
      if (idSeccion) p.append("id_seccion", idSeccion);
      if (busquedaDebounced) p.append("q", busquedaDebounced);

      const res = await apiFetch(`/conducta/notas?${p.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Error al cargar notas de conducta");
      }
      const data: RespuestaConducta = await res.json();
      setDatos(data);

      // Inicializar notas locales con los valores finales
      const mapaInicial: Record<number, string> = {};
      data.alumnos.forEach((a) => {
        mapaInicial[a.id_matricula] = a.nota_final.toFixed(1).replace(/\.0$/, "");
      });
      setNotasLocales(mapaInicial);
    } catch (e: any) {
      toast.error(e.message || "Error al cargar notas de conducta");
    } finally {
      setCargando(false);
    }
  }, [anio, bimestre, idSeccion, busquedaDebounced, pagina, filtros]);

  useEffect(() => {
    cargarNotas();
  }, [cargarNotas]);

  // Manejo de cambio en el input numérico
  const handleNotaChange = (idMatricula: number, valor: string) => {
    setNotasLocales((prev) => ({ ...prev, [idMatricula]: valor }));
  };

  // Guardar nota manual
  const ejecutarGuardadoNota = async (idMatricula: number, notaNum: number) => {
    setGuardandoId(idMatricula);
    try {
      const res = await apiFetch("/conducta/notas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_matricula: idMatricula,
          bimestre,
          nota: notaNum,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "No se pudo guardar la nota de conducta");
      }

      const respuesta = await res.json();
      toast.success(
        respuesta.coincide
          ? "Nota de conducta guardada correctamente"
          : "Nota de conducta ajustada manualmente"
      );
      cargarNotas();
    } catch (e: any) {
      toast.error(e.message || "Error al guardar nota");
    } finally {
      setGuardandoId(null);
      setModalConfirmacion({ abierto: false, alumno: null, nuevaNota: 20 });
    }
  };

  // Validar y confirmar antes de guardar
  const intentarGuardarNota = (alumno: AlumnoConducta) => {
    const raw = notasLocales[alumno.id_matricula];
    const notaNum = parseFloat(raw);

    if (isNaN(notaNum) || notaNum < 0 || notaNum > 20) {
      toast.error("Ingresa una nota válida entre 0 y 20");
      return;
    }

    // Si la nota que el tutor quiere poner difiere del cálculo de reportes
    if (Math.round(notaNum) !== alumno.nota_calculada) {
      setModalConfirmacion({
        abierto: true,
        alumno,
        nuevaNota: notaNum,
      });
      return;
    }

    // Si coincide con el cálculo, se guarda directamente
    ejecutarGuardadoNota(alumno.id_matricula, notaNum);
  };

  // Restablecer al cálculo automático
  const restablecerNota = async (alumno: AlumnoConducta) => {
    setGuardandoId(alumno.id_matricula);
    try {
      const res = await apiFetch(`/conducta/nota/${alumno.id_matricula}/${bimestre}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "No se pudo restablecer la nota");
      }
      toast.success("Nota restablecida al cálculo automático de deméritos");
      cargarNotas();
    } catch (e: any) {
      toast.error(e.message || "Error al restablecer la nota");
    } finally {
      setGuardandoId(null);
    }
  };

  // Estadísticas del aula tutoreada
  const estadisticas = useMemo(() => {
    if (!datos?.alumnos?.length) {
      return { total: 0, promedio: 0, conReportes: 0, modificadas: 0 };
    }
    const total = datos.alumnos.length;
    const suma = datos.alumnos.reduce((acc, a) => acc + a.nota_final, 0);
    const promedio = (suma / total).toFixed(1);
    const conReportes = datos.alumnos.filter((a) => a.total_reportes > 0).length;
    const modificadas = datos.alumnos.filter((a) => a.es_modificado).length;

    return { total, promedio, conReportes, modificadas };
  }, [datos]);

  if (cargandoFiltros) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#701C32]" />
          <p className="text-sm font-bold text-gray-500">Cargando datos de tutoría...</p>
        </div>
      </div>
    );
  }

  // Si el docente no es tutor de ninguna sección
  if (!filtros?.secciones || filtros.secciones.length === 0) {
    return (
      <div className="flex-1 bg-[#F8FAFC] p-6 md:p-10 min-h-screen">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
            <div className="w-12 h-12 rounded-2xl bg-[#701C32]/10 text-[#701C32] flex items-center justify-center">
              <Award size={26} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Notas de Conducta</h1>
              <p className="text-xs text-gray-500">Gestión y evaluación de conducta por tutoría de aula</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <h2 className="text-lg font-black text-gray-900">No tienes una sección asignada como Tutor</h2>
            <p className="text-sm text-gray-600 max-w-lg mx-auto leading-relaxed">
              La gestión de notas de conducta está reservada para los <b>Docentes Tutores</b> y auxiliares del colegio.
              Si eres tutor de un aula para este año lectivo, solicita a Dirección o Administración que registre tu asignación en el panel de control.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const seccionActualObj = filtros.secciones.find((s) => String(s.id_seccion) === idSeccion) || filtros.secciones[0];

  return (
    <div className="flex-1 bg-[#F8FAFC] p-4 md:p-8 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* CABECERA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#701C32]/10 text-[#701C32] flex items-center justify-center shrink-0">
              <Award size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-gray-900">Notas de Conducta</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#701C32] text-white">
                  TUTORÍA
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Aula asignada: <b className="text-gray-800">{seccionActualObj?.grado} - Sección {seccionActualObj?.seccion}</b> ({seccionActualObj?.nivel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => cargarNotas()}
              disabled={cargando}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
              title="Recargar datos"
            >
              <RefreshCw size={14} className={cargando ? "animate-spin" : ""} />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* TARJETAS RESUMEN DE LA SECCIÓN */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-gray-400">Total Alumnos</span>
              <UserCheck size={16} className="text-[#093E7A]" />
            </div>
            <p className="text-2xl font-black text-gray-900 mt-1">{estadisticas.total}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-gray-400">Promedio Aula</span>
              <Award size={16} className="text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700 mt-1">{estadisticas.promedio}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-gray-400">Con Reportes</span>
              <FileWarning size={16} className="text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-700 mt-1">{estadisticas.conReportes}</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-gray-400">Notas Ajustadas</span>
              <Edit3 size={16} className="text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700 mt-1">{estadisticas.modificadas}</p>
          </div>
        </div>

        {/* FILTROS Y CONTROLES */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* SELECTOR DE BIMESTRES */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl overflow-x-auto">
              {[1, 2, 3, 4].map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setBimestre(b);
                    setPagina(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    bimestre === b
                      ? "bg-[#701C32] text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {b}° Bimestre
                </button>
              ))}
            </div>

            {/* SI TIENE MÁS DE UNA SECCIÓN ASIGNADA */}
            {filtros.secciones.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Sección:</label>
                <select
                  value={idSeccion}
                  onChange={(e) => {
                    setIdSeccion(e.target.value);
                    setPagina(1);
                  }}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#701C32]"
                >
                  {filtros.secciones.map((s) => (
                    <option key={s.id_seccion} value={s.id_seccion}>
                      {s.grado} - {s.seccion}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* BUSCADOR */}
            <div className="relative w-full md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar alumno o DNI..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:bg-white focus:ring-2 focus:ring-[#701C32]"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* TABLA DE ALUMNOS */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcfafa] border-b border-gray-200 text-[#617489] text-[11px] font-black uppercase tracking-wider">
                  <th className="px-5 py-3.5">#</th>
                  <th className="px-5 py-3.5">Estudiante</th>
                  <th className="px-5 py-3.5">DNI</th>
                  <th className="px-5 py-3.5 text-center">Incidencias</th>
                  <th className="px-5 py-3.5 text-center">Puntos -</th>
                  <th className="px-5 py-3.5 text-center">Nota Calculada</th>
                  <th className="px-5 py-3.5 text-center">Nota Final (Tutor)</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {cargando ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#701C32] mb-2" />
                      Cargando lista de estudiantes de tu sección...
                    </td>
                  </tr>
                ) : !datos?.alumnos?.length ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400 text-xs">
                      No se encontraron alumnos para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  datos.alumnos.map((a, idx) => {
                    const localVal = notasLocales[a.id_matricula] ?? "";
                    const editadoLocal = localVal !== "" && parseFloat(localVal) !== a.nota_final;
                    const esGuardando = guardandoId === a.id_matricula;

                    return (
                      <tr key={a.id_matricula} className="hover:bg-[#fcfafa]/80 transition-colors">
                        <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">
                          {(pagina - 1) * POR_PAGINA + idx + 1}
                        </td>

                        <td className="px-5 py-3.5">
                          <p className="font-bold text-gray-900 leading-tight">{a.alumno}</p>
                          <span className="text-[11px] text-gray-400">
                            {a.grado} - Sección {a.seccion}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-xs font-mono text-gray-600">
                          {a.dni}
                        </td>

                        {/* Total reportes */}
                        <td className="px-5 py-3.5 text-center">
                          {a.total_reportes > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                              {a.total_reportes} {a.total_reportes === 1 ? "falta" : "faltas"}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">—</span>
                          )}
                        </td>

                        {/* Puntos descontados */}
                        <td className="px-5 py-3.5 text-center">
                          {a.puntos_descontados > 0 ? (
                            <span className="text-xs font-black text-red-600">
                              -{a.puntos_descontados} pts
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">0 pts</span>
                          )}
                        </td>

                        {/* Nota calculada automática */}
                        <td className="px-5 py-3.5 text-center">
                          <span className={`text-xs font-bold ${colorNota(a.nota_calculada)}`}>
                            {a.nota_calculada}
                          </span>
                        </td>

                        {/* Input Nota Final (Editable) */}
                        <td className="px-5 py-3.5 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={localVal}
                              onChange={(e) => handleNotaChange(a.id_matricula, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  intentarGuardarNota(a);
                                }
                              }}
                              disabled={esGuardando}
                              className={`w-16 text-center py-1 px-1.5 border rounded-lg text-sm font-black outline-none transition-all ${
                                editadoLocal
                                  ? "border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-300"
                                  : a.es_modificado
                                  ? "border-purple-300 bg-purple-50 text-purple-900"
                                  : "border-gray-200 bg-white text-gray-800 focus:border-[#701C32] focus:ring-1 focus:ring-[#701C32]"
                              }`}
                            />
                            {editadoLocal && (
                              <button
                                onClick={() => intentarGuardarNota(a)}
                                disabled={esGuardando}
                                className="p-1.5 bg-[#701C32] text-white rounded-lg hover:bg-[#581527] transition-all shadow-sm"
                                title="Guardar nota"
                              >
                                {esGuardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Estado / Origen */}
                        <td className="px-5 py-3.5 text-center">
                          {a.es_modificado ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-100 text-purple-700">
                              <Edit3 size={10} /> MANUAL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-600">
                              <CheckCircle2 size={10} /> AUTO
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Botón Guardar si no hay cambios pendientes pero quiere forzar */}
                            {!editadoLocal && (
                              <button
                                onClick={() => intentarGuardarNota(a)}
                                disabled={esGuardando}
                                className="p-1.5 text-gray-400 hover:text-[#701C32] hover:bg-gray-100 rounded-lg transition-all"
                                title="Guardar nota"
                              >
                                <Save size={15} />
                              </button>
                            )}

                            {/* Botón Restablecer si fue modificada */}
                            {a.es_modificado && (
                              <button
                                onClick={() => restablecerNota(a)}
                                disabled={esGuardando}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                title="Restablecer al cálculo automático"
                              >
                                <RotateCcw size={15} />
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
      </div>

      {/* --- MODAL DE CONFIRMACIÓN POR DISCREPANCIA --- */}
      {modalConfirmacion.abierto && modalConfirmacion.alumno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-gray-100">
            <div className="p-5 bg-amber-600 text-white flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="font-black text-lg">Confirmar Ajuste de Conducta</h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                Estás ingresando una nota que <b>difiere del cálculo reglamentario</b> para el estudiante{" "}
                <b className="text-gray-900">{modalConfirmacion.alumno.alumno}</b>.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-amber-900">
                <div className="flex justify-between items-center py-1 border-b border-amber-200/60">
                  <span>Reportes en el {bimestre}° Bimestre:</span>
                  <b className="text-amber-950">{modalConfirmacion.alumno.total_reportes} incidencia(s)</b>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-200/60">
                  <span>Puntos descontados por faltas:</span>
                  <b className="text-red-700">-{modalConfirmacion.alumno.puntos_descontados} pts</b>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-amber-200/60">
                  <span>Nota calculada por sistema:</span>
                  <b className="text-gray-900 text-sm">{modalConfirmacion.alumno.nota_calculada}</b>
                </div>
                <div className="flex justify-between items-center py-1 font-bold">
                  <span>Nueva nota manual a registrar:</span>
                  <b className="text-[#701C32] text-base">{modalConfirmacion.nuevaNota}</b>
                </div>
              </div>

              <p className="text-xs text-gray-500 italic">
                Al confirmar, esta calificación manual prevalecerá en la boleta y libreta de notas del estudiante.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalConfirmacion({ abierto: false, alumno: null, nuevaNota: 20 })}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() =>
                    ejecutarGuardadoNota(
                      modalConfirmacion.alumno!.id_matricula,
                      modalConfirmacion.nuevaNota
                    )
                  }
                  className="px-4 py-2 bg-[#701C32] hover:bg-[#581527] text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  Sí, confirmar nota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
