"use client";
import { useEffect, useState } from "react";
import { X, Download, FileText, Clock, User, CheckCircle, MessageSquare, Save } from "lucide-react";
import { toast } from "sonner";

export default function ModalVerEntregas({ tarea, onClose }: { tarea: any; onClose: () => void }) {
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para calificar
  const [notas, setNotas] = useState<{ [key: number]: number }>({});
  const [retros, setRetros] = useState<{ [key: number]: string }>({});
  const [editandoRetro, setEditandoRetro] = useState<number | null>(null);

  useEffect(() => {
    const fetchEntregas = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/tareas/${tarea.id_tarea}/entregas`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEntregas(data);
        
        const notasIniciales: any = {};
        const retrosIniciales: any = {};
        data.forEach((e: any) => {
          if (e.calificacion) notasIniciales[e.id_entrega] = e.calificacion;
          if (e.retroalimentacion_docente) retrosIniciales[e.id_entrega] = e.retroalimentacion_docente;
        });
        setNotas(notasIniciales);
        setRetros(retrosIniciales);
      } catch (error) {
        toast.error("Error al cargar los archivos");
      } finally {
        setLoading(false);
      }
    };
    fetchEntregas();
  }, [tarea.id_tarea]);

  const guardarCalificacion = async (idEntrega: number) => {
    const nota = notas[idEntrega];
    const retro = retros[idEntrega] || "";

    if (nota === undefined || nota < 0 || nota > 20) {
      toast.error("Nota inválida (0-20)");
      return;
    }

    try {
      // Enviamos nota y retroalimentación al endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/virtual/calificar-entrega/${idEntrega}?calificacion=${nota}&retroalimentacion=${encodeURIComponent(retro)}`, 
        { method: 'PUT' }
      );

      if (!res.ok) throw new Error();
      toast.success("Evaluación guardada con éxito");
      setEditandoRetro(null);
    } catch (error) {
      toast.error("Error al guardar");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#701C32] text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-lg"><FileText size={24} /></div>
            <div>
              <h2 className="text-xl font-bold leading-tight">{tarea.titulo}</h2>
              <p className="text-red-100 text-xs uppercase tracking-widest font-semibold">Calificación y Retroalimentación</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <div className="animate-spin mb-4 border-4 border-t-[#701C32] border-gray-200 rounded-full w-10 h-10"></div>
               <p>Cargando alumnos...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entregas.map((e) => (
                <div key={e.id_entrega} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                  <div className="p-5 flex flex-col md:flex-row justify-between gap-4 bg-white">
                    
                    {/* Info Alumno y su comentario */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#701C32] font-bold">{e.alumno.charAt(0)}</div>
                        <div>
                          <p className="font-bold text-gray-800">{e.alumno}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1 uppercase"><Clock size={10}/> {e.fecha_envio}</p>
                        </div>
                      </div>
                      {e.comentario && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-2 mt-2 rounded-r-lg">
                          <p className="text-xs text-amber-800 italic">" {e.comentario} "</p>
                        </div>
                      )}
                    </div>

                    {/* Controles de Calificación */}
                    <div className="flex flex-wrap items-center gap-3">
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}${e.archivo_url}`} target="_blank"
                         className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#701C32] hover:text-white transition-all">
                        <Download size={14} /> Leer Tarea
                      </a>

                      <button 
                        onClick={() => setEditandoRetro(editandoRetro === e.id_entrega ? null : e.id_entrega)}
                        className={`p-2 rounded-xl border transition-colors ${retros[e.id_entrega] ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                        title="Añadir retroalimentación"
                      >
                        <MessageSquare size={18} />
                      </button>

                      <div className="flex items-center gap-2 bg-blue-600 p-1 rounded-xl shadow-lg shadow-blue-200">
                        <input 
                          type="number"
                          value={notas[e.id_entrega] || ""}
                          onChange={(val) => setNotas({...notas, [e.id_entrega]: Number(val.target.value)})}
                          className="w-12 text-center bg-white border-none rounded-lg py-1 text-sm font-bold focus:ring-0"
                          placeholder="00"
                        />
                        <button onClick={() => guardarCalificacion(e.id_entrega)} className="text-white px-2 hover:scale-110 transition-transform">
                          <Save size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Área de Retroalimentación (Se expande) */}
                  {editandoRetro === e.id_entrega && (
                    <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 duration-300">
                      <textarea
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                        rows={3}
                        placeholder="Escribe una retroalimentación para el alumno..."
                        value={retros[e.id_entrega] || ""}
                        onChange={(val) => setRetros({...retros, [e.id_entrega]: val.target.value})}
                      />
                      <p className="text-[10px] text-gray-400 mt-1 italic">El alumno podrá ver este comentario desde su aula virtual.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}