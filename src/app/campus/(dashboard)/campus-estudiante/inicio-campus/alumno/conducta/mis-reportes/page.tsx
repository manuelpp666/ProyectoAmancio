"use client";
import { useEffect, useState, useCallback } from "react";
import { ChevronDown, Loader2, History, Calendar, ArrowLeft } from "lucide-react";
import { useUser } from "@/src/context/userContext";
import Link from "next/link";

export default function HistorialConductaPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [aniosConData, setAniosConData] = useState<number[]>([]); // Cambiado a array de números
  const [anioSeleccionado, setAnioSeleccionado] = useState<string>("");
  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Cargar solo los años que tienen reportes
  useEffect(() => {
    const fetchAniosDisponibles = async () => {
      if (!id_usuario) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conducta/usuario/${id_usuario}/anios-reportes`);
        const data: number[] = await res.json();
        setAniosConData(data);

        // Seleccionar el año más reciente por defecto si existen reportes
        if (data.length > 0) {
          setAnioSeleccionado(String(data[0]));
        }
      } catch (e) {
        console.error("Error cargando años con reportes:", e);
      }
    };

    if (!userLoading) fetchAniosDisponibles();
  }, [id_usuario, userLoading]);

  // 2. Cargar Reportes del año seleccionado
  const fetchReportes = useCallback(async (uid: number, anio: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conducta/usuario/${uid}/estado-conducta?anio=${anio}`);
      const data = await res.json();
      setReportes(data?.historial || []);
    } catch (e) {
      setReportes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id_usuario && anioSeleccionado) {
      fetchReportes(Number(id_usuario), anioSeleccionado);
    }
  }, [id_usuario, anioSeleccionado, fetchReportes]);

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-8 px-4">
      <Link href="/campus/campus-estudiante/inicio-campus/alumno/conducta" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-[#701C32] w-fit">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32] mb-1">Historial Disciplinario</h1>
          <p className="text-gray-500 text-sm">Mostrando periodos con incidencias registradas</p>
        </div>

        {/* SELECT DINÁMICO: Solo años con reportes */}
        {aniosConData.length > 0 && (
          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <div className="pl-3 text-gray-400"><Calendar size={18} /></div>
            <div className="relative">
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(e.target.value)}
                className="appearance-none bg-transparent text-gray-700 text-sm py-2 pl-2 pr-10 focus:outline-none font-black cursor-pointer min-w-[100px]"
              >
                {aniosConData.map(anio => (
                  <option key={anio} value={anio}>Año {anio}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#701C32]" size={40} /></div>
      ) : reportes.length > 0 ? (
        <div className="grid gap-4">
          {reportes.map((r, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#701C32] bg-[#701C32]/5 px-2 py-0.5 rounded-md">{r.fecha}</span>
                <h4 className="font-bold text-gray-800 text-lg">{r.motivo}</h4>
                <p className="text-sm text-gray-500">{r.nota_reglamento}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-red-600">-{r.puntos_restados}</span>
                <p className="text-[9px] text-gray-400 font-bold uppercase">Puntos</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
          <History size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="text-gray-800 font-bold text-lg">Historial Limpio</h3>
          <p className="text-gray-400 text-sm">No se encontraron reportes registrados para tu usuario.</p>
        </div>
      )}
    </div>
  );
}