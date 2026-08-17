"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Clock,
  User,
  Filter,
  Loader2,
  CalendarDays,
  Trash2,
  Edit3,
  Eye,
  ClipboardCheck,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ModalRegistrarCita } from "@/src/components/Citas/ModalRegistrarCitas";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { ModalModificarCita } from "@/src/components/Citas/ModalModificarCita";
import { ModalRegistrarAtencion } from "@/src/components/Citas/ModalRegistrarAtencion";
import { ModalDetalleSeguimiento } from "@/src/components/Citas/ModalDetalleSeguimiento";
import { toast } from "sonner";

const ESTADOS_PENDIENTES = ["PROGRAMADA", "REPROGRAMADA"];

export default function AgendaCitasPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState("");
  const [selectedCita, setSelectedCita] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAtencionModalOpen, setIsAtencionModalOpen] = useState(false);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const url = filtroFecha
        ? `/conducta/citas/agenda-diaria?fecha=${filtroFecha}`
        : "/conducta/citas/agenda-diaria";
      const res = await apiFetch(url);
      if (res.ok) {
        setCitas(await res.json());
      } else {
        toast.error("No se pudieron cargar las citas");
        setCitas([]);
      }
    } catch {
      toast.error("Error de conexión al cargar las citas");
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [filtroFecha]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  const handleEliminarCita = (id: number) => {
    setSelectedDeleteId(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmEliminarCita = async () => {
    if (!selectedDeleteId) return;

    try {
      const res = await apiFetch(`/conducta/citas/${selectedDeleteId}/cancelar`, {
        method: "PATCH",
      });
      if (res.ok) {
        toast.success("Cita cancelada correctamente");
        fetchCitas();
      } else {
        toast.error("Error al cancelar la cita");
      }
    } catch {
      toast.error("Error de conexión al cancelar");
    } finally {
      setSelectedDeleteId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <CalendarDays size={28} /> Agenda de Citas Psicológicas
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Visualice todas las atenciones programadas y filtre por fecha según necesidad.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#701C32] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#5a1628] transition-all shadow-lg shadow-[#701C32]/20 shrink-0"
        >
          <Plus size={20} /> Programar Nueva Cita
        </button>
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
            <Filter size={16} className="text-[#093E7A]" /> Filtrar por fecha:
          </div>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors cursor-pointer"
          />
          {filtroFecha && (
            <button
              onClick={() => setFiltroFecha("")}
              className="flex items-center gap-1 text-xs font-bold text-[#701C32] hover:underline px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              <RotateCcw size={13} /> Mostrar todas
            </button>
          )}
        </div>

        <span className="text-xs font-bold text-gray-500 tabular-nums">
          {loading ? "Cargando..." : `${citas.length} ${citas.length === 1 ? "cita" : "citas"} ${filtroFecha ? `el ${filtroFecha}` : "en total"}`}
        </span>
      </div>

      {/* CUERPO DE LA AGENDA */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#093E7A]" size={40} />
        </div>
      ) : citas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {citas.map((cita: any) => {
            const fechaObj = new Date(cita.fecha_cita);
            const fechaStr = fechaObj.toLocaleDateString();
            const horaStr = fechaObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            return (
              <div
                key={cita.id_cita}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#093E7A]" />

                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-1.5 text-[#093E7A] bg-blue-50 px-2.5 py-1 rounded-lg">
                      <CalendarIcon size={13} />
                      <span className="text-xs font-bold">{fechaStr}</span>
                      <span className="text-gray-300">·</span>
                      <Clock size={13} />
                      <span className="text-xs font-bold">{horaStr}</span>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase shrink-0 ${
                        cita.estado === "PROGRAMADA"
                          ? "bg-blue-50 text-blue-700"
                          : cita.estado === "REPROGRAMADA"
                          ? "bg-amber-50 text-amber-700"
                          : cita.estado === "CANCELADA"
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {cita.estado}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#093E7A] flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 leading-tight truncate">
                        {cita.alumno_nombre || "Estudiante"}
                      </h3>
                      {cita.alumno_dni && (
                        <p className="text-xs font-medium text-gray-500">DNI {cita.alumno_dni}</p>
                      )}
                    </div>
                  </div>

                  {/* MOTIVO DE LA CITA DESTACADO */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <span className="font-bold block text-[10px] uppercase tracking-wider text-[#701C32] mb-1">
                      Motivo de la Cita:
                    </span>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                      {cita.motivo || "Sin motivo especificado"}
                    </p>
                  </div>

                  {cita.resultado_reunion && (
                    <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100 text-xs text-emerald-800">
                      <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-700 mb-0.5">
                        Resultado de la atención:
                      </span>
                      <p className="line-clamp-2">{cita.resultado_reunion}</p>
                    </div>
                  )}
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedCita(cita);
                      setIsDetailModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-[#093E7A] hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    title="Ver expediente del alumno"
                  >
                    <Eye size={15} /> Expediente
                  </button>

                  <div className="flex items-center gap-1">
                    {ESTADOS_PENDIENTES.includes(cita.estado) && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedCita(cita);
                            setIsAtencionModalOpen(true);
                          }}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Registrar atención y cerrar la cita"
                        >
                          <ClipboardCheck size={17} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCita(cita);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Reprogramar cita"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button
                          onClick={() => handleEliminarCita(cita.id_cita)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancelar cita"
                        >
                          <Trash2 size={17} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
          <CalendarDays className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-gray-700 font-bold">
            {filtroFecha ? `No hay citas para el ${filtroFecha}` : "No hay citas psicológicas registradas"}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {filtroFecha ? "Pruebe limpiando el filtro de fecha o elija otro día." : "Haga clic en el botón para programar una nueva cita."}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 bg-[#701C32] text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-[#5a1628] transition-colors"
          >
            Programar Cita
          </button>
        </div>
      )}

      {/* MODALES */}
      <ModalModificarCita
        isOpen={isEditModalOpen}
        cita={selectedCita}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCita(null);
        }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setSelectedCita(null);
          fetchCitas();
        }}
      />

      <ModalRegistrarAtencion
        isOpen={isAtencionModalOpen}
        cita={selectedCita}
        onClose={() => {
          setIsAtencionModalOpen(false);
          setSelectedCita(null);
        }}
        onSuccess={() => {
          setIsAtencionModalOpen(false);
          setSelectedCita(null);
          fetchCitas();
        }}
      />

      <ModalDetalleSeguimiento
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCita(null);
        }}
        idAlumno={selectedCita?.id_alumno}
        nombreAlumno={selectedCita?.alumno_nombre}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setSelectedDeleteId(null);
        }}
        onConfirm={handleConfirmEliminarCita}
        title="Confirmar cancelación"
        message="¿Estás seguro de cancelar esta cita psicológica? Esta acción no se puede deshacer."
        confirmText="Sí, cancelar"
        type="danger"
      />

      <ModalRegistrarCita
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchCitas();
        }}
      />
    </div>
  );
}