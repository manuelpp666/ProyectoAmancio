"use client";

/**
 * Bandeja de "no puedo entrar".
 *
 * Aquí caen los avisos que la gente manda desde el botón de la pantalla de
 * inicio de sesión. Es el otro extremo de ese formulario: allí se escriben,
 * aquí se atienden.
 *
 * LO QUE HAY QUE MIRAR PRIMERO
 *   El aviso de "ese DNI no figura". Casi siempre es un número mal tecleado, y
 *   descartarlo antes de nada ahorra buscar una cuenta que no existe. A quien
 *   la manda no se le dice: el formulario es público y decirle si acertó lo
 *   convertiría en una forma de averiguar quién estudia en el colegio.
 *
 * Y ANTES DE TOCAR NINGUNA CUENTA
 *   Comprobar por teléfono que la persona es quien dice ser. Cualquiera pudo
 *   escribir ese DNI: la solicitud no demuestra nada por sí sola.
 */

import { useCallback, useEffect, useState } from "react";
import {
  LifeBuoy, Loader2, Phone, IdCard, Clock, CheckCircle2, XCircle,
  AlertTriangle, RotateCcw, MapPin,
} from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";

interface Solicitud {
  id_solicitud: number;
  dni: string;
  telefono: string;
  descripcion: string;
  nombre: string | null;
  rol: string | null;
  dni_encontrado: boolean;
  estado: "PENDIENTE" | "ATENDIDA" | "DESCARTADA";
  nota: string | null;
  atendida_por: string | null;
  fecha_atencion: string | null;
  ip: string | null;
  fecha: string | null;
}

type Filtro = "PENDIENTE" | "ATENDIDA" | "DESCARTADA" | "TODAS";

const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: "PENDIENTE", texto: "Pendientes" },
  { valor: "ATENDIDA", texto: "Atendidas" },
  { valor: "DESCARTADA", texto: "Descartadas" },
  { valor: "TODAS", texto: "Todas" },
];

export function SolicitudesAcceso() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [pendientes, setPendientes] = useState(0);
  const [filtro, setFiltro] = useState<Filtro>("PENDIENTE");
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  // Qué solicitud está esperando respuesta del servidor, para no dejar los
  // botones activos y que se cierre dos veces.
  const [ocupada, setOcupada] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams();
      if (filtro !== "TODAS") params.set("estado", filtro);
      const res = await apiFetch(`/seguridad/solicitudes-acceso?${params}`);
      if (!res.ok) throw new Error();
      const datos = await res.json();
      setSolicitudes(datos.solicitudes ?? []);
      setPendientes(datos.pendientes ?? 0);
      setAviso(datos.aviso ?? null);
    } catch {
      // Sin bandeja no se rompe la pantalla: el resto de ajustes de seguridad
      // siguen siendo utilizables.
      setSolicitudes([]);
      setAviso("No se pudieron cargar las solicitudes.");
    } finally {
      setCargando(false);
    }
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const cambiarEstado = async (s: Solicitud, estado: Solicitud["estado"]) => {
    // La nota es opcional a propósito: obligar a escribirla haría que se
    // dejaran solicitudes sin cerrar por no tener ganas de redactar.
    let nota: string | null = null;
    if (estado !== "PENDIENTE") {
      nota = window.prompt(
        estado === "ATENDIDA"
          ? "¿Qué hiciste para resolverlo? (opcional)"
          : "¿Por qué la descartas? (opcional)",
        s.nota ?? ""
      );
      if (nota === null) return;   // pulsó Cancelar
    }

    setOcupada(s.id_solicitud);
    try {
      const res = await apiFetch(`/seguridad/solicitudes-acceso/${s.id_solicitud}`, {
        method: "PATCH",
        body: JSON.stringify({ estado, nota: nota || null }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        estado === "ATENDIDA" ? "Marcada como atendida"
          : estado === "DESCARTADA" ? "Descartada"
            : "Devuelta a pendientes"
      );
      await cargar();
    } catch {
      toast.error("No se pudo actualizar la solicitud");
    } finally {
      setOcupada(null);
    }
  };

  const sinDni = solicitudes.filter((s) => !s.dni_encontrado && s.estado === "PENDIENTE");

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <LifeBuoy size={16} className="text-[#701C32]" />
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
            Solicitudes de acceso
          </h2>
          {pendientes > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-[#701C32] text-white text-[10px] font-black">
              {pendientes} pendiente{pendientes === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              type="button"
              onClick={() => setFiltro(f.valor)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                filtro === f.valor
                  ? "bg-white text-[#701C32] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.texto}
            </button>
          ))}
        </div>
      </div>

      {aviso && (
        <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3 text-sm text-amber-800">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p>{aviso}</p>
        </div>
      )}

      {/* Un DNI que no figura casi siempre es un número mal escrito. */}
      {sinDni.length > 0 && (
        <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">
              {sinDni.length === 1
                ? "Hay una solicitud con un DNI que no figura en el sistema"
                : `Hay ${sinDni.length} solicitudes con un DNI que no figura en el sistema`}
            </p>
            <p className="mt-1 text-amber-800">
              Suele ser una cifra mal tecleada. Llama al teléfono que dejó y
              confirma el número antes de buscar la cuenta.
            </p>
          </div>
        </div>
      )}

      {cargando ? (
        <div className="p-14 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[#701C32]" />
        </div>
      ) : solicitudes.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12 px-6">
          {filtro === "PENDIENTE"
            ? "No hay ninguna solicitud pendiente. Cuando alguien no consiga entrar y lo reporte desde el login, aparecerá aquí."
            : "No hay solicitudes en este estado."}
        </p>
      ) : (
        <div className="p-6 space-y-4">
          {solicitudes.map((s) => (
            <article
              key={s.id_solicitud}
              className={`rounded-xl border p-4 ${
                s.estado === "PENDIENTE"
                  ? "border-gray-200 bg-white"
                  : "border-gray-100 bg-gray-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 font-mono font-bold text-gray-800 text-sm">
                      <IdCard size={15} className="text-gray-300" />
                      {s.dni}
                    </span>
                    {s.dni_encontrado ? (
                      <span className="text-sm text-gray-600">
                        {s.nombre}
                        <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-gray-400">
                          {s.rol}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 rounded px-2 py-0.5">
                        <AlertTriangle size={11} /> DNI no encontrado
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
                    <a
                      href={`tel:+51${s.telefono}`}
                      className="inline-flex items-center gap-1 font-bold text-[#093E7A] hover:underline"
                    >
                      <Phone size={12} /> {s.telefono}
                    </a>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} className="text-gray-300" /> {s.fecha}
                    </span>
                    {s.ip && (
                      <span className="inline-flex items-center gap-1 text-gray-400">
                        <MapPin size={12} className="text-gray-300" /> {s.ip}
                      </span>
                    )}
                  </div>
                </div>

                <Etiqueta estado={s.estado} />
              </div>

              <p className="mt-3 text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3 whitespace-pre-wrap break-words">
                {s.descripcion}
              </p>

              {s.estado !== "PENDIENTE" && (
                <p className="mt-2.5 text-xs text-gray-500">
                  {s.estado === "ATENDIDA" ? "Atendida" : "Descartada"} por{" "}
                  <b className="font-mono">{s.atendida_por ?? "—"}</b>
                  {s.fecha_atencion && ` el ${s.fecha_atencion}`}
                  {s.nota && <> — <i>{s.nota}</i></>}
                </p>
              )}

              <div className="flex gap-2 mt-3.5 flex-wrap">
                {s.estado === "PENDIENTE" ? (
                  <>
                    <button
                      type="button"
                      disabled={ocupada === s.id_solicitud}
                      onClick={() => cambiarEstado(s, "ATENDIDA")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
                    >
                      {ocupada === s.id_solicitud
                        ? <Loader2 size={13} className="animate-spin" />
                        : <CheckCircle2 size={13} />}
                      Marcar como atendida
                    </button>
                    <button
                      type="button"
                      disabled={ocupada === s.id_solicitud}
                      onClick={() => cambiarEstado(s, "DESCARTADA")}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-gray-600 text-xs font-bold transition-colors"
                    >
                      <XCircle size={13} /> Descartar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={ocupada === s.id_solicitud}
                    onClick={() => cambiarEstado(s, "PENDIENTE")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-gray-600 text-xs font-bold transition-colors"
                  >
                    <RotateCcw size={13} /> Devolver a pendientes
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Etiqueta({ estado }: { estado: Solicitud["estado"] }) {
  const estilo = {
    PENDIENTE: "bg-amber-100 text-amber-800",
    ATENDIDA: "bg-emerald-100 text-emerald-800",
    DESCARTADA: "bg-gray-200 text-gray-600",
  }[estado];
  return (
    <span className={`shrink-0 text-[10px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 ${estilo}`}>
      {estado}
    </span>
  );
}
