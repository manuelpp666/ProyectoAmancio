"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  Users,
  Save,
  CheckCircle2,
  Clock,
  XCircle,
  ClipboardCheck,
  FileText,
  SlidersHorizontal,
  BarChart3,
  Search,
  CheckCircle,
  AlertCircle,
  Percent,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { Nivel, Grado, Seccion } from "@/src/interfaces/academic";
import { fechaLocalISO } from "@/src/lib/fechas";

type Estado = "P" | "T" | "F" | "J";

const ESTADOS: { valor: Estado; letra: string; nombre: string; icono: typeof CheckCircle2; activo: string; punto: string }[] = [
  { valor: "P", letra: "P", nombre: "Presente", icono: CheckCircle2, activo: "bg-emerald-600 text-white", punto: "bg-emerald-600" },
  { valor: "T", letra: "T", nombre: "Tardanza", icono: Clock, activo: "bg-amber-600 text-white", punto: "bg-amber-600" },
  { valor: "F", letra: "F", nombre: "Falta", icono: XCircle, activo: "bg-red-600 text-white", punto: "bg-red-600" },
  { valor: "J", letra: "J", nombre: "Justificado", icono: FileText, activo: "bg-slate-600 text-white", punto: "bg-slate-600" },
];

interface AlumnoReporte {
  id_matricula: number;
  id_alumno: number;
  alumno: string;
  dni: string;
  nivel: string;
  grado: string;
  id_grado: number;
  seccion: string;
  id_seccion: number;
  presentes: number;
  tardanzas: number;
  faltas: number;
  justificaciones: number;
  total_dias: number;
  porcentaje_asistencia: number;
}

export default function AsistenciaAuxiliarPage() {
  const { anioPlanificacion } = useAnioAcademico();
  const [tabActiva, setTabActiva] = useState<"toma" | "reporte">("toma");

  // Estado común para filtros
  // fechaLocalISO y no toISOString(): este ultimo pasa por UTC y, de 7 de la
  // tarde en adelante, la lista se guardaba con la fecha de manana.
  const [fechaAsistencia, setFechaAsistencia] = useState(fechaLocalISO());
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);

  const [selectedNivel, setSelectedNivel] = useState("");
  const [selectedGrado, setSelectedGrado] = useState("");
  const [selectedSeccion, setSelectedSeccion] = useState("");

  // Datos para Toma de Asistencia Diaria
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [asistenciaState, setAsistenciaState] = useState<Record<number, Estado>>({});
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Datos para Reporte Resumen de Asistencia
  const [selectedBimestre, setSelectedBimestre] = useState("");
  const [bimestresDisponibles, setBimestresDisponibles] = useState<Array<{ numero: number; nombre: string; fecha_inicio: string; fecha_fin: string }>>([
    { numero: 1, nombre: "1° Bimestre", fecha_inicio: "", fecha_fin: "" },
    { numero: 2, nombre: "2° Bimestre", fecha_inicio: "", fecha_fin: "" },
    { numero: 3, nombre: "3° Bimestre", fecha_inicio: "", fecha_fin: "" },
    { numero: 4, nombre: "4° Bimestre", fecha_inicio: "", fecha_fin: "" },
  ]);
  const [reporteAlumnos, setReporteAlumnos] = useState<AlumnoReporte[]>([]);
  const [totalReporte, setTotalReporte] = useState(0);
  const [loadingReporte, setLoadingReporte] = useState(false);
  const [busquedaReporte, setBusquedaReporte] = useState("");

  const peticionActiva = useRef(0);
  const peticionReporteActiva = useRef(0);

  // 1. Cargar Niveles
  useEffect(() => {
    const fetchNiveles = async () => {
      try {
        const res = await apiFetch("/academic/niveles/");
        if (res.ok) setNiveles(await res.json());
      } catch {
        toast.error("Error cargando niveles");
      } finally {
        setLoadingFiltros(false);
      }
    };
    fetchNiveles();
  }, []);

  // 2. Cargar Grados cuando cambia el Nivel
  useEffect(() => {
    setSelectedGrado("");
    setSelectedSeccion("");
    if (!selectedNivel) {
      setGrados([]);
      return;
    }
    const fetchGrados = async () => {
      try {
        const res = await apiFetch(`/academic/grados/?nivel_id=${selectedNivel}`);
        if (res.ok) setGrados(await res.json());
      } catch {
        toast.error("Error cargando grados");
      }
    };
    fetchGrados();
  }, [selectedNivel]);

  // 3. Cargar Secciones cuando cambia el Grado
  useEffect(() => {
    setSelectedSeccion("");
    if (!selectedGrado || !anioPlanificacion) {
      setSecciones([]);
      return;
    }
    const fetchSecciones = async () => {
      try {
        const res = await apiFetch(`/academic/secciones/?grado_id=${selectedGrado}&anio_id=${anioPlanificacion}`);
        if (res.ok) setSecciones(await res.json());
      } catch {
        toast.error("Error cargando secciones");
      }
    };
    fetchSecciones();
  }, [selectedGrado, anioPlanificacion]);

  // 4. Cargar los alumnos y la asistencia registrada para la fecha seleccionada
  const fetchAsistenciaDiaria = useCallback(async () => {
    if (!selectedSeccion || !anioPlanificacion) {
      peticionActiva.current++;
      setAlumnos([]);
      setAsistenciaState({});
      setLoadingAlumnos(false);
      return;
    }

    const idPeticion = ++peticionActiva.current;
    setLoadingAlumnos(true);

    try {
      // 1) Cargar alumnos matriculados
      const resMatriculas = await apiFetch(
        `/enrollment/matriculas/?seccion_id=${selectedSeccion}&anio_id=${anioPlanificacion}`
      );
      if (idPeticion !== peticionActiva.current) return;

      if (!resMatriculas.ok) {
        setAlumnos([]);
        toast.error("No se pudieron cargar los estudiantes");
        setLoadingAlumnos(false);
        return;
      }

      const dataMatriculas = await resMatriculas.json();
      const alumnosOrdenados = dataMatriculas.sort((a: any, b: any) => {
        if (a.alumno?.apellidos < b.alumno?.apellidos) return -1;
        if (a.alumno?.apellidos > b.alumno?.apellidos) return 1;
        return 0;
      });

      // 2) Cargar asistencias guardadas para la fecha seleccionada
      const resAsist = await apiFetch(
        `/gestion/asistencia/seccion/${selectedSeccion}?fecha=${fechaAsistencia}`
      );
      if (idPeticion !== peticionActiva.current) return;

      const mapaGuardado: Record<number, Estado> = resAsist.ok
        ? (await resAsist.json()).asistencias || {}
        : {};

      const nuevoEstado: Record<number, Estado> = {};
      alumnosOrdenados.forEach((m: any) => {
        nuevoEstado[m.id_matricula] = mapaGuardado[m.id_matricula] || "P";
      });

      setAlumnos(alumnosOrdenados);
      setAsistenciaState(nuevoEstado);
    } catch {
      if (idPeticion !== peticionActiva.current) return;
      setAlumnos([]);
      toast.error("Error de conexión al cargar asistencia");
    } finally {
      if (idPeticion === peticionActiva.current) setLoadingAlumnos(false);
    }
  }, [selectedSeccion, anioPlanificacion, fechaAsistencia]);

  useEffect(() => {
    if (tabActiva === "toma") {
      fetchAsistenciaDiaria();
    }
  }, [tabActiva, fetchAsistenciaDiaria]);

  // 5. Cargar Reporte Resumen de Asistencia
  const fetchReporteAsistencia = useCallback(async () => {
    const idPeticion = ++peticionReporteActiva.current;
    setLoadingReporte(true);

    try {
      const params = new URLSearchParams();
      if (anioPlanificacion) params.set("anio_id", anioPlanificacion);
      if (selectedBimestre) params.set("bimestre", selectedBimestre);
      if (selectedNivel) params.set("nivel_id", selectedNivel);
      if (selectedGrado) params.set("grado_id", selectedGrado);
      if (selectedSeccion) params.set("seccion_id", selectedSeccion);
      if (busquedaReporte.trim()) params.set("q", busquedaReporte.trim());

      const res = await apiFetch(`/gestion/asistencia/reporte-resumen?${params.toString()}`);
      if (idPeticion !== peticionReporteActiva.current) return;

      if (res.ok) {
        const data = await res.json();
        setReporteAlumnos(data.alumnos || []);
        setTotalReporte(data.total || 0);
        if (data.bimestres && Array.isArray(data.bimestres) && data.bimestres.length > 0) {
          setBimestresDisponibles(data.bimestres);
        }
      } else {
        setReporteAlumnos([]);
        setTotalReporte(0);
        toast.error("No se pudo cargar el reporte de asistencia");
      }
    } catch {
      if (idPeticion !== peticionReporteActiva.current) return;
      setReporteAlumnos([]);
      setTotalReporte(0);
      toast.error("Error de conexión al cargar el reporte");
    } finally {
      if (idPeticion === peticionReporteActiva.current) setLoadingReporte(false);
    }
  }, [anioPlanificacion, selectedBimestre, selectedNivel, selectedGrado, selectedSeccion, busquedaReporte]);

  useEffect(() => {
    if (tabActiva === "reporte") {
      const timer = setTimeout(() => {
        fetchReporteAsistencia();
      }, busquedaReporte ? 350 : 0);
      return () => clearTimeout(timer);
    }
  }, [tabActiva, fetchReporteAsistencia, busquedaReporte, selectedBimestre]);

  // Manejar el cambio de un botón individual de asistencia
  const setEstado = (idMatricula: number, estado: Estado) => {
    setAsistenciaState((prev) => ({ ...prev, [idMatricula]: estado }));
  };

  // Guardar Asistencia al Backend (en lote)
  const handleGuardarAsistencia = async () => {
    if (alumnos.length === 0) return;
    setIsSaving(true);

    try {
      const registros = alumnos.map((m) => ({
        id_matricula: m.id_matricula,
        estado: asistenciaState[m.id_matricula] || "P",
        observacion: "",
      }));

      const res = await apiFetch("/gestion/asistencia/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha: fechaAsistencia, registros }),
      });

      if (!res.ok) throw new Error("No se pudo registrar la asistencia");

      const data = await res.json().catch(() => null);
      if (data && data.correos_encolados > 0) {
        toast.success(
          `Asistencia guardada para el ${fechaAsistencia}. Se enviará confirmación a ${data.correos_encolados} apoderado(s).`
        );
      } else {
        toast.success(`Asistencia del ${fechaAsistencia} guardada correctamente`);
      }
    } catch {
      toast.error("Hubo un error al registrar la asistencia");
    } finally {
      setIsSaving(false);
    }
  };

  // Conteo en vivo por estado en la toma diaria
  const conteo = useMemo(() => {
    const base: Record<Estado, number> = { P: 0, T: 0, F: 0, J: 0 };
    alumnos.forEach((m) => {
      base[asistenciaState[m.id_matricula] || "P"]++;
    });
    return base;
  }, [alumnos, asistenciaState]);

  const nombreSeccion = secciones.find((s) => String(s.id_seccion) === selectedSeccion)?.nombre;
  const nombreGrado = grados.find((g) => String(g.id_grado) === selectedGrado)?.nombre;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ENCABEZADO Y TABS */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <ClipboardCheck size={28} /> Control y Reporte de Asistencia
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Gestione la asistencia diaria por aula o revise el resumen acumulado de faltas y tardanzas.
          </p>
        </div>

        {/* SELECTOR DE PESTAÑAS */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setTabActiva("toma")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              tabActiva === "toma"
                ? "bg-[#093E7A] text-white shadow-md shadow-[#093E7A]/20"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <ClipboardCheck size={16} /> Toma Diaria
          </button>
          <button
            type="button"
            onClick={() => setTabActiva("reporte")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
              tabActiva === "reporte"
                ? "bg-[#093E7A] text-white shadow-md shadow-[#093E7A]/20"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BarChart3 size={16} /> Reporte Resumen
          </button>
        </div>
      </div>

      {/* FILTROS DE BÚSQUEDA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <SlidersHorizontal size={13} aria-hidden="true" /> Filtros de Búsqueda
          </h3>

          {tabActiva === "toma" ? (
            <div className="flex items-center gap-3">
              <label htmlFor="fecha-asistencia" className="text-xs font-bold text-gray-700 whitespace-nowrap">
                Fecha:
              </label>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 focus-within:border-[#093E7A] transition-colors">
                <Calendar size={16} className="text-gray-500" aria-hidden="true" />
                <input
                  id="fecha-asistencia"
                  type="date"
                  value={fechaAsistencia}
                  onChange={(e) => setFechaAsistencia(e.target.value)}
                  className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por DNI o Apellidos..."
                value={busquedaReporte}
                onChange={(e) => setBusquedaReporte(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors"
              />
            </div>
          )}
        </div>

        <div className={`grid grid-cols-1 ${tabActiva === "reporte" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3"} gap-4`}>
          {tabActiva === "reporte" && (
            <div className="space-y-1.5">
              <label htmlFor="filtro-bimestre" className="text-xs font-bold text-gray-700">
                Bimestre
              </label>
              <select
                id="filtro-bimestre"
                value={selectedBimestre}
                onChange={(e) => setSelectedBimestre(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors cursor-pointer"
              >
                <option value="">Todos los bimestres</option>
                {bimestresDisponibles.map((b) => (
                  <option key={b.numero} value={b.numero}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="filtro-nivel" className="text-xs font-bold text-gray-700">
              Nivel
            </label>
            <select
              id="filtro-nivel"
              value={selectedNivel}
              onChange={(e) => setSelectedNivel(e.target.value)}
              disabled={loadingFiltros}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{tabActiva === "reporte" ? "Todos los niveles" : "Seleccione Nivel"}</option>
              {niveles.map((n) => (
                <option key={n.id_nivel} value={n.id_nivel}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filtro-grado" className="text-xs font-bold text-gray-700">
              Grado
            </label>
            <select
              id="filtro-grado"
              value={selectedGrado}
              onChange={(e) => setSelectedGrado(e.target.value)}
              disabled={!selectedNivel}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{tabActiva === "reporte" ? "Todos los grados" : "Seleccione Grado"}</option>
              {grados.map((g) => (
                <option key={g.id_grado} value={g.id_grado}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filtro-seccion" className="text-xs font-bold text-gray-700">
              Sección
            </label>
            <select
              id="filtro-seccion"
              value={selectedSeccion}
              onChange={(e) => setSelectedSeccion(e.target.value)}
              disabled={!selectedGrado}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{tabActiva === "reporte" ? "Todas las secciones" : "Seleccione Sección"}</option>
              {secciones.map((s) => (
                <option key={s.id_seccion} value={s.id_seccion}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VISTA 1: TOMA DE ASISTENCIA DIARIA */}
      {tabActiva === "toma" && (
        <>
          {loadingAlumnos && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-blue-50/50">
                <div className="h-5 w-56 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 flex-1 max-w-[260px] bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-9 w-64 bg-gray-100 rounded-xl animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loadingAlumnos && !selectedSeccion && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#093E7A] flex items-center justify-center mx-auto mb-4">
                <Users size={28} aria-hidden="true" />
              </div>
              <h3 className="font-black text-gray-800">Elija una sección para comenzar</h3>
              <p className="text-sm text-gray-600 mt-1.5 max-w-md mx-auto">
                Seleccione el nivel, grado y sección. La lista cargará automáticamente el estado registrado en la fecha seleccionada.
              </p>
            </div>
          )}

          {!loadingAlumnos && selectedSeccion && alumnos.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-16 text-center surface-in">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
                <Users size={28} aria-hidden="true" />
              </div>
              <h3 className="font-black text-gray-800">Esta sección no tiene estudiantes matriculados</h3>
              <p className="text-sm text-gray-600 mt-1.5">Verifique el año escolar o elija otra sección.</p>
            </div>
          )}

          {!loadingAlumnos && alumnos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden surface-in">
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50">
                <div className="flex items-center gap-2 text-[#093E7A] font-black">
                  <Users size={20} aria-hidden="true" />
                  <span>
                    {nombreGrado && nombreSeccion ? `${nombreGrado} "${nombreSeccion}" — ` : ""}
                    {alumnos.length} estudiantes
                  </span>
                </div>

                {/* RESUMEN EN VIVO */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-600">
                  {ESTADOS.map((e) => (
                    <span key={e.valor} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${e.punto}`} aria-hidden="true" />
                      {e.nombre}
                      <span className="text-gray-900 tabular-nums">{conteo[e.valor]}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th scope="col" className="px-6 py-4 text-xs font-black text-gray-600 uppercase">
                        N°
                      </th>
                      <th scope="col" className="px-6 py-4 text-xs font-black text-gray-600 uppercase">
                        Apellidos y Nombres
                      </th>
                      <th scope="col" className="px-6 py-4 text-xs font-black text-gray-600 uppercase">
                        DNI
                      </th>
                      <th scope="col" className="px-6 py-4 text-xs font-black text-gray-600 uppercase text-center">
                        Registro de Asistencia
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {alumnos.map((m, index) => {
                      const estadoActual = asistenciaState[m.id_matricula] || "P";
                      const nombre = `${m.alumno?.apellidos}, ${m.alumno?.nombres}`;

                      return (
                        <tr key={m.id_matricula} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="px-6 py-4 text-sm font-bold text-gray-500 tabular-nums">{index + 1}</td>
                          <td className="px-6 py-4 font-bold text-gray-800">{nombre}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium tabular-nums">{m.alumno?.dni}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <div role="group" aria-label={`Asistencia de ${nombre}`} className="flex bg-gray-100 p-1 rounded-xl w-fit">
                                {ESTADOS.map((e) => {
                                  const activo = estadoActual === e.valor;
                                  const Icono = e.icono;
                                  return (
                                    <button
                                      key={e.valor}
                                      type="button"
                                      onClick={() => setEstado(m.id_matricula, e.valor)}
                                      aria-pressed={activo}
                                      title={e.nombre}
                                      className={`flex items-center justify-center gap-1 w-[58px] py-1.5 rounded-lg text-xs font-black transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] ${
                                        activo ? `${e.activo} shadow-sm` : "text-gray-500 hover:bg-white hover:text-gray-700"
                                      }`}
                                    >
                                      <Icono size={14} className={activo ? "opacity-100" : "opacity-0"} aria-hidden="true" />
                                      <span>{e.letra}</span>
                                      <span className="sr-only">{e.nombre}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-gray-600 font-medium">
                  Se guardarán {alumnos.length} {alumnos.length === 1 ? "registro" : "registros"} con fecha{" "}
                  <span className="font-bold text-[#093E7A]">{fechaAsistencia}</span>.
                </p>
                <button
                  onClick={handleGuardarAsistencia}
                  disabled={isSaving}
                  className="bg-[#701C32] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#5a1628] transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] shadow-lg shadow-[#701C32]/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
                  {isSaving ? "Guardando..." : "Guardar Registro Diario"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* VISTA 2: REPORTE RESUMEN DE ASISTENCIA */}
      {tabActiva === "reporte" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden surface-in">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-blue-50/50">
            <div className="flex items-center gap-2 text-[#093E7A] font-black">
              <BarChart3 size={20} aria-hidden="true" />
              <span>
                Reporte General de Asistencia
                {selectedBimestre ? ` — ${selectedBimestre}° Bimestre` : " — Acumulado Anual"}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-600 tabular-nums">
              {reporteAlumnos.length} de {totalReporte} estudiantes
            </span>
          </div>

          {loadingReporte ? (
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-5 flex items-center gap-4">
                  <div className="h-4 w-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 flex-1 max-w-[200px] bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          ) : reporteAlumnos.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-3">
                <FileText size={24} />
              </div>
              <h4 className="font-bold text-gray-800">No se encontraron estudiantes</h4>
              <p className="text-xs text-gray-500 mt-1">Pruebe ajustando los filtros de nivel, grado o sección.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3.5 text-xs font-black text-gray-600 uppercase">N°</th>
                    <th className="px-5 py-3.5 text-xs font-black text-gray-600 uppercase">Estudiante</th>
                    <th className="px-5 py-3.5 text-xs font-black text-gray-600 uppercase">DNI</th>
                    <th className="px-5 py-3.5 text-xs font-black text-gray-600 uppercase">Grado / Sección</th>
                    <th className="px-3 py-3.5 text-xs font-black text-emerald-700 uppercase text-center">Presentes (P)</th>
                    <th className="px-3 py-3.5 text-xs font-black text-amber-700 uppercase text-center">Tardanzas (T)</th>
                    <th className="px-3 py-3.5 text-xs font-black text-red-700 uppercase text-center">Faltas (F)</th>
                    <th className="px-3 py-3.5 text-xs font-black text-slate-700 uppercase text-center">Justificadas (J)</th>
                    <th className="px-5 py-3.5 text-xs font-black text-[#093E7A] uppercase text-center">% Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {reporteAlumnos.map((a, idx) => {
                    const porc = a.porcentaje_asistencia;
                    const badgeColor =
                      porc >= 90
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : porc >= 75
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200";

                    return (
                      <tr key={a.id_matricula} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-xs font-bold text-gray-500 tabular-nums">{idx + 1}</td>
                        <td className="px-5 py-3.5 font-bold text-gray-800 text-sm">{a.alumno}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 font-medium tabular-nums">{a.dni}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">
                          <span className="font-semibold text-gray-700">{a.grado}</span> "{a.seccion}"
                          <span className="text-[10px] text-gray-400 block">{a.nivel}</span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs tabular-nums">
                            {a.presentes}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-black text-xs tabular-nums">
                            {a.tardanzas}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-black text-xs tabular-nums">
                            {a.faltas}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-black text-xs tabular-nums">
                            {a.justificaciones}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-black tabular-nums ${badgeColor}`}
                          >
                            <Percent size={12} />
                            {a.porcentaje_asistencia}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
