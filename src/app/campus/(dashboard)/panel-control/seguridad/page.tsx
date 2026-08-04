"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Loader2, Save, KeyRound, AlertCircle, Info } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";

const SECCION = "seguridad";
const CLAVE = "forzar_cambio_password_inicial";

// El backend interpreta como activado: "1", "true", "si", "sí", "on"
const estaActivo = (valor: string | null) =>
  ["1", "true", "si", "sí", "on"].includes((valor ?? "").trim().toLowerCase());

export default function SeguridadPage() {
  const [valor, setValor] = useState<string>("1");
  const [original, setOriginal] = useState<string>("1");
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/configuracion/${SECCION}`);
      // 404 = la sección aún no existe: se asume activado, que es el valor
      // por defecto que aplica el backend cuando no hay configuración.
      if (res.status === 404) {
        setValor("1");
        setOriginal("1");
        return;
      }
      const data = await res.json();
      const item = Array.isArray(data) ? data.find((i: { clave: string }) => i.clave === CLAVE) : null;
      const v = item?.valor ?? "1";
      setValor(v);
      setOriginal(v);
    } catch {
      toast.error("No se pudo cargar la configuración de seguridad");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const guardar = async () => {
    setGuardando(true);
    try {
      const res = await apiFetch(`/configuracion/${CLAVE}?seccion=${SECCION}`, {
        method: "PUT",
        body: JSON.stringify({ valor }),
      });
      if (!res.ok) throw new Error();
      setOriginal(valor);
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setGuardando(false);
    }
  };

  const activo = estaActivo(valor);
  const hayCambios = valor !== original;

  return (
    <div className="min-h-full bg-[#F2F4F7]">
      <header className="bg-white border-b border-gray-100 px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FFF1E3] text-[#701C32]">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#701C32]">Seguridad de las cuentas</h1>
            <p className="text-gray-500 text-sm">Reglas de acceso al campus virtual</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-14 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-[#701C32]" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2">
                <KeyRound size={16} className="text-[#701C32]" />
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  Contraseña del primer ingreso
                </h2>
              </div>

              <div className="p-6 space-y-5">
                <label className="flex items-start justify-between gap-6 cursor-pointer group">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800">
                      Obligar a cambiar la contraseña en el primer ingreso
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Cuando está activo, todo usuario que aún use la contraseña
                      que le entregó el colegio (su DNI) debe definir una propia
                      antes de poder usar el campus.
                    </p>
                  </div>

                  {/* Interruptor */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={activo}
                    onClick={() => setValor(activo ? "0" : "1")}
                    className={`relative shrink-0 w-14 h-8 rounded-full transition-colors ${
                      activo ? "bg-[#701C32]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        activo ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                <div
                  className={`flex items-start gap-3 rounded-xl p-4 text-sm border ${
                    activo
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  {activo ? <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                          : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                  <p>
                    {activo
                      ? "Activado: los usuarios nuevos definirán su propia contraseña al entrar por primera vez."
                      : "Desactivado: los usuarios podrán seguir usando su DNI como contraseña indefinidamente."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-3">
              <Info size={18} className="text-[#093E7A] shrink-0 mt-0.5" />
              <p className="text-sm text-gray-500">
                Este ajuste no reinicia contraseñas ya cambiadas. Solo afecta a
                las cuentas que todavía conservan la contraseña inicial.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={guardar}
                disabled={!hayCambios || guardando}
                className="inline-flex items-center gap-2 bg-[#093E7A] hover:bg-[#073365] disabled:bg-slate-300 text-white px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#093E7A]/20 disabled:shadow-none"
              >
                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
