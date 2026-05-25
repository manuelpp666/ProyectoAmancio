"use client";

import { useUser } from "@/src/context/userContext";
import { LayoutDashboard, Users, ClipboardCheck, FileWarning, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AuxiliarDashboardPage() {
  const { username } = useUser();
  const [fechaActual, setFechaActual] = useState("");

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const formatted = new Intl.DateTimeFormat('es-PE', options).format(new Date());
    setFechaActual(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* BANNER DE BIENVENIDA */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#701C32] to-[#922a44] rounded-2xl p-8 shadow-lg shadow-[#701C32]/10">
        <div className="relative z-10">
          <h3 className="text-white text-2xl font-black italic">
            ¡Hola de nuevo, Auxiliar {username}!
          </h3>
          <p className="text-white/80 mt-2 font-medium">
            {fechaActual}
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
          <LayoutDashboard className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* ACCESOS RÁPIDOS */}
      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mt-8 mb-4">Módulos de Gestión</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card Asistencia */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#093E7A]/20 transition-all flex flex-col group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <ClipboardCheck size={28} />
            </div>
            <div>
              <h4 className="text-xl font-black text-gray-800">Control de Asistencia</h4>
              <p className="text-xs text-gray-500 font-medium mt-1">Registra la asistencia diaria por sección</p>
            </div>
          </div>
          <Link href="/campus/campus-auxiliar/asistencia" className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors">
            Ir al módulo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Card Reportes */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#701C32]/20 transition-all flex flex-col group">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-red-50 text-[#701C32] rounded-xl group-hover:scale-110 transition-transform">
              <FileWarning size={28} />
            </div>
            <div>
              <h4 className="text-xl font-black text-gray-800">Reportes y Partes</h4>
              <p className="text-xs text-gray-500 font-medium mt-1">Gestión de partes disciplinarios e incidencias</p>
            </div>
          </div>
          <Link href="/campus/campus-auxiliar/reportes" className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-[#701C32] font-bold text-sm hover:text-[#5a1628] transition-colors">
            Ir al módulo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </div>
  );
}