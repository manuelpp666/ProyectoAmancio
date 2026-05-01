"use client";
import { useState, useEffect } from "react";
import { X, History, ShieldAlert, User, Calendar, MessageSquare, ClipboardList, Loader2 } from "lucide-react";
import { apiFetch } from "@/src/lib/api";

export function ModalDetalleSeguimiento({ isOpen, onClose, idAlumno, nombreAlumno }: any) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (!idAlumno) {
      console.error("ModalDetalleSeguimiento: falta idAlumno");
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
        } else {
          console.error("Error al cargar seguimiento", res.status, await res.text());
        }
      } catch (error) {
        console.error("Error al cargar seguimiento", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetalle();
  }, [isOpen, idAlumno]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2C3E50]/40 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        
        {/* HEADER */}
        <div className="bg-[#2C3E50] p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{nombreAlumno || "Detalle del Estudiante"}</h2>
              <p className="text-white/60 text-xs">Expediente integral de conducta y psicología</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-[#2C3E50]" size={40} />
              <p className="text-gray-400 font-medium">Cargando historial completo...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* COLUMNA 1: HISTORIAL DE CONDUCTA */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-bold text-[#701C32] border-b pb-2">
                  <ShieldAlert size={20} /> Incidentes de Conducta ({data?.total_incidentes})
                </h3>
                <div className="space-y-3">
                  {data?.historial_conducta?.length > 0 ? (
                    data.historial_conducta.map((h: any) => (
                      <div key={h.id_reporte} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-black text-gray-400 uppercase">
                            {new Date(h.fecha_reporte).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] bg-[#701C32]/10 text-[#701C32] px-2 py-0.5 rounded-full font-bold">
                            NIVEL {h.id_nivel_conducta}
                          </span>
                        </div>
                        <p className="text-sm text-[#2C3E50] font-semibold">{h.descripcion}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic py-4">Sin incidentes registrados.</p>
                  )}
                </div>
              </div>

              {/* COLUMNA 2: HISTORIAL PSICOLÓGICO */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-bold text-[#093E7A] border-b pb-2">
                  <History size={20} /> Sesiones Psicológicas ({data?.total_citas})
                </h3>
                <div className="space-y-3">
                  {data?.historial_psicologico?.length > 0 ? (
                    data.historial_psicologico.map((c: any) => (
                      <div key={c.id_cita} className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 text-[#093E7A]">
                            <Calendar size={14} />
                            <span className="text-xs font-bold">{new Date(c.fecha_cita).toLocaleDateString()}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            c.estado === 'COMPLETADA' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {c.estado}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#2C3E50] mb-1">Motivo: {c.motivo}</p>
                        {c.resultado_reunion && (
                          <div className="mt-2 pt-2 border-t border-blue-100 flex gap-2">
                            <MessageSquare size={12} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-gray-600 italic">"{c.resultado_reunion}"</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 italic py-4">Sin historial de citas.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-gray-50 border-t flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-[#2C3E50] text-white rounded-xl font-bold hover:bg-[#1a252f] transition-all shadow-lg shadow-[#2C3E50]/20"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
}