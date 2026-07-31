"use client";
import { useEffect, useState, useCallback } from "react";
import { Video, ExternalLink, Calendar, Loader2, FolderOpen } from "lucide-react";
import { apiFetch } from "@/src/lib/api";

interface ClaseVirtual {
  id_clase_virtual: number;
  tema: string | null;
  fecha: string;
  enlace: string;
}

export default function ClasesVirtualesAlumno({
  idCurso,
  idUsuario,
  anio,
}: {
  idCurso: number | string;
  idUsuario: number | null;
  anio: string;
}) {
  const [clases, setClases] = useState<ClaseVirtual[]>([]);
  const [driveUrl, setDriveUrl] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchClases = useCallback(async () => {
    if (!idCurso || !idUsuario || !anio) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/virtual/clases-virtuales-alumno/${idCurso}/${idUsuario}?anio=${anio}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClases(data.clases || []);
      setDriveUrl(data.drive_url || "");
    } catch {
      setClases([]);
      setDriveUrl("");
    } finally {
      setLoading(false);
    }
  }, [idCurso, idUsuario, anio]);

  useEffect(() => { fetchClases(); }, [fetchClases]);

  const formatearFecha = (f: string) =>
    new Date(f).toLocaleString("es-PE", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-gray-50/70 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#701C32] text-white flex items-center justify-center">
            <Video size={18} />
          </div>
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Clases Virtuales</h3>
        </div>
        {driveUrl && (
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-[#093E7A] bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition self-start sm:self-auto"
          >
            <FolderOpen size={15} /> Clases grabadas (Drive)
          </a>
        )}
      </div>

      <div className="p-5 space-y-3">
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-[#701C32]" size={26} /></div>
        ) : clases.length === 0 ? (
          <div className="text-center py-8 bg-gray-50/60 rounded-xl border-2 border-dashed border-gray-200">
            <Video size={26} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-xs font-medium">El docente aún no ha programado clases virtuales.</p>
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
              <a
                href={c.enlace}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#701C32] hover:bg-[#5a1628] px-4 py-2 rounded-xl transition shrink-0"
              >
                <ExternalLink size={14} /> Entrar
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
