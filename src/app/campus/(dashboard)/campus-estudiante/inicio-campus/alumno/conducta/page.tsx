"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/src/context/userContext";
import { 
  ShieldCheck, 
  AlertTriangle, 
  History, 
  TrendingDown, 
  Loader2, 
  Info,
  CheckCircle2,
  ArrowRight,
  AlertCircle

} from "lucide-react";

interface HistorialConducta {
  fecha: string;
  motivo: string;
  puntos_restados: number;
  nota_reglamento: string;
}

interface EstadoConducta {
  id_usuario: number;
  id_alumno: number;
  puntaje_actual: number;
  porcentaje_progreso: string;
  estado_color: "Verde" | "Amarillo" | "Rojo";
  total_reportes: number;
  historial: HistorialConducta[];
}

export default function ConductaAlumnoPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [data, setData] = useState<EstadoConducta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadoConducta = useCallback(async (uid: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conducta/usuario/${uid}/estado-conducta`);
      if (!res.ok) throw new Error("No se pudo obtener la información de conducta");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Error al cargar el estado disciplinario");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && id_usuario) {
      fetchEstadoConducta(Number(id_usuario));
    }
  }, [id_usuario, userLoading, fetchEstadoConducta]);

  if (userLoading || loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500 animate-pulse">Consultando expediente...</p>
      </div>
    );
  }

  // Determinar colores de la barra según el backend
  const getColorClasses = (color: string) => {
    switch (color) {
      case "Rojo": return "bg-red-500 text-red-500 border-red-200";
      case "Amarillo": return "bg-amber-500 text-amber-500 border-amber-200";
      default: return "bg-emerald-500 text-emerald-500 border-emerald-200";
    }
  };
const ultimoReporte = data?.historial?.[0];
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 px-4 animate-in fade-in duration-500">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-black text-[#701C32] flex items-center gap-3">
          <ShieldCheck size={36} /> Mi Estado Disciplinario
        </h1>
        <p className="text-gray-500 mt-2">Seguimiento de conducta basado en el Reglamento Interno 2026</p>
      </div>

      {/* SECCIÓN DE PUNTAJE Y BARRA */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-center">
        <div className="relative flex-shrink-0">
          {/* Círculo de Puntaje */}
          <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center flex-col ${data?.estado_color === 'Verde' ? 'border-emerald-50' : data?.estado_color === 'Amarillo' ? 'border-amber-50' : 'border-red-50'}`}>
             <span className={`text-4xl font-black ${data?.estado_color === 'Verde' ? 'text-emerald-600' : data?.estado_color === 'Amarillo' ? 'text-amber-600' : 'text-red-600'}`}>
                {data?.puntaje_actual}
             </span>
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Puntos</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Progreso Conductual</h2>
              <p className="text-sm text-gray-500">Inicias con 100 puntos cada año escolar</p>
            </div>
            <span className="font-black text-2xl text-gray-300">100</span>
          </div>
          
          {/* La Barra de Progreso */}
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${getColorClasses(data?.estado_color || "").split(' ')[0]}`}
              style={{ width: data?.porcentaje_progreso }}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
              <CheckCircle2 size={14} className="text-emerald-500" /> 100-75: Excelente
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">
              <AlertTriangle size={14} className="text-amber-500" /> 74-40: Regular
            </div>
          </div>
        </div>
      </div>

      {/* HISTORIAL DE REPORTES */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <History size={20} /> Historial de Incidencias
        </h3>

        {/* ÚLTIMO REPORTE Y ACCESO AL HISTORIAL */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Última Incidencia</h3>
          <Link 
            href="/campus/campus-estudiante/inicio-campus/alumno/conducta/mis-reportes" 
            className="text-sm font-bold text-[#701C32] hover:underline flex items-center gap-1"
          >
            Ver historial completo <ArrowRight size={16} />
          </Link>
        </div>

        {ultimoReporte ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-5">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800">{ultimoReporte.motivo}</h4>
                  <p className="text-xs text-gray-500">{ultimoReporte.fecha}</p>
                </div>
              </div>
              <span className="text-red-600 font-black">-{ultimoReporte.puntos_restados} pts</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <ShieldCheck className="text-emerald-500" size={32} />
            </div>
            <h4 className="text-emerald-900 font-bold text-lg">¡Excelente conducta!</h4>
            <p className="text-emerald-700 text-sm max-w-xs">No tienes reportes registrados. Mantén tu puntaje en 100 para obtener beneficios al finalizar el año.</p>
          </div>
        )}
      </div>
      </div>

      {/* NOTA ACLARATORIA */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
        <Info className="text-blue-500 flex-shrink-0" size={20} />
        <p className="text-xs text-blue-700 leading-relaxed">
          Los puntos son descontados automáticamente según la gravedad de la falta tipificada en el Reglamento Interno. 
          Si consideras que un reporte es erróneo, por favor acude a la oficina de tutoría o psicología.
        </p>
      </div>
    </div>
  );
}