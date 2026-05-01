"use client";
import { useState, useEffect } from "react";
import { Search, AlertTriangle, Eye, CalendarPlus, User, Loader2 } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ModalDetalleSeguimiento } from "@/src/components/Citas/ModalDetalleSeguimiento";

export default function SeguimientoAlumnosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [alumnosRiesgo, setAlumnosRiesgo] = useState<any[]>([]);
  const [loadingRiesgo, setLoadingRiesgo] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAlumnosRiesgo();
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.length < 3) return;
    
    setIsSearching(true);
    try {
      const res = await apiFetch(`/conducta/buscar-alumnos?q=${searchTerm}`);
      if (res.ok) setSearchResults(await res.json());
    } catch (error) {
      console.error("Error en la búsqueda", error);
    } finally {
      setIsSearching(false);
    }
  };

  const openDetail = (alumno: any) => {
    // Normalizar el nombre dependiendo de qué endpoint venga
    const nombre = alumno.nombre_completo || `${alumno.nombres} ${alumno.apellidos}`;
    setSelectedStudent({ id_alumno: alumno.id_alumno, nombre_completo: nombre });
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 flex flex-col md:flex-row gap-8">
      
      {/* SECCIÓN IZQUIERDA: BUSCADOR Y RESULTADOS (60%) */}
      <div className="w-full md:w-2/3 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C3E50]">Seguimiento de Alumnos</h1>
          <p className="text-gray-500 mt-1">Busca el historial completo de conducta y psicología de cualquier estudiante.</p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, apellidos o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 focus:border-[#093E7A] focus:ring-4 focus:ring-[#093E7A]/10 transition-all outline-none text-[#2C3E50] font-medium"
          />
          <Search className="absolute left-4 top-4 text-gray-400" size={24} />
          <button 
            type="submit"
            disabled={isSearching || searchTerm.length < 3}
            className="absolute right-3 top-3 bg-[#093E7A] text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-[#072b54] disabled:opacity-50 transition-colors"
          >
            {isSearching ? <Loader2 className="animate-spin" size={20} /> : "Buscar"}
          </button>
        </form>

        <div className="space-y-4">
          {searchResults.length > 0 ? (
            searchResults.map((alumno) => (
              <div key={alumno.id_alumno} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-[#2C3E50]">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2C3E50]">{alumno.nombres} {alumno.apellidos}</h3>
                    <p className="text-sm text-gray-500">DNI: {alumno.dni}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => openDetail(alumno)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-[#2C3E50] font-semibold rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <Eye size={18} /> Ver Historial
                  </button>
                </div>
              </div>
            ))
          ) : (
            searchTerm.length >= 3 && !isSearching && (
              <div className="text-center py-10 text-gray-400 font-medium bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                No se encontraron resultados para "{searchTerm}"
              </div>
            )
          )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: ALARMAS Y SUGERENCIAS DE CITACIÓN (30%) */}
      <div className="w-full md:w-1/3 space-y-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-[#701C32] p-5 text-white flex items-center gap-3">
            <AlertTriangle size={24} className="text-amber-300" />
            <div>
              <h2 className="font-bold text-lg">Requieren Citación</h2>
              <p className="text-white/70 text-xs">Puntaje de conducta crítico</p>
            </div>
          </div>
          
          <div className="p-2">
            {loadingRiesgo ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[#701C32]" /></div>
            ) : alumnosRiesgo.length > 0 ? (
              <div className="space-y-1">
                {alumnosRiesgo.map((alumno) => (
                  <div key={alumno.id_alumno} className="p-4 hover:bg-red-50/50 rounded-2xl transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-[#2C3E50] text-sm">{alumno.nombre_completo}</h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        alumno.estado === 'Rojo' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alumno.puntaje} PTS
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openDetail(alumno)}
                        className="flex-1 bg-white border border-gray-200 text-[#2C3E50] text-xs font-bold py-2 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"
                      >
                        <Eye size={14} /> Expediente
                      </button>
                      {/* Aquí podrías conectar tu función de agendar cita */}
                      <button className="flex-1 bg-[#C97035] text-white text-xs font-bold py-2 rounded-lg hover:bg-[#b05f2a] flex items-center justify-center gap-1">
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

      {/* MODAL DE DETALLE INTEGRADOR */}
      <ModalDetalleSeguimiento
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        idAlumno={selectedStudent?.id_alumno}
        nombreAlumno={selectedStudent?.nombre_completo}
      />
    </div>
  );
}