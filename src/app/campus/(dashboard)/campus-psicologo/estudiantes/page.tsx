"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  ShieldAlert,
  Gauge,
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
  Filter,
  Phone,
  PhoneOff,
  CalendarRange,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ModalDetalleSeguimiento } from "@/src/components/Citas/ModalDetalleSeguimiento";
import { ModalRegistrarCita } from "@/src/components/Citas/ModalRegistrarCitas";
import { toast } from "sonner";

// El semáforo de conducta del reglamento, tal como lo devuelve
// `estado_visual` en app/modules/behavior/constants.py. Verde a partir de 15
// puntos, Amarillo por debajo, Rojo por debajo de 8 o con medida de cambio
// de I.E. Los nombres de color son los del sistema; aquí se traducen a lo
// que el psicólogo necesita leer.
const ESTADOS_CONDUCTA = [
  { valor: "Verde", etiqueta: "Regular", detalle: "Sin observaciones" },
  { valor: "Amarillo", etiqueta: "En observación", detalle: "Por debajo de 15 puntos" },
  { valor: "Rojo", etiqueta: "Crítico", detalle: "Por debajo de 8 puntos o cambio de I.E." },
] as const;

const ESTILO_CONDUCTA: Record<string, string> = {
  Verde: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Amarillo: "bg-amber-50 text-amber-700 border-amber-200",
  Rojo: "bg-red-50 text-red-700 border-red-200",
};

const ESTILO_CONDUCTA_DESCONOCIDO = "bg-gray-100 text-gray-600 border-gray-200";

const etiquetaConducta = (estado: string) =>
  ESTADOS_CONDUCTA.find((e) => e.valor === estado)?.etiqueta ?? estado;

/** Qué hay detrás del color, para quien pase el ratón por la insignia. */
const tituloConducta = (a: AlumnoConReporte) => {
  const partes = [
    `Conducta ${a.puntaje_conducta}/${a.puntaje_maximo ?? 20}`,
    a.conducta_bimestre ? `bimestre ${a.conducta_bimestre}` : "año completo",
  ];
  if (a.reportes_del_bimestre !== null) {
    partes.push(
      `${a.reportes_del_bimestre} ${a.reportes_del_bimestre === 1 ? "reporte" : "reportes"} en el periodo`,
    );
  }
  // Sin esto, un alumno con 18 puntos en rojo no tendría explicación.
  if (a.conducta_cambio_ie) partes.push("con medida de cambio de I.E.");
  if (a.conducta_de_registro_anterior) partes.push("nota traída del registro anterior");
  return partes.join(" · ");
};

interface AlumnoConReporte {
  id_alumno: number;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  dni: string;
  estado_conducta: string | null;
  puntaje_conducta: number | null;
  puntaje_maximo: number | null;
  conducta_bimestre: number | null;
  reportes_del_bimestre: number | null;
  conducta_cambio_ie: boolean;
  conducta_de_registro_anterior: boolean;
  apoderado: string | null;
  apoderado_parentesco: string | null;
  apoderado_telefono: string | null;
  nivel: string | null;
  grado: string | null;
  seccion: string | null;
  total_reportes: number;
  total_citas: number;
  ultima_fecha_reporte: string;
  ultima_falta: string | null;
  tipo_falta: string | null;
  puntos_descontados: number | null;
  requiere_cambio_ie: boolean;
}

export default function SeguimientoAlumnosPage() {
  const [orden, setOrden] = useState<"reciente" | "antiguo" | "conducta">("reciente");
  const [conducta, setConducta] = useState("");
  // "" = el bimestre que toca hoy, que es lo que el backend decide solo.
  const [bimestre, setBimestre] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [alumnos, setAlumnos] = useState<AlumnoConReporte[]>([]);
  const [loading, setLoading] = useState(true);

  // Número de la última búsqueda pedida. Con dos filtros a la vez es fácil
  // cambiar de opción antes de que conteste la anterior, y sin esto la
  // respuesta que llegue tarde pisaría a la buena: se vería una lista que no
  // corresponde a lo que marca la pantalla.
  const peticion = useRef(0);

  // Modal Expediente
  const [selectedStudent, setSelectedStudent] = useState<{ id_alumno: number; nombre_completo: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Agendar Cita
  const [citaAlumno, setCitaAlumno] = useState<any>(null);
  const [isCitaOpen, setIsCitaOpen] = useState(false);

  const fetchAlumnos = useCallback(async () => {
    const mia = ++peticion.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ orden });
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (conducta) params.set("estado_conducta", conducta);
      if (bimestre) params.set("bimestre", bimestre);

      const res = await apiFetch(`/conducta/alumnos-con-reportes?${params.toString()}`);
      if (mia !== peticion.current) return; // llegó tarde: ya hay otra en curso

      if (res.ok) {
        const datos = await res.json();
        // Si el backend devolviera algo que no es una lista, pintar sobre ello
        // reventaría el .map de más abajo.
        setAlumnos(Array.isArray(datos) ? datos : []);
      } else {
        // El backend explica por qué (por ejemplo, un estado no reconocido).
        // Enseñar su mensaje es más útil que un «no se pudo» genérico.
        let motivo = "No se pudo cargar la lista de alumnos con reportes";
        try {
          const cuerpo = await res.json();
          if (cuerpo?.detail) motivo = String(cuerpo.detail);
        } catch {
          /* la respuesta no traía JSON: se queda el mensaje genérico */
        }
        toast.error(motivo);
        setAlumnos([]);
      }
    } catch {
      if (mia !== peticion.current) return;
      toast.error("Error de conexión al cargar alumnos");
      setAlumnos([]);
    } finally {
      if (mia === peticion.current) setLoading(false);
    }
  }, [orden, searchTerm, conducta, bimestre]);

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

        <div className="flex flex-col items-stretch md:items-end gap-2 shrink-0">
          <div className="flex items-center gap-2 bg-blue-50/60 border border-blue-100 px-4 py-2 rounded-xl text-xs font-bold text-[#093E7A]">
            <Users size={16} />
            <span>
              {alumnos.length} {alumnos.length === 1 ? "estudiante" : "estudiantes"} con reportes
              {conducta && ` · ${etiquetaConducta(conducta)}`}
              {bimestre && ` · ${bimestre}° bim.`}
            </span>
          </div>

          {/* Esta pantalla es solo la de los reportados. El listado completo
              del alumnado vive en su propio apartado del menú. */}
          <Link
            href="/campus/campus-psicologo/estado-conducta"
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#093E7A] hover:underline"
          >
            <Gauge size={14} /> Ver a todos los alumnos por estado de conducta
          </Link>
        </div>
      </div>

      {/* FILTROS Y ORDENAMIENTO */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* BUSCADOR */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto lg:justify-end">
          {/* FILTRO POR ESTADO DE CONDUCTA */}
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-500 shrink-0" />
            <span className="text-xs font-bold text-gray-600 shrink-0">Conducta:</span>
            <select
              value={conducta}
              onChange={(e) => setConducta(e.target.value)}
              className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#093E7A] transition-colors cursor-pointer"
            >
              <option value="">Todos los estados</option>
              {ESTADOS_CONDUCTA.map((e) => (
                <option key={e.valor} value={e.valor} title={e.detalle}>
                  {e.etiqueta}
                </option>
              ))}
            </select>
          </div>

          {/* BIMESTRE SOBRE EL QUE SE CALCULA LA CONDUCTA */}
          <div className="flex items-center gap-2">
            <CalendarRange size={15} className="text-gray-500 shrink-0" />
            <span className="text-xs font-bold text-gray-600 shrink-0">Bimestre:</span>
            <select
              value={bimestre}
              onChange={(e) => setBimestre(e.target.value)}
              className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#093E7A] transition-colors cursor-pointer"
            >
              <option value="">El de hoy</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={String(n)}>
                  {n}° bimestre
                </option>
              ))}
            </select>
          </div>

          {/* SELECTOR DE ORDEN */}
          <div className="flex items-center gap-2">
            <ArrowDownUp size={15} className="text-gray-500 shrink-0" />
            <span className="text-xs font-bold text-gray-600 shrink-0">Ordenar por:</span>
            <select
              value={orden}
              onChange={(e) =>
                setOrden(e.target.value as "reciente" | "antiguo" | "conducta")
              }
              className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#093E7A] transition-colors cursor-pointer"
            >
              <option value="reciente">Más reciente primero (Predeterminado)</option>
              <option value="antiguo">Más antiguo primero</option>
              <option value="conducta">Peor conducta primero</option>
            </select>
          </div>
        </div>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-gray-900 leading-snug">{alumno.nombre_completo}</h3>
                        {alumno.estado_conducta && (
                          <span
                            title={tituloConducta(alumno)}
                            className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border shrink-0 ${
                              ESTILO_CONDUCTA[alumno.estado_conducta] ?? ESTILO_CONDUCTA_DESCONOCIDO
                            }`}
                          >
                            {etiquetaConducta(alumno.estado_conducta)}
                            {alumno.puntaje_conducta !== null && (
                              <span className="font-bold normal-case">
                                {" · "}
                                {alumno.puntaje_conducta}/{alumno.puntaje_maximo ?? 20}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
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

                {/* APODERADO: a quién llamar */}
                <div className="flex items-start gap-2.5 text-xs">
                  {alumno.apoderado_telefono ? (
                    <>
                      <Phone size={14} className="text-[#093E7A] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <a
                          href={`tel:${alumno.apoderado_telefono}`}
                          className="font-bold text-[#093E7A] tabular-nums hover:underline"
                        >
                          {alumno.apoderado_telefono}
                        </a>
                        <span className="text-gray-500">
                          {" · "}
                          {alumno.apoderado ?? "Apoderado"}
                          {alumno.apoderado_parentesco &&
                            ` (${alumno.apoderado_parentesco.toLowerCase()})`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <PhoneOff size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <span className="text-gray-500">
                        {alumno.apoderado
                          ? `${alumno.apoderado} — sin teléfono registrado`
                          : "Sin apoderado registrado"}
                      </span>
                    </>
                  )}
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
            {searchTerm && conducta
              ? `Ningún alumno con conducta "${etiquetaConducta(conducta)}" coincide con "${searchTerm}".`
              : searchTerm
              ? `No hay alumnos que coincidan con "${searchTerm}".`
              : conducta
              ? `Ningún alumno con reportes tiene la conducta en ` +
                `"${etiquetaConducta(conducta)}" en ${
                  bimestre ? `el ${bimestre}° bimestre` : "el bimestre en curso"
                }.`
              : "No hay reportes de conducta registrados actualmente."}
          </p>
          {(searchTerm || conducta || bimestre) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setConducta("");
                setBimestre("");
              }}
              className="mt-4 text-xs font-bold text-[#093E7A] hover:underline"
            >
              Quitar filtros
            </button>
          )}
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
