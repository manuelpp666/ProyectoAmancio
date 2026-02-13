"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/src/context/userContext"; 
import { toast } from "sonner";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SolicitudesPage() {
  const { user } = useUser();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id_alumno) {
      fetchSolicitudes();
    }
  }, [user]);

  const fetchSolicitudes = async () => {
    try {
      const res = await fetch(`${API_URL}/finance/solicitudes/alumno/${user?.id_alumno}`);
      if (res.ok) setSolicitudes(await res.json());
    } catch (error) {
      toast.error("Error al cargar solicitudes");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "PENDIENTE_PAGO":
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><AlertCircle size={12}/> Pendiente Pago</span>;
      case "EN_PROCESO":
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><Clock size={12}/> En Proceso</span>;
      case "ACEPTADO":
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle size={12}/> Aceptado</span>;
      case "RECHAZADO":
        return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><XCircle size={12}/> Rechazado</span>;
      default:
        return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{estado}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      
      {/* HEADER */}
      <div className="h-20 bg-white border-b px-8 flex items-center justify-between shrink-0">
        <div>
           <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
             <FileText className="text-[#701C32]" />
             Mis Solicitudes
           </h1>
           <p className="text-gray-500 text-sm">Gestiona y revisa el estado de tus trámites.</p>
        </div>
        {/* CORRECCIÓN: Ruta actualizada con 'inicio-campus' */}
        <Link 
          href="/campus/campus-estudiante/inicio-campus/tramites/solicitud/nuevo" 
          className="bg-[#701C32] hover:bg-[#5a1628] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/10 flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Trámite
        </Link>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Cargando solicitudes...</div>
        ) : solicitudes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
             <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                <FileText size={40} />
             </div>
             <h3 className="text-lg font-bold text-gray-800">No tienes solicitudes</h3>
             <p className="text-gray-500 text-sm mb-6">Aún no has realizado ningún trámite.</p>
             {/* CORRECCIÓN: Ruta actualizada */}
             <Link href="/campus/campus-estudiante/inicio-campus/tramites/solicitud/nuevo" className="text-[#701C32] font-bold hover:underline">
                ¡Solicita uno ahora!
             </Link>
          </div>
        ) : (
          <div className="grid gap-4">
             {solicitudes.map((sol) => (
               <div key={sol.id_solicitud_tramite} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="size-12 rounded-lg bg-blue-50 flex items-center justify-center text-[#701C32]">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h4 className="font-bold text-gray-800 text-lg">{sol.tipo_tramite?.nombre || "Trámite"}</h4>
                        <p className="text-gray-400 text-xs">Solicitado el: {new Date(sol.fecha_solicitud).toLocaleDateString()}</p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Estado</p>
                        {getStatusBadge(sol.estado)}
                     </div>
                     {sol.estado === 'PENDIENTE_PAGO' && (
                        <Link href="/campus/campus-estudiante/inicio-campus/tramites/pago" className="text-sm font-bold text-[#701C32] border border-[#701C32] px-4 py-2 rounded-lg hover:bg-[#701C32] hover:text-white transition-colors">
                           Pagar Ahora
                        </Link>
                     )}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}