"use client";
import { useState, useMemo } from 'react';
import { useEventos } from '@/src/hooks/useEvento';
import { EventRow } from '@/src/components/Evento/EventRow';
import { Search, Filter } from "lucide-react";

export default function TodosLosEventosPage() {
  const { eventos, loading } = useEventos('todos'); 
  const [busqueda, setBusqueda] = useState("");
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("todos");

  // Extraer años únicos para el filtro
  const aniosDisponibles = useMemo(() => {
    const anios = new Set(eventos.map(ev => new Date(ev.fecha_inicio).getFullYear().toString()));
    return Array.from(anios).sort().reverse();
  }, [eventos]);

  // Lógica de filtrado combinada
  const eventosFiltrados = useMemo(() => {
    return eventos.filter(ev => {
      const cumpleBusqueda = ev.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             ev.tipo_evento?.toLowerCase().includes(busqueda.toLowerCase());
      const cumpleAnio = anioSeleccionado === "todos" || 
                         new Date(ev.fecha_inicio).getFullYear().toString() === anioSeleccionado;
      return cumpleBusqueda && cumpleAnio;
    });
  }, [eventos, busqueda, anioSeleccionado]);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-black mb-6 uppercase tracking-tight">Historial Completo</h1>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por título o categoría..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
          <select 
            className="pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer"
            value={anioSeleccionado}
            onChange={(e) => setAnioSeleccionado(e.target.value)}
          >
            <option value="todos">Todos los años</option>
            {aniosDisponibles.map(anio => (
              <option key={anio} value={anio}>{anio}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tu tabla se mantiene igual, pero mapeando eventosFiltrados */}
        <table className="w-full text-left border-collapse">
            <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Evento / Actividad</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Fecha</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Categoría</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Acciones</th>
                    </tr>
                  </thead>
            <tbody>
                {eventosFiltrados.map(ev => (
                    <EventRow 
                key={ev.id_evento} 
                evento={ev} 
                onEdit={() => console.log("Editar", ev.id_evento)} 
                onDelete={() => console.log("Eliminar", ev.id_evento)} 
              />
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}

