"use client";
import { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  Eye,
  CalendarPlus,
  User,
  Loader2,
  Users,
  Clock,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { nombreAlumno } from "@/src/lib/alumno";
import { ModalDetalleSeguimiento } from "@/src/components/Citas/ModalDetalleSeguimiento";
import { ModalRegistrarCita } from "@/src/components/Citas/ModalRegistrarCitas";

export default function SeguimientoAlumnosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  // null = no hay búsqueda activa (se muestra la lista de recientes)
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [terminoBuscado, setTerminoBuscado] = useState("");

  // Alumnos con citas recientes (lista por defecto al entrar)
  const [recientes, setRecientes] = useState<any[]>([]);
  const [loadingRecientes, setLoadingRecientes] = useState(true);

  const [alumnosRiesgo, setAlumnosRiesgo] = useState<any[]>([]);
  const [loadingRiesgo, setLoadingRiesgo] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal de cita (botón "Citar" contextual de cada alumno)
  const [citaAlumno, setCitaAlumno] = useState<any>(null);
  const [isCitaOpen, setIsCitaOpen] = useState(false);

  useEffect(() => {
    fetchAlumnosRiesgo();
    fetchRecientes();
  }, []);

  const fetchAlumnosRiesgo = async () => {
    setLoadingRiesgo(true);
    try {
      const res = await apiFetch("/conducta/alumnos-en-riesgo");
      if (res.ok) setAlumnosRiesgo(await res.json());
    } catch (error) {
      console.error("Error obteniendo alumnos en riesgo", error);
    } finally {
      setLoadingRiesgo(false);
    }
  };

  const fetchRecientes = async () => {
    setLoadingRecientes(true);
    try {
      const res = await apiFetch("/conducta/citas/alumnos-recientes");
      if (res.ok) setRecientes(await res.json());
    } catch (error) {
      console.error("Error obteniendo alumnos con citas recientes", error);
    } finally {
      setLoadingRecientes(false);
    }
  };

  // Búsqueda automática con debounce (sin botón). Con < 3 caracteres se
  // limpia la búsqueda y se vuelve a mostrar la lista de recientes.
  useEffect(() => {
    const termino = searchTerm.trim();
    if (termino.length < 3) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    let cancelado = false;
    setIsSearching(true);
    const debounce = setTimeout(async () => {
      try {
        const res = await apiFetch(`/conducta/buscar-alumnos?q=${encodeURIComponent(termino)}`);
        if (cancelado) return;
        setTerminoBuscado(termino);
        setSearchResults(res.ok ? await res.json() : []);
      } catch (error) {
        if (!cancelado) {
          console.error("Error en la búsqueda", error);
          setSearchResults([]);
        }
      } finally {
        if (!cancelado) setIsSearching(false);
      }
    }, 400);

    return () => {
      cancelado = true;
      clearTimeout(debounce);
    };
  }, [searchTerm]);

  const openDetail = (alumno: any) => {
    setSelectedStudent({ id_alumno: alumno.id_alumno, nombre_completo: nombreAlumno(alumno) });
    setIsModalOpen(true);
  };

  const openCita = (alumno?: any) => {
    setCitaAlumno(alumno ? { id_alumno: alumno.id_alumno, nombre_completo: nombreAlumno(alumno) } : null);
    setIsCitaOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2C3E50]">Seguimiento de Alumnos</h1>
          <p className="text-gray-500 text-sm">
            Consulta el historial completo de conducta y psicología de cualquier estudiante.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* SECCIÓN IZQUIERDA: BUSCADOR Y RESULTADOS */}
        <div className="w-full lg:w-2/3 space-y-6">
          {/* BARRA DE BÚSQUEDA (automática) */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, apellidos o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#701C32] focus:ring-4 focus:ring-[#701C32]/10 transition-all outline-none text-[#2C3E50] font-medium"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-[#701C32] animate-spin" size={20} />
              )}
            </div>
          </div>

          {/* RESULTADOS DE BÚSQUEDA */}
          {searchResults && searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((alumno) => (
                <div
                  key={alumno.id_alumno}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:shadow-xl transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-[#701C32]" />
                  <div className="flex items-center gap-4 pl-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-[#2C3E50] shrink-0">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2C3E50]">
                        {alumno.nombres} {alumno.apellidos}
                      </h3>
                      <p className="text-sm text-gray-500">DNI: {alumno.dni}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDetail(alumno)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-[#2C3E50] font-semibold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <Eye size={18} /> Historial
                    </button>
                    <button
                      onClick={() => openCita(alumno)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#701C32] text-white font-semibold rounded-xl hover:bg-[#5a1628] active:scale-[0.98] transition-all"
                    >
                      <CalendarPlus size={18} /> Citar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults && !isSearching ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Search className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-gray-500 font-medium">No se encontraron resultados para "{terminoBuscado}"</h3>
            </div>
          ) : (
            /* SIN BÚSQUEDA ACTIVA: lista de alumnos con citas recientes */
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#2C3E50] px-1">
                <Clock size={16} className="text-[#701C32]" />
                Alumnos con citas recientes
              </div>

              {loadingRecientes ? (
                <div className="space-y-4 animate-pulse" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-gray-100 rounded" />
                        <div className="h-3 w-24 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recientes.length > 0 ? (
                recientes.map((alumno) => (
                  <div
                    key={alumno.id_alumno}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:shadow-xl transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#701C32]" />
                    <div className="flex items-center gap-4 pl-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-[#2C3E50] shrink-0">
                        <User size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#2C3E50]">
                          {alumno.nombres} {alumno.apellidos}
                        </h3>
                        <p className="text-sm text-gray-500">
                          DNI: {alumno.dni}
                          {alumno.ultima_cita && (
                            <span className="text-gray-400">
                              {" · "}Última cita: {new Date(alumno.ultima_cita).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDetail(alumno)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-[#2C3E50] font-semibold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <Eye size={18} /> Historial
                      </button>
                      <button
                        onClick={() => openCita(alumno)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#701C32] text-white font-semibold rounded-xl hover:bg-[#5a1628] active:scale-[0.98] transition-all"
                      >
                        <CalendarPlus size={18} /> Citar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                  <Users className="mx-auto text-gray-300 mb-4" size={48} />
                  <h3 className="text-gray-500 font-medium">Aún no hay citas registradas</h3>
                  <p className="text-gray-400 text-sm mt-1">Busca un alumno por nombre o DNI para ver su expediente</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SECCIÓN DERECHA: REQUIEREN CITACIÓN */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:sticky lg:top-6">
            <div className="bg-[#701C32] p-5 text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-amber-300" />
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">Requieren Citación</h2>
                <p className="text-white/70 text-xs">Puntaje de conducta crítico</p>
              </div>
            </div>

            <div className="p-2">
              {loadingRiesgo ? (
                <div className="space-y-2 animate-pulse" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="p-4">
                      <div className="flex justify-between items-center gap-2 mb-3">
                        <div className="h-4 w-36 bg-gray-100 rounded" />
                        <div className="h-4 w-12 bg-gray-100 rounded-full" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-8 flex-1 bg-gray-100 rounded-lg" />
                        <div className="h-8 flex-1 bg-gray-100 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : alumnosRiesgo.length > 0 ? (
                <div className="space-y-1">
                  {alumnosRiesgo.map((alumno) => (
                    <div key={alumno.id_alumno} className="p-4 hover:bg-red-50/40 rounded-2xl transition-colors">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              alumno.estado === "Rojo" ? "bg-red-500" : "bg-amber-400"
                            }`}
                          />
                          <h4 className="font-bold text-[#2C3E50] text-sm truncate">{alumno.nombre_completo}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            alumno.estado === "Rojo" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {alumno.puntaje} PTS
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetail(alumno)}
                          className="flex-1 bg-white border border-gray-200 text-[#2C3E50] text-xs font-bold py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1.5"
                        >
                          <Eye size={14} /> Expediente
                        </button>
                        <button
                          onClick={() => openCita(alumno)}
                          className="flex-1 bg-[#C97035] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#b05f2a] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                        >
                          <CalendarPlus size={14} /> Citar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No hay alumnos en riesgo actualmente.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALLE INTEGRADOR */}
      <ModalDetalleSeguimiento
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        idAlumno={selectedStudent?.id_alumno}
        nombreAlumno={selectedStudent?.nombre_completo}
      />

      {/* MODAL DE PROGRAMAR CITA */}
      <ModalRegistrarCita
        isOpen={isCitaOpen}
        onClose={() => setIsCitaOpen(false)}
        alumnoInicial={citaAlumno}
        onSuccess={() => {
          setIsCitaOpen(false);
          fetchAlumnosRiesgo();
        }}
      />
    </div>
  );
}
