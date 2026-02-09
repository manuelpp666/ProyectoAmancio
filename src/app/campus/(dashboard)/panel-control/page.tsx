"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState } from "react"; // Añadimos useState
import React from 'react';
import { useRouter } from "next/navigation";
import Link from "next/link"; // Importante para la navegación
import {
  LayoutDashboard,
  Users,
  Globe,
  UserPlus, // Cambiamos Bot por UserPlus
  BookOpen,
  Settings,
  LogOut,
  Bell,
  TrendingUp,
  BadgeCheck,
  Calendar,
  Newspaper,
  FileText,
  ChevronRight,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {

  // 1. Extraer datos del contexto
  const { role, username, loading } = useUser();
  const router = useRouter();
  const [postulantesCount, setPostulantesCount] = useState(0);

  // 2. Proteger la ruta: Solo ADMIN
  useEffect(() => {
    if (!loading) {
      if (!role) {
        router.push("/campus");
      } else if (role.toUpperCase() !== "ADMIN") {
        router.push("/prohibido");
      }
    }
  }, [role, loading, router]);
  useEffect(() => {
    if (role?.toUpperCase() === "ADMIN") {
// Llamada a la API para obtener el número de pendientes
    const fetchPostulantes = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alumnos/solicitudes-pendientes`);
        if (res.ok) {
          const data = await res.json();
          setPostulantesCount(data.length);
        }
      } catch (error) {
        console.error("Error cargando conteo de postulantes:", error);
      }
    };

    fetchPostulantes();

    }
    
  }, [role]);

  // 4. Pantalla de carga
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
      </div>
    );
  }

  // Si no es admin, no renderizar nada mientras redirige
  if (role?.toUpperCase() !== "ADMIN") return null;
  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen">
      {/* Main Content */}
      <div className="w-full h-full space-y-6 pb-8">


        <div className="p-4 md:p-8 space-y-8 w-full">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#701C32] to-[#922a44] rounded-2xl p-8 shadow-lg shadow-[#701C32]/10">
            <div className="relative z-10">
              <h3 className="text-white text-2xl font-black italic">Bienvenido, Dra. Martinez</h3>
              <p className="text-white/80 mt-1 max-w-md">Lunes, 24 de Mayo. Hay 3 eventos programados para hoy que requieren tu atención.</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <LayoutDashboard className="w-48 h-48 text-white" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Users className="text-blue-600" />} bg="bg-blue-50" label="Total Estudiantes" value="1,250" growth="+5.2%" />
            <StatCard icon={<BadgeCheck className="text-purple-600" />} bg="bg-purple-50" label="Docentes Activos" value="84" growth="+2.1%" />
            <StatCard icon={<Calendar className="text-orange-600" />} bg="bg-orange-50" label="Próximos Eventos" value="12" growth="Semana" />
            <StatCard icon={<Newspaper className="text-emerald-600" />} bg="bg-emerald-50" label="Noticias" value="45" growth="+12.5%" />
          </div>

          {/* Main Grid Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Table Section */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#701C32]" />
                  Actualizaciones Web
                </h3>
                <button className="text-[#09397c] text-xs font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Ver historial</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Sección</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Autor</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-[#09397c]">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-gray-900">Admisiones 2024</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">Carlos Ruiz</td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-medium">Hace 2 horas</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-md tracking-wider">Publicado</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Events Sidebar */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#701C32]" />
                Eventos
              </h3>
              <div className="space-y-6">
                <div className="group flex gap-4 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                  <div className="flex flex-col items-center justify-center w-12 h-14 bg-[#701C32] text-white rounded-xl shrink-0 shadow-md shadow-[#701C32]/20">
                    <span className="text-[10px] font-bold uppercase opacity-80">May</span>
                    <span className="text-lg font-black leading-none">26</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Reunión de Padres</h4>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      Auditorio Principal • 17:00
                    </p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-8 py-3 bg-slate-50 border-2 border-dashed border-gray-200 text-gray-500 text-sm font-bold rounded-xl hover:border-[#09397c] hover:text-[#09397c] transition-all flex items-center justify-center gap-2">
                Gestionar Calendario
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
            {/* Elemento decorativo */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
            
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <UserPlus className="w-8 h-8 text-orange-600" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-gray-900">Solicitudes de Admisión</h3>
                {postulantesCount > 0 && (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-black animate-pulse">
                        PENDIENTE
                    </span>
                )}
              </div>
              
              <p className="text-gray-500 mt-2 leading-relaxed max-w-2xl">
                Actualmente hay <span className="text-orange-600 font-black text-lg">{postulantesCount}</span> estudiantes postulando al colegio. 
                Revisa sus perfiles y completa el proceso de admisión para generar sus accesos.
              </p>
              
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <Link href="/campus/panel-control/gestion-estudiantes" className="w-full sm:w-auto">
                    <button className="w-full bg-[#09397c] text-white px-8 py-4 rounded-xl text-sm font-black hover:bg-[#062d59] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#09397c]/20 hover:-translate-y-0.5 active:scale-95">
                      IR A GESTIÓN DE ADMISIÓN
                      <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
                
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 px-2">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    Actualizado en tiempo real
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para las tarjetas de estadísticas
function StatCard({ icon, bg, label, value, growth }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#09397c]/20 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${bg} rounded-xl`}>
          {React.cloneElement(icon, { className: "w-6 h-6 " + icon.props.className })}
        </div>
        <span className={`text-xs font-black ${growth.includes('+') ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'} px-2.5 py-1 rounded-md`}>
          {growth}
        </span>
      </div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
    </div>
  );
}