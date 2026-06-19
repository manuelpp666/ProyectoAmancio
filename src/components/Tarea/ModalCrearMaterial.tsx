"use client";
import { useState } from "react";
import { X, Save, Loader2, FileUp } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";

const NOMBRES_BIMESTRE = ["I Bimestre", "II Bimestre", "III Bimestre", "IV Bimestre"];

export default function ModalCrearMaterial({ idCarga, bimestre, onClose, onRefresh }: any) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Publicando material...");
    try {
      const dataToSend = new FormData();
      dataToSend.append("id_carga_academica", idCarga.toString());
      dataToSend.append("titulo", titulo);
      dataToSend.append("descripcion", descripcion || "");
      dataToSend.append("bimestre", bimestre.toString());
      if (file) dataToSend.append("archivo", file);

      const res = await apiFetch(`/virtual/materiales/`, { method: "POST", body: dataToSend });
      const data = await res.json();

      if (res.ok) {
        toast.success("¡Material publicado!", { id: toastId });
        onRefresh();
        onClose();
      } else {
        toast.error(data.detail || "Error al publicar", { id: toastId });
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

        <div className="bg-[#093E7A] p-4 text-white flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <h2 className="font-bold text-lg leading-tight">Nuevo contenido de clase</h2>
            <p className="text-[10px] opacity-80 uppercase tracking-wider">
              {NOMBRES_BIMESTRE[(bimestre || 1) - 1]}
            </p>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1.5 transition">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <form id="material-form" onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Título del contenido</label>
              <input
                required
                value={titulo}
                placeholder="Ej. Diapositivas: La célula"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] transition-all bg-white"
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Descripción (Opcional)</label>
              <textarea
                rows={2}
                placeholder="Breve descripción del material..."
                value={descripcion}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-[#093E7A] resize-none bg-white"
                onChange={(e) => setDescripcion(e.target.value)}
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase ml-1">Archivo (diapositivas, PDF, informe...)</label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-3 hover:bg-[#093E7A]/5 hover:border-[#093E7A]/30 transition-all group">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg text-gray-500 group-hover:bg-[#093E7A] group-hover:text-white transition-colors">
                    <FileUp size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {file ? file.name : "Subir material de clase"}
                    </p>
                    <p className="text-[10px] text-gray-400">PDF, Word o Imágenes (Max 10MB)</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-gray-600 text-sm font-bold hover:bg-gray-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            form="material-form"
            type="submit"
            disabled={loading}
            className="flex-[1.5] bg-[#093E7A] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#072d59] shadow-lg shadow-[#093E7A]/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Publicar material
          </button>
        </div>
      </div>
    </div>
  );
}
