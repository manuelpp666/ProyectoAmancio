"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  History,
  ShieldAlert,
  User,
  Calendar,
  MessageSquare,
  ClipboardList,
  Loader2,
  ArrowDownUp,
  Filter,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { aFechaLocalISO } from "@/src/lib/fechas";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  idAlumno?: number;
  nombreAlumno?: string;
}

export function ModalDetalleSeguimiento({ isOpen, onClose, idAlumno, nombreAlumno }: Props) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Filtros de orden y fecha
  const [orden, setOrden] = useState<"reciente" | "antiguo">("reciente");
  const [filtroFecha, setFiltroFecha] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (!idAlumno) {
      setData(null);
      setLoading(false);
      return;
    }

    const fetchDetalle = async () => {
      setLoading(true);
      setData(null);
      try {
        const res = await apiFetch(`/conducta/seguimiento/${idAlumno}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Error al cargar seguimiento", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalle();
  }, [isOpen, idAlumno]);

  // Filtrado y ordenamiento de Reportes de Conducta
  const reportesFiltrados = useMemo(() => {
    if (!data?.historial_conducta) return [];
    let items = [...data.historial_conducta];

    if (filtroFecha) {
      items = items.filter((h: any) => {
        const f = aFechaLocalISO(h.fecha_reporte);
        return f === filtroFecha;
      });
    }

    items.sort((a: any, b: any) => {
      const timeA = new Date(a.fecha_reporte).getTime();
      const timeB = new Date(b.fecha_reporte).getTime();
      return orden === "reciente" ? timeB - timeA : timeA - timeB;
    });

    return items;
  }, [data, orden, filtroFecha]);

  // Filtrado y ordenamiento de Sesiones Psicológicas
  const citasFiltradas = useMemo(() => {
    if (!data?.historial_psicologico) return [];
    let items = [...data.historial_psicologico];

    if (filtroFecha) {
      items = items.filter((c: any) => {
        const f = aFechaLocalISO(c.fecha_cita);
        return f === filtroFecha;
      });
    }

    items.sort((a: any, b: any) => {
      const timeA = new Date(a.fecha_cita).getTime();
      const timeB = new Date(b.fecha_cita).getTime();
      return orden === "reciente" ? timeB - timeA : timeA - timeB;
    });

    return items;
  }, [data, orden, filtroFecha]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col scale-in">
        {/* HEADER */}
        <div className="bg-[#093E7A] p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black leading-tight">{nombreAlumno || "Expediente del Estudiante"}</h2>
              <p className="text-white/70 text-xs mt-0.5">Expediente integral de conducta y sesiones psicológicas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* BARRA DE FILTROS DEL EXPEDIENTE */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <ArrowDownUp size={15} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-700">Ordenar por:</span>
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value as "reciente" | "antiguo")}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#093E7A] transition-colors cursor-pointer"
            >
              <option value="reciente">Más reciente primero (Predeterminado)</option>
              <option value="antiguo">Más antiguo primero</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-500" />
            <span className="text-xs font-bold text-gray-700">Filtrar fecha:</span>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#093E7A] transition-colors cursor-pointer"
            />
            {filtroFecha && (
              <button
                onClick={() => setFiltroFecha("")}
                className="text-xs font-bold text-[#701C32] hover:underline px-2 py-1"
                title="Limpiar fecha"
              >
                <RotateCcw size={13} className="inline mr-1" />
                Todas
              </button>
            )}
          </div>
        </div>

        {/* CONTENIDO EXPEDIENTE */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 min-h-0 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#093E7A]" size={40} />
              <p className="text-gray-400 font-medium text-sm">Cargando expediente completo...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* COLUMNA 1: REPORTES DE CONDUCTA */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <h3 className="flex items-center gap-2 font-black text-[#701C32] text-sm">
                    <ShieldAlert size={18} /> Reportes de Conducta ({reportesFiltrados.length})
                  </h3>
                  {data?.total_incidentes > 0 && (
                    <span className="text-xs font-bold text-gray-400 tabular-nums">
                      {data.total_incidentes} en total
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {reportesFiltrados.length > 0 ? (
                    reportesFiltrados.map((h: any) => {
                      const fechaObj = new Date(h.fecha_reporte);
                      const fechaStr = fechaObj.toLocaleDateString();
                      const horaStr = fechaObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                      return (
                        <div key={h.id_reporte} className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-gray-500 tabular-nums">
                              {fechaStr} · {horaStr}
                            </span>
                            {typeof h.puntos === "number" && (
                              <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-black shrink-0 border border-red-100">
                                −{h.puntos} pts
                              </span>
                            )}
                          </div>

                          {(h.nivel_nombre || h.tipo_falta) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {h.nivel_nombre && (
                                <span className="text-xs font-bold text-[#701C32]">{h.nivel_nombre}</span>
                              )}
                              {h.tipo_falta && (
                                <span className="text-[10px] uppercase tracking-wide bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-bold">
                                  {h.tipo_falta}
                                </span>
                              )}
                              {h.cambio_ie && (
                                <span className="text-[10px] uppercase tracking-wide bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-black">
                                  ⚠️ Cambio de I.E.
                                </span>
                              )}
                            </div>
                          )}

                          <p className="text-xs text-gray-700 font-medium leading-relaxed">{h.descripcion}</p>

                          {h.medida && (
                            <p className="text-[11px] text-gray-600 bg-white p-2 rounded-xl border border-gray-200">
                              <span className="font-bold uppercase text-gray-500">Medida: </span>
                              {h.medida}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">No hay reportes de conducta para este criterio.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* COLUMNA 2: SESIONES PSICOLÓGICAS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <h3 className="flex items-center gap-2 font-black text-[#093E7A] text-sm">
                    <History size={18} /> Sesiones Psicológicas ({citasFiltradas.length})
                  </h3>
                  {data?.total_citas > 0 && (
                    <span className="text-xs font-bold text-gray-400 tabular-nums">
                      {data.total_citas} en total
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {citasFiltradas.length > 0 ? (
                    citasFiltradas.map((c: any) => {
                      const fechaObj = new Date(c.fecha_cita);
                      const fechaStr = fechaObj.toLocaleDateString();
                      const horaStr = fechaObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                      return (
                        <div key={c.id_cita} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 text-[#093E7A] text-xs font-bold">
                              <Calendar size={13} />
                              <span>{fechaStr}</span>
                              <span className="text-gray-300">·</span>
                              <Clock size={13} />
                              <span>{horaStr}</span>
                            </div>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase ${
                                c.estado === "COMPLETADA"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : c.estado === "PROGRAMADA"
                                  ? "bg-blue-100 text-blue-800"
                                  : c.estado === "REPROGRAMADA"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {c.estado}
                            </span>
                          </div>

                          <p className="text-xs font-bold text-gray-900">
                            <span className="text-gray-500 font-semibold">Motivo: </span>
                            {c.motivo || "Sin motivo especificado"}
                          </p>

                          {c.resultado_reunion && (
                            <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 text-xs text-gray-700">
                              <span className="font-bold text-[#093E7A] block text-[10px] uppercase tracking-wider mb-0.5">
                                Resultado / Acuerdos:
                              </span>
                              <p className="leading-relaxed">{c.resultado_reunion}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">No hay sesiones psicológicas para este criterio.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 md:p-5 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#093E7A] text-white rounded-xl font-bold text-xs hover:bg-[#072d5a] transition-all shadow-md shadow-[#093E7A]/20"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
}