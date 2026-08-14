"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileWarning,
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Plus,
  History,
  ArrowRight,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ModalRegistrarReporte } from "@/src/components/Campus/CampusAuxiliar/ModalRegistrarReporte";
import { ItemReporte } from "@/src/components/Campus/CampusAuxiliar/ItemReporte";
import { ReporteReciente, RespuestaReportes, ResultadoReporte } from "@/src/interfaces/conducta";

const REPORTES_EN_BANDEJA = 5;

const SEMAFORO = {
  Verde: { texto: "Buena conducta", clase: "text-emerald-700", punto: "bg-emerald-600" },
  Amarillo: { texto: "En observación", clase: "text-amber-700", punto: "bg-amber-600" },
  Rojo: { texto: "Conducta crítica", clase: "text-red-700", punto: "bg-red-600" },
} as const;

export default function ReportesAuxiliarPage() {
  const [reportes, setReportes] = useState<ReporteReciente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ultimoRegistro, setUltimoRegistro] = useState<ResultadoReporte | null>(null);

  /* La escala de puntos la define el backend (behavior/constants.py) y viaja en
     la respuesta al registrar un reporte. Los valores de aquí solo se usan
     mientras no se ha registrado ninguno todavía; son los mismos de la libreta:
     se parte de 20 en cada bimestre. */
  const escala = {
    maximo: ultimoRegistro?.puntaje_maximo ?? 20,
    observacion: ultimoRegistro?.umbral_observacion ?? 15,
    critico: ultimoRegistro?.umbral_critico ?? 8,
  };

  const fetchReportes = useCallback(async () => {
    try {
      const res = await apiFetch(`/conducta/reportes/?limit=${REPORTES_EN_BANDEJA}`);
      if (res.ok) {
        const data: RespuestaReportes = await res.json();
        setReportes(data.items);
        setTotal(data.total);
      } else {
        toast.error("No se pudieron cargar los reportes recientes");
      }
    } catch {
      toast.error("Error de conexión al cargar los reportes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  const handleReporteRegistrado = (resultado: ResultadoReporte) => {
    setIsModalOpen(false);
    setUltimoRegistro(resultado);
    toast.success("Reporte registrado correctamente");
    if (resultado.requiere_cambio_ie) {
      toast.error("Falta muy grave: según el reglamento amerita cambio de I.E. Informe a dirección.");
    } else if (resultado.estado_color === "Rojo") {
      toast.warning("El alumno quedó en estado crítico. Considere derivarlo a psicología.");
    }
    setLoading(true);
    fetchReportes();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* ENCABEZADO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <FileWarning size={28} /> Reportes y Partes
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Registre faltas al Reglamento Interno y revise los últimos reportes colocados.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#701C32] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#5a1628] transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] shadow-lg shadow-[#701C32]/20 shrink-0"
        >
          <Plus size={18} aria-hidden="true" /> Nuevo Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* BANDEJA: ÚLTIMOS REPORTES */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="divide-y divide-gray-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-5 space-y-2">
                    <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
                    <div className="h-3 w-72 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : reportes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#093E7A] flex items-center justify-center mx-auto mb-4">
                <History size={28} aria-hidden="true" />
              </div>
              <h3 className="font-black text-gray-800">Aún no hay reportes registrados</h3>
              <p className="text-sm text-gray-600 mt-1.5 max-w-md mx-auto">
                Cuando registre una falta con el botón "Nuevo Reporte", aparecerá aquí con su
                descuento de puntos y la medida que corresponda.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden surface-in">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                <h3 className="flex items-center gap-2 text-[#093E7A] font-black">
                  <History size={20} aria-hidden="true" /> Últimos reportes
                </h3>
                <span className="text-xs font-bold text-gray-600 tabular-nums">
                  {reportes.length} de {total}
                </span>
              </div>
              <ul className="divide-y divide-gray-50">
                {reportes.map((r) => (
                  <ItemReporte key={r.id_reporte} reporte={r} />
                ))}
              </ul>
              {total > reportes.length && (
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                  <Link
                    href="/campus/campus-auxiliar/reportes/historial"
                    className="text-sm font-bold text-[#701C32] hover:underline inline-flex items-center gap-1"
                  >
                    Ver los {total} reportes en el historial <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL LATERAL */}
        <div className="space-y-6">

          {/* RESULTADO DEL ÚLTIMO REGISTRO */}
          {ultimoRegistro && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 surface-in" aria-live="polite">
              <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                <CheckCircle2 size={13} className="text-emerald-600" aria-hidden="true" /> Reporte registrado
              </h3>
              <p className="font-bold text-gray-800">{ultimoRegistro.alumno}</p>
              <p className="text-sm text-gray-600 mt-0.5">{ultimoRegistro.falta}</p>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Puntaje actual</p>
                  <p className={`text-2xl font-black tabular-nums ${SEMAFORO[ultimoRegistro.estado_color].clase}`}>
                    {ultimoRegistro.puntaje_actual}
                    <span className="text-sm font-bold text-gray-400"> / {escala.maximo}</span>
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 text-xs font-bold ${SEMAFORO[ultimoRegistro.estado_color].clase}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${SEMAFORO[ultimoRegistro.estado_color].punto}`} aria-hidden="true" />
                  {SEMAFORO[ultimoRegistro.estado_color].texto}
                </span>
              </div>
              {ultimoRegistro.requiere_cambio_ie ? (
                <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                  Falta muy grave: el reglamento contempla el cambio de institución educativa.
                  Informe a dirección y al departamento de psicología.
                </p>
              ) : ultimoRegistro.estado_color === "Rojo" && (
                <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" aria-hidden="true" />
                  El alumno está en estado crítico. Considere coordinar una cita con el departamento de psicología.
                </p>
              )}
            </div>
          )}

          {/* SISTEMA DE PUNTOS */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <ClipboardList size={13} aria-hidden="true" /> Sistema de puntos
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Cada alumno empieza <span className="font-bold">cada bimestre</span> con{" "}
              <span className="font-bold">{escala.maximo} puntos</span>, que es la nota de conducta
              que sale en su libreta. Cada reporte descuenta los puntos que fija el reglamento
              para la falta.
            </p>
            <ul className="mt-4 space-y-2.5">
              <li className="flex items-center gap-2.5 text-sm text-gray-700">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" aria-hidden="true" />
                <span><span className="font-bold">{escala.maximo} a {escala.observacion}:</span> buena conducta</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-700">
                <AlertTriangle size={16} className="text-amber-600 shrink-0" aria-hidden="true" />
                <span><span className="font-bold">{escala.observacion - 1} a {escala.critico}:</span> en observación</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-700">
                <AlertCircle size={16} className="text-red-600 shrink-0" aria-hidden="true" />
                <span><span className="font-bold">{escala.critico - 1} a 0:</span> conducta crítica</span>
              </li>
            </ul>
            <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 leading-relaxed">
              Las faltas marcadas con <span className="font-bold text-red-700">Cambio de I.E.</span> ponen
              al alumno en estado crítico de inmediato, sin importar su puntaje. Los alumnos en riesgo
              aparecen en el seguimiento del departamento de psicología.
            </p>
          </div>

          {/* ACCESO AL HISTORIAL COMPLETO */}
          <Link
            href="/campus/campus-auxiliar/reportes/historial"
            className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex items-center gap-4 hover:border-[#701C32]/30 hover:shadow-md transition-all duration-150 active:scale-[0.99]"
          >
            <div className="w-11 h-11 rounded-xl bg-[#FFF1E3] text-[#701C32] flex items-center justify-center shrink-0">
              <History size={22} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-gray-800">Historial de reportes</p>
              <p className="text-xs text-gray-600 mt-0.5">Todos los reportes, con búsqueda por alumno</p>
            </div>
            <ArrowRight size={18} className="ml-auto text-[#701C32] shrink-0 group-hover:translate-x-1 transition-transform duration-150" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <ModalRegistrarReporte
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleReporteRegistrado}
      />
    </div>
  );
}
