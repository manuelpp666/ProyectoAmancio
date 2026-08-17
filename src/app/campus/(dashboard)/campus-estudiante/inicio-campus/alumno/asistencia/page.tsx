"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useUser } from "@/src/context/userContext";
import {
  CalendarCheck, Loader2, AlertCircle, CheckCircle2, Clock,
  XCircle, FileCheck, CalendarX
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";

type EstadoAsistencia = "P" | "T" | "F" | "J";

interface RegistroAsistencia {
  id_asistencia: number;
  fecha: string;
  estado: EstadoAsistencia;
  observacion: string;
}

interface ResumenAsistencia {
  P: number;
  T: number;
  F: number;
  J: number;
  total: number;
  porcentaje: number | null;
}

// Mismos colores que usan los correos de asistencia (management/service.py)
const ESTADOS = {
  P: { label: "Presente", color: "#059669", bg: "bg-emerald-50", texto: "text-emerald-700", borde: "border-emerald-200", icono: CheckCircle2 },
  T: { label: "Tardanza", color: "#d97706", bg: "bg-amber-50", texto: "text-amber-700", borde: "border-amber-200", icono: Clock },
  F: { label: "Falta", color: "#dc2626", bg: "bg-red-50", texto: "text-red-700", borde: "border-red-200", icono: XCircle },
  J: { label: "Justificado", color: "#475569", bg: "bg-slate-50", texto: "text-slate-700", borde: "border-slate-200", icono: FileCheck },
} as const;

const ORDEN_ESTADOS: EstadoAsistencia[] = ["P", "T", "F", "J"];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Las fechas llegan como "YYYY-MM-DD": se parsean a mano para que el navegador
// no las corra un día por zona horaria.
const parsearFecha = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, (m || 1) - 1, d || 1);
};

const formatearFecha = (iso: string) => {
  const f = parsearFecha(iso);
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return `${dias[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()].toLowerCase()}`;
};

export default function MiAsistenciaPage() {
  const {
    anioPlanificacion: anioSeleccionado,
    setAnioPlanificacion: setAnioSeleccionado,
    listaAnios: anios,
    loadingAnios,
  } = useAnioAcademico();

  const { id_usuario, loading: userLoading } = useUser();

  const [registros, setRegistros] = useState<RegistroAsistencia[]>([]);
  const [resumen, setResumen] = useState<ResumenAsistencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<EstadoAsistencia | "TODOS">("TODOS");
  // Mes del año académico que se está viendo ("TODOS" = el año completo)
  const [mes, setMes] = useState<string>("TODOS");

  const fetchAsistencia = useCallback(async (uid: number, anio: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/gestion/mi-asistencia/${uid}?anio=${anio}`);
      if (!res.ok) throw new Error("Error al cargar la asistencia");
      const data = await res.json();
      setRegistros(Array.isArray(data?.registros) ? data.registros : []);
      setResumen(data?.resumen ?? null);
    } catch (err) {
      toast.error("Error al obtener tu asistencia", {
        description: "Por favor, intenta recargar la página.",
        icon: <AlertCircle className="text-red-500" size={16} />,
      });
      console.error(err);
      setRegistros([]);
      setResumen(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && id_usuario && anioSeleccionado) {
      setFiltro("TODOS");
      setMes("TODOS");
      fetchAsistencia(id_usuario, anioSeleccionado);
    }
  }, [id_usuario, userLoading, anioSeleccionado, fetchAsistencia]);

  // Meses que se ofrecen en el selector: solo aquellos con registros, para no
  // listar los doce cuando el año académico va de marzo a diciembre.
  const mesesDisponibles = useMemo(() => {
    const vistos = new Set<number>();
    for (const r of registros) vistos.add(parsearFecha(r.fecha).getMonth());
    return [...vistos].sort((a, b) => a - b);
  }, [registros]);

  const registrosDelMes = useMemo(
    () => (mes === "TODOS"
      ? registros
      : registros.filter((r) => parsearFecha(r.fecha).getMonth() === Number(mes))),
    [registros, mes]
  );

  /**
   * Resumen de lo que se está viendo.
   *
   * Se recalcula en lugar de usar el del servidor porque ese viene siempre del
   * año completo: al elegir un mes, dejaría los contadores y el porcentaje
   * contando días que no aparecen en la lista. La fórmula es la misma que usa
   * el backend, incluido que las faltas justificadas no penalizan.
   */
  const resumenVisible = useMemo<ResumenAsistencia>(() => {
    const conteo: Record<EstadoAsistencia, number> = { P: 0, T: 0, F: 0, J: 0 };
    for (const r of registrosDelMes) {
      if (r.estado in conteo) conteo[r.estado] += 1;
    }
    const total = conteo.P + conteo.T + conteo.F + conteo.J;
    const computables = total - conteo.J;
    const porcentaje = computables > 0
      ? Math.round(((conteo.P + conteo.T) / computables) * 1000) / 10
      : null;
    return { ...conteo, total, porcentaje };
  }, [registrosDelMes]);

  const registrosFiltrados = useMemo(
    () => (filtro === "TODOS" ? registrosDelMes : registrosDelMes.filter((r) => r.estado === filtro)),
    [registrosDelMes, filtro]
  );

  // Agrupamos por mes para que el historial se lea como un calendario y no
  // como una lista plana de cientos de filas.
  const porMes = useMemo(() => {
    const grupos: { clave: string; titulo: string; items: RegistroAsistencia[] }[] = [];
    for (const r of registrosFiltrados) {
      const f = parsearFecha(r.fecha);
      const clave = `${f.getFullYear()}-${f.getMonth()}`;
      let grupo = grupos.find((g) => g.clave === clave);
      if (!grupo) {
        grupo = { clave, titulo: `${MESES[f.getMonth()]} ${f.getFullYear()}`, items: [] };
        grupos.push(grupo);
      }
      grupo.items.push(r);
    }
    return grupos;
  }, [registrosFiltrados]);

  if (userLoading) {
    return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#701C32]" /></div>;
  }

  // El porcentaje sigue al mes elegido, igual que los contadores
  const porcentaje = resumenVisible.porcentaje;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32] mb-2">Mi Asistencia</h1>
          <p className="text-gray-500 text-sm">Consulta tu historial de asistencia del año escolar</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <AnioSelector
            value={anioSeleccionado}
            onChange={setAnioSeleccionado}
            anios={anios}
            loading={loadingAnios}
          />

          {mesesDisponibles.length > 1 && (
            <div className="flex flex-col">
              <label htmlFor="filtro-mes" className="sr-only">Mes</label>
              <select
                id="filtro-mes"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg px-3 py-2 font-bold outline-none focus:border-[#701C32] focus:ring-2 focus:ring-[#701C32]/15 transition-colors cursor-pointer"
              >
                <option value="TODOS">Todo el año</option>
                {mesesDisponibles.map((m) => (
                  <option key={m} value={String(m)}>{MESES[m]}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
          <Loader2 size={32} className="animate-spin mx-auto text-[#701C32] mb-3" />
          <p className="text-gray-400 text-sm">Cargando tu historial...</p>
        </div>
      ) : !resumen || resumen.total === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center border-2 border-dashed border-gray-200">
          <div className="bg-[#FFF1E3] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-[#701C32]">
            <CalendarX size={36} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Sin registros de asistencia</h3>
          <p className="text-gray-500 text-sm">
            Todavía no hay asistencias registradas para el año escolar seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {/* RESUMEN GENERAL */}
          <div className="bg-[#701C32] rounded-3xl p-7 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">
                {mes === "TODOS" ? "Asistencia del año" : `Asistencia de ${MESES[Number(mes)]}`}
              </p>
              <h2 className="text-2xl font-black">{resumenVisible.total} días registrados</h2>
              <p className="text-white/60 text-xs mt-1">
                Las faltas justificadas no afectan tu porcentaje
              </p>
            </div>
            <div className="relative z-10 sm:text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Porcentaje</p>
              <span className="text-5xl font-black">
                {porcentaje !== null && porcentaje !== undefined ? `${porcentaje}%` : "--"}
              </span>
            </div>
          </div>

          {/* CONTADORES POR ESTADO (también sirven de filtro) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {ORDEN_ESTADOS.map((clave) => {
              const info = ESTADOS[clave];
              const Icono = info.icono;
              const activo = filtro === clave;
              return (
                <button
                  key={clave}
                  onClick={() => setFiltro(activo ? "TODOS" : clave)}
                  aria-pressed={activo}
                  className={`bg-white rounded-2xl border shadow-sm p-5 text-left transition-all hover:shadow-md ${
                    activo ? "border-[#701C32] ring-2 ring-[#701C32]/15" : "border-gray-100 hover:border-[#701C32]/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${info.bg}`} style={{ color: info.color }}>
                      <Icono size={20} />
                    </div>
                    <span className="text-3xl font-black text-gray-800">{resumenVisible[clave]}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {info.label}
                  </p>
                </button>
              );
            })}
          </div>

          {/* HISTORIAL */}
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <CalendarCheck size={18} className="text-[#701C32]" />
                <h3 className="text-lg font-bold text-gray-800">Historial detallado</h3>
              </div>
              {filtro !== "TODOS" && (
                <button
                  onClick={() => setFiltro("TODOS")}
                  className="text-xs font-bold text-[#093E7A] hover:underline"
                >
                  Ver todos los registros
                </button>
              )}
            </div>

            {porMes.length === 0 ? (
              <div className="text-center py-10 bg-gray-50/60 rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 text-xs font-medium">
                  No tienes registros con el estado &quot;{filtro !== "TODOS" ? ESTADOS[filtro].label : ""}&quot;.
                </p>
              </div>
            ) : (
              porMes.map((grupo) => (
                <div key={grupo.clave} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50/70 border-b border-gray-100">
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                      {grupo.titulo}
                    </h4>
                    <span className="bg-white text-gray-500 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200">
                      {grupo.items.length} {grupo.items.length === 1 ? "registro" : "registros"}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    {grupo.items.map((r) => {
                      const info = ESTADOS[r.estado] ?? ESTADOS.P;
                      const Icono = info.icono;
                      return (
                        <div
                          key={r.id_asistencia}
                          className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#701C32]/30 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`p-3 rounded-xl shrink-0 ${info.bg}`} style={{ color: info.color }}>
                              <Icono size={22} />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-gray-800 capitalize truncate">
                                {formatearFecha(r.fecha)}
                              </h5>
                              {r.observacion && (
                                <p className="text-xs text-gray-400 mt-1 truncate">{r.observacion}</p>
                              )}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${info.bg} ${info.texto} ${info.borde}`}
                          >
                            {info.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
