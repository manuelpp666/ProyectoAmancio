"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  Info,
  Users,
  MessageSquare,
  HeartHandshake,
  CalendarHeart
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
    { label: "Citas para Hoy", val: resumen.citas_pendientes.toString(), icon: Calendar, color: "bg-blue-50 text-blue-600" },
    { label: "Alumnos en Riesgo", val: resumen.alumnos_riesgo.toString(), icon: AlertCircle, color: "bg-red-50 text-red-600" },
    { label: "Atenciones del Mes", val: resumen.atenciones_mes.toString(), icon: CheckCircle2, color: "bg-green-50 text-green-600" },
  ];

  const accesos = [
    { label: "Agenda de Citas", desc: "Programa y atiende sesiones", icon: CalendarHeart, href: `/campus/campus-psicologo/agenda` },
    { label: "Seguimiento de Alumnos", desc: "Historial y casos de bienestar", icon: Users, href: `/campus/campus-psicologo/estudiantes` },
    { label: "Mensajería", desc: "Comunícate con alumnos y docentes", icon: MessageSquare, href: `/campus/campus-psicologo/mensajeria` },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8">

      {/* BANNER DE BIENVENIDA */}
      <div className="bg-[#701C32] rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-[10px] font-bold tracking-widest mb-4 uppercase backdrop-blur-sm">
              <HeartHandshake size={12} /> Departamento de Psicología
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">Bienestar Estudiantil</h1>
            <p className="text-white/85 mt-2 text-sm md:text-base max-w-lg">
              Acompaña, evalúa y da seguimiento al bienestar emocional de los estudiantes del colegio.
            </p>
          </div>
          <div className="hidden md:flex w-20 h-20 rounded-2xl bg-white/10 border border-white/15 items-center justify-center shrink-0">
            <HeartHandshake size={36} className="text-[#FFF1E3]" />
          </div>
        </div>
      </div>

      {/* ESTADÍSTICAS RÁPIDAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {estadisticas.map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-800">{item.val}</p>
              <p className="text-sm text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {accesos.map((a, i) => (
          <Link key={i} href={a.href} className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-[#701C32]/30 hover:shadow-md transition-all flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FFF1E3] text-[#701C32] flex items-center justify-center shrink-0">
              <a.icon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-800 group-hover:text-[#701C32] transition-colors">{a.label}</p>
              <p className="text-xs text-gray-400 truncate">{a.desc}</p>
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-[#701C32] group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
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
              citasHoy.slice(0, 5).map((cita: any) => (
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
                    href={`/campus/campus-psicologo/agenda`}
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

        {/* PANEL LATERAL: RECORDATORIO Y ESTADO */}
        <div className="space-y-6">
          <div className="bg-[#2C3E50] rounded-xl shadow-sm p-8 text-white h-full flex flex-col justify-center">
            <div className="flex items-start gap-4">
                <div className="bg-[#701C32] p-3 rounded-lg shadow-lg">
                    <Info size={24} className="text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-xl mb-2 text-white">Recordatorio del Especialista</h2>
                    <p className="text-gray-300 leading-relaxed">
                        Es fundamental registrar el <span className="text-white font-bold text-sm">resultado de la reunión</span> inmediatamente después de cada sesión. 
                        Esto garantiza que el historial psicológico esté actualizado para el seguimiento de conducta.
                    </p>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Estado del Sistema:</span>
                    <span className="flex items-center gap-2 text-green-400 font-medium">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Sincronizado
                    </span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}