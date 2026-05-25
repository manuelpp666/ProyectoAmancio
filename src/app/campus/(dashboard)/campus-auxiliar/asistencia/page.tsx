"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
// AQUÍ ESTÁ LA CORRECCIÓN: Agregados ClipboardCheck y FileText
import { Loader2, Search, Calendar, Users, Save, CheckCircle2, Clock, XCircle, ClipboardCheck, FileText } from "lucide-react"; 
import { apiFetch } from "@/src/lib/api";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { Nivel, Grado, Seccion } from "@/src/interfaces/academic";

interface AsistenciaRegistro {
  id_matricula: number;
  estado: "P" | "T" | "F" | "J";
}

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
  const [asistenciaState, setAsistenciaState] = useState<Record<number, "P" | "T" | "F" | "J">>({});
  
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    setAlumnos([]);
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
    setAlumnos([]);
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

  // 4. Buscar Alumnos de la sección seleccionada
  const handleBuscarAlumnos = async () => {
    if (!selectedSeccion || !anioPlanificacion) {
      toast.warning("Seleccione una sección y un año escolar.");
      return;
    }

    setLoadingAlumnos(true);
    try {
      const res = await apiFetch(`/enrollment/matriculas/?seccion_id=${selectedSeccion}&anio_id=${anioPlanificacion}`);
      if (res.ok) {
        const data = await res.json();
        
        // Ordenamos alfabéticamente por apellidos
        const alumnosOrdenados = data.sort((a: any, b: any) => {
           if (a.alumno?.apellidos < b.alumno?.apellidos) return -1;
           if (a.alumno?.apellidos > b.alumno?.apellidos) return 1;
           return 0;
        });

        setAlumnos(alumnosOrdenados);

        // Inicializar estado de asistencia a "Presente" por defecto para todos
        const initialState: Record<number, "P" | "T" | "F" | "J"> = {};
        alumnosOrdenados.forEach((m: any) => {
          initialState[m.id_matricula] = "P";
        });
        setAsistenciaState(initialState);
      } else {
        toast.error("No se pudieron cargar los estudiantes");
      }
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setLoadingAlumnos(false);
    }
  };

  // 5. Manejar el cambio de un botón individual de asistencia
  const setEstado = (idMatricula: number, estado: "P" | "T" | "F" | "J") => {
    setAsistenciaState(prev => ({ ...prev, [idMatricula]: estado }));
  };

  // 6. Enviar Asistencia al Backend
  const handleGuardarAsistencia = async () => {
    if (alumnos.length === 0) return;
    setIsSaving(true);
    
    try {
      const promesas = alumnos.map((m) => {
        const estado = asistenciaState[m.id_matricula] || "P";
        return apiFetch("/gestion/asistencia/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_matricula: m.id_matricula,
            fecha: fechaAsistencia,
            estado: estado,
            observacion: ""
          })
        });
      });

      await Promise.all(promesas);
      toast.success("Asistencia registrada correctamente");
    } catch (error) {
      toast.error("Hubo un error al registrar algunas asistencias");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ENCABEZADO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <ClipboardCheck size={28} /> Control de Asistencia Diaria
          </h2>
          <p className="text-gray-500 text-sm mt-1">Busque una sección y marque la asistencia correspondiente.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
          <Calendar size={20} className="text-gray-400" />
          <input 
            type="date" 
            value={fechaAsistencia}
            onChange={(e) => setFechaAsistencia(e.target.value)}
            className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* FILTROS DE BÚSQUEDA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Filtros de Sección</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600">Nivel</label>
            <select 
              value={selectedNivel} 
              onChange={(e) => setSelectedNivel(e.target.value)}
              disabled={loadingFiltros}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20"
            >
              <option value="">Seleccione Nivel</option>
              {niveles.map(n => <option key={n.id_nivel} value={n.id_nivel}>{n.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600">Grado</label>
            <select 
              value={selectedGrado} 
              onChange={(e) => setSelectedGrado(e.target.value)}
              disabled={!selectedNivel}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20 disabled:opacity-50"
            >
              <option value="">Seleccione Grado</option>
              {grados.map(g => <option key={g.id_grado} value={g.id_grado}>{g.nombre}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600">Sección</label>
            <select 
              value={selectedSeccion} 
              onChange={(e) => setSelectedSeccion(e.target.value)}
              disabled={!selectedGrado}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20 disabled:opacity-50"
            >
              <option value="">Seleccione Sección</option>
              {secciones.map(s => <option key={s.id_seccion} value={s.id_seccion}>{s.nombre}</option>)}
            </select>
          </div>

          <button 
            onClick={handleBuscarAlumnos}
            disabled={!selectedSeccion || loadingAlumnos}
            className="w-full bg-[#093E7A] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#072d5a] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loadingAlumnos ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Buscar Alumnos
          </button>
        </div>
      </div>

      {/* TABLA DE ASISTENCIA */}
      {alumnos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
            <div className="flex items-center gap-2 text-[#093E7A] font-black">
               <Users size={20} />
               <span>Estudiantes Encontrados: {alumnos.length}</span>
            </div>
            
            {/* LEYENDA VISUAL */}
            <div className="hidden sm:flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-full"></div> P = Presente</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded-full"></div> T = Tardanza</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-full"></div> F = Falta</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-500 rounded-full"></div> J = Justificado</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">N°</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Apellidos y Nombres</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">DNI</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-center">Registro de Asistencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {alumnos.map((m, index) => {
                  const estadoActual = asistenciaState[m.id_matricula] || "P";

                  return (
                    <tr key={m.id_matricula} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">
                        {m.alumno?.apellidos}, {m.alumno?.nombres}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                        {m.alumno?.dni}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {/* Segmented Control para marcar estado */}
                          <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner w-fit">
                            <button 
                              onClick={() => setEstado(m.id_matricula, "P")}
                              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${estadoActual === "P" ? "bg-emerald-500 text-white shadow-md" : "text-gray-400 hover:bg-white"}`}
                            >
                              <CheckCircle2 size={14} className={estadoActual === "P" ? "block" : "hidden"} /> P
                            </button>
                            <button 
                              onClick={() => setEstado(m.id_matricula, "T")}
                              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${estadoActual === "T" ? "bg-amber-500 text-white shadow-md" : "text-gray-400 hover:bg-white"}`}
                            >
                              <Clock size={14} className={estadoActual === "T" ? "block" : "hidden"} /> T
                            </button>
                            <button 
                              onClick={() => setEstado(m.id_matricula, "F")}
                              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${estadoActual === "F" ? "bg-red-500 text-white shadow-md" : "text-gray-400 hover:bg-white"}`}
                            >
                              <XCircle size={14} className={estadoActual === "F" ? "block" : "hidden"} /> F
                            </button>
                            <button 
                              onClick={() => setEstado(m.id_matricula, "J")}
                              className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-black transition-all ${estadoActual === "J" ? "bg-gray-600 text-white shadow-md" : "text-gray-400 hover:bg-white"}`}
                            >
                              <FileText size={14} className={estadoActual === "J" ? "block" : "hidden"} /> J
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleGuardarAsistencia}
              disabled={isSaving}
              className="bg-[#701C32] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#5a1628] transition-all shadow-lg shadow-[#701C32]/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Guardar Registro Diario
            </button>
          </div>

        </div>
      )}

    </div>
  );
}