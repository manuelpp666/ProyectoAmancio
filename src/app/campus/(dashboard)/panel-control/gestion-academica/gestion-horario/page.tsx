"use client";
import { useState, useEffect, useRef } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner"; // Recomiendo instalar react-hot-toast
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";

export default function ConstructorHorariosPage() {


  // --- ESTADOS PARA LA DATA ---
  const [secciones, setSecciones] = useState([]);
  const [seccionActiva, setSeccionActiva] = useState(null);
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [horasLectivas, setHorasLectivas] = useState([]);
  const [horarioAsignado, setHorarioAsignado] = useState([]);
  const [loading, setLoading] = useState(true);

  const diasSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

  const [listaAnios, setListaAnios] = useState([]);
  const [anioPlanificacion, setAnioPlanificacion] = useState("");

  // --- REFERENCIA PARA IMPRESIÓN ---
  const contentRef = useRef(null);

  const exportarPDFDirecto = async () => {
  const element = contentRef.current;
  if (!element) return;

  const toastId = toast.loading("Generando PDF completo...");

  try {
    // === Muy importante estas 3 líneas ===
    const originalWidth = element.scrollWidth;
    const originalHeight = element.scrollHeight;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: originalWidth,          // ← clave
      height: originalHeight,        // ← clave
      windowWidth: originalWidth,
      windowHeight: originalHeight,
      x: 0,
      y: 0,

      onclone: (clonedDoc) => {
        // tu código de limpieza...
        // puedes mantenerlo
      },
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.92);

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 10; // mm
    const maxImgWidth = pageWidth - margin * 2;
    const maxImgHeight = pageHeight - margin * 2;

    const imgWidth = maxImgWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Si es muy largo → hacemos varias páginas
    let positionY = margin;

    pdf.addImage(imgData, "JPEG", margin, positionY, imgWidth, imgHeight);

    // Si la imagen es más alta que la página → agregamos páginas
    while (imgHeight > maxImgHeight) {
      positionY = - (pageHeight - margin * 2); // siguiente página
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
  // 1. CARGA DE AÑOS ACADÉMICOS (Solo una vez al montar)
  useEffect(() => {
    const cargarAnios = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/anios/`);
        const data = await res.json();
        setListaAnios(data);

        // Seleccionar el activo o el primero de la lista
        const activo = data.find((a) => a.estado === "activo") || data[0];
        if (activo) setAnioPlanificacion(activo.id_anio_escolar.toString());
      } catch (error) {
        toast.error("Error al cargar años académicos");
      }
    };
    cargarAnios();
  }, []);

  // --- 2. CARGA INICIAL (Secciones y Horas) ---
  useEffect(() => {
    if (!anioPlanificacion) return;

    const cargarConfiguracion = async () => {
      try {
        setLoading(true);
        const [resSec, resHoras] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/secciones-horario/${anioPlanificacion}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/horarios/horas`)
        ]);

        const dataSec = await resSec.json();
        const dataHoras = await resHoras.json();

        setSecciones(Array.isArray(dataSec) ? dataSec : []);
        setHorasLectivas(Array.isArray(dataHoras) ? dataHoras : []);

        // Si hay secciones en este año, activar la primera
        if (dataSec.length > 0) {
          setSeccionActiva(dataSec[0].id_seccion);
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
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/horarios/materias-disponibles/${seccionActiva}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/horarios/seccion/${seccionActiva}`)
      ]);
      setMateriasDisponibles(await resMat.json());
      setHorarioAsignado(await resHorario.json());
    };
    cargarDatosSeccion();
  }, [seccionActiva]);

  // --- 3. LÓGICA DE ASIGNACIÓN (Drag & Drop simplificado) ---
  const handleDrop = async (idCargaAcademica, idHora, dia) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/horarios/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_carga_academica: idCargaAcademica,
          id_hora: idHora,
          dia_semana: dia
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.detail); // Aquí verás el "Conflicto Docente" del backend
        return;
      }

      toast.success("Horario asignado");
      // Recargar el horario de la sección
      const resUpdate = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/horarios/seccion/${seccionActiva}`);
      setHorarioAsignado(await resUpdate.json());
    } catch (err) {
      toast.error("Error de conexión");
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
  /* Forzamos a que Tailwind no use perfiles de color modernos para este panel */
  color-interpolation-filters: sRGB !important;
}

#print-content {
  /* Aseguramos que el contenedor no tenga efectos de mezcla de color */
  isolation: isolate;
  background-color: white !important;
}
  @media screen {
  /* Evita que el navegador use espacios de color extendidos */
  #print-content, .time-slot, .materia-card {
    color-scheme: light;
    color-interpolation-filters: sRGB;
  }
}
  @media print {
    @page { size: landscape; margin: 10mm; }
    .no-print { display: none !important; }
    
    /* Forzar colores en Chrome/Safari/Edge */
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    
    .schedule-grid { grid-template-columns: 80px repeat(5, 1fr) !important; width: 100%; }
    .time-slot { min-height: 70px !important; }
    .bg-gray-100 { background-color: white !important; }
    
    /* Eliminar sombras y bordes innecesarios en el papel */
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

          {/* Header principal */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0 no-print">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#093E7A]">calendar_month</span>
              <h2 className="text-xl font-bold text-gray-800">Constructor 2026</h2>
              <div className="flex items-center gap-2 border-l pl-6">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Año Académico:</label>
                <select
                  value={anioPlanificacion}
                  onChange={(e) => setAnioPlanificacion(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] py-1 px-3 outline-none cursor-pointer hover:bg-white transition-colors"
                >
                  {listaAnios.map((anio) => (
                    <option key={anio.id_anio_escolar} value={anio.id_anio_escolar}>
                      {anio.id_anio_escolar} {anio.estado === 'activo' ? ' (Actual)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              {/* OPCIÓN 1: VENTANA DE IMPRESIÓN (MÁS COMPATIBLE) */}
              <button
                onClick={() => handlePrint()}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all">
                <span className="material-symbols-outlined text-sm">print</span> Imprimir
              </button>

              {/* OPCIÓN 2: DESCARGA DIRECTA (PDF GENERADO) */}
              <button
                onClick={exportarPDFDirecto}
                className="flex items-center gap-2 px-5 py-2 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#062d59] transition-all">
                <span className="material-symbols-outlined text-sm">download</span> Descargar PDF
              </button>
            </div>


          </div>

          {/* Tabs de Secciones Dinámicas */}
          <div className="bg-white px-8 border-b shrink-0 flex gap-6 overflow-x-auto no-print">
            {secciones?.map((sec) => (
              <button
                key={sec.id_seccion}
                onClick={() => setSeccionActiva(sec.id_seccion)}
                className={`py-4 px-2 text-sm font-bold whitespace-nowrap transition-all ${seccionActiva === sec.id_seccion ? "active-tab text-[#093E7A]" : "text-gray-400 border-b-[3px] border-transparent"
                  }`}
              >
                {sec.grado.nombre} - {sec.nombre}
              </button>
            ))}
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar - Materias (Carga Académica) */}
            <div className="w-72 bg-white border-r flex flex-col shrink-0 no-print">
              <div className="p-4 border-b bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Carga Académica Disponible</h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {materiasDisponibles.map((mat) => (
                  <div
                    key={mat.id_carga_academica}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("id_carga", mat.id_carga_academica)}
                    className="materia-card p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-[#093E7A] transition-all"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] font-black text-gray-700 uppercase">{mat.curso_nombre}</span>
                      <span className="material-symbols-outlined text-gray-300 text-sm">drag_indicator</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 border">
                        {mat.docente_nombre.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[10px] text-gray-500">{mat.docente_nombre}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visualizador de Horario Dinámico */}
            <div className="flex-1 overflow-auto bg-gray-100 p-8">
              <div ref={contentRef} id="print-content" className="bg-white rounded-xl shadow-lg border border-gray-200 min-w-[900px] overflow-hidden">

                {/* Título que solo aparece al imprimir */}
                <div className="hidden print:block text-center mb-8">
                  <h1 className="text-3xl font-black text-[#093E7A]">HORARIO ESCOLAR {anioPlanificacion}</h1>
                  <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">
                    Sección: {secciones.find(s => s.id_seccion === seccionActiva)?.grado.nombre} - {secciones.find(s => s.id_seccion === seccionActiva)?.nombre}
                  </p>
                  <div className="mt-4 border-b-2 border-[#093E7A] w-1/4 mx-auto"></div>
                </div>
                {/* Cabecera */}
                <div className="schedule-grid bg-gray-50 border-b text-center font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                  <div className="p-4 border-r">Bloque</div>
                  {diasSemana.map(d => <div key={d} className="p-4 border-r text-gray-700">{d}</div>)}
                </div>

                {/* Cuerpo del Grid */}
                <div className="relative">
                  {horasLectivas.map((hora) => (
                    <div key={hora.id_hora} className="schedule-grid">
                      {/* Columna de Hora */}
                      <div className={`time-slot flex flex-col items-center justify-center text-[10px] font-bold ${hora.tipo === 'receso' ? 'bg-slate-100' : 'bg-gray-50/30'}`}>
                        <span className="text-gray-600">{hora.hora_inicio.substring(0, 5)}</span>
                        <span className="text-gray-400 font-normal">{hora.hora_fin.substring(0, 5)}</span>
                      </div>

                      {/* Celdas de Días */}
                      {diasSemana.map((dia) => {
                        const asignacion = horarioAsignado.find(h => h.dia_semana === dia && h.id_hora === hora.id_hora);

                        return (
                          <div
                            key={`${dia}-${hora.id_hora}`}
                            className={`time-slot p-2 transition-colors ${hora.tipo === 'receso' ? 'bg-slate-50' : 'hover:bg-blue-50/30'}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              const idCarga = e.dataTransfer.getData("id_carga");
                              if (hora.tipo !== 'receso') handleDrop(idCarga, hora.id_hora, dia);
                            }}
                          >
                            {hora.tipo === 'receso' ? (
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
                                  onClick={async () => {
                                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/horarios/${asignacion.id_horario}`, { method: 'DELETE' });
                                    setHorarioAsignado(prev => prev.filter(h => h.id_horario !== asignacion.id_horario));
                                  }}
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