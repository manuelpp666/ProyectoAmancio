"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Search,
  Gauge,
  Eye,
  CalendarPlus,
  Loader2,
  ArrowDownUp,
  Phone,
  PhoneOff,
  CalendarRange,
  Users,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ModalDetalleSeguimiento } from "@/src/components/Citas/ModalDetalleSeguimiento";
import { ModalRegistrarCita } from "@/src/components/Citas/ModalRegistrarCitas";
import { toast } from "sonner";

// El mismo semáforo del reglamento que usa `estado_visual` en
// app/modules/behavior/constants.py: Verde desde 15 puntos, Amarillo por
// debajo, Rojo por debajo de 8 o con medida de cambio de I.E.
const ESTADOS_CONDUCTA = [
  { valor: "Verde", etiqueta: "Regular", detalle: "15 puntos o más" },
  { valor: "Amarillo", etiqueta: "En observación", detalle: "Por debajo de 15 puntos" },
  { valor: "Rojo", etiqueta: "Crítico", detalle: "Por debajo de 8 puntos o cambio de I.E." },
] as const;

const ESTILO_CONDUCTA: Record<string, string> = {
  Verde: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Amarillo: "bg-amber-50 text-amber-700 border-amber-200",
  Rojo: "bg-red-50 text-red-700 border-red-200",
};

// El de la pastilla de arriba cuando está puesta, más saturado para que se
// vea de lejos cuál es el filtro activo.
const ESTILO_CHIP_ACTIVO: Record<string, string> = {
  Verde: "bg-emerald-600 text-white border-emerald-600",
  Amarillo: "bg-amber-500 text-white border-amber-500",
  Rojo: "bg-red-600 text-white border-red-600",
};

const ESTILO_CONDUCTA_DESCONOCIDO = "bg-gray-100 text-gray-600 border-gray-200";

const etiquetaConducta = (estado: string) =>
  ESTADOS_CONDUCTA.find((e) => e.valor === estado)?.etiqueta ?? estado;

interface AlumnoConducta {
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
  requiere_cambio_ie: boolean;
}

/** Qué hay detrás del color, para quien pase el ratón por la insignia. */
const tituloConducta = (a: AlumnoConducta) => {
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

export default function EstadoConductaPage() {
  const [orden, setOrden] = useState<"conducta" | "reciente" | "antiguo">("conducta");
  const [conducta, setConducta] = useState("");
  // "" = el bimestre que toca hoy, que es lo que el backend decide solo.
  const [bimestre, setBimestre] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [alumnos, setAlumnos] = useState<AlumnoConducta[]>([]);
  const [loading, setLoading] = useState(true);

  // Número de la última búsqueda pedida. Al cambiar de bimestre o de orden
  // antes de que conteste la anterior, la respuesta que llegue tarde pisaría
  // a la buena y se vería una lista que no corresponde a lo que marca la
  // pantalla.
  const peticion = useRef(0);

  const [selectedStudent, setSelectedStudent] = useState<{
    id_alumno: number;
    nombre_completo: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [citaAlumno, setCitaAlumno] = useState<any>(null);
  const [isCitaOpen, setIsCitaOpen] = useState(false);

  // El estado de conducta se filtra aquí y no en el servidor a propósito: las
  // pastillas de arriba tienen que seguir diciendo cuántos alumnos hay en cada
  // color aunque haya una puesta. Si el filtro fuera del servidor, al marcar
  // «Crítico» los otros dos contadores caerían a cero.
  const fetchAlumnos = useCallback(async () => {
    const mia = ++peticion.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ orden, incluir_sin_reportes: "true" });
      if (searchTerm.trim()) params.set("q", searchTerm.trim());
      if (bimestre) params.set("bimestre", bimestre);

      const res = await apiFetch(`/conducta/alumnos-con-reportes?${params.toString()}`);
      if (mia !== peticion.current) return; // llegó tarde: ya hay otra en curso

      if (res.ok) {
        const datos = await res.json();
        // Si el backend devolviera algo que no es una lista, pintar sobre ello
        // reventaría el .map de más abajo.
        setAlumnos(Array.isArray(datos) ? datos : []);
      } else {
        // El backend explica por qué (por ejemplo, un bimestre fuera de rango).
        // Enseñar su mensaje es más útil que un «no se pudo» genérico.
        let motivo = "No se pudo cargar la lista de alumnos";
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
  }, [orden, searchTerm, bimestre]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlumnos();
    }, searchTerm ? 350 : 0);

    return () => clearTimeout(timer);
  }, [fetchAlumnos, searchTerm]);

  const conteos = useMemo(() => {
    const c: Record<string, number> = { Verde: 0, Amarillo: 0, Rojo: 0 };
    for (const a of alumnos) {
      if (a.estado_conducta && a.estado_conducta in c) c[a.estado_conducta] += 1;
    }
    return c;
  }, [alumnos]);

  const visibles = useMemo(
    () => (conducta ? alumnos.filter((a) => a.estado_conducta === conducta) : alumnos),
    [alumnos, conducta],
  );

  const openDetail = (a: AlumnoConducta) => {
    setSelectedStudent({ id_alumno: a.id_alumno, nombre_completo: a.nombre_completo });
    setIsModalOpen(true);
  };

  const openCita = (a: AlumnoConducta) => {
    setCitaAlumno({ id_alumno: a.id_alumno, nombre_completo: a.nombre_completo });
    setIsCitaOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
          <Gauge size={28} /> Estado de Conducta
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Todos los alumnos matriculados con su puntaje de conducta del bimestre. Filtra por
          estado para ver de un vistazo a quién hay que atender.
        </p>
      </div>

      {/* RESUMEN Y FILTRO POR ESTADO */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setConducta("")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
              conducta === ""
                ? "bg-[#093E7A] text-white border-[#093E7A]"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <Users size={14} /> Todos
            <span className="tabular-nums font-black">{alumnos.length}</span>
          </button>

          {ESTADOS_CONDUCTA.map((e) => (
            <button
              key={e.valor}
              title={e.detalle}
              // Volver a pulsar la pastilla puesta quita el filtro: es lo que
              // se espera al hacer clic en algo que ya está marcado.
              onClick={() => setConducta(conducta === e.valor ? "" : e.valor)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-colors ${
                conducta === e.valor
                  ? ESTILO_CHIP_ACTIVO[e.valor]
                  : `${ESTILO_CONDUCTA[e.valor]} hover:brightness-95`
              }`}
            >
              {e.etiqueta}
              <span className="tabular-nums font-black">{conteos[e.valor]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
          {/* BUSCADOR */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre, apellidos o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
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
                onChange={(e) => setOrden(e.target.value as "conducta" | "reciente" | "antiguo")}
                className="min-w-0 flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[#093E7A] transition-colors cursor-pointer"
              >
                <option value="conducta">Peor conducta primero (Predeterminado)</option>
                <option value="reciente">Reporte más reciente primero</option>
                <option value="antiguo">Reporte más antiguo primero</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-[#093E7A]" size={40} />
        </div>
      ) : visibles.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* La tabla se desplaza dentro de su propio recuadro: en un móvil no
              debe empujar el ancho de la página. */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 text-[11px] uppercase font-black text-gray-500 tracking-wide">
                    Alumno
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase font-black text-gray-500 tracking-wide whitespace-nowrap">
                    Grado
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase font-black text-gray-500 tracking-wide whitespace-nowrap">
                    Conducta
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase font-black text-gray-500 tracking-wide whitespace-nowrap">
                    Reportes
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase font-black text-gray-500 tracking-wide whitespace-nowrap">
                    Apoderado
                  </th>
                  <th className="px-4 py-3 text-[11px] uppercase font-black text-gray-500 tracking-wide text-right whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((a) => (
                  <tr
                    key={a.id_alumno}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70 transition-colors"
                  >
                    {/* ALUMNO */}
                    <td className="px-4 py-3">
                      <p className="font-bold text-gray-900 leading-snug">{a.nombre_completo}</p>
                      <p className="text-[11px] text-gray-500">
                        DNI <span className="font-semibold">{a.dni}</span>
                      </p>
                    </td>

                    {/* GRADO */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.grado ? (
                        <>
                          <p className="text-xs font-semibold text-gray-700">
                            {a.grado}
                            {a.seccion && ` "${a.seccion}"`}
                          </p>
                          {a.nivel && <p className="text-[10px] text-gray-400">{a.nivel}</p>}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    {/* CONDUCTA */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.estado_conducta ? (
                        <span
                          title={tituloConducta(a)}
                          className={`inline-flex items-center gap-1.5 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${
                            ESTILO_CONDUCTA[a.estado_conducta] ?? ESTILO_CONDUCTA_DESCONOCIDO
                          }`}
                        >
                          {etiquetaConducta(a.estado_conducta)}
                          {a.puntaje_conducta !== null && (
                            <span className="font-bold normal-case tabular-nums">
                              {a.puntaje_conducta}/{a.puntaje_maximo ?? 20}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                      {a.requiere_cambio_ie && (
                        <span className="block mt-1 text-[10px] font-bold text-red-700">
                          ⚠️ Cambio de I.E.
                        </span>
                      )}
                    </td>

                    {/* REPORTES Y SESIONES */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.total_reportes > 0 ? (
                        <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-black px-2.5 py-0.5 rounded-full tabular-nums">
                          {a.total_reportes}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 tabular-nums">0</span>
                      )}
                      {a.total_citas > 0 && (
                        <span className="ml-1.5 bg-blue-50 text-[#093E7A] border border-blue-100 text-[10px] font-black px-2.5 py-0.5 rounded-full tabular-nums">
                          {a.total_citas} {a.total_citas === 1 ? "sesión" : "sesiones"}
                        </span>
                      )}
                    </td>

                    {/* APODERADO: a quién llamar */}
                    <td className="px-4 py-3">
                      {a.apoderado_telefono ? (
                        <div className="flex items-start gap-1.5">
                          <Phone size={13} className="text-[#093E7A] mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <a
                              href={`tel:${a.apoderado_telefono}`}
                              className="text-xs font-bold text-[#093E7A] tabular-nums hover:underline"
                            >
                              {a.apoderado_telefono}
                            </a>
                            <p className="text-[10px] text-gray-500 truncate max-w-[13rem]">
                              {a.apoderado ?? "Apoderado"}
                              {a.apoderado_parentesco &&
                                ` (${a.apoderado_parentesco.toLowerCase()})`}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <PhoneOff size={13} className="text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-gray-500">
                            {a.apoderado ? "Sin teléfono registrado" : "Sin apoderado registrado"}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => openDetail(a)}
                          title="Ver expediente"
                          className="p-2 bg-gray-50 hover:bg-gray-100 text-[#093E7A] rounded-lg border border-gray-200 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openCita(a)}
                          title="Agendar cita"
                          className="p-2 bg-[#701C32] hover:bg-[#5a1628] text-white rounded-lg transition-colors active:scale-[0.98]"
                        >
                          <CalendarPlus size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-[11px] font-bold text-gray-500">
            {visibles.length} {visibles.length === 1 ? "alumno" : "alumnos"}
            {conducta && ` en estado "${etiquetaConducta(conducta)}"`}
            {` · conducta del ${bimestre ? `${bimestre}° bimestre` : "bimestre en curso"}`}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Gauge className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-gray-700 font-bold">No se encontraron alumnos</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {searchTerm && conducta
              ? `Ningún alumno con conducta "${etiquetaConducta(conducta)}" coincide con "${searchTerm}".`
              : searchTerm
              ? `No hay alumnos que coincidan con "${searchTerm}".`
              : conducta
              ? `Ningún alumno tiene la conducta en "${etiquetaConducta(conducta)}" en ${
                  bimestre ? `el ${bimestre}° bimestre` : "el bimestre en curso"
                }.`
              : "No hay alumnos matriculados que mostrar."}
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
