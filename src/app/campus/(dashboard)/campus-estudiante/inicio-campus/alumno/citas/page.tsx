"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/src/context/userContext";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  Loader2, 
  Stethoscope
} from "lucide-react";
import { Cita } from "@/src/interfaces/datos_alumno";
import { apiFetch } from "@/src/lib/api";


export default function ResumenCitasPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [proximaCita, setProximaCita] = useState<Cita | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProximaCita = useCallback(async (uid: number) => {
    try {
      
      const res = await apiFetch(`/conducta/usuario/${uid}/proxima-cita`);
      
      // Si el backend devuelve null (no hay citas), data será null
      const data = await res.json();
      setProximaCita(data); 
    } catch (e) {
      console.error("Error al obtener la próxima cita:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && id_usuario) fetchProximaCita(Number(id_usuario));
  }, [id_usuario, userLoading, fetchProximaCita]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Stethoscope size={20} className="text-[#701C32]" /> Citas Psicológicas
        </h3>
        <Link 
          href="/campus/campus-estudiante/inicio-campus/alumno/citas/mis-citas" 
          className="text-sm font-bold text-[#701C32] hover:underline flex items-center gap-1"
        >
          Ver todas <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center bg-gray-50 rounded-2xl">
          <Loader2 className="animate-spin text-[#701C32]" />
        </div>
      ) : proximaCita ? (
        <div className={`relative overflow-hidden bg-white border-2 rounded-2xl p-5 transition-all ${proximaCita.es_hoy ? 'border-amber-200 shadow-md' : 'border-gray-100'}`}>
          {proximaCita.es_hoy && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Hoy
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${proximaCita.es_hoy ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{proximaCita.motivo}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <Clock size={14} /> {proximaCita.hora}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                    <Calendar size={14} /> {proximaCita.fecha}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
               <MapPin size={16} /> Oficina de Psicología
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-400 text-sm font-medium">No tienes citas programadas próximamente.</p>
        </div>
      )}
    </div>
  );
}