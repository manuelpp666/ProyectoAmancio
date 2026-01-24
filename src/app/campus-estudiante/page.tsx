"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, GraduationCap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // SIMULACIÓN DE LOGIN
    // En un futuro, aquí conectarás con tu API de Python
    setTimeout(() => {
      if (username.toLowerCase().includes("admin")) {
        router.push("/campus-estudiante/panel-control");
      } else if (username.toLowerCase().includes("docente") || username.toLowerCase().includes("profe")) {
        router.push("/campus-docente/inicio-docente");
      } else {
        // Por defecto, cualquier otro usuario va al campus estudiante
        router.push("/campus-estudiante/inicio-campus");
      }
      setLoading(false);
    }, 1000); 
  };
  
  return (
    <div className="antialiased text-slate-900 overflow-hidden bg-white">
      
      <div className="flex min-h-screen">
        {/* Sección del Formulario */}
        <main className="w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-16 xl:px-24 bg-white z-10 shadow-2xl relative">
          
          {/* Botón Volver flotante */}
          <Link href="/" className="absolute top-8 left-8 text-slate-400 hover:text-[#701C32] transition-colors flex items-center gap-2 text-sm font-bold">
            <span className="material-symbols-outlined">arrow_back</span>
            Volver al inicio
          </Link>

          <div className="max-w-md mx-auto lg:mx-0 w-full">
            
            {/* Logo */}
            <div className="mb-10 flex justify-center lg:justify-start animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-50 border border-slate-100">
                  {/* Asegúrate de tener el logo en public/logo.png */}
                  <img
                    src="/logo.png"
                    alt="Logo Amancio Varona"
                    className="h-10 w-auto object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#701C32] leading-none uppercase tracking-tight">Amancio</h1>
                  <p className="text-[#093E7A] font-bold text-sm tracking-widest uppercase">Varona</p>
                </div>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-8 text-center lg:text-left animate-fade-in-up delay-100">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Acceso al Campus</h2>
              <p className="text-slate-500">
                Bienvenido a la plataforma virtual unificada. Ingresa tus credenciales institucionales.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up delay-200">
              
              {/* Input Usuario */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="username">Usuario / DNI</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093E7A] transition-colors" size={20} />
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] transition-all outline-none font-medium" 
                    id="username" 
                    placeholder="Ej: 12345678" 
                    required 
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-1">
                  *Tip: Usa "admin", "docente" o tu nombre para probar.
                </p>
              </div>

              {/* Input Contraseña */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="password">Contraseña</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#093E7A] transition-colors" size={20} />
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] transition-all outline-none font-medium" 
                    id="password" 
                    placeholder="••••••••" 
                    required 
                    type="password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input 
                    className="w-4 h-4 rounded border-slate-300 text-[#093E7A] focus:ring-[#093E7A] cursor-pointer" 
                    id="remember" 
                    type="checkbox"
                  />
                  <label className="text-sm text-slate-600 font-medium cursor-pointer" htmlFor="remember">Recordarme</label>
                </div>
                <a href="#" className="text-sm font-bold text-[#701C32] hover:underline">
                  ¿Problemas para entrar?
                </a>
              </div>

              <button 
                disabled={loading}
                className="w-full bg-[#093E7A] hover:bg-[#072e5c] text-white font-black py-4 rounded-xl shadow-lg shadow-[#093E7A]/20 transition-all active:scale-[0.98] uppercase tracking-wide flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed" 
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