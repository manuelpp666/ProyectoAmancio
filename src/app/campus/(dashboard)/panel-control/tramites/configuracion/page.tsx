"use client";
import { useState, useEffect } from "react";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { toast } from "sonner";
import { Pago, Solicitud } from "@/src/interfaces/finance";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Grado { id_grado: number; nombre: string; }
interface Tramite {
  id_tipo_tramite: number;
  nombre: string;
  costo: number;
  requisitos: string;
  alcance: "TODOS" | "GRADOS";
  grados_permitidos: string | null;
  activo: boolean;
}

export default function GestionFinancieraPage() {
  // --- ESTADOS ---
  const [tabActiva, setTabActiva] = useState<"config" | "solicitudes" | "recaudacion">("config");
  const [isLoading, setIsLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Datos
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [isDictamenModalOpen, setIsDictamenModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);

  // Estados para el Modal de Confirmación
const [isConfirmOpen, setIsConfirmOpen] = useState(false);
const [pagoAConfirmar, setPagoAConfirmar] = useState<number | null>(null);
  const abrirModalDictamen = (solicitud: Solicitud) => {
    setRespuestaAdmin("");
    setSelectedSolicitud(solicitud);
    setIsDictamenModalOpen(true);
  };
  const prepararConfirmacionManual = (idPago: number) => {
    setPagoAConfirmar(idPago);
    setIsConfirmOpen(true);
};

// 2. Esta función es la que realmente llama a la API (se pasa al onConfirm del modal)
const ejecutarConfirmacionManual = async () => {
    if (!pagoAConfirmar) return;

    try {
        const res = await fetch(`${API_URL}/finance/pagos/${pagoAConfirmar}/confirmar-manual`, {
            method: "PATCH",
        });

        if (res.ok) {
            toast.success("Pago confirmado y matrícula procesada");
            fetchPagos(); // Recargar la tabla
        } else {
            toast.error("No se pudo confirmar el pago");
        }
    } catch (error) {
        toast.error("Error de conexión con el servidor");
    } finally {
        setPagoAConfirmar(null);
    }
};
  // Formulario Trámite
  const [formData, setFormData] = useState({
    nombre: "",
    costo: 0,
    requisitos: "",
    alcance: "TODOS" as "TODOS" | "GRADOS",
    grados_seleccionados: [] as number[]
  });
  const [respuestaAdmin, setRespuestaAdmin] = useState("");

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (tabActiva === "config") { fetchTramites(); fetchGrados(); }
    if (tabActiva === "solicitudes") fetchSolicitudes();
    if (tabActiva === "recaudacion") fetchPagos();
  }, [tabActiva]);

  const fetchTramites = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_URL}/finance/tramites-tipos/`);
      if (res.ok) setTramites(await res.json());
    } catch (e) { toast.error("Error cargando trámites"); } finally { setIsLoading(false); }
  };

  const fetchGrados = async () => {
    const res = await fetch(`${API_URL}/academic/grados/`);
    if (res.ok) setGrados(await res.json());
  };

  const fetchSolicitudes = async () => {
    const res = await fetch(`${API_URL}/finance/solicitudes/pendientes-revision`);
    if (res.ok) setSolicitudes(await res.json());
  };

  const fetchPagos = async () => {
    const res = await fetch(`${API_URL}/finance/pagos/`);
    if (res.ok) setPagos(await res.json());
  };

  // --- HANDLERS MODAL TRÁMITE ---
  const openNew = () => {
    setFormData({ nombre: "", costo: 0, requisitos: "", alcance: "TODOS", grados_seleccionados: [] });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (t: Tramite) => {
    setFormData({
      nombre: t.nombre,
      costo: t.costo,
      requisitos: t.requisitos || "",
      alcance: t.alcance,
      grados_seleccionados: t.grados_permitidos ? t.grados_permitidos.split(",").map(Number) : []
    });
    setCurrentId(t.id_tipo_tramite);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const toggleGrado = (id: number) => {
    setFormData(prev => ({
      ...prev,
      grados_seleccionados: prev.grados_seleccionados.includes(id)
        ? prev.grados_seleccionados.filter(g => g !== id)
        : [...prev.grados_seleccionados, id]
    }));
  };

  const handleSubmitTramite = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nombre: formData.nombre,
      costo: formData.costo,
      requisitos: formData.requisitos,
      alcance: formData.alcance,
      grados_permitidos: formData.alcance === "GRADOS" ? formData.grados_seleccionados.join(",") : null,
      activo: true
    };

    const url = isEditing ? `${API_URL}/finance/tramites-tipos/${currentId}` : `${API_URL}/finance/tramites-tipos/`;
    const res = await fetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
const data = await res.json();
    if (res.ok) {
      toast.success(isEditing ? "Actualizado" : "Creado");
      setIsModalOpen(false);
      fetchTramites();
    }else {
        // AQUÍ ESTÁ EL CAMBIO: Capturamos el "detail" que enviamos desde FastAPI
        // Si el backend envía detail, lo mostramos, si no, un error genérico
        const mensajeError = data.detail || "Error al procesar la solicitud";
        toast.error(mensajeError, {
          duration: 5000, // Le damos más tiempo para que el usuario pueda leer la explicación
          style: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #F87171' }
        });
      }
  };

  const handleDictamen = async (nuevoEstado: "APROBADO" | "RECHAZADO") => {
    if (!selectedSolicitud) return;
    try {
      const res = await fetch(`${API_URL}/finance/solicitudes/${selectedSolicitud.id_solicitud_tramite}/dictamen`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado, respuesta_administrativa: respuestaAdmin })
      });
      if (res.ok) {
        toast.success(`Solicitud ${nuevoEstado}`);
        setIsDictamenModalOpen(false);
        setSelectedSolicitud(null);
        setRespuestaAdmin("");

        fetchSolicitudes();
      }
    } catch (e) { toast.error("Error al procesar"); }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      <div className="flex-1 flex flex-col">

        {/* HEADER CON TABS */}
        <div className="bg-white border-b px-8 shrink-0">
          <div className="h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#093E7A]">payments</span>
              <h2 className="text-xl font-bold text-gray-800">Gestión Financiera</h2>
            </div>
          </div>

          <div className="flex gap-8">
            {[
              { id: 'config', label: 'Tarifario/Trámites', icon: 'settings' },
              { id: 'solicitudes', label: 'Atención de Solicitudes', icon: 'mark_as_unread' },
              { id: 'recaudacion', label: 'Caja y Recaudación', icon: 'account_balance_wallet' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTabActiva(t.id as any)}
                className={`py-4 border-b-2 flex items-center gap-2 text-sm font-bold transition-all ${tabActiva === t.id ? 'border-[#093E7A] text-[#093E7A]' : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
              >
                <span className="material-symbols-outlined text-lg">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto">
          {tabActiva === "config" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <input
                  type="text" placeholder="Buscar trámite..."
                  className="w-96 px-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-[#093E7A]/20"
                  onChange={e => setBusqueda(e.target.value)}
                />
                <button onClick={openNew}
                  className="bg-[#093E7A] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">add</span> Nuevo Trámite
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tramites.filter(t => t.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(t => (
                  <div key={t.id_tipo_tramite} className="bg-white p-6 rounded-xl border shadow-sm relative">
                    <div className="flex justify-between mb-4">
                      <span className="material-symbols-outlined text-[#093E7A] bg-blue-50 p-2 rounded-full">description</span>
                      <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-blue-600">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </div>
                    <h3 className="font-bold text-gray-800">{t.nombre}</h3>
                    <p className="text-2xl font-black text-[#093E7A] mt-1">S/ {Number(t.costo).toFixed(2)}</p>
                    {t.costo === 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase">Gratuito / Administrativo</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- TAB: ATENCIÓN DE SOLICITUDES --- */}
          {tabActiva === "solicitudes" && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Fecha</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Alumno / DNI</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Trámite</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Motivo</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {solicitudes.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No hay solicitudes pendientes de revisión</td></tr>
                  ) : solicitudes.map((s: any) => (
                    <tr key={s.id_solicitud_tramite} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm">{new Date(s.fecha_solicitud).toLocaleDateString()}</td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-gray-800">{s.alumno?.dni || '---'}</p>
                        <p className="text-xs text-gray-400">{s.alumno?.dni || '---'}</p>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-50 text-[#093E7A] rounded text-xs font-bold">{s.tipo?.nombre}</span>
                      </td>

                      <td className="p-4">
                        {s.archivo_adjunto ? (
                          <a
                            href={`${API_URL}${s.archivo_adjunto}`}
                            target="_blank"
                            className="text-[#093E7A] hover:underline flex items-center gap-1 text-xs font-bold"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Ver Adjunto
                          </a>
                        ) : (
                          <span className="text-gray-300 text-xs">Sin archivo</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => abrirModalDictamen(s)}
                          className="bg-[#093E7A] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#072d5a]"
                        >
                          Atender
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* --- TAB: CAJA Y RECAUDACIÓN --- */}
          {tabActiva === "recaudacion" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-l-4 border-l-green-500 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase">Total Recaudado (Año)</p>
                  <p className="text-2xl font-black text-gray-800">S/ {pagos.filter(p => p.estado === "PAGADO").reduce((acc, p) => acc + Number(p.monto_total), 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">F. Pago</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Concepto</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Monto</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ref. BCP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {pagos.map((p: any) => (
                      <tr key={p.id_pago}>
                        <td className="p-4">{p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : '---'}</td>
                        <td className="p-4 font-medium">{p.concepto}</td>
                        <td className="p-4 font-bold text-gray-800">S/ {Number(p.monto_total).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black ${p.estado === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {p.estado}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-400 font-mono">{p.codigo_operacion_bcp || 'N/A'}</td>
                        <td className="p-4">
                          {p.estado === "PENDIENTE" ? (
                            <button
                              onClick={() => prepararConfirmacionManual(p.id_pago)}
                              className="flex items-center gap-1 text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 font-bold uppercase transition-colors"
                            >
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              Confirmar Pago
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 font-mono">{p.codigo_operacion_bcp || 'N/A'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE TRÁMITE (TU DISEÑO ANTERIOR) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-[#093E7A] p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold">{isEditing ? 'Editar Trámite' : 'Nuevo Trámite'}</h3>
              <button onClick={() => setIsModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
            </div>

            <form onSubmit={handleSubmitTramite} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Trámite</label>
                <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                  value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo (S/)</label>
                  <input required type="number" step="0.01" min="0" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.costo} onChange={e => setFormData({ ...formData, costo: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alcance</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.alcance} onChange={e => setFormData({ ...formData, alcance: e.target.value as "TODOS" | "GRADOS" })}
                  >
                    <option value="TODOS">Todos los grados</option>
                    <option value="GRADOS">Grados específicos</option>
                  </select>
                </div>
              </div>

              {formData.alcance === "GRADOS" && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Seleccionar Grados Permitidos</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-2">
                    {grados.map(g => (
                      <label key={g.id_grado} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-100 p-1 rounded select-none">
                        <input type="checkbox" checked={formData.grados_seleccionados.includes(g.id_grado)}
                          onChange={() => toggleGrado(g.id_grado)} className="accent-[#093E7A] size-4"
                        />
                        <span className="text-gray-700">{g.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Requisitos</label>
                <textarea rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                  placeholder="Ej: - DNI Copia..." value={formData.requisitos} onChange={e => setFormData({ ...formData, requisitos: e.target.value })}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#093E7A] text-white font-bold rounded-lg text-sm hover:bg-[#072d5a] transition-colors">Guardar Trámite</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DICTAMEN */}
      {isDictamenModalOpen && selectedSolicitud && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">Atender Solicitud</h3>
                <p className="text-[10px] text-gray-500 uppercase font-bold">Ref: #{selectedSolicitud.id_solicitud_tramite}</p>
              </div>
              <button
                onClick={() => setIsDictamenModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-800 uppercase mb-1">Comentario del Usuario:</p>
                <p className="text-sm text-gray-700 italic">
                  "{selectedSolicitud.comentario_usuario || 'Sin comentario adjunto'}"
                </p>
              </div>

              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Respuesta Administrativa</label>
              <textarea
                className="w-full border border-gray-200 p-3 rounded-xl mb-4 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20 transition-all"
                rows={4}
                placeholder="Ej: Su solicitud ha sido aprobada, puede recoger su certificado en 48 horas..."
                value={respuestaAdmin}
                onChange={e => setRespuestaAdmin(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => handleDictamen("RECHAZADO")}
                  className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleDictamen("APROBADO")}
                  className="flex-1 bg-[#093E7A] text-white py-3 rounded-xl font-bold hover:bg-[#072d5a] transition-colors shadow-lg shadow-blue-900/20"
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
    isOpen={isConfirmOpen}
    onClose={() => setIsConfirmOpen(false)}
    onConfirm={ejecutarConfirmacionManual}
    title="Confirmar Pago Manual"
    message="¿Estás seguro de registrar este pago manualmente? Si es un derecho de vacante, se generará la matrícula del alumno de forma automática en el sistema."
    confirmText="Sí, Confirmar Pago"
    type="warning" // Usamos warning para que no sea rojo "danger" sino un color de atención
/>
    </div>
  );
}