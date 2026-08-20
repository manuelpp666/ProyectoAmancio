"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState, useCallback } from "react";
import React from "react";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import {
  LayoutDashboard, Users, Loader2,
  AlertTriangle, ClipboardList, CalendarCheck, HeartPulse,
  Clock, XCircle, CheckCircle2, FileCheck, School, ShieldAlert,
} from "lucide-react";

// ── Utilidades de presentación ─────────────────────────────────────────────
const saludo = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
};

const fechaLarga = () => {
  const t = new Intl.DateTimeFormat("es-PE", {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date());
  return t.charAt(0).toUpperCase() + t.slice(1);
};

// Permisos anidados (ej: "contenido_web.noticias")
const tienePermiso = (permisos: unknown, ruta: string): boolean => {
  if (!permisos) return false;
  let actual: unknown = permisos;
  for (const clave of ruta.split(".")) {
    if (typeof actual !== "object" || actual === null) return false;
    const siguiente = (actual as Record<string, unknown>)[clave];
    if (siguiente === undefined) return false;
    actual = siguiente;
  }
  if (typeof actual === "boolean") return actual;
  if (typeof actual === "object" && actual !== null) {
    return Object.values(actual).some((v) => v === true);
  }
  return false;
};

// ── Tipos de la respuesta del backend ──────────────────────────────────────
// El resumen no incluye finanzas a propósito: ver el comentario del bloque
// retirado más abajo.
interface Aula {
  id_seccion: number; nivel: string; grado: string; seccion: string;
  matriculados: number; vacantes: number;
  /** Si el aula ya registró la asistencia de hoy. */
  paso_lista?: boolean;
}
interface Resumen {
  asistencia_hoy: {
    presentes: number; tardanzas: number; faltas: number; justificados: number;
    secciones_registradas: number; secciones_total: number;
  };
  conducta: { en_observacion: number; en_critico: number; reportes_semana: number };
  psicologia: { citas_hoy: number; citas_semana: number };
  tramites: { pendientes: number };
  ocupacion: Aula[];
  totales: { alumnos: number; secciones: number; docentes: number };
}

export default function DashboardPage() {
  const { role, username, permisos, loading } = useUser();
  const {
    anioPlanificacion: anio, setAnioPlanificacion: setAnio,
    listaAnios, loadingAnios,
  } = useAnioAcademico();

  const [nombre, setNombre] = useState("");
  const [datos, setDatos] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(true);

  const puedeAcademico = tienePermiso(permisos, "academico");

  useEffect(() => {
    if (role?.toUpperCase() !== "ADMIN" || !username) return;
    apiFetch(`/perfil/mi-perfil/${username}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.datos) setNombre(`${d.datos.nombres ?? ""} ${d.datos.apellidos ?? ""}`.trim());
      })
      .catch(() => {});
  }, [role, username]);

  const cargar = useCallback(async () => {
    if (!anio) return;
    setCargando(true);
    try {
      const resumen = await apiFetch(`/gestion/dashboard-admin?anio=${anio}`);
      if (resumen.ok) setDatos(await resumen.json());
    } catch (e) {
      console.error("Error cargando el resumen:", e);
    } finally {
      setCargando(false);
    }
  }, [anio]);

  useEffect(() => {
    if (role?.toUpperCase() === "ADMIN") cargar();
  }, [role, cargar]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
      </div>
    );
  }
  if (role?.toUpperCase() !== "ADMIN") return null;

  const a = datos?.asistencia_hoy;

  const marcadosHoy = a ? a.presentes + a.tardanzas + a.faltas + a.justificados : 0;

  return (
    // Sin fondo ni padding propios: esta ruta ya recibe el padding y el fondo
    // del <main> del layout. Ponerlos aquí dibujaba un recuadro más claro
    // sobre el gris del campus, con doble margen.
    <div className="text-slate-800">
      <div className="space-y-8 w-full">

        {/* SALUDO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#701C32] to-[#922a44] rounded-2xl p-5 sm:p-8 shadow-lg shadow-[#701C32]/10">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">{fechaLarga()}</p>
              <h3 className="text-white text-2xl sm:text-3xl font-black">
                {saludo()}, {nombre || username || "Administrador"} 👋
              </h3>
              <p className="text-white/80 mt-2">
                {datos
                  ? `${datos.totales.alumnos} alumnos matriculados · ${datos.totales.secciones} aulas · ${datos.totales.docentes} docentes`
                  : "Cargando el resumen del colegio..."}
              </p>
            </div>
            <div className="[&_label]:text-white/70 [&_select]:bg-white/15 [&_select]:border-white/25 [&_select]:text-white">
              <AnioSelector value={anio} onChange={setAnio} anios={listaAnios} loading={loadingAnios} />
            </div>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
            <LayoutDashboard className="w-48 h-48 text-white" />
          </div>
        </div>

        {cargando && !datos ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-[#701C32] mb-3" />
            <p className="text-gray-400 text-sm">Reuniendo la información del colegio...</p>
          </div>
        ) : (
          <>
            {/* Aquí iba la situación económica (recaudación, deuda vencida y
                los alumnos más morosos). Se retiró del dashboard por ser
                información sensible: vive en Trámites y Finanzas, donde el
                acceso se controla por permiso. El backend tampoco la envía. */}

            {/* ASISTENCIA DE HOY */}
            {a && a.secciones_total > 0 && (
              <section>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarCheck size={18} className="text-[#701C32]" /> Asistencia de hoy
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aulas que pasaron lista</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">
                      {a.secciones_registradas}
                      <span className="text-lg text-gray-300"> / {a.secciones_total}</span>
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mt-4">
                      <div
                        className="bg-[#701C32] h-full transition-all duration-700"
                        style={{ width: `${(a.secciones_registradas / a.secciones_total) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { l: "Presentes", v: a.presentes, c: "text-emerald-600", b: "bg-emerald-50", i: CheckCircle2 },
                      { l: "Tardanzas", v: a.tardanzas, c: "text-amber-600", b: "bg-amber-50", i: Clock },
                      { l: "Faltas", v: a.faltas, c: "text-red-600", b: "bg-red-50", i: XCircle },
                      { l: "Justificados", v: a.justificados, c: "text-slate-600", b: "bg-slate-100", i: FileCheck },
                    ].map((e) => (
                      <div key={e.l} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                        <div className={`p-2 rounded-xl ${e.b} ${e.c} w-fit mb-3`}>
                          {React.createElement(e.i, { size: 18 })}
                        </div>
                        <p className="text-2xl font-black text-gray-900">{e.v}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{e.l}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {marcadosHoy === 0 && (
                  <p className="text-xs text-gray-400 mt-3">
                    Todavía no se ha registrado asistencia hoy.
                  </p>
                )}
              </section>
            )}

            {/* OCUPACIÓN DE AULAS */}
            {puedeAcademico && datos && datos.ocupacion.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <School size={18} className="text-[#701C32]" /> Ocupación de aulas
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> pasó lista
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> falta pasar
                      </span>
                    </span>
                    <Link href="/campus/panel-control/gestion-academica"
                          className="text-xs font-bold text-[#093E7A] hover:underline">
                      Gestionar aulas
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                    {datos.ocupacion.map((o) => {
                      const pct = o.vacantes ? Math.min((o.matriculados / o.vacantes) * 100, 100) : 0;
                      const lleno = pct >= 90;
                      return (
                        <div key={o.id_seccion} className="flex items-center gap-3">
                          {/* Verde: ya pasó lista hoy. Rojo: todavía no.
                              El title explica el color a quien no lo deduzca,
                              y el aria-label lo dice en voz alta para quien
                              use lector de pantalla: un color a secas no es
                              información accesible. */}
                          <span
                            title={o.paso_lista ? "Ya pasó lista hoy" : "Todavía no pasa lista hoy"}
                            aria-label={o.paso_lista ? "Ya pasó lista hoy" : "Todavía no pasa lista hoy"}
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              o.paso_lista ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          <span className="text-xs font-bold text-gray-600 w-24 sm:w-32 shrink-0 truncate">
                            {o.grado} {o.seccion}
                            <span className="text-gray-300 ml-1">
                              {o.nivel === "PRIMARIA" ? "P" : "S"}
                            </span>
                          </span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${lleno ? "bg-red-500" : "bg-[#093E7A]"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-black text-gray-500 w-14 text-right shrink-0">
                            {o.matriculados}/{o.vacantes}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* CONDUCTA Y PSICOLOGÍA */}
            {datos && (
              <section>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-[#701C32]" /> Bienestar del alumnado
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { l: "En observación", v: datos.conducta.en_observacion, d: "Conducta bajo el umbral", c: "text-amber-600", b: "bg-amber-50", i: AlertTriangle },
                    { l: "Conducta crítica", v: datos.conducta.en_critico, d: "Requieren intervención", c: "text-red-600", b: "bg-red-50", i: ShieldAlert },
                    { l: "Reportes (7 días)", v: datos.conducta.reportes_semana, d: "Incidencias registradas", c: "text-slate-600", b: "bg-slate-100", i: ClipboardList },
                    { l: "Citas esta semana", v: datos.psicologia.citas_semana, d: "Agenda de psicología", c: "text-violet-600", b: "bg-violet-50", i: HeartPulse },
                  ].map((e) => (
                    <div key={e.l} className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className={`p-2.5 rounded-xl ${e.b} ${e.c} w-fit mb-3`}>
                        {React.createElement(e.i, { size: 20 })}
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-gray-900">{e.v}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{e.l}</p>
                      <p className="text-xs text-gray-400 mt-1">{e.d}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
