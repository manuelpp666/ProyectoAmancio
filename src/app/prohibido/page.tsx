"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import { useUser } from "@/src/context/userContext";

export default function ForbiddenPage() {
  const router = useRouter();
  const { role } = useUser();

  // Función para redirigir al inicio correspondiente según el rol
  const handleGoHome = () => {
    if (!role) {
      router.push("/campus");
      return;
    }

    const routes = {
      ADMIN: "/campus/panel-control",
      DOCENTE: "/campus/campus-docente/inicio-docente",
      ALUMNO: "/campus/campus-estudiante/inicio-campus",
      AUXILIAR: "/campus/campus-auxiliar/inicio",
    };

    const destination = routes[role as keyof typeof routes] || "/campus/campus-estudiante/inicio-campus";
    router.push(destination);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Iconografía de Seguridad */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-red-100 rounded-full blur-3xl opacity-50 scale-150"></div>
          <div className="relative bg-white p-8 rounded-3xl shadow-xl border border-red-50">
            <ShieldAlert size={80} className="text-red-500 animate-pulse" />
            <div className="absolute -top-2 -right-2 bg-[#701C32] p-2 rounded-lg shadow-lg">
              <Lock size={20} className="text-white" />
            </div>
          </div>
        </div>

        {/* Mensaje de Error */}
        <div className="space-y-3">
          <h1 className="text-7xl font-black text-[#093E7A] tracking-tighter">403</h1>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-wide">
            Acceso Restringido
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Lo sentimos, no tienes los permisos necesarios para acceder a esta sección del campus virtual.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-3 pt-4">
          <button
            onClick={handleGoHome}
            className="w-full bg-[#701C32] hover:bg-[#5a1628] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#701C32]/20 active:scale-95"
          >
            <Home size={20} />
            VOLVER A MI INICIO
          </button>
          
        </div>

        {/* Pie de página informativo */}
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pt-8">
          I.E.P. Amancio Varona • Sistema de Seguridad
        </p>
      </div>
    </div>
  );
}