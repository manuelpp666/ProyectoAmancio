"use client";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/src/context/userContext";
import { toast } from "sonner";
import {
  Loader2, GraduationCap, CalendarCheck, ArrowRight, Send, X,
  CheckCircle, Clock, XCircle, AlertCircle, FileText, School, BadgeCheck, Lock, CalendarClock,
  AlertTriangle, Wallet
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";

interface SolicitudMatricula {
  id_solicitud_matricula: number;
  anio_destino: string;
  grado_destino?: string;
  comentario?: string;
  estado: string;
  respuesta_admin?: string;
  fecha_solicitud: string;
}

interface InfoRenovacion {
  alumno: { id_alumno: number; nombres: string; apellidos: string; dni?: string };
  matricula_actual: {
    anio: string;
    grado?: string;
    seccion?: string;
    estado: string;
    tipo: string;
  } | null;
  anio_destino: string;
  grado_destino?: string;
  egresa: boolean;
  repite?: boolean;
  condicion_academica?: string | null;
  ya_matriculado_destino: boolean;
  puede_solicitar: boolean;
  inscripcion_estado: "NO_CONFIGURADO" | "PROXIMAMENTE" | "ABIERTA" | "CERRADA";
  inscripciones_abiertas: boolean;
  inscripcion_inicio?: string | null;
  inscripcion_fin?: string | null;
  // Estado de cuenta: con cargos vencidos no se puede renovar
  al_dia: boolean;
  deuda_vencida: number;
  pagos_vencidos: PagoVencido[];
  solicitudes: SolicitudMatricula[];
}

interface PagoVencido {
  id_pago: number;
  concepto: string;
  monto: number;
  fecha_vencimiento?: string | null;
}

const soles = (n: number) =>
  `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatearFecha = (fecha?: string | null) =>
  fecha
    ? new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })
    : "";

export default function MatriculaPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [info, setInfo] = useState<InfoRenovacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de solicitud
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Inscripción a verano ---
  const [verano, setVerano] = useState<any>(null);
  const [veranoCursos, setVeranoCursos] = useState<{ fijos: any[]; talleres: any[] }>({ fijos: [], talleres: [] });
  const [modalidadVerano, setModalidadVerano] = useState<"CURSOS" | "TALLER" | "CURSOS_Y_TALLER">("CURSOS");
  const [cursosSelV, setCursosSelV] = useState<number[]>([]);
  const [talleresSelV, setTalleresSelV] = useState<number[]>([]);
  const [veranoSubmitting, setVeranoSubmitting] = useState(false);
  const toggle = (arr: number[], id: number) => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  const fetchVerano = useCallback(async () => {
    if (!id_usuario) return;
    try {
      const res = await apiFetch(`/verano/estado-inscripcion/${id_usuario}`);
      if (res.ok) {
        const data = await res.json();
        setVerano(data);
        if (data?.disponible && data?.abierto && data?.elegible && data?.condicion === "NORMAL" && data?.id_grado) {
          const rc = await apiFetch(`/verano/cursos/${data.id_grado}`);
          if (rc.ok) setVeranoCursos(await rc.json());
        }
      }
    } catch { /* silencioso */ }
  }, [id_usuario]);

  const handleInscribirVerano = async () => {
    if (!id_usuario || !verano?.id_anio_escolar) return;
    const esNivelacion = verano?.condicion === "REQUIERE_NIVELACION";
    setVeranoSubmitting(true);
    try {
      const res = await apiFetch(`/verano/inscribir-interno`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: Number(id_usuario),
          id_anio_escolar: verano.id_anio_escolar,
          modalidad: esNivelacion ? "NIVELACION" : modalidadVerano,
          cursos_ids: esNivelacion || modalidadVerano === "TALLER" ? [] : cursosSelV,
          talleres_ids: esNivelacion || modalidadVerano === "CURSOS" ? [] : talleresSelV,
        })
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        toast.success("Inscripción a verano registrada. Realiza el pago para ser admitido.");
        fetchVerano();
      } else {
        toast.error(body?.detail || "No se pudo registrar la inscripción");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setVeranoSubmitting(false);
    }
  };

  const fetchInfo = useCallback(async () => {
    if (!id_usuario) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/enrollment/renovacion/${id_usuario}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || "No se pudo cargar tu información de matrícula");
      }
      const data = await res.json();
      setInfo(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id_usuario]);

  useEffect(() => {
    if (!userLoading && id_usuario) { fetchInfo(); fetchVerano(); }
  }, [userLoading, id_usuario, fetchInfo, fetchVerano]);

  const handleSolicitar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_usuario) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/enrollment/renovacion/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_usuario: Number(id_usuario), comentario })
      });
      if (res.ok) {
        toast.success("Solicitud de renovación enviada con éxito");
        setIsModalOpen(false);
        setComentario("");
        fetchInfo();
      } else {
        const body = await res.json().catch(() => null);
        toast.error(body?.detail || "No se pudo enviar la solicitud");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (estado: string) => {
    const badges: any = {
      "PENDIENTE": { color: "bg-yellow-100 text-yellow-700", icon: <Clock size={12} />, text: "Pendiente" },
      "APROBADA": { color: "bg-green-100 text-green-700", icon: <CheckCircle size={12} />, text: "Aprobada" },
      "RECHAZADA": { color: "bg-red-100 text-red-700", icon: <XCircle size={12} />, text: "Rechazada" },
    };
    const b = badges[estado] || { color: "bg-gray-100 text-gray-600", icon: null, text: estado };
    return (
      <span className={`${b.color} px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit`}>
        {b.icon} {b.text}
      </span>
    );
  };

  if (userLoading || loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500">Cargando información de matrícula...</p>
      </div>
    );
  }

  if (error || !info) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="text-red-500 mb-4" size={48} />
        <p className="text-gray-600">{error || "No se encontró información de matrícula"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold text-[#701C32] mb-2 flex items-center gap-3">
          <School size={30} /> Matrícula
        </h1>
        <p className="text-gray-500 text-sm">
          Consulta tu matrícula actual y solicita la renovación para el próximo año académico.
        </p>
      </div>

      {/* MATRÍCULA ACTUAL + RENOVACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Tarjeta: matrícula actual */}
        <div className="bg-[#701C32] rounded-3xl p-7 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-4 flex items-center gap-2">
            <BadgeCheck size={14} /> Matrícula actual
          </p>

          {info.matricula_actual ? (
            <>
              <h2 className="text-2xl font-black mb-1">
                {info.alumno.nombres} {info.alumno.apellidos}
              </h2>
              <p className="text-white/70 text-xs mb-6">DNI: {info.alumno.dni || "—"}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-[9px] uppercase font-bold text-white/60">Año escolar</p>
                  <p className="font-black text-lg">{info.matricula_actual.anio}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-[9px] uppercase font-bold text-white/60">Estado</p>
                  <p className="font-black text-lg capitalize">{info.matricula_actual.estado.toLowerCase()}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-[9px] uppercase font-bold text-white/60">Grado</p>
                  <p className="font-black text-lg">{info.matricula_actual.grado || "—"}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <p className="text-[9px] uppercase font-bold text-white/60">Sección</p>
                  <p className="font-black text-lg">{info.matricula_actual.seccion || "Por asignar"}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <AlertCircle size={32} className="mx-auto mb-3 text-white/60" />
              <p className="text-sm text-white/80">No tienes una matrícula registrada en el año escolar activo.</p>
            </div>
          )}
        </div>

        {/* Tarjeta: renovación */}
        <div className="bg-white rounded-3xl p-7 border border-gray-100 shadow-sm flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#701C32] mb-4 flex items-center gap-2">
            <CalendarCheck size={14} /> Renovación {info.anio_destino}
          </p>

          {info.egresa ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <GraduationCap size={40} className="text-[#701C32] mb-3" />
              <h3 className="font-black text-gray-800 mb-1">¡Estás por culminar el colegio!</h3>
              <p className="text-sm text-gray-500">
                Te encuentras en el último grado, por lo que no aplica la renovación de matrícula. ¡Éxitos en tu siguiente etapa!
              </p>
            </div>
          ) : info.ya_matriculado_destino ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <CheckCircle size={40} className="text-green-500 mb-3" />
              <h3 className="font-black text-gray-800 mb-1">Ya estás matriculado</h3>
              <p className="text-sm text-gray-500">
                Tu matrícula para el año {info.anio_destino} ya se encuentra registrada.
              </p>
            </div>
          ) : (
            <>
              {/* Progresión de grado */}
              <div className="flex items-center justify-center gap-4 bg-[#FFF1E3] border border-[#F8EBDD] rounded-2xl p-5 mb-5">
                <div className="text-center">
                  <p className="text-[9px] uppercase font-bold text-gray-400">Actual</p>
                  <p className="font-black text-[#701C32]">{info.matricula_actual?.grado || "—"}</p>
                  <p className="text-[10px] text-gray-400">{info.matricula_actual?.anio}</p>
                </div>
                <ArrowRight className="text-[#701C32]" size={22} />
                <div className="text-center">
                  <p className="text-[9px] uppercase font-bold text-gray-400">Siguiente</p>
                  <p className="font-black text-[#701C32]">{info.grado_destino || "—"}</p>
                  <p className="text-[10px] text-gray-400">{info.anio_destino}</p>
                </div>
              </div>

              {/* AVISO ACADÉMICO: REPITE */}
              {info.repite && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-relaxed">
                    <span className="font-bold">Repetirás el año académico</span> por desaprobar 4 o más cursos.
                    Al renovar, tu matrícula quedará en el mismo grado.
                  </p>
                </div>
              )}

              {/* ESTADO DE LA VENTANA DE INSCRIPCIÓN */}
              {info.inscripcion_estado === "ABIERTA" ? (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <CalendarCheck size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800 leading-relaxed">
                    <span className="font-bold">Inscripciones abiertas.</span> Puedes solicitar tu renovación
                    {info.inscripcion_fin ? ` hasta el ${formatearFecha(info.inscripcion_fin)}.` : "."}
                  </p>
                </div>
              ) : info.inscripcion_estado === "PROXIMAMENTE" ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <CalendarClock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Inscripciones próximamente.</span> El periodo de renovación
                    {info.inscripcion_inicio ? ` abre el ${formatearFecha(info.inscripcion_inicio)}.` : " aún no ha sido habilitado."}
                  </p>
                </div>
              ) : info.inscripcion_estado === "CERRADA" ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <Lock size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-relaxed">
                    <span className="font-bold">Inscripciones cerradas.</span> El periodo de renovación
                    {info.inscripcion_fin ? ` finalizó el ${formatearFecha(info.inscripcion_fin)}.` : " ya terminó."} Acércate a secretaría.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-4 flex items-start gap-2">
                  <Clock size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Las inscripciones para el año {info.anio_destino} aún no han sido habilitadas por el colegio.
                    Te avisaremos cuando puedas renovar tu matrícula.
                  </p>
                </div>
              )}

              {/* DEUDA VENCIDA: bloquea la renovación */}
              {!info.al_dia && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-red-800 leading-relaxed">
                        <span className="font-bold">Tienes pagos pendientes.</span> Para renovar tu
                        matrícula primero debes regularizar tu deuda vencida.
                      </p>

                      <div className="mt-3 bg-white/70 rounded-lg border border-red-100 divide-y divide-red-50">
                        {info.pagos_vencidos.slice(0, 4).map((p) => (
                          <div key={p.id_pago} className="flex items-center justify-between gap-3 px-3 py-2">
                            <span className="text-[11px] font-bold text-gray-700 truncate">
                              {p.concepto}
                            </span>
                            <span className="text-[11px] font-black text-red-600 shrink-0">
                              {soles(p.monto)}
                            </span>
                          </div>
                        ))}
                        {info.pagos_vencidos.length > 4 && (
                          <p className="px-3 py-2 text-[11px] text-gray-400 font-medium">
                            y {info.pagos_vencidos.length - 4} cargo(s) más...
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-red-200">
                        <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">
                          Total vencido
                        </span>
                        <span className="text-lg font-black text-red-600">
                          {soles(info.deuda_vencida)}
                        </span>
                      </div>

                      <Link
                        href="/campus/campus-estudiante/inicio-campus/tramites"
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-[#093E7A] hover:bg-[#073365] text-white py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors"
                      >
                        <Wallet size={14} /> Ir a mi estado de cuenta
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsModalOpen(true)}
                disabled={!info.puede_solicitar}
                className="mt-auto w-full bg-[#701C32] hover:bg-[#5a1628] disabled:opacity-40 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/10"
              >
                {info.puede_solicitar ? <Send size={16} /> : <Lock size={16} />}
                {info.puede_solicitar
                  ? "Solicitar renovación de matrícula"
                  : info.solicitudes.some(s => s.anio_destino === info.anio_destino && ["PENDIENTE", "APROBADA"].includes(s.estado))
                    ? "Ya tienes una solicitud en curso"
                    : !info.al_dia
                      ? "Regulariza tu deuda para renovar"
                      : info.inscripcion_estado === "PROXIMAMENTE"
                        ? "Inscripciones aún no abiertas"
                        : info.inscripcion_estado === "CERRADA"
                          ? "Inscripciones cerradas"
                          : "Renovación no disponible"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* INSCRIPCIÓN A VERANO */}
      {verano?.disponible && (
        <div className="bg-white rounded-3xl p-7 border border-orange-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-4 flex items-center gap-2">
            <CalendarClock size={14} /> Inscripción a Verano
          </p>
          {verano.grupo_label && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold">
              <School size={14} /> Aula de verano: {verano.grupo_label}
            </div>
          )}

          {/* Fecha de inicio siempre visible */}
          {!verano.abierto ? (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-2 flex items-start gap-2">
              <CalendarClock size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Las inscripciones a verano
                {verano.inicio_inscripcion ? ` inician el ${formatearFecha(verano.inicio_inscripcion)}.` : " aún no están habilitadas."}
              </p>
            </div>
          ) : verano.ya_inscrito ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-2">
              <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-green-800">Ya estás inscrito al verano</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Estado: {verano.estado_solicitud === "ADMITIDO" ? "Admitido" : "Pendiente de pago"}.
                  {verano.estado_solicitud !== "ADMITIDO" && " Realiza el pago fijo de verano para completar tu admisión."}
                </p>
              </div>
            </div>
          ) : verano.condicion === "REPITE" ? (
            <p className="text-sm text-red-600">{verano.mensaje}</p>
          ) : (
            <>
              {verano.condicion === "REQUIERE_NIVELACION" ? (
                <div className="bg-[#FFF1E3] border border-[#F8EBDD] rounded-xl p-4 mb-4">
                  <p className="text-sm font-bold text-[#701C32] mb-1">Requiere nivelación</p>
                  <p className="text-xs text-gray-600 mb-2">
                    Debes nivelar los siguientes cursos desaprobados en el verano:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(verano.cursos_nivelacion || []).map((c: any) => (
                      <span key={c.id_curso} className="px-2 py-0.5 bg-white border border-[#F8EBDD] text-[#701C32] rounded text-xs font-bold">{c.nombre}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Modalidad</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { v: "CURSOS", t: "Solo cursos fijos" },
                        { v: "TALLER", t: "Solo taller(es)" },
                        { v: "CURSOS_Y_TALLER", t: "Cursos + taller(es)" },
                      ].map(opt => (
                        <button
                          type="button"
                          key={opt.v}
                          onClick={() => setModalidadVerano(opt.v as any)}
                          className={`px-3 py-2 rounded-lg border font-bold text-xs transition-all ${
                            modalidadVerano === opt.v ? "bg-[#701C32] text-white border-[#701C32]" : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >{opt.t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {modalidadVerano !== "TALLER" && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cursos fijos</p>
                        {veranoCursos.fijos.length === 0 ? <p className="text-xs text-gray-400 italic">Sin cursos fijos.</p> :
                          veranoCursos.fijos.map((c: any) => (
                            <label key={c.id_curso} className="flex items-center gap-2 cursor-pointer mb-1">
                              <input type="checkbox" className="w-4 h-4 accent-[#701C32]" checked={cursosSelV.includes(c.id_curso)} onChange={() => setCursosSelV(prev => toggle(prev, c.id_curso))} />
                              <span className="text-sm text-gray-600">{c.nombre}</span>
                            </label>
                          ))}
                      </div>
                    )}
                    {modalidadVerano !== "CURSOS" && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Talleres</p>
                        {veranoCursos.talleres.length === 0 ? <p className="text-xs text-gray-400 italic">Sin talleres.</p> :
                          veranoCursos.talleres.map((c: any) => (
                            <label key={c.id_curso} className="flex items-center gap-2 cursor-pointer mb-1">
                              <input type="checkbox" className="w-4 h-4 accent-[#701C32]" checked={talleresSelV.includes(c.id_curso)} onChange={() => setTalleresSelV(prev => toggle(prev, c.id_curso))} />
                              <span className="text-sm text-gray-600">{c.nombre}</span>
                            </label>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mb-4 bg-orange-50 border border-orange-100 rounded-lg p-3">
                Al inscribirte se generará un <strong>pago fijo de verano</strong> que deberás cancelar por completo para ser admitido.
              </p>
              <button
                onClick={handleInscribirVerano}
                disabled={veranoSubmitting}
                className="w-full bg-[#701C32] hover:bg-[#5a1628] disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {veranoSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} />}
                Inscribirme al verano
              </button>
            </>
          )}
        </div>
      )}

      {/* HISTORIAL DE SOLICITUDES */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
          <FileText className="text-[#701C32]" size={20} /> Mis solicitudes de renovación
        </h2>

        {info.solicitudes.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
            <FileText size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-500">Aún no has realizado ninguna solicitud de renovación.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {info.solicitudes.map((sol) => (
              <div key={sol.id_solicitud_matricula} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-[#FFF1E3] border border-[#F8EBDD] flex items-center justify-center text-[#701C32] shrink-0">
                      <CalendarCheck size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">
                        Renovación {sol.anio_destino} {sol.grado_destino ? `· ${sol.grado_destino}` : ""}
                      </h4>
                      <p className="text-gray-400 text-xs">
                        Solicitada el {new Date(sol.fecha_solicitud).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Estado</p>
                    {getStatusBadge(sol.estado)}
                  </div>
                </div>

                {sol.comentario && (
                  <p className="mt-3 text-xs text-gray-500 italic">Tu comentario: "{sol.comentario}"</p>
                )}
                {sol.respuesta_admin && (
                  <div className="mt-3 p-3 bg-gray-50 border-l-4 border-[#701C32] rounded-r-lg">
                    <p className="text-[10px] font-black text-[#701C32] uppercase mb-1">Respuesta del Colegio:</p>
                    <p className="text-sm text-gray-700 leading-relaxed italic">"{sol.respuesta_admin}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: SOLICITAR RENOVACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-[#701C32] p-4 flex justify-between items-center text-white">
              <h3 className="font-bold flex items-center gap-2">
                <CalendarCheck size={18} /> Renovación de Matrícula {info.anio_destino}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSolicitar} className="p-6 space-y-5">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-blue-600 shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-blue-900 uppercase">Resumen de la solicitud</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Solicitarás tu vacante para <span className="font-bold">{info.grado_destino}</span> en el
                      año <span className="font-bold">{info.anio_destino}</span>. La administración revisará tu
                      solicitud y te confirmará los pasos de pago y matrícula.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Comentario (Opcional)</label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20 min-h-[100px]"
                  placeholder="Escribe alguna observación para la administración (opcional)..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
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
