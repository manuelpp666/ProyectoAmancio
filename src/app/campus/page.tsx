"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/src/context/userContext";
import Link from "next/link";
import { User, Lock, GraduationCap, Loader2, AlertCircle } from "lucide-react";


const ROLE_ROUTES = {
  ADMIN: "/campus/panel-control",
  DOCENTE: "/campus/campus-docente/inicio-docente",
  ALUMNO: "/campus/campus-estudiante/inicio-campus",
  PSICOLOGO: "/campus/campus-psicologo",
  AUXILIAR: "/campus/campus-auxiliar/inicio",
};
export default function LoginPage() {
  const router = useRouter();
  const { setUserData } = useUser(); // 2. Extraer la función para guardar datos
  
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState(""); // 3. Estado para la contraseña
  const [error, setError] = useState<string | null>(null); // 4. Estado para errores visuales

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Credenciales incorrectas");
      }

      // PASO CLAVE: Ahora pasamos el token que viene del backend
      setUserData(
        data.rol, 
        data.username, 
        data.id_usuario, 
        data.access_token, 
        data.permisos 
      )

      // Redirección "ciega" basada en el diccionario
      const destination = ROLE_ROUTES[data.rol as keyof typeof ROLE_ROUTES] || "/campus/campus-estudiante/inicio-campus";
      router.push(destination);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="antialiased text-slate-900 min-h-screen flex flex-col md:flex-row">

      {/* ===== MITAD 1: PANEL VISUAL ===== */}
      <section className="relative w-full md:w-1/2 min-h-[35vh] md:min-h-screen overflow-hidden bg-gradient-to-br from-[#701C32] via-[#5a1628] to-[#093E7A]">
        {/* Imagen de fondo con filtro oscuro */}
        <img
          alt="Campus Amancio Varona"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
          src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Contenido de bienvenida */}
        <div className="relative z-10 h-full flex flex-col justify-center md:justify-end p-8 md:p-16 text-white">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 w-fit">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wide">Plataforma Activa 24/7</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 md:mb-6 leading-tight drop-shadow-lg">
            Bienvenido al <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">
              Colegio Amancio Varona
            </span>
          </h2>
          <p className="text-base md:text-xl text-white/85 leading-relaxed font-light max-w-lg">
            Gestión académica, recursos educativos y comunicación en tiempo real para docentes,
            estudiantes y administrativos.
          </p>
        </div>
      </section>

      {/* ===== MITAD 2: FORMULARIO ===== */}
      <section className="w-full md:w-1/2 flex items-center justify-center bg-gray-100 p-6 sm:p-10 md:min-h-screen">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 relative">

          <Link
            href="/"
            className="absolute top-6 left-6 text-slate-400 hover:text-[#701C32] transition-colors flex items-center gap-1 text-sm font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Inicio
          </Link>

          {/* Logo institucional centrado */}
          <div className="flex flex-col items-center mb-8 mt-4">
            <img src="/logo.png" alt="Logo Colegio Amancio Varona" className="h-20 w-auto object-contain mb-3" />
            <h1 className="text-2xl font-black text-[#701C32] uppercase tracking-tight leading-none">Amancio Varona</h1>
            <p className="text-slate-500 text-sm mt-1">Acceso al Campus Virtual</p>
          </div>

          {/* Alerta de error de validación */}
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 rounded-md animate-shake"
            >
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-bold text-slate-700 mb-2">
                Usuario / DNI
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093E7A] transition-colors" size={20} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#093E7A] focus:border-transparent"
                  placeholder="Ingresa tu usuario o DNI"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093E7A] transition-colors" size={20} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl outline-none transition-all focus:ring-2 focus:ring-[#093E7A] focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-[#093E7A] hover:bg-[#072e5c] text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 transition-all duration-300"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <GraduationCap size={20} />}
              {loading ? "Verificando..." : "Iniciar Sesión"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-8">
            ¿Olvidaste tu contraseña? Contacta a la administración del colegio.
          </p>
        </div>
      </section>
    </div>
  );
}