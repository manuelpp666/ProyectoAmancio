"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import {
  Seccion,
  AnioEscolar,
  MateriaDisponible,
  HorarioAsignado,
  HoraLectiva
} from "@/src/interfaces/academic";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';

// --- INTERFACES EXTENDIDAS PARA LA NUEVA LÓGICA ---
interface MateriaDisponibleExt extends MateriaDisponible {
  minutos_semanales: number;
  minutos_asignados: number;
}

interface HorarioAsignadoExt extends Omit<HorarioAsignado, 'id_hora'> {
  hora_inicio: string;
  hora_fin: string;
}

interface BloqueTiempo {
  hora_inicio: string;
  hora_fin: string;
  tipo: "clase" | "receso";
  duracion: number;
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

export default function ConstructorHorariosPage() {
  const {
    anioPlanificacion,
    setAnioPlanificacion,
    listaAnios,
    loadingAnios
  } = useAnioAcademico();

  // --- ESTADOS PARA LA DATA ---
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [seccionActiva, setSeccionActiva] = useState<number | null>(null);
  const [materiasDisponibles, setMateriasDisponibles] = useState<MateriaDisponibleExt[]>([]);
  const [horasLectivas, setHorasLectivas] = useState<HoraLectiva[]>([]);
  const [horarioAsignado, setHorarioAsignado] = useState<HorarioAsignadoExt[]>([]);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  // --- REFERENCIA PARA IMPRESIÓN ---
  const contentRef = useRef<HTMLDivElement>(null);

  const exportarPDFDirecto = async () => {
    const element = contentRef.current;
    if (!element) return;

    const toastId = toast.loading("Generando PDF completo...");

    try {
      const originalWidth = element.scrollWidth;
      const originalHeight = element.scrollHeight;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: originalWidth,          
        height: originalHeight,        
        windowWidth: originalWidth,
        windowHeight: originalHeight,
        x: 0,
        y: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10; 
      const maxImgWidth = pageWidth - margin * 2;
      const maxImgHeight = pageHeight - margin * 2;

      const imgWidth = maxImgWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      let positionY = margin;

      pdf.addImage(imgData, "JPEG", margin, positionY, imgWidth, imgHeight);

      while (imgHeight > maxImgHeight) {
        positionY = - (pageHeight - margin * 2); 
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, positionY, imgWidth, imgHeight);
        imgHeight -= (pageHeight - margin * 2);
        positionY -= (pageHeight - margin * 2);
      }

      pdf.save(`Horario_${anioPlanificacion || "completo"}.pdf`);

      toast.success("PDF generado completo ✓", { id: toastId });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al generar PDF completo", { id: toastId });
    }
  };
  
  // --- CONFIGURACIÓN DE IMPRESIÓN ---
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Horario_${anioPlanificacion}_Seccion`,
  });
  
  // --- 1. GENERADOR DE BLOQUES: 50 min de 7:30 a 19:30 con recesos fijos
  //        (mañana 10:50-11:10, tarde 17:30-17:50) ---
  const bloquesDinamicos = useMemo<BloqueTiempo[]>(() => {
    const toDate = (h: number, m: number) => new Date(2000, 0, 1, h, m);
    const fmt = (d: Date) => d.toTimeString().substring(0, 5);
    const recesos = [
      { inicio: toDate(10, 50), fin: toDate(11, 10) },
      { inicio: toDate(17, 30), fin: toDate(17, 50) },
    ];
    const end = toDate(19, 30);
    const DURACION = 50;
    const bloques: BloqueTiempo[] = [];
    let current = toDate(7, 30);

    while (current < end) {
      // ¿Empieza un receso exactamente en este punto?
      const receso = recesos.find(r => r.inicio.getTime() === current.getTime());
      if (receso) {
        bloques.push({
          hora_inicio: fmt(receso.inicio),
          hora_fin: fmt(receso.fin),
          tipo: "receso",
          duracion: (receso.fin.getTime() - receso.inicio.getTime()) / 60000,
        });
        current = receso.fin;
        continue;
      }
      // Bloque de clase de 50 min, recortado si cruza un receso o el fin de jornada
      let next = new Date(current.getTime() + DURACION * 60000);
      const cruza = recesos.find(r => r.inicio.getTime() > current.getTime() && r.inicio.getTime() < next.getTime());
      if (cruza) next = cruza.inicio;
      if (next.getTime() > end.getTime()) next = end;
      if (next.getTime() <= current.getTime()) break;
      bloques.push({
        hora_inicio: fmt(current),
        hora_fin: fmt(next),
        tipo: "clase",
        duracion: (next.getTime() - current.getTime()) / 60000,
      });
      current = next;
    }
    return bloques;
  }, []);

  // --- 2. CARGA INICIAL (Secciones y Horas) ---
  useEffect(() => {
    if (!anioPlanificacion) return;

    const cargarConfiguracion = async () => {
      try {
        setLoading(true);
        const [resSec, resHoras] = await Promise.all([
          apiFetch(`/academic/secciones-horario/${anioPlanificacion}`),
          apiFetch(`/horarios/horas`) 
        ]);

        const dataSec = await resSec.json();
        const dataHoras = await resHoras.json();

        setSecciones(Array.isArray(dataSec) ? dataSec : []);
        setHorasLectivas(Array.isArray(dataHoras) ? dataHoras : []);

        if (dataSec.length > 0) {
          // CORRECCIÓN TYPESCRIPT: as number
          setSeccionActiva(dataSec[0].id_seccion as number);
        } else {
          setSeccionActiva(null);
          setMateriasDisponibles([]);
          setHorarioAsignado([]);
        }
      } catch (error) {
        toast.error("Error al cargar configuración del año seleccionado");
      } finally {
        setLoading(false);
      }
    };
    cargarConfiguracion();
  }, [anioPlanificacion]);

  // --- 3. CARGA POR SECCIÓN (Materias y Horario guardado) ---
  useEffect(() => {
    if (!seccionActiva) return;

    const cargarDatosSeccion = async () => {
      const [resMat, resHorario] = await Promise.all([
        apiFetch(`/horarios/materias-disponibles/${seccionActiva}`),
        apiFetch(`/horarios/seccion/${seccionActiva}`)
      ]);
      setMateriasDisponibles(await resMat.json());
      setHorarioAsignado(await resHorario.json());
    };
    cargarDatosSeccion();
  }, [seccionActiva]);

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

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail); 
        return;
      }

      toast.success("Horario asignado");
      const [resMat, resHorario] = await Promise.all([
        apiFetch(`/horarios/materias-disponibles/${seccionActiva}`),
        apiFetch(`/horarios/seccion/${seccionActiva}`)
      ]);
      setMateriasDisponibles(await resMat.json());
      setHorarioAsignado(await resHorario.json());
    } catch (err) {
      toast.error("Error de conexión");
    }
  };

  const eliminarAsignacion = async (id_horario: number) => {
    try {
        await apiFetch(`/horarios/${id_horario}`, { method: 'DELETE' });
        toast.success("Bloque eliminado");
        
        const [resMat, resHorario] = await Promise.all([
          apiFetch(`/horarios/materias-disponibles/${seccionActiva}`),
          apiFetch(`/horarios/seccion/${seccionActiva}`)
        ]);
        setMateriasDisponibles(await resMat.json());
        setHorarioAsignado(await resHorario.json());
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

  const seccionActivaObj = secciones.find(s => s.id_seccion === seccionActiva);
  const materiasCompletas = materiasDisponibles.filter(m => m.minutos_asignados >= m.minutos_semanales).length;

  return (
    
    <RoleGuard modulo="academico" subModulo="horarios">
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
  .schedule-grid { display: grid; grid-template-columns: 120px repeat(5, 1fr); }
  .time-slot { min-height: 90px; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; }
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
    
    .schedule-grid { grid-template-columns: 80px repeat(5, 1fr) !important; width: 100%; }
    .time-slot { min-height: 70px !important; }
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

          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0 no-print">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#093E7A]">calendar_month</span>
              <h2 className="text-xl font-bold text-gray-800">Constructor de Horarios{anioPlanificacion ? ` ${anioPlanificacion}` : ""}</h2>
              <div className="flex items-center gap-2 border-l pl-6">
                <AnioSelector
                  value={anioPlanificacion}
                  onChange={setAnioPlanificacion}
                  anios={listaAnios}
                  loading={loadingAnios}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all">
                <span className="material-symbols-outlined text-sm">print</span> Imprimir
              </button>

              <button
                onClick={exportarPDFDirecto}
                className="flex items-center gap-2 px-5 py-2 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#062d59] transition-all">
                <span className="material-symbols-outlined text-sm">download</span> Descargar PDF
              </button>
            </div>
          </div>

          <div className="bg-white px-8 border-b shrink-0 flex gap-6 overflow-x-auto no-print">
            {secciones.length === 0 ? (
              <span className="py-4 text-sm font-medium text-gray-400 italic">
                No hay secciones registradas para este año.
              </span>
            ) : secciones.map((sec) => (
              <button
                key={sec.id_seccion}
                onClick={() => setSeccionActiva(sec.id_seccion as number)}
                className={`py-4 px-2 text-sm font-bold whitespace-nowrap border-b-[3px] transition-all ${seccionActiva === sec.id_seccion ? "text-[#093E7A] border-[#093E7A]" : "text-gray-400 border-transparent hover:text-gray-600"
                  }`}
              >
                {sec.grado?.nombre} - {sec.nombre}
              </button>
            ))}
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 bg-white border-r flex flex-col shrink-0 no-print">
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

            <div className="flex-1 overflow-auto bg-gray-100 p-8">
              <div ref={contentRef} id="print-content" className="bg-white rounded-xl shadow-lg border border-gray-200 min-w-[900px] overflow-hidden">

                <div className="hidden print:block text-center mb-8">
                  <h1 className="text-3xl font-black text-[#093E7A]">HORARIO ESCOLAR {anioPlanificacion}</h1>
                  <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">
                    Sección: {seccionActivaObj?.grado?.nombre} - {seccionActivaObj?.nombre}
                  </p>
                  <div className="mt-4 border-b-2 border-[#093E7A] w-1/4 mx-auto"></div>
                </div>
                
                <div className="schedule-grid bg-gray-50 border-b text-center font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                  <div className="p-4 border-r">Bloque</div>
                  {diasSemana.map(d => <div key={d} className="p-4 border-r text-gray-700">{d}</div>)}
                </div>

                <div className="relative">
                  {bloquesDinamicos.map((bloque, idx) => (
                    <div key={idx} className="schedule-grid">
                      
                      <div className={`time-slot flex flex-col items-center justify-center text-[10px] font-bold ${bloque.tipo === 'receso' ? 'bg-slate-100' : 'bg-gray-50/30'}`}>
                        <span className="text-gray-600">{bloque.hora_inicio}</span>
                        <span className="text-gray-400 font-normal">{bloque.hora_fin}</span>
                      </div>

                      {diasSemana.map((dia) => {
                        const asignacion = horarioAsignado.find(h => h.dia_semana === dia && h.hora_inicio.substring(0,5) === bloque.hora_inicio);
                        const celdaKey = `${dia}-${bloque.hora_inicio}`;
                        const esDragOver = dragOverKey === celdaKey && bloque.tipo !== 'receso' && !asignacion;
                        const color = asignacion ? colorCurso(asignacion.curso_nombre) : null;

                        return (
                          <div
                            key={celdaKey}
                            className={`time-slot group p-2 transition-colors ${bloque.tipo === 'receso' ? 'bg-slate-50' : esDragOver ? 'bg-blue-100 ring-2 ring-inset ring-[#093E7A]' : 'hover:bg-blue-50/30'}`}
                            onDragOver={(e) => {
                              e.preventDefault();
                              if (bloque.tipo !== 'receso' && !asignacion) setDragOverKey(celdaKey);
                            }}
                            onDragLeave={() => setDragOverKey(prev => (prev === celdaKey ? null : prev))}
                            onDrop={(e) => {
                              setDragOverKey(null);
                              const idCarga = e.dataTransfer.getData("id_carga");
                              if (idCarga && bloque.tipo !== 'receso') {
                                handleDrop(idCarga, bloque.hora_inicio, bloque.hora_fin, dia, bloque.duracion);
                              }
                            }}
                          >
                            {bloque.tipo === 'receso' ? (
                              <div className="h-full flex items-center justify-center">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest rotate-[-10deg]">Receso</span>
                              </div>
                            ) : asignacion && color ? (
                              <div className={`group h-full w-full ${color.bg} border ${color.border} rounded-lg p-2 flex flex-col justify-between relative animate-in fade-in zoom-in duration-300`}>
                                <div>
                                  <p className={`text-[10px] font-black ${color.text} uppercase leading-tight`}>{asignacion.curso_nombre}</p>
                                  <p className={`text-[9px] ${color.text} opacity-70 mt-1`}>{asignacion.docente_nombre}</p>
                                </div>
                                <button
                                  onClick={() => eliminarAsignacion(asignacion.id_horario)}
                                  title="Quitar del horario"
                                  className="absolute top-1 right-1 text-gray-400 hover:text-red-500 hover:bg-white/70 rounded size-5 flex items-center justify-center transition-colors no-print"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
    </RoleGuard>
  );
}