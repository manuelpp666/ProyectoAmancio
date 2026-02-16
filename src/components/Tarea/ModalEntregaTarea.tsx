"use client";
import { useState } from "react";
import { 
  X, 
  Upload as FileUp, 
  FileCheck, 
  Loader2, 
  Calendar, 
  Info,
  MessageSquare, // Icono para el comentario
  CheckCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function ModalEntregaTarea({ tarea, idUsuario, onClose, onRefresh }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Por favor selecciona un archivo");
    const idTareaFinal = tarea.id_tarea || tarea.id;
    
    if (!idTareaFinal || !idUsuario) {
      return toast.error("Error: Faltan identificadores de tarea o usuario");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("id_tarea", String(idTareaFinal));
      formData.append("id_usuario", String(idUsuario));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/virtual/entregar-tarea/`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("¡Tarea entregada con éxito!");
        onRefresh();
        onClose();
      } else {
        const errorData = await res.json();
        if (errorData.detail && Array.isArray(errorData.detail)) {
          toast.error(`Error de validación: ${errorData.detail[0].msg}`);
        } else {
          toast.error(errorData.detail || "Error al entregar la tarea");
        }
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-[#701C32] p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black">{tarea.titulo}</h2>
            <p className="text-white/70 text-sm flex items-center gap-1 mt-1">
              <Calendar size={14} /> Entrega: {new Date(tarea.fecha_entrega).toLocaleDateString()}
            </p>
            <p className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
        Valor: {tarea.peso}%
      </p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Instrucciones */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Info size={14} /> Instrucciones del Docente
            </h4>
            <p className="text-gray-700 leading-relaxed text-sm">
              {tarea.descripcion || "Sin descripción adicional proporcionada por el docente."}
            </p>
          </div>

          {/* --- VISTA SI LA TAREA YA FUE ENTREGADA --- */}
          {tarea.entregado ? (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
                <CheckCircle className="text-green-600" size={24} />
                <div>
                  <p className="text-green-800 font-bold text-sm">Tarea Entregada</p>
                  <p className="text-green-600 text-xs">Ya has enviado tu archivo para esta actividad.</p>
                </div>
              </div>

              {/* Comentario del Docente (Retroalimentación) */}
              {tarea.retroalimentacion_docente && (
                <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <MessageSquare size={40} className="text-blue-600" />
                  </div>
                  <h4 className="text-blue-800 font-bold text-sm flex items-center gap-2 mb-2">
                    <MessageSquare size={16} /> Retroalimentación del Docente
                  </h4>
                  <p className="text-blue-700 text-sm italic leading-relaxed">
                    "{tarea.retroalimentacion_docente}"
                  </p>
                  {tarea.nota !== null && (
                    <div className="mt-4 pt-4 border-t border-blue-200/50 flex justify-between items-center">
                      <span className="text-blue-800 text-xs font-bold uppercase">Calificación:</span>
                      <span className="text-2xl font-black text-blue-900">{tarea.nota}</span>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={onClose}
                className="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                Cerrar Detalle
              </button>
            </div>
          ) : (
            /* --- VISTA PARA SUBIR TAREA (SI NO ESTÁ ENTREGADA) --- */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">Tu entrega</label>
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-[#701C32]/30'}`}>
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <div className={`p-4 rounded-full mb-3 ${file ? 'bg-green-100 text-green-600' : 'bg-[#701C32]/10 text-[#701C32]'}`}>
                      {file ? <FileCheck size={32} /> : <FileUp size={32} />}
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      {file ? file.name : "Haz clic para seleccionar tu archivo"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX o Imágenes (Máx. 10MB)</p>
                  </label>
                </div>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={loading || !file}
                className="w-full bg-[#701C32] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#701C32]/20 hover:bg-[#5a1628] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="animate-spin" size={20} /> Entregando...</>
                ) : (
                  "Confirmar Entrega"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}