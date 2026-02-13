"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/src/context/userContext"; 
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, CheckCircle, FileText, Info } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TipoTramite {
  id_tipo_tramite: number;
  nombre: string;
  costo: number;
  requisitos: string;
  alcance: "TODOS" | "GRADOS";
  grados_permitidos: string | null; // "1,2,3"
}

export default function NuevoTramitePage() {
  const router = useRouter();
  const { user } = useUser();
  const [paso, setPaso] = useState(1); // 1: Selección, 2: Formulario, 3: Confirmación
  const [tramites, setTramites] = useState<TipoTramite[]>([]);
  const [selectedTramite, setSelectedTramite] = useState<TipoTramite | null>(null);
  const [comentario, setComentario] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [miGradoId, setMiGradoId] = useState<number | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    const init = async () => {
      if (!user?.id_alumno) return;
      
      try {
        // 1. Obtener matrícula actual para saber mi grado
        const resMat = await fetch(`${API_URL}/enrollment/matriculas/?anio_id=2026`); // Ajustar año dinámicamente si puedes
        if(resMat.ok) {
           const matriculas = await resMat.json();
           const miMatricula = matriculas.find((m:any) => m.id_alumno === user.id_alumno);
           if(miMatricula) setMiGradoId(miMatricula.id_grado);
        }

        // 2. Cargar trámites
        const resTram = await fetch(`${API_URL}/finance/tramites-tipos/`);
        if(resTram.ok) setTramites(await resTram.json());

      } catch (e) {
        toast.error("Error cargando datos");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [user]);

  // Filtrar trámites disponibles para mi grado
  const tramitesDisponibles = tramites.filter(t => {
    if (t.alcance === 'TODOS') return true;
    if (t.alcance === 'GRADOS' && miGradoId) {
       const permitidos = t.grados_permitidos?.split(',').map(Number) || [];
       return permitidos.includes(miGradoId);
    }
    return false;
  });

  const handleSeleccionar = (t: TipoTramite) => {
    setSelectedTramite(t);
    setPaso(2);
  };

  const handleConfirmar = async () => {
    if(!selectedTramite || !user?.id_alumno) return;

    try {
       const res = await fetch(`${API_URL}/finance/solicitudes/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
             id_alumno: user.id_alumno,
             id_tipo_tramite: selectedTramite.id_tipo_tramite,
             comentario_usuario: comentario
          })
       });

       if(res.ok) {
          toast.success("Solicitud creada correctamente");
          router.push("/campus/campus-estudiante/inicio-campus/tramites/solicitud"); // Volver a lista
       } else {
          toast.error("Error al crear solicitud");
       }
    } catch (e) {
       toast.error("Error de conexión");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
       {/* HEADER */}
       <div className="h-20 bg-white border-b px-8 flex items-center gap-4 shrink-0">
          <Link href="/campus/campus-estudiante/inicio-campus/tramites/solicitud" className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
             <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-black text-gray-800">Nueva Solicitud</h1>
       </div>

       <div className="flex-1 p-8 overflow-y-auto">
          
          {/* PASO 1: SELECCIÓN */}
          {paso === 1 && (
             <div className="max-w-5xl mx-auto">
                <h2 className="text-lg font-bold text-gray-700 mb-6">1. Selecciona el trámite que necesitas</h2>
                
                {isLoading ? <div className="text-center text-gray-400">Cargando catálogo...</div> : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {tramitesDisponibles.map(t => (
                         <button 
                           key={t.id_tipo_tramite}
                           onClick={() => handleSeleccionar(t)}
                           className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#701C32] hover:bg-red-50/10 transition-all text-left group"
                         >
                            <div className="flex justify-between items-start mb-4">
                               <div className="size-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-[#701C32] group-hover:text-white transition-colors">
                                  <FileText size={20} />
                               </div>
                               <span className="bg-green-100 text-green-700 text-xs font-black px-2 py-1 rounded">S/ {t.costo}</span>
                            </div>
                            <h3 className="font-bold text-gray-800 mb-2">{t.nombre}</h3>
                            <p className="text-xs text-gray-500 line-clamp-3">{t.requisitos || "Sin requisitos específicos."}</p>
                         </button>
                      ))}
                   </div>
                )}
             </div>
          )}

          {/* PASO 2: FORMULARIO Y CONFIRMACIÓN */}
          {paso === 2 && selectedTramite && (
             <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-[#701C32] p-6 text-white">
                   <h2 className="text-xl font-black">{selectedTramite.nombre}</h2>
                   <p className="opacity-90 text-sm mt-1">Completa la información para generar la solicitud.</p>
                </div>
                
                <div className="p-8 space-y-6">
                   
                   <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                      <Info className="text-blue-600 shrink-0" />
                      <div>
                         <h4 className="font-bold text-blue-800 text-sm">Requisitos:</h4>
                         <p className="text-blue-700 text-xs mt-1 whitespace-pre-line">{selectedTramite.requisitos || "No se especifican requisitos."}</p>
                      </div>
                   </div>

                   <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Comentarios Adicionales (Opcional)</label>
                      <textarea 
                         rows={4} 
                         className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-[#701C32]"
                         placeholder="Escribe aquí si tienes alguna observación..."
                         value={comentario}
                         onChange={(e) => setComentario(e.target.value)}
                      />
                   </div>

                   <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                      <span className="font-bold text-gray-600">Costo del trámite:</span>
                      <span className="font-black text-xl text-[#701C32]">S/ {selectedTramite.costo.toFixed(2)}</span>
                   </div>

                   <div className="pt-4 flex gap-4">
                      <button onClick={() => setPaso(1)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                         Cancelar
                      </button>
                      <button onClick={handleConfirmar} className="flex-1 py-3 bg-[#701C32] text-white font-bold rounded-xl hover:bg-[#5a1628] shadow-lg shadow-red-900/20 transition-all">
                         Confirmar Solicitud
                      </button>
                   </div>
                   
                   <p className="text-xs text-center text-gray-400">
                      Al confirmar, se generará una orden de pago pendiente.
                   </p>
                </div>
             </div>
          )}

       </div>
    </div>
  );
}