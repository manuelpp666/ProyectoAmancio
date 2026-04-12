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
}

// 2. Obtener fecha formateada (Ej: "Lunes, 24 de Mayo")
const getFormattedDate = () => {
  const date = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const formatted = new Intl.DateTimeFormat('es-PE', options).format(date);
  // Capitalizar la primera letra
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
    permissionPath: 'gestion_estudiantes'
  },
  {
    id: 'gestion_personal',
    label: 'Módulo de Personal',
    description: 'Administración de docentes y staff administrativo.',
    statusText: 'Habilitado',
    icon: Briefcase,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    permissionPath: 'gestion_personal'
  },
  {
    id: 'tramites_finanzas',
    label: 'Trámites y Finanzas',
    description: 'Gestión de pagos, pensiones y solicitudes.',
    statusText: 'Habilitado',
    icon: FileText,
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    permissionPath: 'tramites_finanzas'
  },
  {
    id: 'academico',
    label: 'Gestión Académica',
    description: 'Control de horarios, cursos y estructura escolar.',
    statusText: 'Habilitado',
    icon: BookOpen,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    permissionPath: 'academico'
  },
  {
    id: 'contenido_web',
    label: 'Portal Web',
    description: 'Edición de noticias, eventos y página principal.',
    statusText: 'Habilitado',
    icon: Globe,
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50',
    permissionPath: 'contenido_web'
  },
  {
    id: 'chatbot',
    label: 'Asistente IA',
    description: 'Configuración y monitoreo del Chatbot.',
    statusText: 'Habilitado',
    icon: Bot,
    colorClass: 'text-rose-600',
    bgClass: 'bg-rose-50',
    permissionPath: 'chatbot'
  }
];

export default function DashboardPage() {
  const { role, username, permisos, loading } = useUser();
  const [postulantesCount, setPostulantesCount] = useState(0);

  // Estado simulado para los valores de las tarjetas (idealmente lo llenas con un fetch)
  const [metrics, setMetrics] = useState({
    estudiantes: "1,250",
    docentes: "84",
    noticias: "45"
  });

  useEffect(() => {
    if (role?.toUpperCase() === "ADMIN") {
      const fetchPostulantes = async () => {
        try {
          const res = await apiFetch("/alumnos/solicitudes-pendientes");
          if (res.ok) {
            const data = await res.json();
            setPostulantesCount(data.length);
          }
        } catch (error) {
          console.error("Error cargando conteo de postulantes:", error);
        }
      };

      // Solo llamar a la API si tiene el permiso de gestión de estudiantes
      if (hasPermission(permisos, "gestion_estudiantes")) {
        fetchPostulantes();
      }
    }
  }, [role, permisos]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
      </div>
    );
  }

  if (role?.toUpperCase() !== "ADMIN") return null;

  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen">
      <div className="w-full h-full space-y-6 pb-8">
        <div className="p-4 md:p-8 space-y-8 w-full">

          {/* 1. WELCOME BANNER DINÁMICO */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#701C32] to-[#922a44] rounded-2xl p-8 shadow-lg shadow-[#701C32]/10">
            <div className="relative z-10">
              <h3 className="text-white text-2xl font-black italic">
                {getGreeting()}
              </h3>
              <p className="text-white/80 mt-1 max-w-md">
                {getFormattedDate()}. Revisa las actualizaciones del sistema.
              </p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <LayoutDashboard className="w-48 h-48 text-white" />
            </div>
          </div>

          {/* 2. STATS GRID DINÁMICO BASADO EN PERMISOS */}
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
                />
              ))}
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

// Componente auxiliar mantenido igual, pero recibe el icono ya renderizado
function PermissionCard({ icon, bg, label, description, statusText }: PermissionCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-[#09397c]/20 transition-all duration-300 flex flex-col justify-between h-full group">
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
    </div>
  );
}