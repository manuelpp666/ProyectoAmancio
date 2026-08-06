"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldCheck, Loader2, Save, KeyRound, AlertCircle, Info, Mail } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
import { toast } from "sonner";

const SECCION = "seguridad";
const CLAVE_PASSWORD = "forzar_cambio_password_inicial";
const CLAVE_CORREO = "exigir_correo_primer_ingreso";

// El backend interpreta como activado: "1", "true", "si", "sí", "on"
const estaActivo = (valor: string | null) =>
  ["1", "true", "si", "sí", "on"].includes((valor ?? "").trim().toLowerCase());

export default function SeguridadPage() {
  // Cada interruptor guarda su valor y el que tenía al cargar, para saber
  // qué hay que mandar al servidor.
  const [valores, setValores] = useState<Record<string, string>>({
    [CLAVE_PASSWORD]: "1",
    [CLAVE_CORREO]: "1",
  });
  const [originales, setOriginales] = useState<Record<string, string>>({
    [CLAVE_PASSWORD]: "1",
    [CLAVE_CORREO]: "1",
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/configuracion/${SECCION}`);
      // 404 = la sección aún no existe: se asume activado, que es el valor
      // por defecto que aplica el backend cuando no hay configuración.
      if (res.status === 404) return;

      const data = await res.json();
      const lista: { clave: string; valor: string }[] = Array.isArray(data) ? data : [];
      const leidos: Record<string, string> = {};
      for (const clave of [CLAVE_PASSWORD, CLAVE_CORREO]) {
        leidos[clave] = lista.find((i) => i.clave === clave)?.valor ?? "1";
      }
      setValores(leidos);
      setOriginales(leidos);
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
      // Solo se envían los interruptores que cambiaron
      const pendientes = [CLAVE_PASSWORD, CLAVE_CORREO].filter(
        (c) => valores[c] !== originales[c]
      );
      for (const clave of pendientes) {
        const res = await apiFetch(`/configuracion/${clave}?seccion=${SECCION}`, {
          method: "PUT",
          body: JSON.stringify({ valor: valores[clave] }),
        });
        if (!res.ok) throw new Error();
      }
      setOriginales({ ...valores });
      toast.success("Configuración guardada");
    } catch {
      toast.error("No se pudo guardar la configuración");
    } finally {
      setGuardando(false);
    }
  };

  const alternar = (clave: string) =>
    setValores((v) => ({ ...v, [clave]: estaActivo(v[clave]) ? "0" : "1" }));

  const activo = estaActivo(valores[CLAVE_PASSWORD]);
  const activoCorreo = estaActivo(valores[CLAVE_CORREO]);
  const hayCambios = [CLAVE_PASSWORD, CLAVE_CORREO].some((c) => valores[c] !== originales[c]);

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
                    onClick={() => alternar(CLAVE_PASSWORD)}
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

            {/* CORREO DE CONTACTO */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex items-center gap-2">
                <Mail size={16} className="text-[#701C32]" />
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">
                  Correo del primer ingreso
                </h2>
              </div>

              <div className="p-6 space-y-5">
                <label className="flex items-start justify-between gap-6 cursor-pointer group">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800">
                      Pedir un correo de contacto en el primer ingreso
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Junto con la contraseña, se le pide un correo a quien todavía
                      no tenga uno registrado. Al alumno se le pide el de sus padres
                      o apoderado, advirtiéndole que debe ser uno al que tengan
                      acceso. A quien ya tiene correo no se le pregunta nada.
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={activoCorreo}
                    onClick={() => alternar(CLAVE_CORREO)}
                    className={`relative shrink-0 w-14 h-8 rounded-full transition-colors ${
                      activoCorreo ? "bg-[#701C32]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                        activoCorreo ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </label>

                <div
                  className={`flex items-start gap-3 rounded-xl p-4 text-sm border ${
                    activoCorreo
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}
                >
                  {activoCorreo ? <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                                : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                  <p>
                    {activoCorreo
                      ? "Activado: es la vía por la que el colegio va reuniendo los correos de los apoderados, que hoy es lo único que impide enviar los avisos de asistencia."
                      : "Desactivado: no se pedirá ningún correo, y los avisos por correo solo llegarán a quienes ya tengan uno cargado."}
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
