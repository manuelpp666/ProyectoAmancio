"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ShieldAlert,
  Eye,
  CalendarPlus,
  User,
  Loader2,
  Users,
  Clock,
  ArrowDownUp,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ModalDetalleSeguimiento } from "@/src/components/Citas/ModalDetalleSeguimiento";
import { ModalRegistrarCita } from "@/src/components/Citas/ModalRegistrarCitas";
import { toast } from "sonner";

interface AlumnoConReporte {
  id_alumno: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  dni: string;
  nivel: string | null;
  grado: string | null;
  seccion: string | null;
  total_reportes: number;
  total_citas: number;
  ultima_fecha_reporte: string;
  ultima_falta: string;
  tipo_falta: string | null;
  puntos_descontados: number | null;
  requiere_cambio_ie: boolean;
}

export default function SeguimientoAlumnosPage() {
  const [orden, setOrden] = useState<"reciente" | "antiguo">("reciente");
  const [searchTerm, setSearchTerm] = useState("");
  const [alumnos, setAlumnos] = useState<AlumnoConReporte[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Expediente
  const [selectedStudent, setSelectedStudent] = useState<{ id_alumno: number; nombre_completo: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Agendar Cita
  const [citaAlumno, setCitaAlumno] = useState<any>(null);
  const [isCitaOpen, setIsCitaOpen] = useState(false);

  const fetchAlumnos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ orden });
      if (searchTerm.trim()) params.set("q", searchTerm.trim());

      const res = await apiFetch(`/conducta/alumnos-con-reportes?${params.toString()}`);
      if (res.ok) {
        setAlumnos(await res.json());
      } else {
        toast.error("No se pudo cargar la lista de alumnos con reportes");
        setAlumnos([]);
      }
    } catch {
      toast.error("Error de conexión al cargar alumnos");
      setAlumnos([]);
    } finally {
      setLoading(false);
    }
  }, [orden, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlumnos();
    }, searchTerm ? 350 : 0);

    return () => clearTimeout(timer);
  }, [fetchAlumnos, searchTerm]);

  const openDetail = (alumno: AlumnoConReporte) => {
    setSelectedStudent({ id_alumno: alumno.id_alumno, nombre_completo: alumno.nombre_completo });
    setIsModalOpen(true);
  };

  const openCita = (alumno: AlumnoConReporte) => {
    setCitaAlumno({ id_alumno: alumno.id_alumno, nombre_completo: alumno.nombre_completo });
    setIsCitaOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <ShieldAlert size={28} /> Seguimiento Conductual y Psicológico
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Lista de estudiantes con reportes disciplinarios para evaluación, agendamiento de citas y revisión de expediente.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-blue-50/60 border border-blue-100 px-4 py-2 rounded-xl text-xs font-bold text-[#093E7A] shrink-0">
          <Users size={16} />
          <span>{alumnos.length} estudiantes con reportes</span>
        </div>
      </div>

      {/* FILTROS Y ORDENAMIENTO */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        {/* BUSCADOR */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors"
          />
        </div>

        {/* SELECTOR DE ORDEN */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <ArrowDownUp size={15} className="text-gray-500" />
          <span className="text-xs font-bold text-gray-600">Ordenar por:</span>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as "reciente" | "antiguo")}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#093E7A] transition-colors cursor-pointer"
          >
            <option value="reciente">Más reciente primero (Predeterminado)</option>
            <option value="antiguo">Más antiguo primero</option>
          </select>
        </div>
      </div>

      {/* LISTA DE ESTUDIANTES */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#093E7A]" size={40} />
        </div>
      ) : alumnos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alumnos.map((alumno) => (
            <div
              key={alumno.id_alumno}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#701C32]" />

              <div className="space-y-4">
                {/* CABECERA ESTUDIANTE */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 text-[#701C32] font-black flex items-center justify-center shrink-0 border border-gray-200">
                      <User size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 leading-snug">{alumno.nombre_completo}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        DNI <span className="font-semibold">{alumno.dni}</span>
                        {alumno.grado && (
                          <>
                            {" · "}
                            <span className="font-semibold text-gray-700">{alumno.grado}</span>
                            {alumno.seccion && ` "${alumno.seccion}"`}
                          </>
                        )}
                        {alumno.nivel && <span className="text-[10px] text-gray-400 block">{alumno.nivel}</span>}
                      </p>
                    </div>
                  </div>

                  {/* CONTADORES */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                      {alumno.total_reportes} {alumno.total_reportes === 1 ? "reporte" : "reportes"}
                    </span>
                    {alumno.total_citas > 0 && (
                      <span className="bg-blue-50 text-[#093E7A] border border-blue-100 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                        {alumno.total_citas} {alumno.total_citas === 1 ? "sesión" : "sesiones"}
                      </span>
                    )}
                  </div>
                </div>

                {/* ÚLTIMO INCIDENTE */}
                <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-600">Última falta registrada:</span>
                    <span className="text-gray-400 tabular-nums">{alumno.ultima_fecha_reporte}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-snug">{alumno.ultima_falta}</p>
                  <div className="flex items-center gap-2 pt-1">
                    {alumno.tipo_falta && (
                      <span className="text-[10px] uppercase font-bold bg-white text-gray-600 border border-gray-200 px-2 py-0.5 rounded-md">
                        {alumno.tipo_falta}
                      </span>
                    )}
                    {alumno.puntos_descontados && (
                      <span className="text-[10px] font-bold text-red-600">
                        −{alumno.puntos_descontados} pts
                      </span>
                    )}
                    {alumno.requiere_cambio_ie && (
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                        ⚠️ Cambio de I.E.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => openDetail(alumno)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-[#093E7A] font-bold rounded-xl text-xs transition-colors border border-gray-200"
                >
                  <Eye size={15} /> Ver Expediente
                </button>
                <button
                  onClick={() => openCita(alumno)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#701C32] hover:bg-[#5a1628] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#701C32]/20 active:scale-[0.98]"
                >
                  <CalendarPlus size={15} /> Agendar Cita
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200">
          <ShieldAlert className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-gray-700 font-bold">No se encontraron estudiantes</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? `No hay alumnos que coincidan con "${searchTerm}".`
              : "No hay reportes de conducta registrados actualmente."}
          </p>
        </div>
      )}

      {/* MODAL DETALLE EXPEDIENTE */}
      <ModalDetalleSeguimiento
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        idAlumno={selectedStudent?.id_alumno}
        nombreAlumno={selectedStudent?.nombre_completo}
      />

      {/* MODAL REGISTRAR CITA */}
      <ModalRegistrarCita
        isOpen={isCitaOpen}
        onClose={() => {
          setIsCitaOpen(false);
          setCitaAlumno(null);
        }}
        onSuccess={() => {
          setIsCitaOpen(false);
          setCitaAlumno(null);
          toast.success("Cita agendada correctamente. Ya figura en la Agenda de Citas.");
          fetchAlumnos();
        }}
        alumnoPreseleccionado={citaAlumno}
      />
    </div>
  );
}
