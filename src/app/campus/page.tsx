"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/src/context/userContext";
import Link from "next/link";
import { User, Lock, GraduationCap, Loader2, AlertCircle } from "lucide-react";

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
      // 5. Llamada real a tu backend de FastAPI
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejo de errores del backend (401, 404, etc.)
        throw new Error(data.detail || "Credenciales incorrectas");
      }

      // 6. Guardar en el Contexto Global (y localStorage automáticamente si lo configuraste)
      setUserData(data.rol, data.username);

      // 7. Redirección basada en el ROL REAL de la base de datos
      if (data.rol === "ADMIN") {
        router.push("/campus/panel-control");
      } else if (data.rol === "DOCENTE") {
        router.push("/campus/campus-docente/inicio-docente");
      } else {
        router.push("/campus/campus-estudiante/inicio-campus");
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="antialiased text-slate-900 overflow-hidden bg-white">
      <div className="flex min-h-screen">
        <main className="w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-16 xl:px-24 bg-white z-10 shadow-2xl relative">
          
          <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-[#701C32] transition-colors flex items-center gap-2 text-sm font-bold">
            <span className="material-symbols-outlined">arrow_back</span>
            Volver al inicio
          </Link>

          <div className="max-w-md mx-auto lg:mx-0 w-full">
            <div className="mb-10 flex justify-center lg:justify-start">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100">
                  <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#701C32] leading-none uppercase tracking-tight">Amancio</h1>
                  <p className="text-[#093E7A] font-bold text-sm tracking-widest uppercase">Varona</p>
                </div>
              </div>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Acceso al Campus</h2>
              <p className="text-slate-500">Ingresa tus credenciales institucionales.</p>
            </div>

            {/* 8. Alerta de Error Visual */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center gap-3 animate-shake">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Usuario / DNI</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093E7A]" size={20} />
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#093E7A]" 
                    required 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093E7A]" size={20} />
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#093E7A]" 
                    required 
                    type="password"
                    value={password} // Vinculado al estado
                    onChange={(e) => setPassword(e.target.value)} // Captura la contraseña
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-[#093E7A] hover:bg-[#072e5c] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 transition-all" 
                type="submit"
              >
                {loading ? <Loader2 className="animate-spin" /> : <GraduationCap size={20} />}
                {loading ? "Verificando..." : "Ingresar al Campus"}
              </button>
            </form>
          </div>
        </main>
        {/* Sección de Imagen (Banner derecho) */}
        <aside className="hidden lg:block relative lg:flex-1 bg-[#701C32] overflow-hidden">
          {/* Imagen de fondo */}
          <div className="absolute inset-0">
             <img 
               alt="Campus Life" 
               className="w-full h-full object-cover opacity-50 mix-blend-overlay" 
               src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#701C32] via-[#701C32]/80 to-transparent"></div>
          </div>
          
          {/* Contenido sobre la imagen */}
          <div className="absolute inset-0 flex flex-col justify-end p-16 text-white z-10">
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 w-fit">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
               <span className="text-xs font-bold tracking-wide">Plataforma Activa 24/7</span>
            </div>
            <h3 className="text-5xl font-black mb-6 leading-tight">
              Tu futuro comienza <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">aquí y ahora.</span>
            </h3>
            <p className="text-xl text-white/80 leading-relaxed font-light max-w-lg">
              Gestión académica, recursos educativos y comunicación en tiempo real para docentes, estudiantes y administrativos.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}