"use client";
import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/src/context/userContext";
import { Lock, Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle, ArrowLeft, ShieldAlert, Mail } from 'lucide-react';
import { useRouter } from "next/navigation";
import { apiFetch } from "@/src/lib/api";

interface FastApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// Lo que le falta a la cuenta para poder entrar al campus
interface EstadoPrimerIngreso {
  debe_cambiar_password: boolean;
  debe_registrar_correo: boolean;
  es_alumno: boolean;
  email_actual: string | null;
}

// Ruta de inicio según el rol del usuario
const homePorRol = (rol: string | null): string => {
  switch (rol) {
    case "ADMIN": return "/campus/panel-control";
    case "DOCENTE": return "/campus/campus-docente/inicio-docente";
    case "ALUMNO": return "/campus/campus-estudiante/inicio-campus";
    case "PSICOLOGO": return "/campus/campus-psicologo";
    case "AUXILIAR": return "/campus/campus-auxiliar/inicio";
    default: return "/campus";
  }
};

export default function SecurityPage() {
  const router = useRouter();
  const { username, role, loading: authLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [formData, setFormData] = useState({ current: "", new: "", confirm: "", email: "", emailConfirm: "" });
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Modo "primer ingreso": el usuario llega aquí obligado tras iniciar sesión.
  // useSearchParams exigiría un <Suspense> alrededor de toda la página, así que
  // el parámetro se lee del navegador una sola vez al montar.
  const [esPrimerIngreso, setEsPrimerIngreso] = useState(false);
  const [estado, setEstado] = useState<EstadoPrimerIngreso | null>(null);
  const [cargandoEstado, setCargandoEstado] = useState(true);

  // Qué se pide en esta pantalla. Fuera del primer ingreso siempre es el
  // cambio de contraseña; dentro, solo lo que la cuenta tenga pendiente.
  const pideCorreo = esPrimerIngreso && estado?.debe_registrar_correo === true;
  const pidePassword = !esPrimerIngreso || estado?.debe_cambiar_password !== false;
  const esAlumno = estado?.es_alumno ?? role === "ALUMNO";

  const cargarEstado = useCallback(async () => {
    setCargandoEstado(true);
    try {
      const res = await apiFetch("/perfil/auth/primer-ingreso");
      if (res.ok) setEstado(await res.json());
    } catch {
      // Si no se puede consultar, la pantalla se comporta como el cambio de
      // contraseña de siempre en vez de dejar al usuario bloqueado.
    } finally {
      setCargandoEstado(false);
    }
  }, []);

  useEffect(() => {
    setEsPrimerIngreso(new URLSearchParams(window.location.search).get("inicial") === "1");
  }, []);

  // Cualquier rol puede cambiar SU propia contraseña; el backend ya impide
  // tocar la de otro usuario. Solo se exige tener sesión iniciada.
  useEffect(() => {
    if (authLoading) return;
    if (!role) {
      router.replace("/campus");
      return;
    }
    cargarEstado();
  }, [authLoading, role, router, cargarEstado]);

  const handleBack = () => {
    router.push(homePorRol(role));
  };

  // Lógica de fuerza de contraseña
  const getStrength = () => {
    if (formData.new.length === 0) return { width: '0%', color: 'bg-gray-200', label: 'Vacío' };
    if (formData.new.length < 6) return { width: '33%', color: 'bg-red-500', label: 'Débil' };
    if (formData.new.length < 10) return { width: '66%', color: 'bg-amber-500', label: 'Media' };
    return { width: '100%', color: 'bg-emerald-500', label: 'Fuerte' };
  };

  const strength = getStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (pidePassword) {
      if (formData.new !== formData.confirm) {
        setStatus({ type: 'error', msg: 'Las contraseñas nuevas no coinciden' });
        return;
      }
      // Validación local de longitud (para evitar el 422 del back)
      if (formData.new.length < 8) {
        setStatus({ type: 'error', msg: 'La nueva contraseña debe tener al menos 8 caracteres' });
        return;
      }
    }

    if (pideCorreo) {
      if (formData.email.trim().toLowerCase() !== formData.emailConfirm.trim().toLowerCase()) {
        setStatus({ type: 'error', msg: 'Los correos no coinciden' });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setStatus({ type: 'error', msg: 'Escribe un correo válido (ejemplo: nombre@gmail.com)' });
        return;
      }
    }

    setLoading(true);
    try {
      // El correo va primero: si la contraseña cambiara antes y el correo
      // fallara, el usuario volvería con una clave nueva y el correo pendiente.
      if (pideCorreo) {
        const resCorreo = await apiFetch("/perfil/auth/registrar-correo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email.trim() }),
        });
        if (!resCorreo.ok) {
          setStatus({ type: 'error', msg: await extraerError(resCorreo, "No se pudo registrar el correo") });
          setLoading(false);
          return;
        }
      }

      if (pidePassword) {
        const res = await apiFetch(`/perfil/auth/change-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            current_password: formData.current,
            new_password: formData.new
          }),
        });

        if (!res.ok) {
          setStatus({ type: 'error', msg: await extraerError(res, "Error al actualizar") });
          setLoading(false);
          return;
        }
      }

      setStatus({
        type: 'success',
        msg: pidePassword && pideCorreo ? 'Contraseña y correo registrados correctamente'
          : pideCorreo ? 'Correo registrado correctamente'
          : 'Contraseña actualizada correctamente',
      });
      setFormData({ current: "", new: "", confirm: "", email: "", emailConfirm: "" });

      if (esPrimerIngreso) {
        setTimeout(() => router.replace(homePorRol(role)), 1200);
      }
    } catch {
      setStatus({ type: 'error', msg: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  // Mientras verificamos la sesión no mostramos el formulario
  if (authLoading || !role || cargandoEstado) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-[#093E7A]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* En el primer ingreso no se ofrece salida: debe completar lo pedido */}
        {!esPrimerIngreso && (
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#093E7A] transition-colors"
          >
            <ArrowLeft size={18} /> Volver
          </button>
        )}

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

        {esPrimerIngreso ? (
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-[#FFF1E3] rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="text-[#701C32]" size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-800">
              {pidePassword && pideCorreo ? "Completa tu primer ingreso"
                : pideCorreo ? "Registra tu correo"
                : "Cambia tu contraseña"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm">
              {pidePassword
                ? "Estás usando la contraseña inicial que te entregó el colegio. Por seguridad, define una propia antes de continuar."
                : "Necesitamos un correo para poder enviarte los avisos del colegio."}
            </p>
            {pidePassword && (
              <p className="text-gray-400 mt-2 text-xs">
                Tu contraseña actual es tu número de DNI.
              </p>
            )}
          </div>
        ) : (
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-[#093E7A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-[#093E7A]" size={32} />
            </div>
            <h2 className="text-2xl font-black text-gray-800">Seguridad</h2>
            <p className="text-gray-500 mt-2 text-sm">Gestiona el acceso a tu cuenta de {username}</p>
          </div>
        )}

        {status && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{status.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* CORREO DE CONTACTO (solo si la cuenta aún no tiene uno) */}
          {pideCorreo && (
            <div className="rounded-xl border border-[#093E7A]/15 bg-[#093E7A]/[0.03] p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-[#093E7A] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {esAlumno ? "Correo de tus padres o apoderado" : "Tu correo de contacto"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {esAlumno
                      ? "Aquí llegarán los avisos de asistencia, notas y trámites. Debe ser un correo al que tus padres tengan acceso, porque no se podrá recuperar la cuenta sin él."
                      : "Aquí llegarán los avisos del colegio. Tiene que ser un correo al que tengas acceso: es el que se usará para recuperar tu cuenta."}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                  Correo electrónico
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#093E7A] focus:border-transparent outline-none transition-all text-slate-700"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nombre@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                  Repite el correo
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#093E7A] focus:border-transparent outline-none transition-all text-slate-700"
                  type="email"
                  inputMode="email"
                  placeholder="nombre@gmail.com"
                  value={formData.emailConfirm}
                  onChange={(e) => setFormData({ ...formData, emailConfirm: e.target.value })}
                  onPaste={(e) => e.preventDefault()}
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Se pide dos veces para evitar erratas; un correo mal escrito deja
                  de recibir los avisos sin que nadie lo note.
                </p>
              </div>
            </div>
          )}

          {/* Password Actual */}
          {pidePassword && (
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Contraseña Actual</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#093E7A] focus:border-transparent outline-none transition-all pr-12 text-slate-700"
                type={showPass.current ? "text" : "password"}
                value={formData.current}
                onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass({ ...showPass, current: !showPass.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#093E7A]"
              >
                {showPass.current ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          )}

          {/* Nueva Password */}
          {pidePassword && (
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Nueva Contraseña</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#093E7A] focus:border-transparent outline-none transition-all pr-12 text-slate-700"
                type={showPass.new ? "text" : "password"}
                value={formData.new}
                onChange={(e) => setFormData({ ...formData, new: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass({ ...showPass, new: !showPass.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#093E7A]"
              >
                {showPass.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {/* Barra de fortaleza */}
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Seguridad: {strength.label}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`${strength.color} h-full transition-all duration-500`}
                  style={{ width: strength.width }}
                ></div>
              </div>
            </div>
          </div>
          )}

          {/* Confirmar Password */}
          {pidePassword && (
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#093E7A] focus:border-transparent outline-none transition-all pr-12 text-slate-700"
                type={showPass.confirm ? "text" : "password"}
                value={formData.confirm}
                onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#093E7A]"
              >
                {showPass.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          )}

          <div className="pt-4">
            <button
              disabled={loading}
              className="w-full py-4 bg-[#093E7A] hover:bg-[#072f5d] disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              type="submit"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {loading ? "Procesando..."
                : pidePassword && pideCorreo ? "Guardar y continuar"
                : pideCorreo ? "Registrar correo"
                : "Actualizar Contraseña"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

// Saca el mensaje de error del cuerpo de la respuesta, sea texto plano o la
// lista de validación de Pydantic (que como objeto rompería el render).
async function extraerError(res: Response, porDefecto: string): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail)) {
      return data.detail.map((err: FastApiValidationError) => {
        const campo = err.loc[err.loc.length - 1];
        return `${campo}: ${err.msg}`;
      }).join(" | ");
    }
  } catch { /* respuesta sin cuerpo JSON */ }
  return porDefecto;
}
