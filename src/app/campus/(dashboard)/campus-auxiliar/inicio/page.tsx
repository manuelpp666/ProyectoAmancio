"use client";

import { useUser } from "@/src/context/userContext";
import {
  ClipboardCheck,
  FileWarning,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  Info,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuxiliarDashboardPage() {
  const { username } = useUser();
  const [fechaActual, setFechaActual] = useState("");

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    const formatted = new Intl.DateTimeFormat("es-PE", options).format(new Date());
    setFechaActual(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  const accesos = [
    {
      label: "Control de Asistencia",
      desc: "Registra la asistencia diaria por sección",
      icon: ClipboardCheck,
      href: "/campus/campus-auxiliar/asistencia",
      accent: "bg-blue-50 text-blue-600",
      hover: "hover:border-[#093E7A]/30",
    },
    {
      label: "Reportes y Partes",
      desc: "Gestión de partes disciplinarios e incidencias",
      icon: FileWarning,
      href: "/campus/campus-auxiliar/reportes",
      accent: "bg-[#FFF1E3] text-[#701C32]",
      hover: "hover:border-[#701C32]/30",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8">
      {/* BANNER DE BIENVENIDA */}
      <div className="bg-[#701C32] rounded-3xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-24 -bottom-16 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-[10px] font-bold tracking-widest mb-4 uppercase backdrop-blur-sm">
              <ShieldCheck size={12} /> Auxiliar de Educación
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              ¡Hola de nuevo, {username}!
            </h1>
            <p className="text-white/85 mt-2 text-sm md:text-base flex items-center gap-2">
              <CalendarDays size={16} /> {fechaActual}
            </p>
          </div>
          <div className="hidden md:flex w-20 h-20 rounded-2xl bg-white/10 border border-white/15 items-center justify-center shrink-0">
            <ClipboardCheck size={36} className="text-[#FFF1E3]" />
          </div>
        </div>
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div>
        <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
          Módulos de Gestión
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accesos.map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className={`group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${a.hover} hover:shadow-md transition-all flex flex-col`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${a.accent}`}>
                  <a.icon size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">{a.label}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">{a.desc}</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[#701C32] font-bold text-sm">
                Ir al módulo
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* PANEL DE ORIENTACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2 mb-4">
            <ListChecks className="text-[#701C32]" size={20} /> Tareas del día
          </h2>
          <ul className="space-y-3">
            {[
              "Registrar la asistencia de cada sección a primera hora.",
              "Verificar tardanzas y justificaciones del día.",
              "Registrar los partes o incidencias disciplinarias pendientes.",
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="mt-1 w-5 h-5 rounded-full bg-[#FFF1E3] text-[#701C32] text-[11px] font-black flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#2C3E50] rounded-2xl shadow-sm p-8 text-white flex flex-col justify-center">
          <div className="flex items-start gap-4">
            <div className="bg-[#701C32] p-3 rounded-lg shadow-lg shrink-0">
              <Info size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-xl mb-2 text-white">Recordatorio del Auxiliar</h2>
              <p className="text-gray-300 leading-relaxed text-sm">
                Registra la asistencia <span className="text-white font-bold">el mismo día</span> y mantén
                actualizados los partes disciplinarios. Esta información alimenta el seguimiento de conducta
                del departamento de psicología.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-sm">
            <span className="text-gray-400">Estado del Sistema:</span>
            <span className="flex items-center gap-2 text-green-400 font-medium">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Sincronizado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
