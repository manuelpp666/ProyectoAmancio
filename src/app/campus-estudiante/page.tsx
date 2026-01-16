"use client";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  
  const handleSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
    // Aquí podrías poner una validación temporal
    // Por ahora, redirigimos directamente
    router.push("/campus-estudiante/inicio-campus"); // Cambia esto por la ruta de tu dashboard
  };
  
    return (
    <div className="antialiased text-slate-900 overflow-hidden bg-white">
      
      <div className="flex min-h-screen">
        {/* Sección del Formulario - Ajustada a 40% o 50% en pantallas grandes */}
        <main className="w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-center px-6 sm:px-12 md:px-20 lg:px-16 xl:px-24 bg-white z-10 shadow-2xl">
          <div className="max-w-md mx-auto lg:mx-0 w-full">
            
            {/* Logo */}
            <div className="mb-12 flex justify-center lg:justify-start">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Logo Amancio Varona"
                    className="h-12 w-auto object-contain cursor-pointer"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#701C32] leading-none uppercase tracking-tight">Amancio</h1>
                  <p className="text-[#093E7A] font-bold text-sm tracking-widest uppercase">Verona</p>
                </div>
              </div>
            </div>

            {/* Welcome Text */}
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-3xl font-black text-slate-800 mb-2">Bienvenido</h2>
              <p className="text-slate-500">Ingresa tus credenciales para acceder al Campus Virtual.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} action="#" className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="username">Usuario / Correo Electrónico</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#093E7A] focus:border-[#093E7A] transition-all outline-none" 
                    id="username" 
                    placeholder="Escribe tu usuario" 
                    required 
                    type="text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="password">Contraseña</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#093E7A] focus:border-[#093E7A] transition-all outline-none" 
                    id="password" 
                    placeholder="••••••••" 
                    required 
                    type="password"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input 
                  className="w-4 h-4 rounded border-slate-300 text-[#093E7A] focus:ring-[#093E7A]" 
                  id="remember" 
                  type="checkbox"
                />
                <label className="text-sm text-slate-600 font-medium" htmlFor="remember">Recordar mis datos</label>
              </div>

              <button 
                className="w-full bg-[#093E7A] hover:bg-[#072e5c] text-white font-black py-4 rounded-xl shadow-lg shadow-[#093E7A]/20 transition-all active:scale-[0.98] uppercase tracking-wide" 
                type="submit"
              >
                Ingresar
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-10 space-y-4 text-center lg:text-left">
              <a className="block text-sm font-bold text-[#701C32] hover:underline" href="#">
                ¿Olvidaste tu contraseña?
              </a>
              <div className="pt-6 border-t border-slate-100">
                <a className="inline-flex items-center gap-2 text-slate-500 hover:text-[#093E7A] text-sm font-medium transition-colors" href="/">
                  <span className="material-symbols-outlined text-lg">arrow_back</span>
                  Volver al sitio web
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Sección de Imagen - Ahora ocupa el resto del espacio proporcionalmente */}
        <aside className="hidden lg:block relative lg:flex-1 bg-[#701C32]">
          <img 
            alt="Campus Life" 
            className="absolute inset-0 w-full h-full object-cover opacity-60" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDA-gxLyb-cSg4MGQz4rpFnofmY5yODcgMImAIg-fPeMz3GR51Dr1EfcRHwB2nSBxyCwicWEBff0HGg2t5fNsTm8iFyHI2bUcFcT0XKum_xU3MjzDNvdQf6FkHwbyUk4ZdkJ2VuUJRNP9kz5hGHkJ8TgovTjsa0RuWOvgyl5QoyreAU1eBPHHV6VVLbkoWDgFvRk7DorfenZRYzI3YHn4BLcKbFBoELERtVkOejRvA9zR7PV52F0pJz_pUz3dovFCc9TIJt8YAd1fOq"
          />
          {/* Overlay con gradiente para que el texto destaque más */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#701C32]/90 to-transparent flex flex-col items-center justify-center p-12 xl:p-24 text-white">
            <div className="max-w-lg text-center">
              <div className="mb-8 inline-block p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                <span className="material-symbols-outlined text-6xl">workspace_premium</span>
              </div>
              <h3 className="text-4xl xl:text-5xl font-black mb-6 leading-tight">Excelencia en cada paso de tu formación</h3>
              <p className="text-xl text-white/80 leading-relaxed font-light">
                Accede a tus cursos, materiales y calificaciones desde un solo lugar.
              </p>
            </div>
            
            {/* Adornos visuales ajustados */}
            <div className="absolute bottom-10 right-10 w-24 h-24 border-b-2 border-r-2 border-white/20 rounded-br-3xl"></div>
            <div className="absolute top-10 left-10 w-24 h-24 border-t-2 border-l-2 border-white/20 rounded-tl-3xl"></div>
          </div>
        </aside>
      </div>
    </div>
  );
}