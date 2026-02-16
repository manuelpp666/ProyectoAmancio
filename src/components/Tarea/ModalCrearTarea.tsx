"use client";
import { useEffect, useState } from "react";
import { X, Save, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ModalCrearTarea({ idCarga, bimestre, tareaExistente, onClose, onRefresh }: any) {
  const [loading, setLoading] = useState(false);
  
  // Inicializamos el estado. Si existe tareaExistente, cargamos sus datos, sino, valores por defecto.
  const [formData, setFormData] = useState({
    id_carga_academica: idCarga,
    titulo: "",
    descripcion: "",
    fecha_entrega: "",
    tipo_evaluacion: "TAREA",
    bimestre: bimestre || 1,
    peso: 0
  });

  // EFECTO CRÍTICO: Detecta cuando abrimos el modal para editar o crear
  useEffect(() => {
    if (tareaExistente) {
      setFormData({
        id_carga_academica: idCarga,
        titulo: tareaExistente.titulo || "",
        descripcion: tareaExistente.descripcion || "",
        // Formateamos la fecha para que el input datetime-local la reconozca (YYYY-MM-DDTHH:MM)
        fecha_entrega: tareaExistente.fecha_entrega ? tareaExistente.fecha_entrega.slice(0, 16) : "",
        tipo_evaluacion: tareaExistente.tipo || "TAREA",
        bimestre: tareaExistente.bimestre || bimestre,
        peso: tareaExistente.peso || 0
      });
    }
  }, [tareaExistente, idCarga, bimestre]);

  // Si hay entregas, bloqueamos campos según la regla del backend
  const tieneEntregas = tareaExistente?.total_entregas > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading(tareaExistente ? "Actualizando..." : "Guardando...");

    try {
      // Si hay tareaExistente usamos PUT y el ID, si no POST
      const url = tareaExistente 
        ? `${process.env.NEXT_PUBLIC_API_URL}/virtual/tareas/${tareaExistente.id_tarea}`
        : `${process.env.NEXT_PUBLIC_API_URL}/virtual/tareas/`;
      
      const method = tareaExistente ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(tareaExistente ? "¡Actividad actualizada!" : "¡Actividad creada!", { id: toastId });
        onRefresh();
        onClose();
      } else {
        toast.error(data.detail || "Error en la operación", { id: toastId });
      }
    } catch (error) {
      toast.error("Error de conexión", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header Dinámico */}
        <div className="bg-[#701C32] p-4 text-white flex justify-between items-center">
          <h2 className="font-bold text-lg">
            {tareaExistente ? "Editar Actividad" : "Crear Nueva Actividad"}
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition">
            <X size={20} />
          </button>
        </div>

        {tieneEntregas && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 flex gap-2 items-center text-amber-700 text-xs">
            <AlertCircle size={16} />
            <span>Algunos campos están bloqueados porque ya existen entregas de alumnos.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título</label>
            <input 
              required
              disabled={tieneEntregas} // Bloqueado si hay archivos
              value={formData.titulo}
              className={`w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#701C32] ${tieneEntregas ? 'bg-gray-100' : ''}`}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
              <select 
                disabled={tieneEntregas} // Bloqueado si hay archivos
                value={formData.tipo_evaluacion}
                className={`w-full border border-gray-200 rounded-lg px-3 py-2 outline-none ${tieneEntregas ? 'bg-gray-100' : ''}`}
                onChange={(e) => setFormData({...formData, tipo_evaluacion: e.target.value})}
              >
                <option value="TAREA">Tarea Normal</option>
                <option value="EXAMEN_PARCIAL">Examen Parcial</option>
                <option value="EXAMEN_BIMESTRAL">Examen Bimestral</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bimestre</label>
              <select 
                value={formData.bimestre}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none"
                onChange={(e) => setFormData({...formData, bimestre: parseInt(e.target.value)})}
              >
                {[1,2,3,4].map(b => <option key={b} value={b}>{b}er Bimestre</option>)}
              </select>
            </div>
            <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peso (%)</label>
    <input 
      type="number"
      min="0"
      max="100"
      required
      value={formData.peso}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#701C32]"
      onChange={(e) => setFormData({...formData, peso: parseInt(e.target.value) || 0})}
    />
  </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha Límite</label>
            <input 
              type="datetime-local"
              required
              value={formData.fecha_entrega}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:border-[#701C32] outline-none"
              onChange={(e) => setFormData({...formData, fecha_entrega: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instrucciones / Descripción</label>
            <textarea 
              rows={3}
              value={formData.descripcion}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:border-[#701C32] outline-none resize-none"
              onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
            ></textarea>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg font-bold hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#701C32] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#8a223d] flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {tareaExistente ? "Guardar Cambios" : "Guardar Actividad"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}