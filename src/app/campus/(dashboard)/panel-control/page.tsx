"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState } from "react";
import React from 'react';
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Loader2,
  BadgeCheck,
  Newspaper,
  Briefcase,
  FileText,
  BookOpen,
  Globe,
  Bot,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

// --- FUNCIONES AUXILIARES ---

// 1. Obtener saludo según la hora local
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
};

// Interfaces para tipear las cards de permisos 
interface PermissionCardProps {
  icon: React.ReactElement;
  bg: string;
  label: string;
  description: string;
  statusText: string;
  route: string;
}

interface StatConfigItem {
  id: string;
  label: string;
  description: string;
  statusText: string;
  icon: LucideIcon; // Tipo específico para iconos de Lucide
  colorClass: string;
  bgClass: string;
  permissionPath: string;
  route: string;
}

// 2. Obtener fecha formateada (Ej: "Lunes, 24 de Mayo")
const getFormattedDate = () => {
  const date = new Date();
  // Añadimos el tipo explícito aquí
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  };
  const formatted = new Intl.DateTimeFormat('es-PE', options).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

// 3. Validador de permisos anidados (ej: path = "contenido_web.noticias")
const hasPermission = (permisosObj: any, path: string) => {
  if (!permisosObj) return false;

  const keys = path.split('.');
  let current = permisosObj;

  for (let key of keys) {
    if (current[key] === undefined) return false;
    current = current[key];
  }

  // SI es un booleano, retornamos su valor (true/false)
  if (typeof current === 'boolean') {
    return current;
  }

  // SI es un objeto (como "academico"), verificamos si tiene al menos una propiedad en true
  if (typeof current === 'object' && current !== null) {
    return Object.values(current).some(val => val === true);
  }

  return false;
};

// --- CONFIGURACIÓN DE TARJETAS ---
// Aquí defines qué tarjeta necesita qué permiso
// --- CONFIGURACIÓN DE TARJETAS INFORMATIVAS ---
const STATS_CONFIG: StatConfigItem[] = [
  {
    id: 'gestion_estudiantes',
    label: 'Módulo de Estudiantes',
    description: 'Control de matrículas, postulantes y perfiles.',
    statusText: 'Habilitado',
    icon: Users,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    permissionPath: 'gestion_estudiantes',
    route: '/campus/panel-control/gestion-estudiantes'
  },
  {
    id: 'gestion_personal',
    label: 'Módulo de Personal',
    description: 'Administración de docentes y staff administrativo.',
    statusText: 'Habilitado',
    icon: Briefcase,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    permissionPath: 'gestion_personal',
    route: '/campus/panel-control/gestion-personal'
  },
  {
    id: 'tramites_finanzas',
    label: 'Trámites y Finanzas',
    description: 'Gestión de pagos, pensiones y solicitudes.',
    statusText: 'Habilitado',
    icon: FileText,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    permissionPath: 'tramites_finanzas',
    route: '/campus/panel-control/tramites/configuracion'
  },
  {
    id: 'academico',
    label: 'Gestión Académica',
    description: 'Control de horarios, cursos y estructura escolar.',
    statusText: 'Habilitado',
    icon: BookOpen,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    permissionPath: 'academico',
    route: '/campus/panel-control/gestion-academica'
  },
  {
    id: 'contenido_web',
    label: 'Portal Web',
    description: 'Edición de noticias, eventos y página principal.',
    statusText: 'Habilitado',
    icon: Globe,
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50',
    permissionPath: 'contenido_web',
    route: '/campus/panel-control/pagina-web'
  },
  {
    id: 'chatbot',
    label: 'Asistente IA',
    description: 'Configuración y monitoreo del Chatbot.',
    statusText: 'Habilitado',
    icon: Bot,
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50',
    permissionPath: 'chatbot',
    route: '/campus/panel-control/chatbot'
  }
];

export default function DashboardPage() {
  const { role, username, permisos, loading } = useUser();
  const [adminNombre, setAdminNombre] = useState("");
  const [metrics, setMetrics] = useState({ postulantes: 0, docentes: 0, noticias: 0 });
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const postulantesCount = metrics.postulantes;

  useEffect(() => {
    if (role?.toUpperCase() !== "ADMIN") return;

    // Nombre del administrador para el saludo
    if (username) {
      apiFetch(`/perfil/mi-perfil/${username}`)
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
          if (data?.datos) {
            setAdminNombre(`${data.datos.nombres ?? ""} ${data.datos.apellidos ?? ""}`.trim());
          }
        })
        .catch(() => {});
    }

    // Métricas en vivo del sistema
    const fetchMetrics = async () => {
      setLoadingMetrics(true);
      try {
        const [resPost, resDoc, resNot] = await Promise.all([
          hasPermission(permisos, "gestion_estudiantes") ? apiFetch("/alumnos/solicitudes-pendientes") : Promise.resolve(null),
          apiFetch("/docentes/"),
          apiFetch("/web/noticias/"),
        ]);
        const postulantes = resPost && resPost.ok ? (await resPost.json()).length : 0;
        const docentes = resDoc.ok ? (await resDoc.json()).length : 0;
        const noticias = resNot.ok ? (await resNot.json()).length : 0;
        setMetrics({ postulantes, docentes, noticias });
      } catch (error) {
        console.error("Error cargando métricas:", error);
      } finally {
        setLoadingMetrics(false);
      }
    };
    fetchMetrics();
  }, [role, username, permisos]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
      </div>
    );
  }

  if (role?.toUpperCase() !== "ADMIN") return null;

  // Tarjetas de métricas en vivo (según permisos)
  const metricCards = [
    { label: "Postulantes pendientes", value: metrics.postulantes, icon: UserPlus, color: "text-orange-600", bg: "bg-orange-50", show: hasPermission(permisos, "gestion_estudiantes") },
    { label: "Docentes registrados", value: metrics.docentes, icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50", show: hasPermission(permisos, "gestion_personal") },
    { label: "Noticias publicadas", value: metrics.noticias, icon: Newspaper, color: "text-indigo-600", bg: "bg-indigo-50", show: hasPermission(permisos, "contenido_web") },
  ].filter(m => m.show);

  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen">
      <div className="w-full h-full space-y-6 pb-8">
        <div className="p-4 md:p-8 space-y-8 w-full">

          {/* 1. SALUDO CON NOMBRE Y FECHA */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#701C32] to-[#922a44] rounded-2xl p-8 shadow-lg shadow-[#701C32]/10">
            <div className="relative z-10">
              <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">{getFormattedDate()}</p>
              <h3 className="text-white text-3xl font-black">
                {getGreeting()}, {adminNombre || username || "Administrador"} 👋
              </h3>
              <p className="text-white/80 mt-2 max-w-md">
                Bienvenido a tu panel de administración. Aquí tienes un resumen del sistema.
              </p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <LayoutDashboard className="w-48 h-48 text-white" />
            </div>
          </div>

          {/* 2. MÉTRICAS EN VIVO */}
          {metricCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {metricCards.map((m) => (
                <div key={m.label} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-5">
                  <div className={`p-4 ${m.bg} ${m.color} rounded-2xl shrink-0`}>
                    {React.createElement(m.icon, { className: "w-7 h-7" })}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{m.label}</p>
                    <h4 className="text-3xl font-black text-gray-900 mt-1">
                      {loadingMetrics ? <span className="text-gray-300">…</span> : m.value}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. MÓDULOS DEL SISTEMA (accesos rápidos) */}
          <div>
            <h3 className="text-lg font-black text-gray-900 mb-4">Módulos del sistema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {STATS_CONFIG
                .filter(stat => hasPermission(permisos, stat.permissionPath))
                .map((stat) => (
                  <PermissionCard
                    key={stat.id}
                    icon={React.createElement(stat.icon, { className: stat.colorClass })}
                    bg={stat.bgClass}
                    label={stat.label}
                    description={stat.description}
                    statusText={stat.statusText}
                    route={stat.route}
                  />
                ))}
            </div>
          </div>

          {/* Banner de Solicitudes (Solo si tiene permiso de estudiantes) */}
          {hasPermission(permisos, "gestion_estudiantes") && (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
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
                </p>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
                  <Link href="/campus/panel-control/gestion-estudiantes" className="w-full sm:w-auto">
                    <button className="w-full bg-[#09397c] text-white px-8 py-4 rounded-xl text-sm font-black hover:bg-[#062d59] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#09397c]/20 hover:-translate-y-0.5 active:scale-95">
                      IR A GESTIÓN DE ADMISIÓN
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Tarjeta de módulo: ahora es un acceso directo (Link) a su sección
function PermissionCard({ icon, bg, label, description, statusText, route }: PermissionCardProps) {
  return (
    <Link href={route} className="block group h-full">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#09397c]/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 ${bg} rounded-xl group-hover:scale-110 transition-transform`}>
              {/* Agregamos una aserción de tipo para acceder a props.className de forma segura */}
              {React.cloneElement(icon as React.ReactElement<any>, {
                className: `w-6 h-6 ${(icon.props as any).className || ""}`
              })}
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1.5 rounded-md uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              {statusText}
            </span>
          </div>

          <h4 className="text-gray-900 text-base font-black tracking-tight mb-1">{label}</h4>
          <p className="text-gray-500 text-xs font-medium leading-relaxed">{description}</p>
        </div>
        <div className="mt-4 flex items-center gap-1 text-[#09397c] text-xs font-black opacity-0 group-hover:opacity-100 transition-opacity">
          Entrar <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}