"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { X, FileEdit, BookOpen, Loader2, Save, User } from "lucide-react";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { NivelConducta, ReporteReciente, ResultadoReporte } from "@/src/interfaces/conducta";

const DESCRIPCION_MIN = 10;
const DESCRIPCION_MAX = 1000;

const colorPuntos = (puntos: number) =>
  puntos >= 15 ? "bg-red-50 text-red-700" : puntos >= 8 ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700";

interface Props {
  isOpen: boolean;
  reporte: ReporteReciente | null;
  onClose: () => void;
  onSuccess: (resultado: ResultadoReporte) => void;
}

export function ModalEditarReporte({ isOpen, reporte, onClose, onSuccess }: Props) {
  const [niveles, setNiveles] = useState<NivelConducta[]>([]);
  const [loadingNiveles, setLoadingNiveles] = useState(true);

  const [idTipo, setIdTipo] = useState("");
  const [idNivel, setIdNivel] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [guardando, setGuardando] = useState(false);

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
    if (isOpen) {
      fetchNiveles();
    }
  }, [isOpen]);

  // Inicializar los datos del reporte seleccionado
  useEffect(() => {
    if (isOpen && reporte) {
      setDescripcion(reporte.descripcion || "");

      if (niveles.length > 0) {
        let nivelEncontrado = niveles.find((n) => n.id_nivel_conducta === reporte.id_nivel_conducta);
        if (!nivelEncontrado && reporte.falta) {
          nivelEncontrado = niveles.find((n) => n.nombre === reporte.falta);
        }

        if (nivelEncontrado) {
          setIdTipo(String(nivelEncontrado.id_tipo_falta));
          setIdNivel(String(nivelEncontrado.id_nivel_conducta));
        } else if (reporte.id_tipo_falta) {
          setIdTipo(String(reporte.id_tipo_falta));
          setIdNivel(String(reporte.id_nivel_conducta || ""));
        }
      }
    }
  }, [isOpen, reporte, niveles]);

  // Tipos de falta (categorías), sin duplicados
  const tiposFalta = useMemo(() => {
    const vistos = new Map<number, string>();
    niveles.forEach((n) => vistos.set(n.id_tipo_falta, n.tipo_falta));
    return Array.from(vistos, ([id, nombre]) => ({ id, nombre }));
  }, [niveles]);

  // Subtipos de falta filtrados por la categoría seleccionada
  const faltasDisponibles = useMemo(() => {
    if (!idTipo) return [];
    return niveles.filter((n) => n.id_tipo_falta === Number(idTipo));
  }, [niveles, idTipo]);

  const nivelSeleccionado = useMemo(
    () => niveles.find((n) => n.id_nivel_conducta === Number(idNivel)),
    [niveles, idNivel]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporte) return;

    if (!idNivel) {
      toast.error("Seleccione el tipo de falta cometida");
      return;
    }
    const desc = descripcion.trim();
    if (desc.length < DESCRIPCION_MIN) {
      toast.error(`La descripción debe tener al menos ${DESCRIPCION_MIN} caracteres`);
      return;
    }

    setGuardando(true);
    try {
      const res = await apiFetch(`/conducta/reportes/${reporte.id_reporte}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_nivel_conducta: Number(idNivel),
          descripcion_suceso: desc,
        }),
      });

      if (res.ok) {
        const resultado: ResultadoReporte = await res.json();
        onSuccess(resultado);
      } else {
        toast.error(await mensajeDeError(res, "No se pudo actualizar el reporte"));
      }
    } catch {
      toast.error("Error de conexión al actualizar el reporte");
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen || !reporte) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-editar-reporte"
      >
        {/* CABECERA */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#093E7A] flex items-center justify-center shrink-0">
              <FileEdit size={20} aria-hidden="true" />
            </div>
            <div>
              <h3 id="titulo-modal-editar-reporte" className="text-lg font-black text-[#093E7A]">
                Editar Reporte de Conducta
              </h3>
              <p className="text-xs text-gray-500">
                Modifique la falta o los detalles. La nota de conducta se actualizará automáticamente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={guardando}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Cerrar ventana"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* CONTENIDO FORMULARIO */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-5 space-y-5 pr-1">
          {/* INFORMACIÓN DEL ALUMNO (SOLO LECTURA) */}
          <div className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#701C32] font-black shrink-0">
                <User size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estudiante</p>
                <p className="font-bold text-gray-800 text-sm truncate">{reporte.alumno}</p>
              </div>
            </div>
            {reporte.dni && (
              <span className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-2.5 py-1 rounded-lg shrink-0">
                DNI {reporte.dni}
              </span>
            )}
          </div>

          {/* CLASIFICACIÓN DE LA FALTA */}
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-tipo-falta" className="block text-xs font-bold text-gray-700 mb-1.5">
                1. Tipo de Falta (Categoría)
              </label>
              {loadingNiveles ? (
                <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
              ) : (
                <select
                  id="edit-tipo-falta"
                  value={idTipo}
                  onChange={(e) => {
                    setIdTipo(e.target.value);
                    setIdNivel("");
                  }}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 transition-colors"
                >
                  <option value="">-- Seleccione una categoría --</option>
                  {tiposFalta.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="edit-falta-especifica" className="block text-xs font-bold text-gray-700 mb-1.5">
                2. Falta cometida (según Reglamento Interno)
              </label>
              <select
                id="edit-falta-especifica"
                value={idNivel}
                onChange={(e) => setIdNivel(e.target.value)}
                disabled={!idTipo || loadingNiveles}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <option value="">
                  {!idTipo ? "-- Primero elija un tipo de falta --" : "-- Seleccione la falta específica --"}
                </option>
                {faltasDisponibles.map((n) => (
                  <option key={n.id_nivel_conducta} value={n.id_nivel_conducta}>
                    {n.nombre} ({n.puntos} pts)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FICHA DE SANCIÓN DE LA FALTA SELECCIONADA */}
          {nivelSeleccionado && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 surface-in">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen size={12} aria-hidden="true" /> Sanción del reglamento
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${colorPuntos(nivelSeleccionado.puntos)}`}>
                  Descuenta {nivelSeleccionado.puntos} {nivelSeleccionado.puntos === 1 ? "punto" : "puntos"}
                </span>
              </div>
              {nivelSeleccionado.medida && (
                <p className="text-xs font-medium text-gray-700">
                  <span className="font-bold">Medida:</span> {nivelSeleccionado.medida}
                </p>
              )}
              {nivelSeleccionado.cambio_ie && (
                <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-xl p-2.5 mt-1">
                  ⚠️ Esta falta amerita cambio de I.E. según el reglamento.
                </p>
              )}
            </div>
          )}

          {/* DETALLES DEL SUCESO */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="edit-descripcion-reporte" className="text-xs font-bold text-gray-700">
                3. Detalles del suceso
              </label>
              <span className="text-[11px] text-gray-400 tabular-nums">
                {descripcion.length} / {DESCRIPCION_MAX}
              </span>
            </div>
            <textarea
              id="edit-descripcion-reporte"
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.slice(0, DESCRIPCION_MAX))}
              placeholder="Describa objetivamente lo ocurrido, hora y lugar..."
              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-[#093E7A] focus:ring-2 focus:ring-[#093E7A]/15 resize-none transition-colors"
            />
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3 pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !idNivel || descripcion.trim().length < DESCRIPCION_MIN}
              className="bg-[#701C32] text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#5a1628] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#701C32]/20"
            >
              {guardando ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={16} aria-hidden="true" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
