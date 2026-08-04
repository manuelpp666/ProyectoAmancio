"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState, useCallback } from "react";
import React from "react";
import Link from "next/link";
import { apiFetch } from "@/src/lib/api";
import { useAnioAcademico } from "@/src/hooks/useAnioAcademico";
import { AnioSelector } from "@/src/components/utils/AnioSelector";
import {
  LayoutDashboard, Users, UserPlus, Loader2, Wallet, TrendingUp, TrendingDown,
  AlertTriangle, ClipboardList, CalendarCheck, HeartPulse, ArrowRight,
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

const soles = (n: number) =>
  `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
interface Deudor { id_alumno: number; nombre: string; aula: string; deuda: number; }
interface Aula {
  id_seccion: number; nivel: string; grado: string; seccion: string;
  matriculados: number; vacantes: number;
}
interface Resumen {
  finanzas: {
    recaudado_mes: number; recaudado_mes_anterior: number;
    deuda_vencida: number; por_cobrar: number;
    alumnos_con_deuda: number; top_deudores: Deudor[];
  };
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
  const [postulantes, setPostulantes] = useState(0);
  const [cargando, setCargando] = useState(true);

  const puedeFinanzas = tienePermiso(permisos, "tramites_finanzas");
  const puedeEstudiantes = tienePermiso(permisos, "gestion_estudiantes");
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
      const [resumen, post] = await Promise.all([
        apiFetch(`/gestion/dashboard-admin?anio=${anio}`),
        puedeEstudiantes ? apiFetch("/alumnos/solicitudes-pendientes") : Promise.resolve(null),
      ]);
      if (resumen.ok) setDatos(await resumen.json());
      if (post?.ok) setPostulantes((await post.json()).length);
    } catch (e) {
      console.error("Error cargando el resumen:", e);
    } finally {
      setCargando(false);
    }
  }, [anio, puedeEstudiantes]);

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

  const f = datos?.finanzas;
  const a = datos?.asistencia_hoy;

  // Variación de la recaudación respecto al mes anterior
  const variacion =
    f && f.recaudado_mes_anterior > 0
      ? ((f.recaudado_mes - f.recaudado_mes_anterior) / f.recaudado_mes_anterior) * 100
      : null;

  const marcadosHoy = a ? a.presentes + a.tardanzas + a.faltas + a.justificados : 0;
  const seccionesPendientes = a ? a.secciones_total - a.secciones_registradas : 0;

  // Avisos que exigen una acción concreta. Solo aparecen si hay algo que hacer.
  const avisos = [
    {
      id: "postulantes",
      mostrar: puedeEstudiantes && postulantes > 0,
      icono: UserPlus,
      valor: postulantes,
      texto: postulantes === 1 ? "postulante por revisar" : "postulantes por revisar",
      color: "text-orange-700", fondo: "bg-orange-50", borde: "border-orange-200",
      ruta: "/campus/panel-control/gestion-estudiantes",
    },
    {
      id: "tramites",
      mostrar: puedeFinanzas && (datos?.tramites.pendientes ?? 0) > 0,
      icono: ClipboardList,
      valor: datos?.tramites.pendientes ?? 0,
      texto: "trámites esperando respuesta",
      color: "text-blue-700", fondo: "bg-blue-50", borde: "border-blue-200",
      ruta: "/campus/panel-control/tramites/configuracion",
    },
    {
      id: "asistencia",
      mostrar: seccionesPendientes > 0 && (a?.secciones_total ?? 0) > 0,
      icono: CalendarCheck,
      valor: seccionesPendientes,
      texto: seccionesPendientes === 1 ? "aula sin pasar lista hoy" : "aulas sin pasar lista hoy",
      color: "text-amber-700", fondo: "bg-amber-50", borde: "border-amber-200",
      ruta: "/campus/panel-control/gestion-academica",
    },
    {
      id: "conducta",
      mostrar: (datos?.conducta.en_critico ?? 0) > 0,
      icono: ShieldAlert,
      valor: datos?.conducta.en_critico ?? 0,
      texto: "alumnos en conducta crítica",
      color: "text-red-700", fondo: "bg-red-50", borde: "border-red-200",
      ruta: "/campus/panel-control/gestion-estudiantes",
    },
    {
      id: "citas",
      mostrar: (datos?.psicologia.citas_hoy ?? 0) > 0,
      icono: HeartPulse,
      valor: datos?.psicologia.citas_hoy ?? 0,
      texto: "citas de psicología hoy",
      color: "text-violet-700", fondo: "bg-violet-50", borde: "border-violet-200",
      ruta: "/campus/panel-control/gestion-estudiantes",
    },
  ].filter((x) => x.mostrar);

  return (
    // Sin fondo ni padding propios: esta ruta ya recibe el padding y el fondo
    // del <main> del layout. Ponerlos aquí dibujaba un recuadro más claro
    // sobre el gris del campus, con doble margen.
    <div className="text-slate-800">
      <div className="space-y-8 w-full">

        {/* SALUDO */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#701C32] to-[#922a44] rounded-2xl p-8 shadow-lg shadow-[#701C32]/10">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">{fechaLarga()}</p>
              <h3 className="text-white text-3xl font-black">
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
            {/* REQUIERE TU ATENCIÓN */}
            {avisos.length > 0 && (
              <section>
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Requiere tu atención
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {avisos.map((av) => (
                    <Link key={av.id} href={av.ruta} className="group">
                      <div className={`${av.fondo} ${av.borde} border rounded-2xl p-5 flex items-center gap-4 hover:shadow-md transition-all`}>
                        <div className={`p-3 rounded-xl bg-white/70 ${av.color} shrink-0`}>
                          {React.createElement(av.icono, { size: 22 })}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-2xl font-black ${av.color} leading-none`}>{av.valor}</p>
                          <p className="text-xs font-bold text-gray-600 mt-1">{av.texto}</p>
                        </div>
                        <ArrowRight size={16} className={`${av.color} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0`} />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* FINANZAS */}
            {puedeFinanzas && f && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <Wallet size={18} className="text-[#701C32]" /> Situación económica
                  </h3>
                  <Link href="/campus/panel-control/tramites/configuracion"
                        className="text-xs font-bold text-[#093E7A] hover:underline">
                    Ver finanzas
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recaudado este mes</p>
                    <p className="text-2xl font-black text-gray-900 mt-2">{soles(f.recaudado_mes)}</p>
                    {variacion !== null && (
                      <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${variacion >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {variacion >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(variacion).toFixed(0)}% vs. mes anterior
                      </p>
                    )}
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deuda vencida</p>
                    <p className="text-2xl font-black text-red-600 mt-2">{soles(f.deuda_vencida)}</p>
                    <p className="text-xs font-bold text-gray-400 mt-2">
                      {f.alumnos_con_deuda} alumnos con atraso
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Por cobrar</p>
                    <p className="text-2xl font-black text-amber-600 mt-2">{soles(f.por_cobrar)}</p>
                    <p className="text-xs font-bold text-gray-400 mt-2">Aún no vencido</p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mes anterior</p>
                    <p className="text-2xl font-black text-gray-900 mt-2">{soles(f.recaudado_mes_anterior)}</p>
                    <p className="text-xs font-bold text-gray-400 mt-2">Referencia de comparación</p>
                  </div>
                </div>

                {f.top_deudores.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mt-5">
                    <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100">
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                        Mayores deudas vencidas
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {f.top_deudores.map((d, i) => (
                        <div key={d.id_alumno} className="px-6 py-3.5 flex items-center gap-4">
                          <span className="w-6 h-6 rounded-lg bg-[#FFF1E3] text-[#701C32] text-[11px] font-black flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <p className="font-bold text-gray-800 text-sm truncate flex-1">{d.nombre}</p>
                          <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0">{d.aula}</span>
                          <span className="font-black text-red-600 text-sm shrink-0 w-24 text-right">
                            {soles(d.deuda)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

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
                  <Link href="/campus/panel-control/gestion-academica"
                        className="text-xs font-bold text-[#093E7A] hover:underline">
                    Gestionar aulas
                  </Link>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                    {datos.ocupacion.map((o) => {
                      const pct = o.vacantes ? Math.min((o.matriculados / o.vacantes) * 100, 100) : 0;
                      const lleno = pct >= 90;
                      return (
                        <div key={o.id_seccion} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-600 w-32 shrink-0 truncate">
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
                    <div key={e.l} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <div className={`p-2.5 rounded-xl ${e.b} ${e.c} w-fit mb-3`}>
                        {React.createElement(e.i, { size: 20 })}
                      </div>
                      <p className="text-3xl font-black text-gray-900">{e.v}</p>
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
