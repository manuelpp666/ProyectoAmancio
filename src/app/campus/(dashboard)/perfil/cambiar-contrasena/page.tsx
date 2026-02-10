"use client";
import { useState } from "react";
import { useUser } from "@/src/context/userContext";
import { Lock, Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SecurityPage() {
  const router = useRouter();
  const { username, role } = useUser();
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [formData, setFormData] = useState({ current: "", new: "", confirm: "" });
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleBack = () => {
    if (role === "ADMIN") {
      router.push("/campus/panel-control");
    } else if (role === "DOCENTE") {
      router.push("/campus/campus-docente/inicio-docente");
    } else if (role === "ALUMNO") {
      router.push("/campus/campus-estudiante/inicio-campus");
    } else {
      // Por si acaso el role es null, enviarlo al login o inicio
      router.push("/login");
    }
  };
  // Lógica de fuerza de contraseña
  const getStrength = () => {
    if (formData.new.length === 0) return { width: '0%', color: 'bg-gray-200', label: 'Vaciío' };
    if (formData.new.length < 6) return { width: '33%', color: 'bg-red-500', label: 'Débil' };
    if (formData.new.length < 10) return { width: '66%', color: 'bg-amber-500', label: 'Media' };
    return { width: '100%', color: 'bg-emerald-500', label: 'Fuerte' };
  };

  const strength = getStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // 1. Validación local de coincidencia
    if (formData.new !== formData.confirm) {
      setStatus({ type: 'error', msg: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    // 2. Validación local de longitud (Para evitar el 422 del back)
    if (formData.new.length < 8) {
      setStatus({ type: 'error', msg: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/perfil/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          current_password: formData.current,
          new_password: formData.new
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', msg: 'Contraseña actualizada correctamente' });
        setFormData({ current: "", new: "", confirm: "" });
      } else {
        // --- MANEJO DE ERRORES CORREGIDO ---
        let errorMsg = "Error al actualizar";

        if (typeof data.detail === 'string') {
          // Error simple enviado por ti (ej: "La contraseña actual es incorrecta")
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Error de validación de Pydantic/FastAPI (422)
          // Esto evita el error de "Objects are not valid as a React child"
          errorMsg = data.detail.map(err => {
            const campo = err.loc[err.loc.length - 1];
            return `${campo}: ${err.msg}`;
          }).join(" | ");
        }

        setStatus({ type: 'error', msg: errorMsg });
      }
    } catch (error) {
      setStatus({ type: 'error', msg: 'Error de conexión con el servidor' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-[#093E7A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-[#093E7A]" size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-800">Seguridad</h2>
          <p className="text-gray-500 mt-2 text-sm">Gestiona el acceso a tu cuenta de {username}</p>
        </div>

        {status && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="text-sm font-medium">{status.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Password Actual */}
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

          {/* Nueva Password */}
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

          {/* Confirmar Password */}
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

          <div className="pt-4 flex flex-col gap-3">
            <button
              disabled={loading}
              className="w-full py-4 bg-[#093E7A] hover:bg-[#072f5d] disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              type="submit"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {loading ? "Procesando..." : "Actualizar Contraseña"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="text-center text-xs font-bold text-[#701C32] hover:underline py-2 uppercase tracking-tight"
            >
              Cancelar y volver al campus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}