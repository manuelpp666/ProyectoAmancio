"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, History, Search, Loader2, SearchX, Trash2 } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { ItemReporte } from "@/src/components/Campus/CampusAuxiliar/ItemReporte";
import { ItemReporteEliminado } from "@/src/components/Campus/CampusAuxiliar/ItemReporteEliminado";
import { ModalEditarReporte } from "@/src/components/Campus/CampusAuxiliar/ModalEditarReporte";
import { ModalEliminarReporte } from "@/src/components/Campus/CampusAuxiliar/ModalEliminarReporte";
import {
  ReporteEliminado,
  ReporteReciente,
  RespuestaReportes,
  RespuestaReportesEliminados,
  ResultadoReporte,
} from "@/src/interfaces/conducta";

const POR_PAGINA = 15;
// Los borrados son la excepción, no la norma: se listan de diez en diez para
// que la sección no empuje el historial normal fuera de la pantalla.
const POR_PAGINA_ELIMINADOS = 10;
const BUSQUEDA_MIN = 3;

export default function HistorialReportesPage() {
  const [busqueda, setBusqueda] = useState("");
  const [reportes, setReportes] = useState<ReporteReciente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [reporteEditar, setReporteEditar] = useState<ReporteReciente | null>(null);
  const [reporteEliminar, setReporteEliminar] = useState<ReporteReciente | null>(null);

  const [eliminados, setEliminados] = useState<ReporteEliminado[]>([]);
  const [totalEliminados, setTotalEliminados] = useState(0);
  const [loadingEliminados, setLoadingEliminados] = useState(true);
  const [cargandoMasEliminados, setCargandoMasEliminados] = useState(false);

  // Descarta respuestas que lleguen fuera de orden al cambiar la búsqueda.
  const peticionActiva = useRef(0);
  const peticionEliminados = useRef(0);

  // El término solo filtra a partir de 3 letras; debajo de eso se lista todo.
  const termino = busqueda.trim().length >= BUSQUEDA_MIN ? busqueda.trim() : "";

  const construirUrl = useCallback(
    (offset: number) => {
      const params = new URLSearchParams({ limit: String(POR_PAGINA), offset: String(offset) });
      if (termino) params.set("q", termino);
      return `/conducta/reportes/?${params.toString()}`;
    },
    [termino]
  );

  const cargarPrimeraPagina = useCallback(async () => {
    const idPeticion = ++peticionActiva.current;
    setLoading(true);
    try {
      const res = await apiFetch(construirUrl(0));
      if (idPeticion !== peticionActiva.current) return;
      if (res.ok) {
        const data: RespuestaReportes = await res.json();
        setReportes(data.items);
        setTotal(data.total);
      } else {
        setReportes([]);
        setTotal(0);
        toast.error("No se pudo cargar el historial de reportes");
      }
    } catch {
      if (idPeticion !== peticionActiva.current) return;
      setReportes([]);
      setTotal(0);
      toast.error("Error de conexión al cargar el historial");
    } finally {
      if (idPeticion === peticionActiva.current) setLoading(false);
    }
  }, [construirUrl]);

  // --- historial de eliminados -------------------------------------------
  // Mismo buscador que la lista de arriba: al escribir un alumno se filtran
  // las dos, que es lo que espera quien busca "qué pasó con este alumno".

  const urlEliminados = useCallback(
    (offset: number) => {
      const params = new URLSearchParams({
        limit: String(POR_PAGINA_ELIMINADOS),
        offset: String(offset),
      });
      if (termino) params.set("q", termino);
      return `/conducta/reportes/eliminados?${params.toString()}`;
    },
    [termino]
  );

  const cargarEliminados = useCallback(async () => {
    const idPeticion = ++peticionEliminados.current;
    setLoadingEliminados(true);
    try {
      const res = await apiFetch(urlEliminados(0));
      if (idPeticion !== peticionEliminados.current) return;
      if (res.ok) {
        const data: RespuestaReportesEliminados = await res.json();
        setEliminados(data.items);
        setTotalEliminados(data.total);
      } else {
        setEliminados([]);
        setTotalEliminados(0);
      }
    } catch {
      if (idPeticion !== peticionEliminados.current) return;
      setEliminados([]);
      setTotalEliminados(0);
      // Sin toast: si se cayó la red, el historial de arriba ya avisó, y dos
      // avisos seguidos por el mismo corte solo estorban.
    } finally {
      if (idPeticion === peticionEliminados.current) setLoadingEliminados(false);
    }
  }, [urlEliminados]);

  // Primera página: se recarga al cambiar la búsqueda (con debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      cargarPrimeraPagina();
      cargarEliminados();
    }, termino ? 400 : 0);

    return () => clearTimeout(timer);
  }, [cargarPrimeraPagina, cargarEliminados, termino]);

  const cargarMasEliminados = async () => {
    const idPeticion = peticionEliminados.current;
    setCargandoMasEliminados(true);
    try {
      const res = await apiFetch(urlEliminados(eliminados.length));
      if (idPeticion !== peticionEliminados.current) return;
      if (res.ok) {
        const data: RespuestaReportesEliminados = await res.json();
        setEliminados((prev) => [...prev, ...data.items]);
        setTotalEliminados(data.total);
      } else {
        toast.error("No se pudieron cargar más reportes eliminados");
      }
    } catch {
      toast.error("Error de conexión al cargar más reportes eliminados");
    } finally {
      if (idPeticion === peticionEliminados.current) setCargandoMasEliminados(false);
    }
  };

  const handleReporteActualizado = (resultado: ResultadoReporte) => {
    setReporteEditar(null);
    toast.success(`Reporte actualizado. Nota de conducta recalculada a ${resultado.puntaje_actual} pts`);
    cargarPrimeraPagina();
  };

  const handleReporteEliminado = () => {
    setReporteEliminar(null);
    toast.success("Reporte eliminado y nota de conducta recalculada correctamente");
    cargarPrimeraPagina();
    cargarEliminados(); // el reporte acaba de pasar a la lista de abajo
  };

  const cargarMas = async () => {
    const idPeticion = peticionActiva.current;
    setCargandoMas(true);
    try {
      const res = await apiFetch(construirUrl(reportes.length));
      if (idPeticion !== peticionActiva.current) return;
      if (res.ok) {
        const data: RespuestaReportes = await res.json();
        setReportes((prev) => [...prev, ...data.items]);
        setTotal(data.total);
      } else {
        toast.error("No se pudieron cargar más reportes");
      }
    } catch {
      toast.error("Error de conexión al cargar más reportes");
    } finally {
      if (idPeticion === peticionActiva.current) setCargandoMas(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <Link
        href="/campus/campus-auxiliar/reportes"
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#701C32] w-fit transition-colors duration-150"
      >
        <ArrowLeft size={16} aria-hidden="true" /> Volver a Reportes y Partes
      </Link>

      {/* ENCABEZADO */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <History size={28} /> Historial de Reportes
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Todos los reportes de conducta registrados, del más reciente al más antiguo.
          </p>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <label htmlFor="buscar-reportes" className="sr-only">Buscar reportes por alumno</label>
          <Search className="absolute left-3 top-3 text-gray-400" size={18} aria-hidden="true" />
          <input
            id="buscar-reportes"
            type="text"
            placeholder="Buscar por alumno o DNI..."
            autoComplete="off"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors duration-150"
          />
          {loading && busqueda.length > 0 && (
            <Loader2 size={16} className="absolute right-3 top-3.5 animate-spin text-[#093E7A]" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* LISTADO */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 space-y-2">
                <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-72 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : reportes.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-16 text-center surface-in">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center mx-auto mb-4">
            {termino ? <SearchX size={28} aria-hidden="true" /> : <History size={28} aria-hidden="true" />}
          </div>
          {termino ? (
            <>
              <h3 className="font-black text-gray-800">Sin reportes para "{termino}"</h3>
              <p className="text-sm text-gray-600 mt-1.5">
                Revise el nombre o el DNI, o borre la búsqueda para ver todos los reportes.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-black text-gray-800">Aún no hay reportes registrados</h3>
              <p className="text-sm text-gray-600 mt-1.5">
                Los reportes que registre en Reportes y Partes aparecerán aquí.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden surface-in">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
            <h3 className="flex items-center gap-2 text-[#093E7A] font-black" aria-live="polite">
              {termino ? `Resultados para "${termino}"` : "Todos los reportes"}
            </h3>
            <span className="text-xs font-bold text-gray-600 tabular-nums">
              Mostrando {reportes.length} de {total}
            </span>
          </div>

          <ul className="divide-y divide-gray-50">
            {reportes.map((r) => (
              <ItemReporte
                key={r.id_reporte}
                reporte={r}
                mostrarDni
                onEditar={(rep) => setReporteEditar(rep)}
                onEliminar={(rep) => setReporteEliminar(rep)}
              />
            ))}
          </ul>

          {reportes.length < total && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
              <button
                onClick={cargarMas}
                disabled={cargandoMas}
                className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:border-[#701C32]/30 hover:text-[#701C32] transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
              >
                {cargandoMas && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {cargandoMas ? "Cargando..." : "Mostrar más reportes"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* HISTORIAL DE ELIMINADOS
          Va debajo del historial normal y con su propio contador. Un reporte
          borrado le devuelve puntos de conducta al alumno, así que queda aquí
          con el motivo, quién lo borró y cuándo. */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 bg-[#701C32]/5">
          <h3 className="flex items-center gap-2 text-[#701C32] font-black">
            <Trash2 size={18} aria-hidden="true" />
            Reportes eliminados
          </h3>
          {!loadingEliminados && totalEliminados > 0 && (
            <span className="text-xs font-bold text-gray-600 tabular-nums" aria-live="polite">
              Mostrando {eliminados.length} de {totalEliminados}
            </span>
          )}
        </div>

        {loadingEliminados ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-5 space-y-2">
                <div className="h-4 w-52 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-64 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : eliminados.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-600">
              {termino
                ? `No hay reportes eliminados de "${termino}".`
                : "Todavía no se ha eliminado ningún reporte."}
            </p>
            {!termino && (
              <p className="text-xs text-gray-400 mt-1">
                Los que se eliminen aparecerán aquí con su motivo.
              </p>
            )}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-50">
              {eliminados.map((e) => (
                <ItemReporteEliminado key={e.id_eliminado} reporte={e} mostrarDni />
              ))}
            </ul>

            {eliminados.length < totalEliminados && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                <button
                  onClick={cargarMasEliminados}
                  disabled={cargandoMasEliminados}
                  className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:border-[#701C32]/30 hover:text-[#701C32] transition-[color,border-color,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-60"
                >
                  {cargandoMasEliminados && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                  {cargandoMasEliminados ? "Cargando..." : "Mostrar más eliminados"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ModalEditarReporte
        isOpen={!!reporteEditar}
        reporte={reporteEditar}
        onClose={() => setReporteEditar(null)}
        onSuccess={handleReporteActualizado}
      />

      <ModalEliminarReporte
        isOpen={!!reporteEliminar}
        reporte={reporteEliminar}
        onClose={() => setReporteEliminar(null)}
        onSuccess={handleReporteEliminado}
      />
    </div>
  );
}
