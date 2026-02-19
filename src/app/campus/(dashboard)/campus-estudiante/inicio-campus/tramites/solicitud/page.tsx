"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/src/context/userContext";
import { toast } from "sonner";
import { FileText, Plus, Clock, CheckCircle, XCircle, AlertCircle, Loader2, X, Paperclip } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SolicitudesPage() {
  const { id_usuario } = useUser();
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [tiposTramite, setTiposTramite] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para el Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idAlumno, setIdAlumno] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    id_tipo_tramite: "",
    comentario_usuario: ""
  });
const [selectedFile, setSelectedFile] = useState<File | null>(null);


  const fetchSolicitudes = useCallback(async (alumnoId: number) => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/finance/solicitudes/alumno/${alumnoId}`);
      if (res.ok) {
        const data = await res.json();
        setSolicitudes(data);
      }
    } catch (error) {
      toast.error("Error al cargar solicitudes");
    } finally {
      setIsLoading(false);
    }
  }, []);
  const fetchAlumnoData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/alumnos/alumnos/usuario/${id_usuario}`);
      if (res.ok) {
        const data = await res.json();
        setIdAlumno(data.id_alumno); // Guardamos el ID real del alumno (ej: 5)
        fetchSolicitudes(data.id_alumno); // Cargamos sus trámites usando ese ID
      }
    } catch (e) {
      console.error("Error al obtener datos de alumno");
      setIsLoading(false);
    }
  }, [id_usuario, fetchSolicitudes]);



  const fetchTiposTramite = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/finance/tramites-tipos/alumnos`);
      if (res.ok) {
        const data = await res.json();
        setTiposTramite(data.filter((t: any) => t.activo));
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (id_usuario) {
      fetchAlumnoData();
      fetchTiposTramite();
    }
  }, [id_usuario, fetchAlumnoData, fetchTiposTramite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idAlumno) return toast.error("Error: No se identificó el perfil");

    // Validación opcional: Si el trámite es gratuito (costo 0), exigir archivo
    const tramiteSeleccionado = tiposTramite.find(t => t.id_tipo_tramite.toString() === formData.id_tipo_tramite);
    if (tramiteSeleccionado?.costo <= 0 && !selectedFile) {
        return toast.error("Por favor adjunte el sustento para este trámite");
    }

    setIsSubmitting(true);

    // Creamos el FormData para enviar archivos y texto
    const data = new FormData();
    data.append("id_alumno", idAlumno.toString());
    data.append("id_tipo_tramite", formData.id_tipo_tramite);
    data.append("comentario_usuario", formData.comentario_usuario);
    if (selectedFile) {
      data.append("file", selectedFile); // "file" debe coincidir con el nombre en tu FastAPI
    }

    try {
      const res = await fetch(`${API_URL}/finance/solicitudes/`, {
        method: "POST",
        // IMPORTANTE: Al enviar FormData, NO se debe poner el header "Content-Type"
        body: data
      });

      if (res.ok) {
        toast.success("Solicitud creada con éxito");
        setIsModalOpen(false);
        // Limpiar formulario y archivo
        setFormData({ id_tipo_tramite: "", comentario_usuario: "" });
        setSelectedFile(null);
        fetchSolicitudes(idAlumno);
      } else {
        toast.error("Error al crear la solicitud");
      }
    } catch (e) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    const badges: any = {
      "PENDIENTE_PAGO": { color: "bg-yellow-100 text-yellow-700", icon: <AlertCircle size={12} />, text: "Pendiente Pago" },
      "PAGADO_PENDIENTE_REV": { color: "bg-blue-100 text-blue-700", icon: <Clock size={12} />, text: "En Revisión" },
      "APROBADO": { color: "bg-green-100 text-green-700", icon: <CheckCircle size={12} />, text: "Aprobado" },
      "RECHAZADO": { color: "bg-red-100 text-red-700", icon: <XCircle size={12} />, text: "Rechazado" },
    };
    const b = badges[estado] || { color: "bg-gray-100 text-gray-600", icon: null, text: estado };
    return <span className={`${b.color} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>{b.icon} {b.text}</span>;
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

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#701C32] hover:bg-[#5a1628] text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-900/10 flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Trámite
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 p-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Loader2 className="animate-spin mb-2" />
            Cargando solicitudes...
          </div>
        ) : solicitudes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <FileText size={40} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No tienes solicitudes</h3>
            <p className="text-gray-500 text-sm mb-6">Aún no has realizado ningún trámite.</p>
            <button onClick={() => setIsModalOpen(true)} className="text-[#701C32] font-bold hover:underline">
              ¡Solicita uno ahora!
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {solicitudes.map((sol) => (
              <div key={sol.id_solicitud_tramite} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-lg bg-red-50 flex items-center justify-center text-[#701C32]">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">{sol.tipo?.nombre || "Trámite"}</h4>
                    <p className="text-gray-400 text-xs">Solicitado el: {new Date(sol.fecha_solicitud).toLocaleDateString()}</p>
                    {sol.respuesta_administrativa && (
                      <div className="mt-2 p-3 bg-gray-50 border-l-4 border-[#701C32] rounded-r-lg shadow-sm">
                        <p className="text-[10px] font-black text-[#701C32] uppercase mb-1">Respuesta del Colegio:</p>
                        <p className="text-sm text-gray-700 leading-relaxed italic">"{sol.respuesta_administrativa}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Estado</p>
                    {getStatusBadge(sol.estado)}
                  </div>
                  {sol.estado === 'PENDIENTE_PAGO' && (
                    <Link href={`/campus/campus-estudiante/inicio-campus/tramites/pago?id=${sol.id_solicitud_tramite}`} className="text-sm font-bold text-[#701C32] border border-[#701C32] px-4 py-2 rounded-lg hover:bg-[#701C32] hover:text-white transition-colors">
                      Pagar Ahora
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: NUEVO TRÁMITE */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-[#701C32] p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <Plus size={18} /> Nueva Solicitud de Trámite
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seleccionar Trámite</label>
                <select
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20"
                  value={formData.id_tipo_tramite}
                  onChange={(e) => setFormData({ ...formData, id_tipo_tramite: e.target.value })}
                >
                  <option value="">-- Elige un trámite --</option>
                  {tiposTramite.map((t) => (
                    <option key={t.id_tipo_tramite} value={t.id_tipo_tramite}>
                      {t.nombre} {t.costo > 0 ? `(S/ ${Number(t.costo).toFixed(2)})` : "— GRATUITO"}
                    </option>
                  ))}
                </select>
              </div>

              {/* INFO DINÁMICA DEL TRÁMITE SELECCIONADO */}
              {formData.id_tipo_tramite && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 shrink-0" size={18} />
                    <div>
                      <p className="text-xs font-bold text-blue-900 uppercase">Información del Trámite</p>
                      <p className="text-sm text-blue-800 mt-1">
                        {tiposTramite.find(t => t.id_tipo_tramite.toString() === formData.id_tipo_tramite)?.requisitos || "No se especificaron requisitos adicionales."}
                      </p>
                      {tiposTramite.find(t => t.id_tipo_tramite.toString() === formData.id_tipo_tramite)?.costo === 0 && (
                        <p className="text-[10px] font-black text-blue-600 mt-2 italic">* Este trámite es administrativo y no requiere pago bancario.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
<div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Adjuntar Sustento / Documento</label>
                <div className="relative group">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex items-center gap-3 w-full border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all ${
                      selectedFile 
                        ? "border-green-500 bg-green-50 text-green-700" 
                        : "border-gray-200 bg-gray-50 text-gray-500 hover:border-[#701C32]/40"
                    }`}
                  >
                    {selectedFile ? <CheckCircle size={18} /> : <Paperclip size={18} />}
                    <span className="text-sm truncate">
                      {selectedFile ? selectedFile.name : "Seleccionar archivo (PDF, JPG, PNG)"}
                    </span>
                    {selectedFile && (
                      <X 
                        size={16} 
                        className="ml-auto hover:text-red-500" 
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                      />
                    )}
                  </label>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  * Obligatorio para trámites gratuitos (Certificados, Justificaciones, etc.)
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Comentario / Motivo (Opcional)</label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20 min-h-[100px]"
                  placeholder="Explique brevemente el motivo de su solicitud o detalle los documentos adjuntos..."
                  value={formData.comentario_usuario}
                  onChange={(e) => setFormData({ ...formData, comentario_usuario: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#701C32] text-white font-bold text-sm rounded-xl hover:bg-[#5a1628] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Enviar Solicitud"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}