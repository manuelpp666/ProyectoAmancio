"use client";
import { useState, useEffect, useRef } from "react";
import { X, Search, User, Users, Calendar, FileText, CheckCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { nombreAlumno } from "@/src/lib/alumno";
import { toast } from "sonner";
import { SelectorFechaHora } from "@/src/components/utils/SelectorHora";

const FORM_INICIAL = {
  id_alumno: "",
  id_familiar: "",
  motivo: "",
  fecha_cita: "",
  estado: "PROGRAMADA"
};

export function ModalRegistrarCita({ isOpen, onClose, onSuccess, alumnoInicial, alumnoPreseleccionado }: any) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<any>(null);
  const [familiares, setFamiliares] = useState([]);

  const [formData, setFormData] = useState(FORM_INICIAL);

  // Id del alumno cuyos familiares se pidieron por última vez
  const idAlumnoFamiliares = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelectAlumno = async (alumno: any) => {
    setAlumnoSeleccionado(alumno);
    setFormData((prev) => ({ ...prev, id_alumno: alumno.id_alumno, id_familiar: "" }));
    setBusqueda("");
    setResultados([]);
    setFamiliares([]);
    idAlumnoFamiliares.current = alumno.id_alumno;
    try {
      const res = await apiFetch(`/alumnos/${alumno.id_alumno}/familiares`);
      if (idAlumnoFamiliares.current !== alumno.id_alumno) return;
      if (res.ok) setFamiliares(await res.json());
      else toast.error("No se pudieron cargar los apoderados del alumno");
    } catch {
      if (idAlumnoFamiliares.current === alumno.id_alumno) {
        toast.error("No se pudieron cargar los apoderados del alumno");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiFetch("/conducta/citas/", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Cita programada correctamente");
        onSuccess();
      } else {
        toast.error("No se pudo programar la cita. Revisa los datos e intenta de nuevo.");
      }
    } catch {
      toast.error("Error al procesar la solicitud");
    } finally {
      setLoading(false);
    }
  };

  // Preseleccionar alumno cuando se pasa por props
  useEffect(() => {
    const target = alumnoPreseleccionado || alumnoInicial;
    if (isOpen && target?.id_alumno) {
      handleSelectAlumno(target);
    } else if (!isOpen) {
      idAlumnoFamiliares.current = null;
      setAlumnoSeleccionado(null);
      setFamiliares([]);
      setBusqueda("");
      setResultados([]);
      setFormData(FORM_INICIAL);
    }
  }, [isOpen, alumnoInicial, alumnoPreseleccionado]);
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (busqueda.length >= 3) {
        try {
          const res = await apiFetch(`/conducta/buscar-alumnos?q=${encodeURIComponent(busqueda)}`);
          if (res.ok) setResultados(await res.json());
        } catch (error) {
          console.error("Error buscando alumnos", error);
        }
      } else { setResultados([]); }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [busqueda]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-registrar-cita"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        
        {/* MODAL HEADER */}
        <div className="bg-[#701C32] px-6 py-5 text-white flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <h2 id="titulo-registrar-cita" className="font-black text-lg leading-tight">Programar Atención</h2>
              <p className="text-[11px] text-white/70 mt-0.5">Completa los datos para la nueva cita psicológica.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 hover:bg-white/10 rounded-full transition-colors mt-0.5">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* BUSCADOR */}
          <div className="relative">
            <label className="text-xs font-black text-[#2C3E50] uppercase mb-2 block tracking-wider">Buscar Alumno</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Nombre o DNI..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-100 rounded-xl focus:border-[#701C32] outline-none transition-all"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {resultados.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 shadow-2xl rounded-xl max-h-40 overflow-y-auto">
                  {resultados.map((a: any) => (
                    <button
                      key={a.id_alumno}
                      type="button"
                      onClick={() => handleSelectAlumno(a)}
                      className="w-full p-3 text-left hover:bg-gray-50 flex justify-between border-b last:border-0"
                    >
                      <span className="font-bold text-sm">{a.nombres} {a.apellidos}</span>
                      <span className="text-xs text-gray-400">{a.dni}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {alumnoSeleccionado && (
              <div className="mt-3 bg-[#701C32]/5 p-3 rounded-xl border border-[#701C32]/10 flex items-center gap-3">
                <div className="bg-[#701C32] text-white p-2 rounded-lg"><User size={16}/></div>
                <span className="font-bold text-[#701C32]">{nombreAlumno(alumnoSeleccionado)}</span>
                <button onClick={() => setAlumnoSeleccionado(null)} className="ml-auto text-xs font-bold text-gray-400 hover:text-red-500">Remover</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-[#2C3E50] uppercase mb-2 block tracking-wider">Apoderado</label>
              <select
                required
                disabled={!alumnoSeleccionado}
                className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-[#701C32]"
                onChange={(e) => setFormData({...formData, id_familiar: e.target.value})}
              >
                <option value="">Seleccione familiar</option>
                {familiares.map((f:any) => (
                  <option key={f.id_familiar} value={f.id_familiar}>{f.nombre} ({f.parentesco})</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-black text-[#2C3E50] uppercase mb-2 block tracking-wider">Fecha y Hora</label>
              <SelectorFechaHora
                required
                etiqueta="Fecha y hora de la cita"
                value={formData.fecha_cita}
                onChange={(v) => setFormData({...formData, fecha_cita: v})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-[#2C3E50] uppercase mb-2 block tracking-wider">Motivo</label>
            <textarea
              required
              rows={3}
              className="w-full p-4 border-2 border-gray-100 rounded-xl outline-none focus:border-[#701C32] resize-none"
              placeholder="Describa el motivo de la cita..."
              onChange={(e) => setFormData({...formData, motivo: e.target.value})}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !alumnoSeleccionado}
              className="flex-[2] bg-[#701C32] text-white py-3 rounded-xl font-bold hover:bg-[#5a1628] active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
              Confirmar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}