"use client";
import { useState, useEffect, useRef } from "react";
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
  const [bloquesDinamicos, setBloquesDinamicos] = useState<BloqueTiempo[]>([]);
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
  
  // --- 1. GENERADOR DINÁMICO DE BLOQUES SEGÚN NIVEL ---
  useEffect(() => {
    if (!seccionActiva || secciones.length === 0) return;
    const seccion = secciones.find(s => s.id_seccion === seccionActiva);
    const gradoNombre = seccion?.grado?.nombre?.toLowerCase() || "";
    
    const esSecundaria = gradoNombre.includes("secundaria");
    const esPrimaria = !esSecundaria; 

    const bloques: BloqueTiempo[] = [];
    let current = new Date(2000, 0, 1, 7, 30); // Inicio fijo: 7:30 AM
    const endTime = esPrimaria ? new Date(2000, 0, 1, 18, 30) : new Date(2000, 0, 1, 19, 30);
    const duration = esPrimaria ? 45 : 50;

    while (current < endTime) {
      const next = new Date(current.getTime() + duration * 60000);
      if (next > endTime) break;
      bloques.push({
        hora_inicio: current.toTimeString().substring(0, 5),
        hora_fin: next.toTimeString().substring(0, 5),
        tipo: "clase",
        duracion: duration
      });
      current = next;
    }
    setBloquesDinamicos(bloques);
  }, [seccionActiva, secciones]);

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

  if (loading) return <div className="p-10 text-center font-bold">Cargando Sistema de Horarios...</div>;

  return (
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

      <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="no-print">
            <HeaderPanel />
          </div>

          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0 no-print">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#093E7A]">calendar_month</span>
              <h2 className="text-xl font-bold text-gray-800">Constructor 2026</h2>
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
            {secciones?.map((sec) => (
              <button
                key={sec.id_seccion}
                // CORRECCIÓN TYPESCRIPT: as number
                onClick={() => setSeccionActiva(sec.id_seccion as number)}
                className={`py-4 px-2 text-sm font-bold whitespace-nowrap transition-all ${seccionActiva === sec.id_seccion ? "active-tab text-[#093E7A]" : "text-gray-400 border-b-[3px] border-transparent"
                  }`}
              >
                {sec.grado?.nombre} - {sec.nombre}
              </button>
            ))}
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-72 bg-white border-r flex flex-col shrink-0 no-print">
              <div className="p-4 border-b bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Carga Académica Disponible</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                    Sección: {secciones.find(s => s.id_seccion === seccionActiva)?.grado?.nombre} - {secciones.find(s => s.id_seccion === seccionActiva)?.nombre}
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

                        return (
                          <div
                            key={`${dia}-${bloque.hora_inicio}`}
                            className={`time-slot p-2 transition-colors ${bloque.tipo === 'receso' ? 'bg-slate-50' : 'hover:bg-blue-50/30'}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
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
                            ) : asignacion ? (
                              <div className="group h-full w-full bg-[#F0F4F8] border border-[#D1DCE8] rounded-lg p-2 flex flex-col justify-between relative animate-in fade-in zoom-in duration-300">
                                <div>
                                  <p className="text-[10px] font-black text-[#093E7A] uppercase leading-tight">{asignacion.curso_nombre}</p>
                                  <p className="text-[9px] text-[#093E7A]/70 mt-1">{asignacion.docente_nombre}</p>
                                </div>
                                <button
                                  onClick={() => eliminarAsignacion(asignacion.id_horario)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 size-4 flex items-center justify-center no-print"
                                >
                                  <span className="material-symbols-outlined text-xs">close</span>
                                </button>
                              </div>
                            ) : null}
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
  );
}