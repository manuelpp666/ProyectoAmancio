"use client";

/**
 * Registro de accesos al campus.
 *
 * Existe por un incidente concreto: alguien entró a una cuenta de
 * administrador y mandó un mensaje desde ella, y no hubo manera de saber
 * cuándo ni desde dónde, porque no se guardaba nada. Esta pantalla contesta
 * las tres preguntas que uno se hace entonces: quién ha entrado a mi cuenta,
 * desde qué sitios, y si antes alguien estuvo probando contraseñas.
 *
 * La señal más útil es la de arriba: una cuenta de administrador que ha
 * entrado desde varias IPs distintas. Si tú siempre entras desde el colegio y
 * aparecen dos, la segunda no eres tú.
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, History, MapPin, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/src/lib/api";

interface Acceso {
  id_intento: number;
  username: string;
  rol: string | null;
  exito: boolean;
  motivo: string | null;
  ip: string | null;
  user_agent: string | null;
  fecha: string | null;
}

interface Resumen {
  aciertos: number;
  fallos: number;
  cuentas_mas_tanteadas: { username: string; fallos: number }[];
  admins_por_ip: { username: string; ips_distintas: number; entradas: number }[];
}

const MOTIVOS: Record<string, string> = {
  USUARIO_NO_EXISTE: "Ese usuario no existe",
  PASSWORD_INCORRECTA: "Contraseña incorrecta",
  CUENTA_DESACTIVADA: "Cuenta desactivada",
  BLOQUEADO: "Bloqueado por intentos",
};

export function RegistroAccesos() {
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [dias, setDias] = useState(7);
  const [filtro, setFiltro] = useState<"todos" | "aciertos" | "fallos">("todos");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ dias: String(dias) });
      if (filtro === "fallos") params.set("solo_fallos", "true");
      if (filtro === "aciertos") params.set("solo_aciertos", "true");

      const [rA, rR] = await Promise.all([
        apiFetch(`/seguridad/accesos?${params}`),
        apiFetch(`/seguridad/resumen?dias=${dias}`),
      ]);
      if (rA.ok) setAccesos((await rA.json()).accesos ?? []);
      if (rR.ok) setResumen(await rR.json());
    } catch {
      // Sin registro que mostrar no se rompe la pantalla: el resto de ajustes
      // de seguridad siguen siendo utilizables.
    } finally {
      setCargando(false);
    }
  }, [dias, filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const sospechosos = (resumen?.admins_por_ip ?? []).filter((a) => a.ips_distintas > 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <History size={16} className="text-[#701C32]" />
          <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
            Registro de accesos
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as typeof filtro)}
            className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
          >
            <option value="todos">Todos</option>
            <option value="aciertos">Solo entradas</option>
            <option value="fallos">Solo fallos</option>
          </select>
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="text-xs font-bold border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
          >
            <option value={1}>Hoy</option>
            <option value={7}>7 días</option>
            <option value={30}>30 días</option>
            <option value={90}>90 días</option>
          </select>
        </div>
      </div>

      {/* AVISO: un administrador que entra desde varios sitios */}
      {sospechosos.length > 0 && (
        <div className="mx-6 mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">
              Hay administradores que entraron desde más de un sitio
            </p>
            <ul className="mt-1 space-y-0.5 text-amber-800">
              {sospechosos.map((a) => (
                <li key={a.username}>
                  <span className="font-mono font-bold">{a.username}</span>{" "}
                  — {a.entradas} entradas desde {a.ips_distintas} direcciones distintas
                </li>
              ))}
            </ul>
            <p className="mt-2 text-amber-700 text-xs">
              Puede ser normal (casa y colegio, o datos del móvil). Si no
              reconoces alguna, cambia la contraseña de esa cuenta.
            </p>
          </div>
        </div>
      )}

      {cargando ? (
        <div className="p-14 text-center">
          <Loader2 size={28} className="animate-spin mx-auto text-[#701C32]" />
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {resumen && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-black text-emerald-600">{resumen.aciertos}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  Entradas correctas
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-black text-red-600">{resumen.fallos}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  Intentos fallidos
                </p>
              </div>
            </div>
          )}

          {accesos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No hay accesos registrados en este periodo. El registro empieza a
              llenarse desde que se activó: lo anterior no quedó guardado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Usuario</th>
                    <th className="py-2 pr-3">Resultado</th>
                    <th className="py-2 pr-3">Desde</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accesos.map((a) => (
                    <tr key={a.id_intento} className="hover:bg-gray-50/60">
                      <td className="py-2.5 pr-3 whitespace-nowrap text-gray-500 text-xs">
                        {a.fecha}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs font-bold text-gray-800">
                        {a.username}
                        {a.rol && (
                          <span className="ml-2 font-sans font-medium text-[10px] text-gray-400">
                            {a.rol}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {a.exito ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                            <CheckCircle2 size={13} /> Entró
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-bold text-xs">
                            <XCircle size={13} />
                            {MOTIVOS[a.motivo ?? ""] ?? "Falló"}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} className="text-gray-300" />
                          {a.ip ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(resumen?.cuentas_mas_tanteadas?.length ?? 0) > 0 && (
            <div className="pt-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Cuentas con más fallos
              </p>
              <div className="flex flex-wrap gap-2">
                {resumen!.cuentas_mas_tanteadas.map((c) => (
                  <span key={c.username}
                        className="text-xs font-mono bg-gray-100 text-gray-700 rounded-lg px-2.5 py-1">
                    {c.username} · {c.fallos}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
