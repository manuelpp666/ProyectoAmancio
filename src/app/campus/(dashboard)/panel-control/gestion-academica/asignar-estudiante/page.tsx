"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";
import { toast } from "sonner";
import { Nivel, Grado, Seccion } from "@/src/interfaces/academic";

// Extendemos la interfaz localmente para incluir las fechas de inscripción
interface AnioEscolar {
  id_anio_escolar: string;
  activo: boolean;
  tipo: string;
  inicio_inscripcion?: string; // Fechas vienen como string del JSON
  fin_inscripcion?: string;
}

interface AlumnoMatriculado {
  id_matricula: number;
  id_alumno: number;
  nombres: string;
  apellidos: string;
  dni: string;
  id_seccion: number | null; 
  id_grado: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AsignacionEstudiantesPage() {
  // --- ESTADOS DE DATOS MAESTROS ---
  const [anios, setAnios] = useState<AnioEscolar[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  
  // --- ESTADOS DE SELECCIÓN ---
  const [selectedAnio, setSelectedAnio] = useState<string>("");
  const [selectedNivel, setSelectedNivel] = useState<number | null>(null);
  const [selectedGrado, setSelectedGrado] = useState<number | null>(null);

  // --- ESTADOS DE ALUMNOS ---
  const [alumnos, setAlumnos] = useState<AlumnoMatriculado[]>([]); 
  const [busqueda, setBusqueda] = useState("");
  
  // --- ESTADOS DE UI ---
  const [draggedStudent, setDraggedStudent] = useState<AlumnoMatriculado | null>(null);
  const [seccionesEditando, setSeccionesEditando] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 1. CARGA INICIAL
  useEffect(() => {
    const fetchMaestros = async () => {
      try {
        const [resAnios, resNiveles] = await Promise.all([
          fetch(`${API_URL}/academic/anios/`),
          fetch(`${API_URL}/academic/niveles/`)
        ]);
        const dataAnios = await resAnios.json();
        setAnios(dataAnios);
        setNiveles(await resNiveles.json());

        const activo = dataAnios.find((a: AnioEscolar) => a.activo);
        if (activo) setSelectedAnio(activo.id_anio_escolar);
        else if (dataAnios.length > 0) setSelectedAnio(dataAnios[0].id_anio_escolar);

      } catch (error) {
        console.error(error);
        toast.error("Error al cargar datos iniciales");
      }
    };
    fetchMaestros();
  }, []);

  // 2. CARGAR GRADOS CUANDO CAMBIA NIVEL
  useEffect(() => {
    if (selectedNivel) {
      fetch(`${API_URL}/academic/grados/?nivel_id=${selectedNivel}`)
        .then(res => res.json())
        .then(setGrados)
        .catch(err => console.error(err));
      setSelectedGrado(null); 
    } else {
      setGrados([]);
    }
  }, [selectedNivel]);

  // 3. CARGAR SECCIONES Y ALUMNOS
  const cargarDatosOperativos = useCallback(async (mantenerEstadoEdicion = false) => {
    if (!selectedAnio || !selectedGrado) return;

    setIsLoading(true);
    try {
      // Cargar Secciones
      const resSecciones = await fetch(`${API_URL}/academic/secciones/?anio_id=${selectedAnio}&grado_id=${selectedGrado}`);
      const dataSecciones: Seccion[] = await resSecciones.json();
      setSecciones(dataSecciones);

      // Mantener estado de edición
      setSeccionesEditando(prev => {
        if (mantenerEstadoEdicion) {
            const nuevoEstado = { ...prev };
            dataSecciones.forEach(s => {
                if (nuevoEstado[s.id_seccion] === undefined) {
                    nuevoEstado[s.id_seccion] = false;
                }
            });
            return nuevoEstado;
        } else {
            const estadoInicial: Record<number, boolean> = {};
            dataSecciones.forEach(s => estadoInicial[s.id_seccion] = false); 
            return estadoInicial;
        }
      });

      // Cargar Alumnos
      const resMatriculas = await fetch(`${API_URL}/enrollment/matriculas/?anio_id=${selectedAnio}&grado_id=${selectedGrado}`);
      
      if(resMatriculas.ok){
          const dataMatriculas = await resMatriculas.json();
          // Mapeo seguro verificando que 'alumno' exista
          const alumnosMapeados = dataMatriculas
            .filter((m: any) => m.alumno) // Filtrar matrículas corruptas sin alumno
            .map((m: any) => ({
                id_matricula: m.id_matricula,
                id_alumno: m.alumno.id_alumno,
                nombres: m.alumno.nombres,
                apellidos: m.alumno.apellidos,
                dni: m.alumno.dni,
                id_seccion: m.id_seccion,
                id_grado: m.id_grado
            }));
          setAlumnos(alumnosMapeados);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error cargando datos");
    } finally {
      setIsLoading(false);
    }
  }, [selectedAnio, selectedGrado]);

  useEffect(() => {
    if (selectedAnio && selectedGrado) {
      cargarDatosOperativos(false); 
    } else {
      setSecciones([]);
      setAlumnos([]);
    }
  }, [selectedAnio, selectedGrado, cargarDatosOperativos]);

  // --- LÓGICA DE NEGOCIO Y FECHAS ---

  const anioActualObj = anios.find(a => a.id_anio_escolar === selectedAnio);

  // VALIDACIÓN DE FECHAS DE INSCRIPCIÓN
  const isPeriodoInscripcionActivo = useMemo(() => {
    if (!anioActualObj) return false;
    
    // Si no tiene fechas configuradas, asumimos cerrado por seguridad o abierto según prefieras.
    // Aquí asumimos CERRADO si no hay fechas.
    if (!anioActualObj.inicio_inscripcion || !anioActualObj.fin_inscripcion) return false;

    const hoy = new Date();
    // Ajustar horas para comparar solo fechas (ignorar hora actual)
    hoy.setHours(0,0,0,0);
    
    // Convertir strings YYYY-MM-DD a Date con ajuste de zona horaria local
    // (Ojo: new Date('2026-01-05') suele ser UTC, mejor usar split)
    const [yI, mI, dI] = anioActualObj.inicio_inscripcion.split('-').map(Number);
    const inicio = new Date(yI, mI - 1, dI);

    const [yF, mF, dF] = anioActualObj.fin_inscripcion.split('-').map(Number);
    const fin = new Date(yF, mF - 1, dF);

    return hoy >= inicio && hoy <= fin;
  }, [anioActualObj]);

  const nivelesVisibles = niveles.filter(n => {
    if (!anioActualObj) return false;
    const nombre = n.nombre.toLowerCase();
    if (anioActualObj.tipo === 'VERANO') {
      return true; 
    } else {
      return !nombre.includes('pre');
    }
  });

  // --- DRAG & DROP ---

  const handleDragStart = (alumno: AlumnoMatriculado) => {
    if (!isPeriodoInscripcionActivo) {
        toast.error("El periodo de inscripción/asignación está cerrado para este año.");
        return;
    }
    setDraggedStudent(alumno);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropToSection = (seccionId: number) => {
    if (!draggedStudent) return;
    
    if (!seccionesEditando[seccionId]) {
      toast.warning("Habilita la edición ('Editar Selección') para modificar esta sección.");
      setDraggedStudent(null);
      return;
    }

    const alumnosEnSeccion = alumnos.filter(a => a.id_seccion === seccionId).length;
    const seccionObj = secciones.find(s => s.id_seccion === seccionId);
    if (seccionObj && alumnosEnSeccion >= seccionObj.vacantes) {
      toast.error("¡Sección sin vacantes!");
      setDraggedStudent(null);
      return;
    }

    const nuevosAlumnos = alumnos.map(a => 
      a.id_matricula === draggedStudent.id_matricula 
        ? { ...a, id_seccion: seccionId } 
        : a
    );
    setAlumnos(nuevosAlumnos);
    setDraggedStudent(null);
  };

  const handleDropToUnassigned = () => {
    if (!draggedStudent) return;
    
    if (draggedStudent.id_seccion !== null) {
        if (!seccionesEditando[draggedStudent.id_seccion]) {
            toast.warning("La sección de origen está bloqueada.");
            setDraggedStudent(null);
            return;
        }
    }

    const nuevosAlumnos = alumnos.map(a => 
      a.id_matricula === draggedStudent.id_matricula 
        ? { ...a, id_seccion: null } 
        : a
    );
    setAlumnos(nuevosAlumnos);
    setDraggedStudent(null);
  };

  // --- CONFIRMAR CAMBIOS ---

  const handleConfirmarSeccion = async (seccionId: number) => {
    const alumnosAConfirmar = alumnos.filter(a => a.id_seccion === seccionId);
    
    try {
        const promesas = alumnosAConfirmar.map(alumno => 
            fetch(`${API_URL}/enrollment/matriculas/${alumno.id_matricula}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id_seccion: seccionId,
                    id_anio_escolar: selectedAnio,
                    id_grado: selectedGrado,
                    id_alumno: alumno.id_alumno
                })
            })
        );

        await Promise.all(promesas);
        setSeccionesEditando(prev => ({ ...prev, [seccionId]: false }));
        toast.success("Asignación confirmada");
        cargarDatosOperativos(true); 

    } catch (error) {
        console.error(error);
        toast.error("Error al guardar cambios");
    }
  };

  const handleHabilitarEdicion = (seccionId: number) => {
    if (!isPeriodoInscripcionActivo) {
        toast.error("No se puede editar: Periodo de inscripción cerrado.");
        return;
    }
    setSeccionesEditando(prev => ({ ...prev, [seccionId]: true }));
  };

  const alumnosSinAsignar = alumnos.filter(a => a.id_seccion === null);
  const alumnosFiltrados = alumnosSinAsignar.filter(a => 
    `${a.nombres} ${a.apellidos} ${a.dni}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: 'Lato', sans-serif; background-color: #F8FAFC; }
        .sidebar-maroon { background-color: #701C32; }
        .active-tab { border-bottom: 3px solid #093E7A; color: #093E7A; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />

      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
          
          <HeaderPanel />

          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">person_add_alt</span>
                <h2 className="text-xl font-bold text-gray-800">Asignación de Estudiantes</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Periodo:</label>
                <select 
                    value={selectedAnio}
                    onChange={(e) => setSelectedAnio(e.target.value)}
                    className="bg-gray-50 border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 pr-8"
                >
                  {anios.map(a => (
                      <option key={a.id_anio_escolar} value={a.id_anio_escolar}>
                          {a.id_anio_escolar} - {a.tipo}
                      </option>
                  ))}
                </select>
                
                {/* INDICADOR DE ESTADO DE INSCRIPCIÓN */}
                {isPeriodoInscripcionActivo ? (
                    <span className="ml-2 flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 text-[10px] font-bold uppercase tracking-wide">
                        <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                        Inscripciones Abiertas
                    </span>
                ) : (
                    <span className="ml-2 flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded border border-red-200 text-[10px] font-bold uppercase tracking-wide">
                        <span className="size-2 rounded-full bg-red-500"></span>
                        Inscripciones Cerradas
                    </span>
                )}
              </div>
            </div>
            {anioActualObj && (
                <div className="text-xs text-gray-400">
                    {anioActualObj.inicio_inscripcion ? 
                        `Del ${anioActualObj.inicio_inscripcion} al ${anioActualObj.fin_inscripcion}` : 
                        "Fechas no configuradas"}
                </div>
            )}
          </div>

          <div className="flex-1 flex overflow-hidden p-8 gap-8">
            
            {/* --- LISTA IZQUIERDA --- */}
            <div 
                className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                onDragOver={handleDragOver}
                onDrop={handleDropToUnassigned}
            >
              <div className="p-5 border-b bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight text-sm">
                    <span className="material-symbols-outlined text-[#093E7A] text-xl">person_search</span>
                    Estudiantes sin Asignar
                  </h3>
                  <span className="bg-[#093E7A]/10 text-[#093E7A] text-xs font-bold px-2.5 py-1 rounded-full">
                    {alumnosSinAsignar.length} Pendientes
                  </span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                  <input 
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full bg-white border-gray-200 rounded-lg pl-10 text-sm focus:ring-2 focus:ring-[#093E7A]/20 outline-none py-2" 
                    placeholder="Buscar por nombre o DNI..." 
                    type="text" 
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/30">
                {selectedGrado ? (
                    <div className="divide-y divide-gray-100">
                    {alumnosFiltrados.map((alumno) => (
                        <div 
                            key={alumno.id_matricula} 
                            draggable={isPeriodoInscripcionActivo} // Bloquea drag si está cerrado
                            onDragStart={() => handleDragStart(alumno)}
                            className={`p-4 bg-white hover:bg-gray-50 cursor-grab active:cursor-grabbing group flex items-center gap-4 transition-colors ${!isPeriodoInscripcionActivo ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                        >
                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center border border-gray-200">
                            <span className="material-symbols-outlined text-gray-400">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{alumno.nombres} {alumno.apellidos}</p>
                            <p className="text-xs text-gray-500">DNI: {alumno.dni}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-[#093E7A] transition-colors">drag_indicator</span>
                        </div>
                    ))}
                    {alumnosFiltrados.length === 0 && (
                        <div className="p-10 text-center text-gray-400 text-sm">
                            {isLoading ? "Cargando estudiantes..." : "No hay alumnos pendientes para este filtro."}
                        </div>
                    )}
                    </div>
                ) : (
                    <div className="p-10 text-center text-gray-400 text-sm italic">
                        Selecciona un nivel y grado para ver la lista.
                    </div>
                )}
              </div>
            </div>

            {/* --- DERECHA: PASOS --- */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-10">
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 shrink-0">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Paso 1: Seleccionar Nivel</h3>
                <div className="grid grid-cols-3 gap-4">
                  {nivelesVisibles.map(nivel => (
                      <button 
                        key={nivel.id_nivel}
                        onClick={() => setSelectedNivel(nivel.id_nivel)}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl transition-all ${
                            selectedNivel === nivel.id_nivel 
                            ? 'border-[#093E7A] bg-[#093E7A]/5' 
                            : 'border-gray-100 hover:border-[#093E7A]/30'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-3xl ${selectedNivel === nivel.id_nivel ? 'text-[#093E7A]' : 'text-gray-400'}`}>
                            {nivel.nombre.includes('Primaria') ? 'child_care' : nivel.nombre.includes('Secundaria') ? 'school' : 'rocket_launch'}
                        </span>
                        <span className={`text-sm font-black uppercase ${selectedNivel === nivel.id_nivel ? 'text-[#093E7A]' : 'text-gray-400'}`}>
                            {nivel.nombre}
                        </span>
                      </button>
                  ))}
                </div>
              </div>

              {/* SECCIONES */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[400px] h-fit shrink-0 pb-6">
                <div className="flex items-center justify-between mb-6 shrink-0">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Paso 2: Grado y Sección de Destino</h3>
                </div>
                
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2 shrink-0">
                  {grados.map((grado) => (
                    <button 
                      key={grado.id_grado} 
                      onClick={() => setSelectedGrado(grado.id_grado)}
                      className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${
                          selectedGrado === grado.id_grado 
                          ? 'bg-[#093E7A] text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {grado.nombre}
                    </button>
                  ))}
                  {grados.length === 0 && <span className="text-sm text-gray-400">Selecciona un nivel primero</span>}
                </div>

                {selectedGrado && secciones.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {secciones.map(seccion => {
                        const alumnosEnSeccion = alumnos.filter(a => a.id_seccion === seccion.id_seccion);
                        const vacantesRestantes = seccion.vacantes - alumnosEnSeccion.length;
                        const estaEditando = seccionesEditando[seccion.id_seccion];

                        return (
                            <div 
                                key={seccion.id_seccion}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDropToSection(seccion.id_seccion)}
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col transition-all min-h-[300px] ${
                                    estaEditando ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-white'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-lg flex items-center justify-center text-white font-black ${
                                            seccion.nombre === 'Rojo' ? 'bg-red-600' : 
                                            seccion.nombre === 'Azul' ? 'bg-blue-600' : 
                                            seccion.nombre === 'Amarillo' ? 'bg-yellow-500' : 'bg-gray-800'
                                        }`}>
                                            {seccion.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 leading-none">{seccion.nombre}</p>
                                            <p className="text-[10px] text-gray-400 uppercase mt-1">
                                                {alumnosEnSeccion.length} Asignados
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black ${vacantesRestantes === 0 ? 'text-red-500' : 'text-[#093E7A]'}`}>
                                            {vacantesRestantes}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Vacantes</p>
                                    </div>
                                </div>

                                <div className="flex-1 bg-white border border-gray-100 rounded-lg p-2 mb-4 overflow-y-auto max-h-48 min-h-[100px]">
                                    {alumnosEnSeccion.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                            <span className="material-symbols-outlined text-2xl mb-1">add_circle</span>
                                            <p className="text-[10px] font-bold uppercase">
                                                {vacantesRestantes > 0 && estaEditando ? 'Arrastrar aquí' : 'Vacío'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {alumnosEnSeccion.map(a => (
                                                <div key={a.id_matricula} 
                                                     draggable={estaEditando && isPeriodoInscripcionActivo} 
                                                     onDragStart={() => handleDragStart(a)}
                                                     className={`text-xs p-2 bg-gray-50 rounded border border-gray-100 truncate cursor-grab flex justify-between items-center ${
                                                         !isPeriodoInscripcionActivo ? 'cursor-not-allowed opacity-60' : ''
                                                     }`}
                                                >
                                                    <span>{a.nombres} {a.apellidos}</span>
                                                    {estaEditando && isPeriodoInscripcionActivo && <span className="material-symbols-outlined text-[10px] text-gray-400">drag_handle</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {estaEditando ? (
                                    <button 
                                        onClick={() => handleConfirmarSeccion(seccion.id_seccion)}
                                        className="w-full bg-[#093E7A] text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#093E7A]/90 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">check_circle</span>
                                        Confirmar Asignación
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleHabilitarEdicion(seccion.id_seccion)}
                                        className={`w-full bg-white border border-gray-300 text-gray-600 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors ${
                                            !isPeriodoInscripcionActivo ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                        Editar Selección
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p>Selecciona un grado para ver las secciones disponibles.</p>
                    </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}