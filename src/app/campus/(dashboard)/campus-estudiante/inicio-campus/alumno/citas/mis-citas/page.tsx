"use client";
import { useEffect, useState, useCallback } from "react";
import { ChevronDown, Loader2, Calendar, ArrowLeft, BookmarkCheck, Clock } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";

export default function HistorialCitasPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [aniosConCitas, setAniosConCitas] = useState<number[]>([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>(new Date().getFullYear().toString());
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  
  const fetchAnios = useCallback(async (uid: number) => {
    try {
      // Necesitarás crear este endpoint o usar uno similar al de reportes
      const res = await apiFetch(`/conducta/usuario/${uid}/anios-reportes`);
      const data = await res.json();
      if (data.length > 0) setAniosConCitas(data);
    } catch (e) { console.error(e); }
  }, []);

  const fetchCitasPorAnio = useCallback(async (uid: number, anio: string) => {
    setLoading(true);
    try {
     
      const res = await apiFetch(`/conducta/usuario/${uid}/historial-citas?anio=${anio}`);
      const data = await res.json();
      setCitas(data || []);
    } catch (e) {
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && id_usuario) {
      fetchAnios(Number(id_usuario));
      fetchCitasPorAnio(Number(id_usuario), anioSeleccionado);
    }
  }, [id_usuario, anioSeleccionado, userLoading, fetchCitasPorAnio, fetchAnios]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-8 px-4">
      <Link href="/campus/campus-estudiante/inicio-campus/alumno/conducta" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#701C32] w-fit">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32] mb-1">Mis Citas Psicológicas</h1>
          <p className="text-gray-500 text-sm">Historial de reuniones y seguimiento</p>
        </div>

        {/* SELECT DE AÑO (Mismo estilo que reportes) */}
        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
          <div className="pl-3 text-gray-400"><Calendar size={18} /></div>
          <div className="relative">
            <select
              value={anioSeleccionado}
              onChange={(e) => setAnioSeleccionado(e.target.value)}
              className="appearance-none bg-transparent text-gray-700 text-sm py-2 pl-2 pr-10 focus:outline-none font-black cursor-pointer"
            >
              {aniosConCitas.map(anio => (
                <option key={anio} value={anio}>Año {anio}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#701C32]" size={40} /></div>
      ) : citas.length > 0 ? (
        <div className="grid gap-4">
          {citas.map((c, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm">
              <div className="flex gap-4 items-start">
                <div className={`mt-1 p-2 rounded-lg ${c.estado === 'COMPLETADA' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                  <BookmarkCheck size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-500">{c.fecha}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${c.estado === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {c.estado}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">{c.motivo}</h4>
                  {c.resultado && <p className="text-sm text-gray-500 italic">" {c.resultado} "</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-400 font-bold text-sm bg-gray-50 px-4 py-2 rounded-xl w-fit">
                <Clock size={16} /> {c.hora}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-gray-800 font-bold text-lg">No hay citas en este año</h3>
          <p className="text-gray-400 text-sm">Selecciona otro periodo o contacta con psicología.</p>
        </div>
      )}
    </div>
  );
}