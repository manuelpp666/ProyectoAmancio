"use client";
import { useState, useEffect } from "react";
import { ConfirmModal } from "@/src/components/utils/ConfirmModal";
import { toast } from "sonner";
import { Pago, Solicitud } from "@/src/interfaces/finance";
import { Grado } from "@/src/interfaces/academic";
import { Tramite } from "@/src/interfaces/tramite";
import { apiFetch } from "@/src/lib/api";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// --- NUEVA INTERFAZ PARA TIPOS DE PAGO ---
interface TipoPago {
  id_tipo_pago: number;
  categoria: string;
  nombre: string;
  costo: number;
  fecha_inicio: string;
  fecha_vencimiento: string;
  mora: number;
  accion_vencimiento: string;
  activo: boolean;
}

export default function GestionFinancieraPage() {
  // --- ESTADOS ---
  // Se agregó "tipos-pagos" a los tipos de tabActiva
  const [tabActiva, setTabActiva] = useState<"config" | "solicitudes" | "tipos-pagos" | "recaudacion">("config");
  const [isLoading, setIsLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  // Datos
  const [tramites, setTramites] = useState<Tramite[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  
  // Nuevo estado para los Tipos de Pago
  const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);

  // Modales Trámites y Solicitudes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [isDictamenModalOpen, setIsDictamenModalOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<Solicitud | null>(null);

  // Nuevos estados para el Modal de Tipos de Pago
  const [isModalTipoPagoOpen, setIsModalTipoPagoOpen] = useState(false);
  const [isEditingTipoPago, setIsEditingTipoPago] = useState(false);
  const [currentIdTipoPago, setCurrentIdTipoPago] = useState<number | null>(null);

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

  //Estados para los filtros
  const [filtroTipoPago, setFiltroTipoPago] = useState("TODOS");
  const [criterioFecha, setCriterioFecha] = useState<"pago" | "vencimiento">("pago");
  const [anioFiltro, setAnioFiltro] = useState(new Date().getFullYear());

  // 2. Esta función es la que realmente llama a la API (se pasa al onConfirm del modal)
  const ejecutarConfirmacionManual = async () => {
    if (!pagoAConfirmar) return;

    try {
      const res = await apiFetch(`/finance/pagos/${pagoAConfirmar}/confirmar-manual`, {
        method: "PATCH",
      });

      if (res.ok) {
        toast.success("Pago confirmado y procesos ejecutados");
        fetchPagos(); // Recargar la tabla
      } else {
        toast.error("No se pudo confirmar el pago");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setPagoAConfirmar(null);
      setIsConfirmOpen(false); // Cierra el modal después de ejecutar
    }
  };

  // Formulario Trámite
  const [formData, setFormData] = useState({
    nombre: "",
    costo: 0,
    requisitos: "",
    alcance: "TODOS" as "TODOS" | "GRADOS",
    grados_seleccionados: [] as number[],
    periodo_academico: "REGULAR" as "REGULAR" | "VERANO" | "AMBOS"
  });
  const [respuestaAdmin, setRespuestaAdmin] = useState("");

  // Formulario Tipo Pago
  const [formDataTipoPago, setFormDataTipoPago] = useState({
    categoria: "OTRO", nombre: "", costo: 0, fecha_inicio: "", fecha_vencimiento: "", mora: 0, accion_vencimiento: "APLICAR_MORA", activo: true
  });

  // --- NUEVOS ESTADOS PARA FECHAS MM-DD ---
  const [mesInicio, setMesInicio] = useState("01");
  const [diaInicio, setDiaInicio] = useState("01");
  const [mesFin, setMesFin] = useState("12");
  const [diaFin, setDiaFin] = useState("31");

  const meses = [
    { num: "01", nom: "Enero" }, { num: "02", nom: "Febrero" }, { num: "03", nom: "Marzo" },
    { num: "04", nom: "Abril" }, { num: "05", nom: "Mayo" }, { num: "06", nom: "Junio" },
    { num: "07", nom: "Julio" }, { num: "08", nom: "Agosto" }, { num: "09", nom: "Septiembre" },
    { num: "10", nom: "Octubre" }, { num: "11", nom: "Noviembre" }, { num: "12", nom: "Diciembre" }
  ];
  const dias = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const nombreMes = (mm: string) => meses.find(m => m.num === mm)?.nom || mm;

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (tabActiva === "config") { fetchTramites(); fetchGrados(); }
    if (tabActiva === "solicitudes") fetchSolicitudes();
    if (tabActiva === "recaudacion") { fetchPagos(); fetchTiposPago(); } // Cargamos tiposPago para el filtro
    if (tabActiva === "tipos-pagos") fetchTiposPago();
  }, [tabActiva]);

  const fetchTramites = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/finance/tramites-tipos/`);
      if (res.ok) setTramites(await res.json());
    } catch (e) { toast.error("Error cargando trámites"); } finally { setIsLoading(false); }
  };

  const fetchGrados = async () => {
    const res = await apiFetch(`/academic/grados/`);
    if (res.ok) setGrados(await res.json());
  };

  const fetchSolicitudes = async () => {
    const res = await apiFetch(`/finance/solicitudes/pendientes-revision`);
    if (res.ok) setSolicitudes(await res.json());
  };

  // Nueva función para cargar tipos de pago
  const fetchTiposPago = async () => {
    try {
      const res = await apiFetch(`/finance/tipos-pago`);
      if (res.ok) setTiposPago(await res.json());
    } catch (e) { toast.error("Error cargando los tipos de pago"); }
  };

  const fetchPagos = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append("busqueda", busqueda);
      if (filtroTipoPago !== "TODOS") params.append("tipo", filtroTipoPago);
      params.append("anio", anioFiltro.toString());
      params.append("criterio_fecha", criterioFecha);

      const res = await apiFetch(`/finance/pagos/?${params.toString()}`);
      if (res.ok) {
        setPagos(await res.json());
      }
    } catch (e) {
      toast.error("Error al filtrar pagos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tabActiva === "recaudacion") {
      const timer = setTimeout(() => {
        fetchPagos();
      }, 400); // Debounce para no saturar el servidor al escribir
      return () => clearTimeout(timer);
    }
  }, [busqueda, filtroTipoPago, criterioFecha, anioFiltro, tabActiva]);

  // --- HANDLERS MODAL TRÁMITE ---
  const openNew = () => {
    setFormData({
      nombre: "", costo: 0, requisitos: "", alcance: "TODOS", grados_seleccionados: [],
      periodo_academico: "REGULAR"
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (t: Tramite) => {
    setFormData({
      nombre: t.nombre,
      costo: t.costo,
      requisitos: t.requisitos || "",
      alcance: t.alcance,
      grados_seleccionados: t.grados_permitidos ? t.grados_permitidos.split(",").map(Number) : [],
      periodo_academico: t.periodo_academico
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
      ...formData,
      grados_permitidos: formData.alcance === "GRADOS" ? formData.grados_seleccionados.join(",") : null,
      activo: true
    };

    const url = isEditing ? `/finance/tramites-tipos/${currentId}` : `/finance/tramites-tipos/`;
    const res = await apiFetch(url, {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(isEditing ? "Actualizado" : "Creado");
      setIsModalOpen(false);
      fetchTramites();
    } else {
      const mensajeError = data.detail || "Error al procesar la solicitud";
      toast.error(mensajeError, {
        duration: 5000, 
        style: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #F87171' }
      });
    }
  };

  const handleDictamen = async (nuevoEstado: "APROBADO" | "RECHAZADO") => {
    if (!selectedSolicitud) return;
    try {
      const res = await apiFetch(`/finance/solicitudes/${selectedSolicitud.id_solicitud_tramite}/dictamen`, {
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

  // --- HANDLERS MODAL TIPOS DE PAGO ---
  const openNewTipoPago = () => { 
    setFormDataTipoPago({ categoria: "OTRO", nombre: "", costo: 0, fecha_inicio: "", fecha_vencimiento: "", mora: 0, accion_vencimiento: "APLICAR_MORA", activo: true }); 
    setMesInicio("01"); setDiaInicio("01"); setMesFin("12"); setDiaFin("31");
    setIsEditingTipoPago(false); 
    setIsModalTipoPagoOpen(true); 
  };
  const openEditTipoPago = (p: TipoPago) => { 
    setFormDataTipoPago({ ...p }); 
    const [mI, dI] = p.fecha_inicio.split("-");
    const [mF, dF] = p.fecha_vencimiento.split("-");
    setMesInicio(mI || "01"); setDiaInicio(dI || "01");
    setMesFin(mF || "12"); setDiaFin(dF || "31");
    setCurrentIdTipoPago(p.id_tipo_pago); 
    setIsEditingTipoPago(true); 
    setIsModalTipoPagoOpen(true); 
  };
  const handleEliminarTipoPago = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este tipo de pago?")) return;
    try { 
      await apiFetch(`/finance/tipos-pago/${id}`, { method: "DELETE" }); 
      toast.success("Eliminado correctamente"); 
      fetchTiposPago(); 
    } catch (e) { toast.error("Error al eliminar"); }
  };
  const handleSubmitTipoPago = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reemplazamos las fechas por la concatenación de los nuevos selectores MM-DD
    const fInicio = `${mesInicio}-${diaInicio}`;
    const fFin = `${mesFin}-${diaFin}`;
    const payload = { ...formDataTipoPago, fecha_inicio: fInicio, fecha_vencimiento: fFin };
    
    const url = isEditingTipoPago ? `/finance/tipos-pago/${currentIdTipoPago}` : `/finance/tipos-pago`;
    try {
      const res = await apiFetch(url, { 
        method: isEditingTipoPago ? "PUT" : "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      });
      if (res.ok) { 
        toast.success(isEditingTipoPago ? "Actualizado correctamente" : "Creado correctamente"); 
        setIsModalTipoPagoOpen(false); 
        fetchTiposPago(); 
      } else { 
        const errorData = await res.json(); toast.error(errorData.detail || "Error al guardar"); 
      }
    } catch (e) { toast.error("Error de conexión"); }
  };

  // Extracción dinámica de categorías para el filtro de Recaudación
  const categoriasUnicas = Array.from(new Set(tiposPago.map(tp => tp.categoria)));

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
              { id: 'tipos-pagos', label: 'Tipos de Pagos', icon: 'receipt_long' }, // NUEVA PESTAÑA AÑADIDA AQUÍ
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
                {tramites.filter(t => t.nombre.toLowerCase().includes(busqueda.toLowerCase())).sort((a, b) => a.periodo_academico.localeCompare(b.periodo_academico)).map(t => (
                  <div key={t.id_tipo_tramite} className="bg-white p-6 rounded-xl border shadow-sm relative">
                    <div className="flex justify-between mb-4">
                      <span className="material-symbols-outlined text-[#093E7A] bg-blue-50 p-2 rounded-full">description</span>
                      <span className={`text-[9px] font-black px-2 py-1 rounded border ${t.periodo_academico === 'VERANO' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        t.periodo_academico === 'REGULAR' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-gray-50 text-gray-600 border-gray-100'
                        }`}>
                        {t.periodo_academico}
                      </span>
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

          {/* --- TAB: TIPOS DE PAGOS --- */}
          {tabActiva === "tipos-pagos" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold text-gray-800">Tipos de Pago Globales (Plantillas)</h1>
                  <p className="text-xs text-gray-500">Reglas fijas para generación de deudas por rango de fecha y categoría.</p>
                </div>
                <button onClick={openNewTipoPago} className="bg-[#093E7A] text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined">add</span> Nuevo Pago
                </button>
              </div>

              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Categoría</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nombre del Pago</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Rango de Fechas</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Costo</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {tiposPago.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">No hay plantillas de pago registradas</td></tr>
                    ) : tiposPago.map(p => {
                      const [mI, dI] = p.fecha_inicio.split("-");
                      const [mF, dF] = p.fecha_vencimiento.split("-");
                      return (
                      <tr key={p.id_tipo_pago} className="hover:bg-gray-50">
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            p.categoria === 'PENSION' ? 'bg-blue-100 text-blue-700' : 
                            p.categoria === 'MATRICULA' ? 'bg-purple-100 text-purple-700' : 
                            p.categoria === 'VACANTE' ? 'bg-green-100 text-green-700' : 
                            p.categoria === 'MODULO' ? 'bg-orange-100 text-orange-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {p.categoria === 'MODULO' ? 'MÓDULO' : p.categoria}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-gray-800">{p.nombre}</td>
                        <td className="p-4 text-xs font-medium text-gray-600">
                          {dI} de {nombreMes(mI)} a {dF} de {nombreMes(mF)}
                        </td>
                        <td className="p-4 text-center font-black text-[#093E7A]">S/ {Number(p.costo).toFixed(2)}</td>
                        <td className="p-4 flex justify-end gap-2">
                          <button onClick={() => openEditTipoPago(p)} className="text-gray-400 hover:text-blue-600"><span className="material-symbols-outlined text-sm">edit</span></button>
                          <button onClick={() => handleEliminarTipoPago(p.id_tipo_pago)} className="text-gray-400 hover:text-red-600"><span className="material-symbols-outlined text-sm">delete</span></button>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- TAB: CAJA Y RECAUDACIÓN --- */}
          {tabActiva === "recaudacion" && (
            <div className="space-y-4">
              {/* --- BARRA DE FILTROS AVANZADOS --- */}
              <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-4 items-end">
                {/* Búsqueda por DNI/Concepto */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Búsqueda rápida</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2 text-gray-400 text-sm">search</span>
                    <input
                      type="text"
                      placeholder="DNI Alumno o concepto..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                </div>

                {/* Selector de Categoría (Dinámico) */}
                <div className="w-44">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Categoría</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm outline-none"
                    value={filtroTipoPago}
                    onChange={(e) => setFiltroTipoPago(e.target.value)}
                  >
                    <option value="TODOS">Todas las categorías</option>
                    {categoriasUnicas.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'PENSION' ? 'Pensiones' : 
                         cat === 'MATRICULA' ? 'Matrículas' : 
                         cat === 'VACANTE' ? 'Vacantes' : 
                         cat === 'MODULO' ? 'Módulos (Libros)' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Switch de Criterio (Recaudación vs Deudas) */}
                <div className="w-52">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Criterio de tiempo</label>
                  <div className="flex bg-gray-100 p-1 rounded-lg border">
                    <button
                      onClick={() => setCriterioFecha("pago")}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${criterioFecha === 'pago' ? 'bg-white shadow text-[#093E7A]' : 'text-gray-500'}`}
                    >
                      PAGADOS
                    </button>
                    <button
                      onClick={() => setCriterioFecha("vencimiento")}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${criterioFecha === 'vencimiento' ? 'bg-white shadow text-[#093E7A]' : 'text-gray-500'}`}
                    >
                      VENCIMIENTOS
                    </button>
                  </div>
                </div>

                {/* Selector de Año */}
                <div className="w-28">
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Año</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm"
                    value={anioFiltro}
                    onChange={(e) => setAnioFiltro(parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Estadísticos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-l-4 border-l-green-500 shadow-sm">
                  <p className="text-[10px] font-black text-gray-400 uppercase">
                    {criterioFecha === 'pago' ? 'Total Cobrado' : 'Total Proyectado'} ({anioFiltro})
                  </p>
                  <p className="text-2xl font-black text-gray-800">
                    S/ {pagos.filter(p => p.estado === "PAGADO").reduce((acc, p) => acc + Number(p.monto_total), 0).toFixed(2)}
                  </p>
                </div>
                {criterioFecha === 'vencimiento' && (
                  <div className="bg-white p-4 rounded-xl border border-l-4 border-l-orange-500 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Por Cobrar (Pendientes)</p>
                    <p className="text-2xl font-black text-orange-600">
                      S/ {pagos.filter(p => p.estado === "PENDIENTE").reduce((acc, p) => acc + Number(p.monto_total), 0).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">F. Pago</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">F. Venc.</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Concepto</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Monto</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Estado</th>
                      <th className="p-4 text-xs font-bold text-gray-500 uppercase">Ref. BCP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {pagos.map((p: any) => {
                      // --- LÓGICA DE VENCIMIENTO ---
                      const hoy = new Date();
                      hoy.setHours(0, 0, 0, 0); // Normalizamos a medianoche para comparar solo fechas
                      const fechaVenc = p.fecha_vencimiento ? new Date(p.fecha_vencimiento) : null;
                      const estaVencido = p.estado === "PENDIENTE" && fechaVenc && fechaVenc < hoy;

                      return (
                        <tr key={p.id_pago} className={estaVencido ? "bg-red-50/30" : ""}>
                          <td className="p-4">
                            {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : '---'}
                          </td>

                          {/* CELDA DE VENCIMIENTO CON ESTILO DINÁMICO */}
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className={`font-medium ${estaVencido ? 'text-red-600' : 'text-gray-600'}`}>
                                {p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString() : '---'}
                              </span>
                              {estaVencido && (
                                <span className="text-[9px] font-black text-red-500 uppercase leading-none">
                                  Vencido
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-4 font-medium">{p.concepto}</td>
                          <td className="p-4 font-bold text-gray-800">S/ {Number(p.monto_total).toFixed(2)}</td>

                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-black ${p.estado === 'PAGADO' ? 'bg-green-100 text-green-700' :
                              estaVencido ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                              {estaVencido ? 'VENCIDO' : p.estado}
                            </span>
                          </td>

                          <td className="p-4 text-xs text-gray-400 font-mono">{p.codigo_operacion_bcp || 'N/A'}</td>

                          <td className="p-4">
                            {p.estado === "PENDIENTE" ? (
                              <button
                                onClick={() => prepararConfirmacionManual(p.id_pago)}
                                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded font-bold uppercase transition-colors text-white ${estaVencido ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                  }`}
                              >
                                <span className="material-symbols-outlined text-xs">
                                  {estaVencido ? 'priority_high' : 'check_circle'}
                                </span>
                                Confirmar Pago
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400 font-mono">{p.codigo_operacion_bcp || 'N/A'}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL DE TRÁMITE --- */}
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
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Periodo Académico</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.periodo_academico}
                    onChange={e => setFormData({ ...formData, periodo_academico: e.target.value as any })}
                  >
                    <option value="REGULAR">Año Regular</option>
                    <option value="VERANO">Vacacional / Verano</option>
                    <option value="AMBOS">Ambos Periodos</option>
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

      {/* --- MODAL DICTAMEN SOLICITUD --- */}
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

      {/* --- NUEVO MODAL PARA TIPOS DE PAGO --- */}
      {isModalTipoPagoOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-[#093E7A] p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold">{isEditingTipoPago ? 'Editar Plantilla' : 'Nueva Plantilla Automática'}</h3>
              <button onClick={() => setIsModalTipoPagoOpen(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <form onSubmit={handleSubmitTipoPago} className="p-6 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría del Pago</label>
                <select required className="w-full bg-blue-50 border border-blue-200 text-[#093E7A] font-bold rounded-lg px-4 py-2 text-sm outline-none" value={formDataTipoPago.categoria} onChange={e => setFormDataTipoPago({...formDataTipoPago, categoria: e.target.value})}>
                  <option value="VACANTE">Derecho de Vacante</option>
                  <option value="MATRICULA">Matrícula</option>
                  <option value="PENSION">Pensión Mensual</option>
                  <option value="MODULO">Módulos (Libros)</option>
                  <option value="OTRO">Otro (Genérico)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre (Ej: Matrícula Anticipada o Pensión Abril)</label>
                <input required type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" value={formDataTipoPago.nombre} onChange={e => setFormDataTipoPago({...formDataTipoPago, nombre: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Válido Desde / Inicio</label>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none" value={mesInicio} onChange={e => setMesInicio(e.target.value)}>
                      {meses.map(m => <option key={m.num} value={m.num}>{m.nom}</option>)}
                    </select>
                    <select className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none" value={diaInicio} onChange={e => setDiaInicio(e.target.value)}>
                      {dias.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Válido Hasta / Vence</label>
                  <div className="flex gap-2">
                    <select className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none" value={mesFin} onChange={e => setMesFin(e.target.value)}>
                      {meses.map(m => <option key={m.num} value={m.num}>{m.nom}</option>)}
                    </select>
                    <select className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none" value={diaFin} onChange={e => setDiaFin(e.target.value)}>
                      {dias.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Base (S/)</label>
                  <input required type="number" min="0" step="0.01" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" value={formDataTipoPago.costo} onChange={e => setFormDataTipoPago({...formDataTipoPago, costo: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Acción al Vencer</label>
                  <select className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none" value={formDataTipoPago.accion_vencimiento} onChange={e => setFormDataTipoPago({...formDataTipoPago, accion_vencimiento: e.target.value})}>
                    <option value="APLICAR_MORA">Aplicar Mora (+10 días)</option>
                    <option value="DESHABILITAR">Se Deshabilita</option>
                  </select>
                </div>
              </div>
              
              {formDataTipoPago.accion_vencimiento === "APLICAR_MORA" && formDataTipoPago.categoria === "PENSION" && (
                <div>
                  <label className="block text-xs font-bold text-orange-500 uppercase mb-1">Monto de Mora (S/)</label>
                  <input required type="number" min="0" step="0.01" className="w-full bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm outline-none" value={formDataTipoPago.mora} onChange={e => setFormDataTipoPago({...formDataTipoPago, mora: parseFloat(e.target.value)})} />
                </div>
              )}
              {formDataTipoPago.categoria !== "PENSION" && (
                 <p className="text-xs text-gray-400 italic">* Nota: La mora automática del sistema está configurada para aplicar únicamente a Pensiones.</p>
              )}
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalTipoPagoOpen(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-500 font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-[#093E7A] text-white font-bold rounded-lg text-sm hover:bg-[#072d5a] transition-colors">Guardar Plantilla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CONFIRMACIÓN --- */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={ejecutarConfirmacionManual}
        title="Confirmar Pago Manual"
        message="¿Estás seguro de registrar este pago manualmente? Si es un derecho de vacante o matrícula, se ejecutarán los procesos en cascada para generar las deudas correspondientes (Pensiones y Módulos)."
        confirmText="Sí, Confirmar Pago"
        type="warning" 
      />
    </div>
  );
}