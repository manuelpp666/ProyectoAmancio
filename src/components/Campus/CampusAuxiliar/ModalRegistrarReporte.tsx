"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { X, Search, User, FileWarning, BookOpen, Loader2, Send } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { nombreAlumno } from "@/src/lib/alumno";
import { AlumnoBusqueda, NivelConducta, ResultadoReporte } from "@/src/interfaces/conducta";

const DESCRIPCION_MIN = 10;
const DESCRIPCION_MAX = 1000;

const colorPuntos = (puntos: number) =>
  puntos >= 15 ? "bg-red-50 text-red-700" : puntos >= 8 ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (resultado: ResultadoReporte) => void;
}

export function ModalRegistrarReporte({ isOpen, onClose, onSuccess }: Props) {
  // Catálogo de faltas (se carga una sola vez)
  const [niveles, setNiveles] = useState<NivelConducta[]>([]);
  const [loadingNiveles, setLoadingNiveles] = useState(true);

  // Búsqueda de alumno
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<AlumnoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<AlumnoBusqueda | null>(null);

  // Formulario: el tipo de falta filtra los subtipos disponibles
  const [idTipo, setIdTipo] = useState("");
  const [idNivel, setIdNivel] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Descarta respuestas de búsqueda que lleguen fuera de orden.
  const busquedaActiva = useRef(0);

  useEffect(() => {
    const fetchNiveles = async () => {
      try {
        const res = await apiFetch("/conducta/niveles-conducta");
        if (res.ok) setNiveles(await res.json());
        else toast.error("No se pudo cargar el catálogo de faltas");
      } catch {
        toast.error("No se pudo cargar el catálogo de faltas");
      } finally {
        setLoadingNiveles(false);
      }
    };
    fetchNiveles();
  }, []);

  // Limpiar el formulario al cerrar
  useEffect(() => {
    if (!isOpen) {
      busquedaActiva.current++;
      setBusqueda("");
      setResultados([]);
      setBuscando(false);
      setAlumnoSeleccionado(null);
      setIdTipo("");
      setIdNivel("");
      setDescripcion("");
    }
  }, [isOpen]);

  // Búsqueda de alumnos con debounce
  useEffect(() => {
    const idBusqueda = ++busquedaActiva.current;
    if (busqueda.trim().length < 3) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/conducta/buscar-alumnos?q=${encodeURIComponent(busqueda.trim())}`);
        if (idBusqueda !== busquedaActiva.current) return;
        if (res.ok) setResultados(await res.json());
      } catch {
        if (idBusqueda === busquedaActiva.current) setResultados([]);
      } finally {
        if (idBusqueda === busquedaActiva.current) setBuscando(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Tipos de falta (los criterios del reglamento), sin repetir
  const tiposFalta = useMemo(() => {
    const vistos = new Map<number, string>();
    niveles.forEach((n) => vistos.set(n.id_tipo_falta, n.tipo_falta));
    return Array.from(vistos, ([id, nombre]) => ({ id, nombre }));
  }, [niveles]);

  // Subtipos del tipo elegido
  const faltasDelTipo = useMemo(
    () => (idTipo ? niveles.filter((n) => String(n.id_tipo_falta) === idTipo) : []),
    [niveles, idTipo]
  );

  const nivelSeleccionado = niveles.find((n) => String(n.id_nivel_conducta) === idNivel) ?? null;

  // Al cambiar el tipo, el subtipo anterior deja de ser válido
  const cambiarTipo = (valor: string) => {
    setIdTipo(valor);
    setIdNivel("");
  };
  const descripcionValida = descripcion.trim().length >= DESCRIPCION_MIN;
  const formValido = !!alumnoSeleccionado && !!nivelSeleccionado && descripcionValida;

  const seleccionarAlumno = (a: AlumnoBusqueda) => {
    setAlumnoSeleccionado(a);
    setBusqueda("");
    setResultados([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValido || enviando) return;
    setEnviando(true);
    try {
      const res = await apiFetch("/conducta/reportes/", {
        method: "POST",
        body: JSON.stringify({
          id_alumno: alumnoSeleccionado!.id_alumno,
          id_nivel_conducta: Number(idNivel),
          descripcion_suceso: descripcion.trim(),
        }),
      });
      if (res.ok) {
        onSuccess(await res.json());
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.detail || "No se pudo registrar el reporte. Revise los datos.");
      }
    } catch {
      toast.error("Error de conexión al registrar el reporte");
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-registrar-reporte"
        className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col modal-in"
      >
        {/* MODAL HEADER */}
        <div className="bg-[#701C32] px-6 py-5 text-white flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <FileWarning size={24} />
            </div>
            <div>
              <h2 id="titulo-registrar-reporte" className="font-black text-lg leading-tight">Nuevo Reporte de Conducta</h2>
              <p className="text-[11px] text-white/70 mt-0.5">El descuento de puntos se aplica según el Reglamento Interno.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="p-2 hover:bg-white/10 rounded-full transition-colors duration-150 mt-0.5">
            <X size={24} />
          </button>
        </div>

        {/* El alto lo marca la tarjeta (max-h-[92vh]); el formulario ocupa lo que
            queda bajo la cabecera y hace scroll dentro. Con max-h-[80vh] propio,
            en pantallas bajas la cabecera más el formulario pasaban del alto de
            la ventana y el final del formulario quedaba fuera. */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar">

          {/* 1. ALUMNO */}
          <div>
            <label htmlFor="buscar-alumno-reporte" className="text-xs font-black text-[#2C3E50] uppercase tracking-wider mb-2 block">
              Alumno reportado
            </label>

            {alumnoSeleccionado ? (
              <div className="bg-[#701C32]/5 p-3 rounded-xl border border-[#701C32]/10 flex items-center gap-3 surface-in">
                <div className="bg-[#701C32] text-white p-2 rounded-lg shrink-0"><User size={16} aria-hidden="true" /></div>
                <div className="min-w-0">
                  <p className="font-bold text-[#701C32] truncate">{nombreAlumno(alumnoSeleccionado)}</p>
                  <p className="text-xs text-gray-600 tabular-nums">DNI {alumnoSeleccionado.dni}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAlumnoSeleccionado(null)}
                  className="ml-auto text-xs font-bold text-gray-500 hover:text-red-600 transition-colors duration-150 shrink-0"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} aria-hidden="true" />
                <input
                  id="buscar-alumno-reporte"
                  type="text"
                  placeholder="Busque por nombre, apellido o DNI (mínimo 3 letras)"
                  autoComplete="off"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#701C32] focus:ring-2 focus:ring-[#701C32]/15 transition-colors duration-150"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
                {buscando && (
                  <Loader2 size={16} className="absolute right-3 top-3.5 animate-spin text-[#701C32]" aria-hidden="true" />
                )}
                {resultados.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 shadow-xl rounded-xl max-h-48 overflow-y-auto custom-scrollbar">
                    {resultados.map((a) => (
                      <button
                        key={a.id_alumno}
                        type="button"
                        onClick={() => seleccionarAlumno(a)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center gap-3 border-b border-gray-100 last:border-0 transition-colors duration-150"
                      >
                        <span className="font-bold text-sm text-gray-800">{a.nombres} {a.apellidos}</span>
                        <span className="text-xs text-gray-500 tabular-nums shrink-0">{a.dni}</span>
                      </button>
                    ))}
                  </div>
                )}
                {!buscando && busqueda.trim().length >= 3 && resultados.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2" aria-live="polite">
                    Sin coincidencias para "{busqueda.trim()}".
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 2. TIPO DE FALTA Y SUBTIPO */}
          <div>
            <label htmlFor="tipo-falta-reporte" className="text-xs font-black text-[#2C3E50] uppercase tracking-wider mb-2 block">
              Tipo de falta
            </label>
            <select
              id="tipo-falta-reporte"
              required
              value={idTipo}
              disabled={loadingNiveles}
              onChange={(e) => cambiarTipo(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#701C32] focus:ring-2 focus:ring-[#701C32]/15 transition-colors duration-150 disabled:opacity-50"
            >
              <option value="">{loadingNiveles ? "Cargando reglamento..." : "Seleccione el tipo de falta"}</option>
              {tiposFalta.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>

            <label htmlFor="subtipo-falta-reporte" className="text-xs font-black text-[#2C3E50] uppercase tracking-wider mb-2 mt-5 block">
              Falta según el reglamento
            </label>
            <select
              id="subtipo-falta-reporte"
              required
              value={idNivel}
              disabled={!idTipo}
              onChange={(e) => setIdNivel(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 outline-none focus:border-[#701C32] focus:ring-2 focus:ring-[#701C32]/15 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {idTipo ? "Seleccione la falta cometida" : "Primero elija el tipo de falta"}
              </option>
              {faltasDelTipo.map((n) => (
                <option key={n.id_nivel_conducta} value={n.id_nivel_conducta}>
                  {n.nombre} (-{n.puntos} pts)
                </option>
              ))}
            </select>

            {nivelSeleccionado && (
              <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 surface-in">
                <div className="flex items-start gap-3">
                  <BookOpen size={16} className="text-gray-500 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-700 leading-relaxed">{nivelSeleccionado.descripcion}</p>
                    <p className="text-[11px] font-bold text-gray-500 mt-1.5 uppercase tracking-wider">{nivelSeleccionado.tipo_falta}</p>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg shrink-0 tabular-nums ${colorPuntos(nivelSeleccionado.puntos)}`}>
                    -{nivelSeleccionado.puntos} pts
                  </span>
                </div>
                {nivelSeleccionado.medida && (
                  <p className={`mt-3 text-xs font-bold rounded-lg px-3 py-2 ${nivelSeleccionado.cambio_ie ? "bg-red-50 text-red-700 border border-red-100" : "bg-slate-100 text-slate-700"}`}>
                    Medida del reglamento: {nivelSeleccionado.medida}
                    {nivelSeleccionado.cambio_ie && ". El alumno pasará a estado crítico de inmediato."}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 3. DESCRIPCIÓN */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <label htmlFor="descripcion-suceso" className="text-xs font-black text-[#2C3E50] uppercase tracking-wider block">
                Descripción de lo ocurrido
              </label>
              <span className="text-[11px] font-bold tabular-nums text-gray-400">
                {descripcion.length}/{DESCRIPCION_MAX}
              </span>
            </div>
            <textarea
              id="descripcion-suceso"
              required
              rows={4}
              maxLength={DESCRIPCION_MAX}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalle qué ocurrió, dónde y cuándo. El alumno y el departamento de psicología verán este texto."
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#701C32] focus:ring-2 focus:ring-[#701C32]/15 transition-colors duration-150 resize-none"
            />
            {descripcion.length > 0 && !descripcionValida && (
              <p className="text-xs text-amber-700 mt-1.5" aria-live="polite">
                La descripción debe tener al menos {DESCRIPCION_MIN} caracteres.
              </p>
            )}
          </div>

          {/* ACCIONES */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formValido || enviando}
              className="flex-[2] bg-[#701C32] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#5a1628] transition-[background-color,transform] duration-150 ease-out active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {enviando ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
              {enviando ? "Registrando..." : "Registrar Reporte"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
