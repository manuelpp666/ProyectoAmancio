"use client";
import { useState, useMemo, useEffect } from 'react';
import { useEventos } from '@/src/hooks/useEvento';
import { EventRow } from '@/src/components/Evento/EventRow';
import { Search, Filter, CalendarDays } from "lucide-react";
import { AnioEscolar } from "@/src/interfaces/academic";
import { apiFetch } from "@/src/lib/api";

export default function TodosLosEventosPage() {
  // 1. Cargamos todos los eventos
  const { eventos, loading } = useEventos('todos'); 
  const [busqueda, setBusqueda] = useState("");
  
  // 2. Estados para los años académicos oficiales
  const [aniosAcademicos, setAniosAcademicos] = useState<AnioEscolar[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("todos");

  // 3. Cargar la lista de años desde la API
  useEffect(() => {
    const fetchAnios = async () => {
      try {
        const res = await apiFetch(`/academic/anios/`);
        if (res.ok) {
          const data = await res.json();
          setAniosAcademicos(data);
        }
      } catch (error) {
        console.error("Error cargando años académicos:", error);
      }
    };
    fetchAnios();
  }, []);

  // 4. Lógica de filtrado combinada (Usando el nuevo ID de año escolar)
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(ev => {
      const cumpleBusqueda = ev.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             ev.tipo_evento?.toLowerCase().includes(busqueda.toLowerCase());
      
      // Filtramos por la propiedad id_anio_escolar que añadimos a la interfaz
      const cumpleAnio = anioSeleccionado === "todos" || 
                         ev.id_anio_escolar === anioSeleccionado;
      
      return cumpleBusqueda && cumpleAnio;
    });
  }, [eventos, busqueda, anioSeleccionado]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">Historial Completo de Eventos</h1>
        <p className="text-sm text-gray-500 font-medium">Consulta y filtra todos los eventos registrados por periodo académico.</p>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título o categoría..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/10 outline-none transition-all"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="relative min-w-[200px]">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            className="w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer appearance-none font-bold text-gray-700 outline-none hover:border-[#093E7A] transition-colors"
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(e.target.value)}
          >
            <option value="todos">Todos los periodos</option>
            {aniosAcademicos.map(anio => (
              <option key={anio.id_anio_escolar} value={anio.id_anio_escolar}>
                Periodo {anio.id_anio_escolar} {anio.activo ? "(Actual)" : ""}
              </option>
            ))}
          </select>
          <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={14} />
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Evento / Actividad</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Fecha</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Categoría</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-400 animate-pulse font-bold uppercase text-xs tracking-widest">
                    Cargando historial...
                  </td>
                </tr>
              ) : eventosFiltrados.length > 0 ? (
                eventosFiltrados.map(ev => (
                  <EventRow 
                    key={ev.id_evento} 
                    evento={ev} 
                    onEdit={() => {/* Lógica de edición */}} 
                    onDelete={() => {/* Lógica de borrado */}} 
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-gray-400">
                    <p className="font-medium">No se encontraron eventos con los filtros seleccionados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}