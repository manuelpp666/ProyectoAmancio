"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Users, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Clock,
  Activity
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";

export default function InicioPsicologoPage() {
  const { id_usuario, role, loading } = useUser();
  const [citasHoy, setCitasHoy] = useState([]);
  const [resumen, setResumen] = useState({ 
    citas_pendientes: 0, 
    alumnos_riesgo: 0, 
    atenciones_mes: 0 
  });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id_usuario) return;
      try {
        // En una implementación real, estos endpoints deben existir en tu FastAPI
        const [resResumen, resCitas] = await Promise.all([
          apiFetch(`/conducta/resumen-psicologo`), 
          apiFetch(`/conducta/citas/agenda-diaria`)
        ]);

        if (resResumen.ok) setResumen(await resResumen.json());
        if (resCitas.ok) setCitasHoy(await resCitas.json());
      } catch (error) {
        console.error("Error cargando dashboard psicología:", error);
      } finally {
        setFetching(false);
      }
    };

    if (!loading && (role === "PSICOLOGO" || role === "AUXILIAR")) {
      fetchData();
    }
  }, [id_usuario, loading, role]);

  if (loading || fetching) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
      </div>
    );
  }

  const estadisticas = [
    { label: "Citas para Hoy", val: citasHoy.length.toString(), icon: Calendar, color: "bg-blue-50 text-blue-600" },
    { label: "Alumnos en Riesgo", val: resumen.alumnos_riesgo.toString(), icon: AlertCircle, color: "bg-red-50 text-red-600" },
    { label: "Atenciones del Mes", val: resumen.atenciones_mes.toString(), icon: CheckCircle2, color: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-0">
      <div>
        <h1 className="text-2xl font-bold text-[#701C32]">Panel de Psicología</h1>
        <p className="text-gray-500">Gestión de bienestar estudiantil y conducta</p>
      </div>

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {estadisticas.map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.color}`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{item.val}</p>
              <p className="text-sm text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AGENDA DEL DÍA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Clock className="text-[#701C32]" size={20} /> Próximas Citas
            </h2>
            <Link href="/campus/campus-psicologo/agenda" className="text-[#701C32] text-sm font-medium hover:underline flex items-center gap-1">
              Ver agenda completa <ArrowRight size={16} />
            </Link>
          </div>

          <div className="space-y-4">
            {citasHoy.length > 0 ? (
              citasHoy.slice(0, 4).map((cita: any) => (
                <div key={cita.id_cita} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-[#2C3E50] text-white text-xs font-bold p-2 rounded text-center min-w-[60px]">
                      {new Date(cita.fecha_cita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{cita.alumno_nombre || "Cita Programada"}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{cita.motivo}</p>
                    </div>
                  </div>
                  <Link 
                    href={`/campus/campus-psicologo/agenda/${cita.id_cita}`}
                    className="p-2 hover:bg-gray-200 rounded-full text-gray-400"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-400">No hay citas programadas para hoy.</p>
              </div>
            )}
          </div>
        </div>

        {/* RECIENTES / ACCIONES */}
        <div className="bg-[#2C3E50] rounded-xl shadow-sm p-6 text-white">
          <h2 className="font-bold text-lg mb-4 text-white">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link href="/campus/campus-psicologo/agenda" className="bg-white/10 hover:bg-white/20 p-4 rounded-lg flex items-center justify-between transition-colors">
              <span>Programar Nueva Cita</span>
              <Calendar size={20} />
            </Link>
            <Link href="/campus/campus-psicologo/conducta/nuevo" className="bg-white/10 hover:bg-white/20 p-4 rounded-lg flex items-center justify-between transition-colors">
              <span>Registrar Reporte de Conducta</span>
              <Activity size={20} />
            </Link>
            <Link href="/campus/campus-psicologo/estudiantes" className="bg-white/10 hover:bg-white/20 p-4 rounded-lg flex items-center justify-between transition-colors">
              <span>Buscar Expediente de Alumno</span>
              <Users size={20} />
            </Link>
          </div>
          
          <div className="mt-8 p-4 bg-[#701C32] rounded-lg">
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Recordatorio</p>
            <p className="text-sm">Recuerda completar los resultados de las reuniones al finalizar cada sesión para mantener el historial actualizado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}