"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import {
  Seccion,
  MateriaDisponible,
  HorarioAsignado,
  BloqueHorario,
} from "@/src/interfaces/academic";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';
import { ModalConfiguracionHorario } from "@/src/components/Horario/ModalConfiguracionHorario";
import { generarPDFHorario } from "@/src/lib/pdfHorario";

// --- INTERFACES EXTENDIDAS PARA LA NUEVA LÓGICA ---
interface MateriaDisponibleExt extends MateriaDisponible {
  minutos_semanales: number;
  minutos_asignados: number;
}

interface HorarioAsignadoExt extends Omit<HorarioAsignado, 'id_hora'> {
  hora_inicio: string;
  hora_fin: string;
}

// Paleta para diferenciar visualmente los cursos en la grilla (mejora #8)
const COLORES_CURSO = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700" },
];
const colorCurso = (nombre: string) => {
  let h = 0;
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
  return COLORES_CURSO[h % COLORES_CURSO.length];
};

const COLOR_SECCION: Record<string, string> = {
  Rojo: "bg-red-500",
  Azul: "bg-blue-500",
  Amarillo: "bg-yellow-400",
  Verde: "bg-green-500",
  Naranja: "bg-orange-500",
  A: "bg-blue-600",
  B: "bg-indigo-600",
  C: "bg-purple-600",
};

const obtenerEtiquetaSeccion = (sec?: Seccion, esVerano?: boolean): string => {
  if (!sec) return "";
  if (esVerano) {
    if (sec.id_grado === 1) return `1ro y 2do Primaria - ${sec.nombre}`;
    if (sec.id_grado === 3) return `3ro y 4to Primaria - ${sec.nombre}`;
    if (sec.id_grado === 5) return `5to y 6to Primaria - ${sec.nombre}`;
    if (sec.id_grado === 7) return `1ro Secundaria - ${sec.nombre}`;
    if (sec.id_grado === 8) return `2do Secundaria - ${sec.nombre}`;
    if (sec.id_grado === 9) return `3ro Secundaria - ${sec.nombre}`;
    if (sec.id_grado === 10 || sec.id_grado === 11) return `Pre Academia - ${sec.nombre}`;
  }
  const gradoNombre = sec.grado?.nombre || `Grado ${sec.id_grado}`;
  return `${gradoNombre} - ${sec.nombre}`;
};

const obtenerEtiquetaGradoOGrupo = (sec?: Seccion, esVerano?: boolean): string => {
  if (!sec) return "";
  if (esVerano) {
    if (sec.id_grado === 1) return "1ro y 2do de Primaria";
    if (sec.id_grado === 3) return "3ro y 4to de Primaria";
    if (sec.id_grado === 5) return "5to y 6to de Primaria";
    if (sec.id_grado === 7) return "1ro de Secundaria";
    if (sec.id_grado === 8) return "2do de Secundaria";
    if (sec.id_grado === 9) return "3ro de Secundaria";
    if (sec.id_grado === 10 || sec.id_grado === 11) return "Pre Academia";
  }
  return sec.grado?.nombre || `Grado ${sec.id_grado}`;
};

export default function ConstructorHorariosPage() {
  const {
    anioPlanificacion,
    setAnioPlanificacion,
    listaAnios,
    loadingAnios
  } = useAnioAcademico();

  const anioObj = listaAnios.find(a => a.id_anio_escolar === anioPlanificacion);
  const esVerano = anioObj?.tipo === "VERANO";

  // --- ESTADOS PARA LA DATA ---
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null);
  const [nivelSeleccionado, setNivelSeleccionado] = useState<number>(1);
  const [materiasDisponibles, setMateriasDisponibles] = useState<MateriaDisponibleExt[]>([]);
  const [horarioAsignado, setHorarioAsignado] = useState<HorarioAsignadoExt[]>([]);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [configAbierta, setConfigAbierta] = useState(false);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  // --- REFERENCIA PARA IMPRESIÓN ---
  const contentRef = useRef<HTMLDivElement>(null);

  const seccionActivaObj = secciones.find(s => s.id_seccion === seccionActiva);

  const obtenerNivelDeSeccion = useCallback((sec: Seccion): number => {
    if (esVerano) {
      if ([1, 2, 3, 4, 5, 6].includes(sec.id_grado)) return 1; // Primaria
      if ([7, 8, 9].includes(sec.id_grado)) return 2;         // Secundaria
      if ([10, 11].includes(sec.id_grado)) return 3;        // Pre Academia
    }
    return sec.grado?.id_nivel || (sec.id_grado <= 6 ? 1 : 2);
  }, [esVerano]);

  const nivelesDisponibles = useMemo(() => {
    if (esVerano) {
      return [
        { id: 1, nombre: "Primaria (Verano)", icono: "domain" },
        { id: 2, nombre: "Secundaria (Verano)", icono: "domain" },
        { id: 3, nombre: "Pre Academia", icono: "school" },
      ];
    }
    return [
      { id: 1, nombre: "Primaria", icono: "domain" },
      { id: 2, nombre: "Secundaria", icono: "domain" },
    ];
  }, [esVerano]);

  const seccionesDelNivel = useMemo(() => {
    return secciones.filter((s: Seccion) => obtenerNivelDeSeccion(s) === nivelSeleccionado);
  }, [secciones, nivelSeleccionado, obtenerNivelDeSeccion]);

  // Si la sección activa cambia de año o de nivel, sincronizamos
  useEffect(() => {
    if (seccionesDelNivel.length > 0) {
      const existeEnNivel = seccionesDelNivel.some((s: Seccion) => s.id_seccion === seccionActiva);
      if (!existeEnNivel) {
        setSeccionActiva(seccionesDelNivel[0].id_seccion as number);
      }
    } else if (secciones.length > 0) {
      const primerNivelConSecciones = nivelesDisponibles.find(
        (n: { id: number; nombre: string; icono: string }) => secciones.some((s: Seccion) => obtenerNivelDeSeccion(s) === n.id)
      );
      if (primerNivelConSecciones && primerNivelConSecciones.id !== nivelSeleccionado) {
        setNivelSeleccionado(primerNivelConSecciones.id);
      }
    }
  }, [nivelSeleccionado, seccionesDelNivel, seccionActiva, secciones, nivelesDisponibles, obtenerNivelDeSeccion]);

  const exportarPDF = () => {
    if (!seccionActivaObj) {
      toast.error("Elige primero una sección");
      return;
    }
    const etiquetaGrado = obtenerEtiquetaGradoOGrupo(seccionActivaObj, esVerano);
    try {
      const { nombreArchivo, filas } = generarPDFHorario({
        bloques,
        asignaciones: horarioAsignado.map(h => ({
          dia_semana: h.dia_semana,
          hora_inicio: h.hora_inicio,
          curso_nombre: h.curso_nombre,
          docente_nombre: h.docente_nombre,
        })),
        grado: etiquetaGrado,
        seccion: seccionActivaObj.nombre,
        anio: anioPlanificacion || "",
      });

      if (filas === 0) {
        toast.warning("Esta sección aún no tiene bloques asignados");
        return;
      }
      toast.success(`Descargado ${nombreArchivo}`);
    } catch (error) {
      console.error(error);
      toast.error("No se pudo generar el PDF");
    }
  };

  // --- CONFIGURACIÓN DE IMPRESIÓN ---
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Horario_${obtenerEtiquetaGradoOGrupo(seccionActivaObj, esVerano)}_${seccionActivaObj?.nombre ?? ""}_${anioPlanificacion}`,
  });

  // --- 1. CARGA INICIAL (Secciones) ---
  useEffect(() => {
    if (!anioPlanificacion) return;

    const cargarConfiguracion = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/academic/secciones-horario/${anioPlanificacion}`);
        if (!res.ok) {
          toast.error(await mensajeDeError(res, "No se pudieron cargar las secciones"));
          setSecciones([]);
          setSeccionActiva(null);
          return;
        }
        const dataSec = await res.json();
        const lista: Seccion[] = Array.isArray(dataSec) ? dataSec : [];
        setSecciones(lista);

        if (lista.length > 0) {
          setNivelSeleccionado(obtenerNivelDeSeccion(lista[0]));
          setSeccionActiva(lista[0].id_seccion as number);
        } else {
          setSeccionActiva(null);
          setMateriasDisponibles([]);
          setHorarioAsignado([]);
          setBloques([]);
        }
      } catch (error) {
        toast.error("Error al cargar configuración del año seleccionado");
      } finally {
        setLoading(false);
      }
    };
    cargarConfiguracion();
  }, [anioPlanificacion, obtenerNivelDeSeccion]);

  // --- 2. CARGA POR SECCIÓN (Rejilla, materias y horario guardado) ---
  //
  // Las tres peticiones se piden a la vez pero se resuelven por separado: si
  // una falla, las otras dos siguen mostrándose y el aviso dice cuál fue. Antes
  // un solo fallo tumbaba la pantalla entera con un "Error de conexión" que no
  // decía nada.
  const cargarDatosSeccion = useCallback(async () => {
    if (!seccionActiva) return;

    const pedirLista = async (ruta: string, queEs: string): Promise<any[]> => {
      try {
        const res = await apiFetch(ruta);
        if (!res.ok) {
          toast.error(await mensajeDeError(res, `No se pudieron cargar ${queEs} (error ${res.status})`));
          return [];
        }
        const datos = await res.json();
        if (Array.isArray(datos)) return datos;
        toast.error(`La respuesta de ${queEs} no tiene el formato esperado`);
        return [];
      } catch {
        // fetch solo lanza cuando no se llegó al servidor
        toast.error(`No se pudo contactar al servidor al pedir ${queEs}`);
        return [];
      }
    };

    const [b, m, h] = await Promise.all([
      pedirLista(`/horarios/bloques/seccion/${seccionActiva}`, "los bloques del horario"),
      pedirLista(`/horarios/materias-disponibles/${seccionActiva}`, "los cursos de la sección"),
      pedirLista(`/horarios/seccion/${seccionActiva}`, "el horario guardado"),
    ]);

    setBloques(b);
    setMateriasDisponibles(m);
    setHorarioAsignado(h);
  }, [seccionActiva]);

  useEffect(() => { cargarDatosSeccion(); }, [cargarDatosSeccion]);

  // --- 4. LÓGICA DE ASIGNACIÓN (Drag & Drop dinámico y validación de bolsa) ---
  const handleDrop = async (idCargaAcademica: string | number, h_inicio: string, h_fin: string, dia: string, duracionBloque: number) => {
    
    const materia = materiasDisponibles.find(m => m.id_carga_academica.toString() === idCargaAcademica.toString());
    if (materia) {
      const minDisponibles = materia.minutos_semanales - materia.minutos_asignados;
      if (minDisponibles < duracionBloque) {
        toast.error(`Tiempo excedido. Quedan ${minDisponibles} minutos disponibles, el bloque es de ${duracionBloque} min.`);
        return;
      }
    }

    try {
      const res = await apiFetch(`/horarios/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_carga_academica: idCargaAcademica,
          hora_inicio: h_inicio,
          hora_fin: h_fin,
          dia_semana: dia
        })
      });

      if (!res.ok) {
        toast.error(await mensajeDeError(res, "No se pudo asignar el bloque"));
        return;
      }

      toast.success("Horario asignado");
      await cargarDatosSeccion();
    } catch (err) {
      toast.error("Error de conexión");
    }
  };

  const eliminarAsignacion = async (id_horario: number) => {
    try {
        await apiFetch(`/horarios/${id_horario}`, { method: 'DELETE' });
        toast.success("Bloque eliminado");
        await cargarDatosSeccion();
    } catch (e) {
        toast.error("Error al eliminar");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#F8FAFC]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#093E7A] mb-4"></div>
      <p className="font-bold">Cargando sistema de horarios...</p>
    </div>
  );

  const materiasCompletas = materiasDisponibles.filter(m => m.minutos_asignados >= m.minutos_semanales).length;
  const bloquesClase = bloques.filter(b => b.tipo === "clase").length;

  return (
    
    <RoleGuard modulo="academico" subModulo="horarios">
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
  /* Rejilla más compacta: la columna de la hora pasa de 120px a 78px y la
     altura de fila de 90px a 56px, que era lo que hacía que los bordes
     alrededor de la tabla se comieran la pantalla. */
  .schedule-grid { display: grid; grid-template-columns: 78px repeat(5, 1fr); }
  .time-slot { min-height: 56px; border-bottom: 1px solid #EDF1F6; border-right: 1px solid #EDF1F6; }
  .time-slot:last-child { border-right: none; }
  .slot-receso { min-height: 26px !important; }
  :root {
  color-interpolation-filters: sRGB !important;
}

#print-content {
  isolation: isolate;
  background-color: white !important;
}
  @media screen {
  #print-content, .time-slot, .materia-card {
    color-scheme: light;
    color-interpolation-filters: sRGB;
  }
}
  @media print {
    @page { size: landscape; margin: 10mm; }
    .no-print { display: none !important; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    
    .schedule-grid { grid-template-columns: 62px repeat(5, 1fr) !important; width: 100%; }
    .time-slot { min-height: 46px !important; }
    .slot-receso { min-height: 22px !important; }
    .bg-gray-100 { background-color: white !important; }
    .shadow-lg { shadow: none !important; box-shadow: none !important; }
    .bg-white { background-color: #ffffff !important; }
  .bg-[#F8FAFC] { background-color: #ffffff !important; }
  }
`}} />

      <div className="flex h-full overflow-hidden bg-[#F8FAFC]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="no-print">
            <HeaderPanel />
          </div>

          {/* min-h-16 y flex-wrap en vez de h-16: aquí conviven el título, el
              selector de año y tres botones. Con la altura fija y sin envolver,
              en móvil y en pantalla partida se salían de la pantalla. */}
          <div className="min-h-16 border-b bg-white flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 py-3 shrink-0 no-print">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
              <span className="material-symbols-outlined text-[#093E7A]">calendar_month</span>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Constructor de Horarios{anioPlanificacion ? ` ${anioPlanificacion}` : ""}</h2>
              <div className="flex items-center gap-2 sm:border-l sm:pl-6">
                <AnioSelector
                  value={anioPlanificacion}
                  onChange={setAnioPlanificacion}
                  anios={listaAnios}
                  loading={loadingAnios}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setConfigAbierta(true)}
                title="Duración del bloque, jornada y recesos"
                className="flex items-center gap-2 px-4 sm:px-5 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all whitespace-nowrap">
                <span className="material-symbols-outlined text-sm">tune</span> Configurar
              </button>

              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-2 px-4 sm:px-5 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all whitespace-nowrap">
                <span className="material-symbols-outlined text-sm">print</span> Imprimir
              </button>

              <button
                onClick={exportarPDF}
                className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#062d59] transition-all whitespace-nowrap">
                <span className="material-symbols-outlined text-sm">download</span> <span className="sm:hidden">PDF</span><span className="hidden sm:inline">Descargar PDF</span>
              </button>
            </div>
          </div>

          {/* SELECTOR DE NIVELES Y SECCIONES ORDENADOS */}
          <div className="bg-white border-b shrink-0 no-print">
            {/* 1. Pestañas de Nivel */}
            <div className="flex items-center gap-2 px-4 md:px-8 pt-3 border-b border-gray-100 overflow-x-auto">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-2 shrink-0">Nivel:</span>
              {nivelesDisponibles.map((nivel: { id: number; nombre: string; icono: string }) => {
                const cant = secciones.filter((s: Seccion) => obtenerNivelDeSeccion(s) === nivel.id).length;
                const activo = nivelSeleccionado === nivel.id;
                return (
                  <button
                    key={nivel.id}
                    onClick={() => setNivelSeleccionado(nivel.id)}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                      activo
                        ? `${nivel.id === 3 ? "text-[#701C32] border-[#701C32] bg-orange-50/50" : "text-[#093E7A] border-[#093E7A] bg-blue-50/50"}`
                        : "text-gray-500 border-transparent hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{nivel.icono}</span>
                    <span>{nivel.nombre}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activo ? "bg-white shadow-2xs font-black" : "bg-gray-100 text-gray-500"}`}>
                      {cant}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 2. Lista de Secciones del Nivel */}
            <div className="px-4 md:px-8 py-2.5 flex items-center gap-2.5 overflow-x-auto bg-gray-50/50">
              {seccionesDelNivel.length === 0 ? (
                <span className="py-2 text-xs font-medium text-gray-400 italic">
                  No hay secciones registradas en este nivel para este año.
                </span>
              ) : (
                seccionesDelNivel.map((sec: Seccion) => {
                  const activo = seccionActiva === sec.id_seccion;
                  const colorPunto = COLOR_SECCION[sec.nombre] || (activo ? "bg-white" : "bg-gray-400");
                  return (
                    <button
                      key={sec.id_seccion}
                      onClick={() => setSeccionActiva(sec.id_seccion as number)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border whitespace-nowrap shadow-2xs ${
                        activo
                          ? nivelSeleccionado === 3
                            ? "bg-[#701C32] text-white border-[#701C32] shadow-sm ring-2 ring-[#701C32]/20"
                            : "bg-[#093E7A] text-white border-[#093E7A] shadow-sm ring-2 ring-[#093E7A]/20"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${colorPunto}`} />
                      <span>{obtenerEtiquetaSeccion(sec, esVerano)}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* En pantallas estrechas la carga académica no puede ir en una
              columna de 288px al lado de la rejilla: dejaría menos de 100px
              para el horario. Se coloca arriba, como una banda con su propio
              scroll, y la rejilla ocupa el resto. A partir de lg vuelven a ir
              una al lado de la otra. */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="w-full lg:w-72 max-h-48 sm:max-h-56 lg:max-h-none bg-white border-b lg:border-b-0 lg:border-r flex flex-col shrink-0 no-print">
              <div className="p-4 border-b bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Carga Académica Disponible</h3>
                {materiasDisponibles.length > 0 && (
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-gray-500">Progreso de la sección</span>
                    <span className={`px-2 py-0.5 rounded-full ${materiasCompletas === materiasDisponibles.length ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {materiasCompletas} / {materiasDisponibles.length} completas
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {materiasDisponibles.length === 0 && (
                  <div className="text-center text-gray-400 py-10 px-2">
                    <span className="material-symbols-outlined text-4xl mb-2">menu_book</span>
                    <p className="text-xs font-medium">Esta sección no tiene cursos asignados. Asigna docentes en la pestaña "Asignar Docente".</p>
                  </div>
                )}
                {materiasDisponibles.map((mat) => {
                  const p = Math.min((mat.minutos_asignados / mat.minutos_semanales) * 100, 100) || 0;
                  const lleno = p === 100;
                  return (
                    <div
                      key={mat.id_carga_academica}
                      draggable={!lleno}
                      onDragStart={(e) => e.dataTransfer.setData("id_carga", mat.id_carga_academica.toString())}
                      className={`materia-card p-3 bg-white border border-gray-200 rounded-lg shadow-sm transition-all ${lleno ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#093E7A] cursor-grab'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[11px] font-black text-gray-700 uppercase">{mat.curso_nombre}</span>
                        {!lleno && <span className="material-symbols-outlined text-gray-300 text-sm">drag_indicator</span>}
                        {lleno && <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2 mb-2">
                        <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 border">
                          {mat.docente_nombre.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-[10px] text-gray-500">{mat.docente_nombre}</span>
                      </div>
                      
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1 overflow-hidden">
                        <div className={`h-1.5 rounded-full ${lleno ? 'bg-green-500' : 'bg-[#093E7A]'}`} style={{ width: `${p}%` }}></div>
                      </div>
                      <p className="text-[9px] font-bold text-gray-400 text-right">{mat.minutos_asignados} / {mat.minutos_semanales} min</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 p-3">
              <div ref={contentRef} id="print-content" className="bg-white rounded-lg shadow-sm border border-gray-200 min-w-[820px] overflow-hidden">

                <div className="hidden print:block text-center mb-4">
                  <h1 className="text-2xl font-black text-[#093E7A]">HORARIO ESCOLAR {anioPlanificacion}</h1>
                  <p className="text-base font-bold text-gray-500 uppercase tracking-widest">
                    Sección: {obtenerEtiquetaSeccion(seccionActivaObj, esVerano)}
                  </p>
                </div>

                <div className="schedule-grid bg-gray-50 border-b border-gray-200 text-center font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                  <div className="py-2 border-r border-gray-200">Hora</div>
                  {diasSemana.map(d => (
                    <div key={d} className="py-2 border-r border-gray-200 last:border-r-0 text-gray-700">{d}</div>
                  ))}
                </div>

                {bloques.length === 0 ? (
                  <div className="py-16 text-center text-gray-400">
                    <span className="material-symbols-outlined text-4xl block mb-2">schedule</span>
                    <p className="text-sm font-medium">No hay rejilla configurada para esta sección.</p>
                    <button
                      onClick={() => setConfigAbierta(true)}
                      className="mt-3 text-xs font-bold text-[#093E7A] underline no-print"
                    >
                      Configurar la jornada
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    {bloques.map((bloque, idx) => {
                      const esReceso = bloque.tipo === 'receso';
                      return (
                        <div key={`${bloque.hora_inicio}-${idx}`} className="schedule-grid">

                          <div className={`time-slot ${esReceso ? 'slot-receso' : ''} flex flex-col items-center justify-center text-[10px] font-bold ${esReceso ? 'bg-amber-50/60' : 'bg-gray-50/30'}`}>
                            <span className={esReceso ? 'text-amber-700' : 'text-gray-600'}>{bloque.hora_inicio}</span>
                            {!esReceso && <span className="text-gray-400 font-normal">{bloque.hora_fin}</span>}
                          </div>

                          {esReceso ? (
                            // El receso ocupa la franja entera: no se divide por días
                            // porque no hay nada que colocar dentro.
                            <div className="time-slot slot-receso col-span-5 bg-amber-50/60 flex items-center justify-center gap-2">
                              <span className="material-symbols-outlined text-amber-400 text-[13px]">free_breakfast</span>
                              <span className="text-[9px] font-black text-amber-600/80 uppercase tracking-[0.2em]">
                                {bloque.nombre || 'Receso'} · {bloque.duracion} min
                              </span>
                            </div>
                          ) : diasSemana.map((dia) => {
                            const asignacion = horarioAsignado.find(h => h.dia_semana === dia && h.hora_inicio.substring(0, 5) === bloque.hora_inicio);
                            const celdaKey = `${dia}-${bloque.hora_inicio}`;
                            const esDragOver = dragOverKey === celdaKey && !asignacion;
                            const color = asignacion ? colorCurso(asignacion.curso_nombre) : null;

                            return (
                              <div
                                key={celdaKey}
                                className={`time-slot group p-1 transition-colors ${esDragOver ? 'bg-blue-100 ring-2 ring-inset ring-[#093E7A]' : 'hover:bg-blue-50/30'}`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (!asignacion) setDragOverKey(celdaKey);
                                }}
                                onDragLeave={() => setDragOverKey(prev => (prev === celdaKey ? null : prev))}
                                onDrop={(e) => {
                                  setDragOverKey(null);
                                  const idCarga = e.dataTransfer.getData("id_carga");
                                  if (idCarga) {
                                    handleDrop(idCarga, bloque.hora_inicio, bloque.hora_fin, dia, bloque.duracion);
                                  }
                                }}
                              >
                                {asignacion && color ? (
                                  <div className={`group h-full w-full ${color.bg} border ${color.border} rounded-md px-1.5 py-1 flex flex-col justify-center relative animate-in fade-in zoom-in duration-300`}>
                                    <p className={`text-[10px] font-black ${color.text} uppercase leading-tight pr-4`}>{asignacion.curso_nombre}</p>
                                    <p className={`text-[9px] ${color.text} opacity-70 truncate`}>{asignacion.docente_nombre}</p>
                                    <button
                                      onClick={() => eliminarAsignacion(asignacion.id_horario)}
                                      title="Quitar del horario"
                                      className="absolute top-0.5 right-0.5 text-gray-400 hover:text-red-500 hover:bg-white/70 rounded size-4 flex items-center justify-center transition-colors no-print"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">close</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <span className="material-symbols-outlined text-gray-200 text-base">add</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-gray-400 mt-2 no-print">
                {bloquesClase} bloques de clase al día · {bloques.filter(b => b.tipo === 'receso').length} receso(s).
                Se cambia en <button onClick={() => setConfigAbierta(true)} className="font-bold text-[#093E7A] underline">Configurar</button>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ModalConfiguracionHorario
        isOpen={configAbierta}
        onClose={() => setConfigAbierta(false)}
        onGuardado={cargarDatosSeccion}
      />
    </>
    </RoleGuard>
  );
}