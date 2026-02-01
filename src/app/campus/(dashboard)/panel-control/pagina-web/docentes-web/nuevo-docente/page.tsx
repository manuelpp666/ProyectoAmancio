"use client";
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import {
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import { DocenteCreate } from "@/src/interfaces/docente";
import { useState } from 'react';
import { DocenteForm } from '@/src/components/Docente/FormularioDocente';

export default function RegistrarDocentePage() {
  const [loading, setLoading] = useState(false);

  // 'data' contiene los valores validados que vienen del formulario
  const handleCreate = async (data: DocenteCreate) => {
    setLoading(true);
    const toastId = toast.loading("Enviando datos al servidor...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docentes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data), // Usamos 'data' directamente
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.detail;
        const message = Array.isArray(errorMsg) ? errorMsg[0].msg : errorMsg;
        throw new Error(message || "Error al registrar");
      }

      toast.success("¡Docente registrado correctamente!", { id: toastId });
      
      // Si quieres limpiar el formulario después de éxito, 
      // podrías necesitar pasar resetForm desde el componente hijo o 
      // simplemente redireccionar al listado.

    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex h-screen overflow-hidden">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">

          {/* Header */}
          <header className="h-20 border-b bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-6">
              <Link
                href="/campus/panel-control/pagina-web/docentes-web"
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#093E7A] transition-all"
              >
                <ArrowLeft size={24} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#093E7A]/10 rounded-xl flex items-center justify-center text-[#093E7A]">
                  <UserPlus size={22} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Registrar Nuevo Docente</h2>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto py-12 px-6">
              <DocenteForm onSubmit={handleCreate} loading={loading} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

