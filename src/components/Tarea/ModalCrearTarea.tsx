"use client";
import { useEffect, useState } from "react";
import { X, Save, AlertCircle, Loader2, FileUp, FileText } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";

const NOMBRES_BIMESTRE = ["I Bimestre", "II Bimestre", "III Bimestre", "IV Bimestre"];

export default function ModalCrearTarea({ idCarga, bimestre, tareaExistente, pesoUsadoBimestre = 0, onClose, onRefresh }: any) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [tienePeso, setTienePeso] = useState(false);
  const [tieneFecha, setTieneFecha] = useState(false);

  const [formData, setFormData] = useState({
    id_carga_academica: idCarga,
    titulo: "",
    descripcion: "",
    fecha_entrega: "",
    tipo_evaluacion: "TAREA",
    bimestre: bimestre || 1,
    peso: 0
  });

  useEffect(() => {
    if (tareaExistente) {
      setFormData({
        id_carga_academica: idCarga,
        titulo: tareaExistente.titulo || "",
        descripcion: tareaExistente.descripcion || "",
        fecha_entrega: tareaExistente.fecha_entrega ? tareaExistente.fecha_entrega.slice(0, 16) : "",
        tipo_evaluacion: tareaExistente.tipo || tareaExistente.tipo_evaluacion || "TAREA",
        bimestre: tareaExistente.bimestre || bimestre,
        peso: tareaExistente.peso || 0
      });
      setTienePeso((tareaExistente.peso || 0) > 0);
      setTieneFecha(!!tareaExistente.fecha_entrega);
    }
  }, [tareaExistente, idCarga, bimestre]);

  const tieneEntregas = tareaExistente?.total_entregas > 0;

  // Peso disponible: 100 - lo ya usado por las demás tareas del bimestre
  // (pesoUsadoBimestre ya excluye la tarea que se está editando)
  const pesoActual = tienePeso ? (formData.peso || 0) : 0;
  const pesoDisponible = 100 - pesoUsadoBimestre;
  const pesoRestante = pesoDisponible - pesoActual;
  const pesoExcedido = pesoRestante < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tienePeso && pesoExcedido) {
      toast.error(`El peso excede lo disponible en el bimestre (quedan ${pesoDisponible}%)`);
      return;
    }
    if (tieneFecha && !formData.fecha_entrega) {
      toast.error("Marcaste fecha límite pero no la indicaste");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(tareaExistente ? "Actualizando..." : "Guardando...");

    try {
      const dataToSend = new FormData();
      dataToSend.append("id_carga_academica", formData.id_carga_academica.toString());
      dataToSend.append("titulo", formData.titulo);
      dataToSend.append("descripcion", formData.descripcion || "");
      dataToSend.append("tipo_evaluacion", formData.tipo_evaluacion);
      dataToSend.append("bimestre", formData.bimestre.toString());
      dataToSend.append("peso", (tienePeso ? formData.peso : 0).toString());

      // Solo enviamos la fecha si el docente activó el checkbox
      if (tieneFecha && formData.fecha_entrega) {
        dataToSend.append("fecha_entrega", formData.fecha_entrega);
      }

      if (file) {
        dataToSend.append("archivo", file);
      }

      const url = tareaExistente
        ? `/virtual/tareas/${tareaExistente.id_tarea}`
        : `/virtual/tareas/`;

      const method = tareaExistente ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method: method,
        body: dataToSend,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">

        {/* Header - Fijo arriba */}
        <div className="bg-[#701C32] p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <h2 className="font-bold text-lg leading-tight">
              {tareaExistente ? "Editar Tarea / Examen" : "Nueva Tarea / Examen"}
            </h2>
            <p className="text-[10px] opacity-80 uppercase tracking-wider">
              {NOMBRES_BIMESTRE[(formData.bimestre || 1) - 1]}
            </p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1.5 transition">
            <X size={20} />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {tieneEntregas && (
            <div className="bg-amber-50 border-b border-amber-200 p-3 flex gap-2 items-start text-amber-700 text-[11px]">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>Campos de configuración bloqueados: existen entregas activas de alumnos.</span>
            </div>
          )}

          <form id="tarea-form" onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Nombre de la tarea / examen</label>
              <input
                required
                disabled={tieneEntregas}
                value={formData.titulo}
                placeholder="Ej. Ensayo sobre la célula"
                className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#701C32]/20 focus:border-[#701C32] transition-all ${tieneEntregas ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Tipo de Evaluación</label>
              <select
                disabled={tieneEntregas}
                value={formData.tipo_evaluacion}
                className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 outline-none transition-all ${tieneEntregas ? 'bg-gray-50' : 'bg-white focus:border-[#701C32]'}`}
                onChange={(e) => setFormData({ ...formData, tipo_evaluacion: e.target.value })}
              >
                <option value="TAREA">Tarea Normal</option>
                <option value="EXAMEN_PARCIAL">Examen Parcial</option>
                <option value="EXAMEN_BIMESTRAL">Examen Bimestral</option>
              </select>
            </div>

            {/* --- PESO (con checkbox) --- */}
            <div className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/40">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  disabled={tieneEntregas}
                  checked={tienePeso}
                  onChange={(e) => {
                    setTienePeso(e.target.checked);
                    if (!e.target.checked) setFormData({ ...formData, peso: 0 });
                  }}
                  className="w-4 h-4 accent-[#701C32]"
                />
                <span className="text-sm font-bold text-gray-700">Esta actividad tiene peso en la nota</span>
              </label>

              {tienePeso && (
                <div className="mt-3 ml-0.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      disabled={tieneEntregas}
                      value={formData.peso}
                      className={`w-24 border rounded-xl px-3 py-2 outline-none focus:border-[#701C32] ${pesoExcedido ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`}
                      onChange={(e) => setFormData({ ...formData, peso: parseInt(e.target.value) || 0 })}
                    />
                    <span className="text-sm font-bold text-gray-500">% del bimestre</span>
                  </div>
                  <p className={`text-[11px] mt-1.5 font-semibold ${pesoExcedido ? 'text-red-500' : 'text-gray-500'}`}>
                    {pesoExcedido
                      ? `Te excediste por ${Math.abs(pesoRestante)}% — solo quedan ${pesoDisponible}% disponibles`
                      : `Queda ${pesoRestante}% por asignar en este bimestre (de un total de 100%)`}
                  </p>
                </div>
              )}
            </div>

            {/* --- FECHA Y HORA LÍMITE (con checkbox) --- */}
            <div className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/40">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tieneFecha}
                  onChange={(e) => {
                    setTieneFecha(e.target.checked);
                    if (!e.target.checked) setFormData({ ...formData, fecha_entrega: "" });
                  }}
                  className="w-4 h-4 accent-[#701C32]"
                />
                <span className="text-sm font-bold text-gray-700">Tiene fecha y hora límite</span>
              </label>

              {tieneFecha && (
                <input
                  type="datetime-local"
                  required
                  value={formData.fecha_entrega}
                  className="mt-3 w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-[#701C32] bg-white"
                  onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                />
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Instrucciones</label>
              <textarea
                rows={2}
                placeholder="Escribe las indicaciones para tus alumnos..."
                value={formData.descripcion}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-[#701C32] resize-none bg-white"
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">Recurso de apoyo (Opcional)</label>

              <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-3 hover:bg-[#701C32]/5 hover:border-[#701C32]/30 transition-all group">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg text-gray-500 group-hover:bg-[#701C32] group-hover:text-white transition-colors">
                    <FileUp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {file ? file.name : "Subir guía o material"}
                    </p>
                    <p className="text-[10px] text-gray-400">PDF, Word o Imágenes (Max 10MB)</p>
                  </div>
                </div>
              </div>

              {tareaExistente?.archivo_adjunto_url && !file && (
                <div className="flex flex-col gap-1.5 p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-600" />
                    <span className="text-[11px] text-blue-700 font-medium truncate flex-1">Material adjunto actual</span>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL}${tareaExistente.archivo_adjunto_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition"
                    >
                      Ver archivo
                    </a>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Footer - Fijo abajo */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-600 text-sm font-bold hover:bg-gray-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            form="tarea-form"
            type="submit"
            disabled={loading}
            className="flex-[1.5] bg-[#701C32] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#5a1628] shadow-lg shadow-[#701C32]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {tareaExistente ? "Actualizar" : "Crear Actividad"}
          </button>
        </div>
      </div>
    </div>
  );
}
