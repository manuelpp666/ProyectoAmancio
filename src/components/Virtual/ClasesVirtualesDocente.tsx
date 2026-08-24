"use client";
import { useEffect, useState, useCallback } from "react";
import { Video, Plus, Trash2, ExternalLink, Save, Calendar, Loader2, FolderOpen, Link2 } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { SelectorFechaHora } from "@/src/components/utils/SelectorHora";

interface ClaseVirtual {
  id_clase_virtual: number;
  tema: string | null;
  fecha: string;
  enlace: string;
}

export default function ClasesVirtualesDocente({ idCarga }: { idCarga: number | string }) {
  const [clases, setClases] = useState<ClaseVirtual[]>([]);
  const [driveUrl, setDriveUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [guardandoDrive, setGuardandoDrive] = useState(false);

  // Formulario de nueva clase
  const [tema, setTema] = useState("");
  const [fecha, setFecha] = useState("");
  const [enlace, setEnlace] = useState("");
  const [creando, setCreando] = useState(false);

  // Eliminación
  const [claseAEliminar, setClaseAEliminar] = useState<ClaseVirtual | null>(null);

  const fetchClases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/virtual/clases-virtuales/${idCarga}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClases(data.clases || []);
      setDriveUrl(data.drive_url || "");
    } catch {
      toast.error("No se pudieron cargar las clases virtuales");
    } finally {
      setLoading(false);
    }
  }, [idCarga]);

  useEffect(() => { fetchClases(); }, [fetchClases]);

  const guardarDrive = async () => {
    setGuardandoDrive(true);
    try {
      const res = await apiFetch(`/virtual/clases-virtuales/drive`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_carga_academica: Number(idCarga), url: driveUrl.trim() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDriveUrl(data.drive_url || "");
      toast.success(data.drive_url ? "Enlace de Drive guardado" : "Enlace de Drive eliminado");
    } catch {
      toast.error("No se pudo guardar el enlace de Drive");
    } finally {
      setGuardandoDrive(false);
    }
  };

  const crearClase = async () => {
    if (!fecha || !enlace.trim()) {
      toast.error("Completa la fecha y el enlace de la clase");
      return;
    }
    setCreando(true);
    try {
      const res = await apiFetch(`/virtual/clases-virtuales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_carga_academica: Number(idCarga),
          tema: tema.trim() || null,
          fecha,
          enlace: enlace.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Error al crear la clase");
      }
      toast.success("Clase virtual creada");
      setTema(""); setFecha(""); setEnlace("");
      fetchClases();
    } catch (e: any) {
      toast.error(e.message || "No se pudo crear la clase");
    } finally {
      setCreando(false);
    }
  };

  const eliminarClase = async () => {
    if (!claseAEliminar) return;
    const toastId = toast.loading("Eliminando clase...");
    try {
      const res = await apiFetch(`/virtual/clases-virtuales/${claseAEliminar.id_clase_virtual}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Clase eliminada", { id: toastId });
      fetchClases();
    } catch {
      toast.error("No se pudo eliminar la clase", { id: toastId });
    } finally {
      setClaseAEliminar(null);
    }
  };

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleString("es-PE", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* ENLACE DE DRIVE (clases grabadas) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-[#093E7A] mb-3">
          <FolderOpen size={18} />
          <h4 className="text-xs font-black uppercase tracking-wide">Carpeta de Drive (clases grabadas)</h4>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Pega aquí el enlace de la carpeta de Google Drive donde subes las grabaciones. Los alumnos verán un único botón para acceder.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] outline-none"
            />
          </div>
          <button
            onClick={guardarDrive}
            disabled={guardandoDrive}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#093E7A] text-white rounded-xl font-bold text-sm hover:bg-[#072d59] transition disabled:opacity-50"
          >
            {guardandoDrive ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
          </button>
        </div>
      </div>

      {/* NUEVA CLASE VIRTUAL */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 text-[#701C32] mb-4">
          <Video size={18} />
          <h4 className="text-xs font-black uppercase tracking-wide">Nueva clase virtual</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Fecha y hora</label>
            <SelectorFechaHora
              tam="sm"
              etiqueta="Fecha y hora de la clase"
              value={fecha}
              onChange={setFecha}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tema (opcional)</label>
            <input
              type="text"
              placeholder="Ej. Ecuaciones de segundo grado"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#701C32]/20 focus:border-[#701C32] outline-none"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Enlace de la clase virtual</label>
            <input
              type="url"
              placeholder="https://meet.google.com/... o https://zoom.us/..."
              value={enlace}
              onChange={(e) => setEnlace(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#701C32]/20 focus:border-[#701C32] outline-none"
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={crearClase}
            disabled={creando}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#701C32] text-white rounded-xl font-bold text-sm hover:bg-[#5a1628] transition disabled:opacity-50"
          >
            {creando ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Agregar clase
          </button>
        </div>
      </div>

      {/* LISTA DE CLASES */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wide text-gray-500">Clases programadas ({clases.length})</h4>
        {loading ? (
          <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto text-[#701C32]" size={28} /></div>
        ) : clases.length === 0 ? (
          <div className="text-center py-10 bg-gray-50/60 rounded-xl border-2 border-dashed border-gray-200">
            <Video size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-xs font-medium">Aún no has creado clases virtuales.</p>
          </div>
        ) : (
          clases.map((c) => (
            <div key={c.id_clase_virtual} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-[#701C32]/30 hover:shadow-sm transition-all">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 rounded-xl bg-[#FFF1E3] text-[#701C32] shrink-0"><Video size={22} /></div>
                <div className="min-w-0">
                  <h5 className="font-bold text-gray-800 truncate">{c.tema || "Clase virtual"}</h5>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 capitalize">
                    <Calendar size={12} /> {formatearFecha(c.fecha)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={c.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-[#093E7A] bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition"
                >
                  <ExternalLink size={14} /> Abrir
                </a>
                <button
                  onClick={() => setClaseAEliminar(c)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!claseAEliminar}
        onClose={() => setClaseAEliminar(null)}
        onConfirm={eliminarClase}
        title="¿Eliminar clase virtual?"
        message={`Se eliminará "${claseAEliminar?.tema || "esta clase"}". Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        type="danger"
      />
    </div>
  );
}
