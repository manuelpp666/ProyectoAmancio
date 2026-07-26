"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Calendar, Users, Save, CheckCircle2, Clock, XCircle, ClipboardCheck, FileText, SlidersHorizontal } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { Nivel, Grado, Seccion } from "@/src/interfaces/academic";

type Estado = "P" | "T" | "F" | "J";

const ESTADOS: { valor: Estado; letra: string; nombre: string; icono: typeof CheckCircle2; activo: string; punto: string }[] = [
  { valor: "P", letra: "P", nombre: "Presente", icono: CheckCircle2, activo: "bg-emerald-600 text-white", punto: "bg-emerald-600" },
  { valor: "T", letra: "T", nombre: "Tardanza", icono: Clock, activo: "bg-amber-600 text-white", punto: "bg-amber-600" },
  { valor: "F", letra: "F", nombre: "Falta", icono: XCircle, activo: "bg-red-600 text-white", punto: "bg-red-600" },
  { valor: "J", letra: "J", nombre: "Justificado", icono: FileText, activo: "bg-slate-600 text-white", punto: "bg-slate-600" },
];

export default function AsistenciaAuxiliarPage() {
  const { anioPlanificacion } = useAnioAcademico();
  const [fechaAsistencia, setFechaAsistencia] = useState(new Date().toISOString().split("T")[0]);

  // Filtros
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);

  const [selectedNivel, setSelectedNivel] = useState("");
  const [selectedGrado, setSelectedGrado] = useState("");
  const [selectedSeccion, setSelectedSeccion] = useState("");

  // Datos de Estudiantes
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [asistenciaState, setAsistenciaState] = useState<Record<number, Estado>>({});

  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Descarta respuestas que lleguen fuera de orden al cambiar de sección rápido.
  const peticionActiva = useRef(0);

  // 1. Cargar Niveles
  useEffect(() => {
    const fetchNiveles = async () => {
      try {
        const res = await apiFetch("/academic/niveles/");
        if (res.ok) setNiveles(await res.json());
      } catch (e) {
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
      } catch (e) { toast.error("Error cargando grados"); }
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
      } catch (e) { toast.error("Error cargando secciones"); }
    };
    fetchSecciones();
  }, [selectedGrado, anioPlanificacion]);

  // 4. Cargar los alumnos en cuanto hay una sección seleccionada (sin botón)
  useEffect(() => {
    if (!selectedSeccion || !anioPlanificacion) {
      peticionActiva.current++;
      setAlumnos([]);
      setAsistenciaState({});
      setLoadingAlumnos(false);
      return;
    }

    const idPeticion = ++peticionActiva.current;
    setLoadingAlumnos(true);

    const fetchAlumnos = async () => {
      try {
        const res = await apiFetch(`/enrollment/matriculas/?seccion_id=${selectedSeccion}&anio_id=${anioPlanificacion}`);
        if (idPeticion !== peticionActiva.current) return;

        if (res.ok) {
          const data = await res.json();

          // Ordenamos alfabéticamente por apellidos
          const alumnosOrdenados = data.sort((a: any, b: any) => {
            if (a.alumno?.apellidos < b.alumno?.apellidos) return -1;
            if (a.alumno?.apellidos > b.alumno?.apellidos) return 1;
            return 0;
          });

          if (idPeticion !== peticionActiva.current) return;
          setAlumnos(alumnosOrdenados);

          // Inicializar estado de asistencia a "Presente" por defecto para todos
          const initialState: Record<number, Estado> = {};
          alumnosOrdenados.forEach((m: any) => {
            initialState[m.id_matricula] = "P";
          });
          setAsistenciaState(initialState);
        } else {
          setAlumnos([]);
          toast.error("No se pudieron cargar los estudiantes");
        }
      } catch (e) {
        if (idPeticion !== peticionActiva.current) return;
        setAlumnos([]);
        toast.error("Error de conexión");
      } finally {
        if (idPeticion === peticionActiva.current) setLoadingAlumnos(false);
      }
    };

    fetchAlumnos();
  }, [selectedSeccion, anioPlanificacion]);

  // 5. Manejar el cambio de un botón individual de asistencia
  const setEstado = (idMatricula: number, estado: Estado) => {
    setAsistenciaState(prev => ({ ...prev, [idMatricula]: estado }));
  };

  // 6. Enviar Asistencia al Backend (en lote) y notificar por correo a los apoderados
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
          `Asistencia registrada. Se enviará confirmación por correo a ${data.correos_encolados} apoderado(s).`
        );
      } else {
        toast.success("Asistencia registrada correctamente");
      }
    } catch (error) {
      toast.error("Hubo un error al registrar la asistencia");
    } finally {
      setIsSaving(false);
    }
  };

  // Conteo en vivo por estado: la leyenda deja de ser decorativa y pasa a informar.
  const conteo = useMemo(() => {
    const base: Record<Estado, number> = { P: 0, T: 0, F: 0, J: 0 };
    alumnos.forEach((m) => { base[asistenciaState[m.id_matricula] || "P"]++; });
    return base;
  }, [alumnos, asistenciaState]);

  const nombreSeccion = secciones.find(s => String(s.id_seccion) === selectedSeccion)?.nombre;
  const nombreGrado = grados.find(g => String(g.id_grado) === selectedGrado)?.nombre;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ENCABEZADO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <ClipboardCheck size={28} /> Control de Asistencia Diaria
          </h2>
          <p className="text-gray-600 text-sm mt-1">Elija una sección y marque la asistencia correspondiente.</p>
        </div>

        <div className="shrink-0">
          <label htmlFor="fecha-asistencia" className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">
            Fecha del registro
          </label>
          <div className="flex items-center gap-3 bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-200 focus-within:border-[#093E7A] transition-colors duration-150">
            <Calendar size={18} className="text-gray-500" aria-hidden="true" />
            <input
              id="fecha-asistencia"
              type="date"
              value={fechaAsistencia}
              onChange={(e) => setFechaAsistencia(e.target.value)}
              className="bg-transparent font-bold text-gray-800 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* FILTROS DE BÚSQUEDA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <SlidersHorizontal size={13} aria-hidden="true" /> Filtros de Sección
          </h3>

          {/* Estado de la búsqueda automática */}
          <p aria-live="polite" className="text-xs font-bold text-gray-500 flex items-center gap-2 min-h-[16px]">
            {loadingAlumnos ? (
              <>
                <Loader2 size={13} className="animate-spin text-[#093E7A]" aria-hidden="true" />
                Cargando estudiantes...
              </>
            ) : selectedSeccion && alumnos.length > 0 ? (
              <span className="text-[#093E7A]">
                {alumnos.length} {alumnos.length === 1 ? "estudiante" : "estudiantes"}
                {nombreGrado && nombreSeccion ? ` en ${nombreGrado} "${nombreSeccion}"` : ""}
              </span>
            ) : null}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="space-y-1.5">
            <label htmlFor="filtro-nivel" className="text-xs font-bold text-gray-700">Nivel</label>
            <select
              id="filtro-nivel"
              value={selectedNivel}
              onChange={(e) => setSelectedNivel(e.target.value)}
              disabled={loadingFiltros}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccione Nivel</option>
              {niveles.map(n => <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filtro-grado" className="text-xs font-bold text-gray-700">Grado</label>
            <select
              id="filtro-grado"
              value={selectedGrado}
              onChange={(e) => setSelectedGrado(e.target.value)}
              disabled={!selectedNivel}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccione Grado</option>
              {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="filtro-seccion" className="text-xs font-bold text-gray-700">Sección</label>
            <select
              id="filtro-seccion"
              value={selectedSeccion}
              onChange={(e) => setSelectedSeccion(e.target.value)}
              disabled={!selectedGrado}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Seleccione Sección</option>
              {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CARGANDO: esqueleto con la forma de la tabla final */}
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

      {/* SIN SECCIÓN: estado vacío que enseña el flujo */}
      {!loadingAlumnos && !selectedSeccion && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#093E7A] flex items-center justify-center mx-auto mb-4">
            <Users size={28} aria-hidden="true" />
          </div>
          <h3 className="font-black text-gray-800">Elija una sección para empezar</h3>
          <p className="text-sm text-gray-600 mt-1.5 max-w-md mx-auto">
            Al seleccionar nivel, grado y sección, la lista de estudiantes se carga sola y todos quedan
            marcados como presentes. Solo tendrá que corregir las excepciones.
          </p>
        </div>
      )}

      {/* SECCIÓN VACÍA */}
      {!loadingAlumnos && selectedSeccion && alumnos.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-16 text-center surface-in">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
            <Users size={28} aria-hidden="true" />
          </div>
          <h3 className="font-black text-gray-800">Esta sección no tiene estudiantes matriculados</h3>
          <p className="text-sm text-gray-600 mt-1.5">Verifique el año escolar o elija otra sección.</p>
        </div>
      )}

      {/* TABLA DE ASISTENCIA */}
      {!loadingAlumnos && alumnos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden surface-in">

          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/50">
            <div className="flex items-center gap-2 text-[#093E7A] font-black">
              <Users size={20} aria-hidden="true" />
              <span>Estudiantes: {alumnos.length}</span>
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
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th scope="col" className="px-6 py-4 text-xs font-black text-gray-600 uppercase">N°</th>
                  <th scope="col" className="px-6 py-4 text-xs font-black text-gray-600 uppercase">Apellidos y Nombres</th>
                  <th scope="col" className="px-6 py-4 text-xs font-black text-gray-600 uppercase">DNI</th>
                  <th scope="col" className="px-6 py-4 text-xs font-black text-gray-600 uppercase text-center">Registro de Asistencia</th>
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
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium tabular-nums">
                        {m.alumno?.dni}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {/* Segmented Control para marcar estado */}
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
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-gray-600 font-medium">
              Se guardarán {alumnos.length} {alumnos.length === 1 ? "registro" : "registros"} con fecha{" "}
              <span className="font-bold text-gray-800">{fechaAsistencia}</span>.
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

    </div>
  );
}
