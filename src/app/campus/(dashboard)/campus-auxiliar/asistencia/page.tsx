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
  AlertTriangle,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { Nivel, Grado, Seccion } from "@/src/interfaces/academic";
import { fechaLocalISO } from "@/src/lib/fechas";
import { ReporteAsistencia } from "@/src/components/Campus/ReporteAsistencia";

type Estado = "P" | "T" | "F" | "J";

const ESTADOS: { valor: Estado; letra: string; nombre: string; icono: typeof CheckCircle2; activo: string; punto: string }[] = [
  { valor: "P", letra: "P", nombre: "Presente", icono: CheckCircle2, activo: "bg-emerald-600 text-white", punto: "bg-emerald-600" },
  { valor: "T", letra: "T", nombre: "Tardanza", icono: Clock, activo: "bg-amber-600 text-white", punto: "bg-amber-600" },
  { valor: "F", letra: "F", nombre: "Falta", icono: XCircle, activo: "bg-red-600 text-white", punto: "bg-red-600" },
  { valor: "J", letra: "J", nombre: "Justificado", icono: FileText, activo: "bg-slate-600 text-white", punto: "bg-slate-600" },
];

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

  /**
   * ¿La lista que está en pantalla todavía no se ha guardado?
   *
   * Se pone en true en cuanto se carga un aula que ese día aún no tiene
   * asistencia registrada, AUNQUE no se toque ninguna letra. El caso que se
   * escapaba era justo el aula sin novedad: se veía a todos en "P", parecía
   * que ya estaba puesto, y se pasaba a la siguiente aula sin pulsar Guardar,
   * así que ese día quedaba sin registrar y nadie se enteraba.
   */
  const [pendienteGuardar, setPendienteGuardar] = useState(false);

  /** Lo que se hará si decide salir del aula. null = no hay pregunta abierta. */
  const [accionPendiente, setAccionPendiente] = useState<(() => void) | null>(null);

  const peticionActiva = useRef(0);

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
      setPendienteGuardar(false);
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
        setPendienteGuardar(false);
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
      // Si ese día ya tiene asistencia guardada, lo que se ve es lo que hay en
      // la base y no hay nada pendiente. Si no, queda pendiente desde el
      // primer momento, sin esperar a que se marque nada.
      setPendienteGuardar(
        alumnosOrdenados.length > 0 && Object.keys(mapaGuardado).length === 0
      );
    } catch {
      if (idPeticion !== peticionActiva.current) return;
      setAlumnos([]);
      setPendienteGuardar(false);
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

  // Manejar el cambio de un botón individual de asistencia
  const setEstado = (idMatricula: number, estado: Estado) => {
    setAsistenciaState((prev) => ({ ...prev, [idMatricula]: estado }));
    setPendienteGuardar(true);
  };

  // Guardar Asistencia al Backend (en lote)
  const handleGuardarAsistencia = async (): Promise<boolean> => {
    if (alumnos.length === 0) return false;
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
      setPendienteGuardar(false);
      return true;
    } catch {
      toast.error("Hubo un error al registrar la asistencia");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Salir del aula: cambiar de sección, de fecha o de pestaña.
   *
   * No se bloquea la salida, porque a veces uno se mete en el aula equivocada
   * y quiere irse. Lo que no puede pasar es irse sin enterarse.
   */
  const alSalirDeLaLista = (accion: () => void) => {
    if (!pendienteGuardar) {
      accion();
      return;
    }
    // Envuelta en otra función: useState ejecuta lo que recibe si es función.
    setAccionPendiente(() => accion);
  };

  const continuarSinGuardar = () => {
    const accion = accionPendiente;
    setAccionPendiente(null);
    setPendienteGuardar(false);
    accion?.();
  };

  const guardarYContinuar = async () => {
    const accion = accionPendiente;
    const guardado = await handleGuardarAsistencia();
    // Si el guardado falla, la pregunta sigue abierta: nadie sale por error.
    if (!guardado) return;
    setAccionPendiente(null);
    accion?.();
  };

  // Cerrar la pestaña o recargar con la asistencia sin guardar. Aquí el aviso
  // lo da el navegador con su propio texto; es lo único que permite.
  useEffect(() => {
    if (!pendienteGuardar) return;
    const avisar = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [pendienteGuardar]);

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

  /**
   * Botón de guardar.
   *
   * Va en una barra pegada al borde inferior de la pantalla, de modo que se ve
   * siempre mientras se recorre la lista. Antes estaba al final de la tabla:
   * en un aula de treinta alumnos había que bajar hasta abajo del todo para
   * encontrarlo, y era fácil salir sin guardar.
   */
  const botonGuardar = (
    <button
      onClick={handleGuardarAsistencia}
      disabled={isSaving}
      className="w-full sm:w-auto bg-[#701C32] text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#5a1628] transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] shadow-lg shadow-[#701C32]/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      {isSaving ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
      {isSaving ? "Guardando..." : "Guardar Registro Diario"}
    </button>
  );

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
            onClick={() => alSalirDeLaLista(() => setTabActiva("reporte"))}
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

      {/* VISTA 1: TOMA DE ASISTENCIA DIARIA */}
      {tabActiva === "toma" && (
        <>
          {/* FILTROS DE BÚSQUEDA */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal size={13} aria-hidden="true" /> Filtros de Búsqueda
              </h3>

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
                    onChange={(e) => {
                      const valor = e.target.value;
                      alSalirDeLaLista(() => setFechaAsistencia(valor));
                    }}
                    className="bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="filtro-nivel" className="text-xs font-bold text-gray-700">
                  Nivel
                </label>
                <select
                  id="filtro-nivel"
                  value={selectedNivel}
                  onChange={(e) => {
                    const valor = e.target.value;
                    alSalirDeLaLista(() => setSelectedNivel(valor));
                  }}
                  disabled={loadingFiltros}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccione Nivel</option>
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
                  onChange={(e) => {
                    const valor = e.target.value;
                    alSalirDeLaLista(() => setSelectedGrado(valor));
                  }}
                  disabled={!selectedNivel}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccione Grado</option>
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
                  onChange={(e) => {
                    const valor = e.target.value;
                    alSalirDeLaLista(() => setSelectedSeccion(valor));
                  }}
                  disabled={!selectedGrado}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccione Sección</option>
                  {secciones.map((s) => (
                    <option key={s.id_seccion} value={s.id_seccion}>
                      {s.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

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
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden surface-in">
                {/* CABECERA: datos del aula y resumen en vivo */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50">
                  <div className="flex items-center gap-2 text-[#093E7A] font-black flex-wrap">
                    <Users size={20} aria-hidden="true" />
                    <span>
                      {nombreGrado && nombreSeccion ? `${nombreGrado} "${nombreSeccion}" — ` : ""}
                      {alumnos.length} estudiantes
                    </span>
                    {pendienteGuardar ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-[10px] uppercase tracking-wider">
                        <AlertTriangle size={12} aria-hidden="true" /> Sin guardar
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] uppercase tracking-wider">
                        <CheckCircle2 size={12} aria-hidden="true" /> Guardada
                      </span>
                    )}
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
                                        // `relative` no mueve nada, pero hace falta.
                                        //
                                        // Dentro va un <span class="sr-only"> con el
                                        // nombre del estado, para que un lector de
                                        // pantalla diga "Presente" y no "P". `sr-only`
                                        // lo pone en position:absolute, y un absolute
                                        // sin ancestro posicionado se cuelga del
                                        // documento entero, no del contenedor con
                                        // scroll de la tabla. Resultado: los spans de
                                        // las últimas columnas quedaban a 868px en una
                                        // ventana de 785 y toda la página se podía
                                        // arrastrar a la derecha hacia un vacío.
                                        // Con esto el span se ancla al botón.
                                        className={`relative flex items-center justify-center gap-1 w-[58px] py-1.5 rounded-lg text-xs font-black transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.97] ${
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
              </div>

              {/* BARRA FIJA DE GUARDADO
                  Va fuera de la tarjeta a propósito: la tarjeta tiene
                  overflow-hidden para redondear la tabla, y dentro de un
                  contenedor así `sticky` deja de pegarse al borde de la
                  pantalla. Aquí abajo acompaña al usuario mientras recorre la
                  lista, por larga que sea. */}
              <div className="sticky bottom-0 z-10 -mx-4 md:mx-0 px-4 md:px-0 pb-2 pt-3 bg-gradient-to-t from-[#F2F4F7] via-[#F2F4F7] to-transparent">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-gray-600 font-medium">
                    Se guardarán {alumnos.length} {alumnos.length === 1 ? "registro" : "registros"} con fecha{" "}
                    <span className="font-bold text-[#093E7A]">{fechaAsistencia}</span>.
                    {pendienteGuardar && (
                      <span className="block text-amber-700 font-bold mt-0.5">
                        Aunque estén todos presentes, el día no queda registrado hasta que pulses Guardar.
                      </span>
                    )}
                  </p>
                  {botonGuardar}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* VISTA 2: REPORTE RESUMEN DE ASISTENCIA
          La tabla es la misma que ve el administrador en Gestión de
          Estudiantes; vive en un componente compartido. El auxiliar trabaja
          sobre el año que tiene elegido, así que no se le repite el selector. */}
      {tabActiva === "reporte" && <ReporteAsistencia anioId={anioPlanificacion} />}

      {/* AVISO AL SALIR DEL AULA CON LA ASISTENCIA SIN GUARDAR */}
      {accionPendiente && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !isSaving) setAccionPendiente(null); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-sin-guardar"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 shrink-0">
                <AlertTriangle size={22} aria-hidden="true" />
              </div>
              <div>
                <h3 id="titulo-sin-guardar" className="text-lg font-black text-gray-800 leading-tight">
                  La asistencia no está guardada
                </h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                  {nombreGrado && nombreSeccion ? `${nombreGrado} "${nombreSeccion}", ` : ""}
                  {fechaAsistencia}. Marcar la lista no guarda nada por sí solo, ni siquiera cuando
                  están todos presentes: si sales ahora, este día queda sin registrar.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setAccionPendiente(null)}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                Seguir aquí
              </button>
              <button
                type="button"
                onClick={continuarSinGuardar}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Salir sin guardar
              </button>
              <button
                type="button"
                onClick={guardarYContinuar}
                disabled={isSaving}
                className="flex-[1.4] py-3 rounded-xl font-bold text-sm text-white bg-[#701C32] hover:bg-[#5a1628] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {isSaving && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {isSaving ? "Guardando..." : "Guardar y salir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
