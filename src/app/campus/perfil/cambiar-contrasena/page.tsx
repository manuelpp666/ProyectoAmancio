

export default function SecurityPage() {
  return (
    <>
      

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --primary: #093E7A;
          --secondary: #701C32;
          --accent: #48C9B0;
          --warning: #FFB300;
          --background-light: #F8FAFC;
        }
        body { 
          font-family: 'Lato', sans-serif;
          margin: 0;
        }
        .sidebar-maroon { background-color: var(--secondary); }
        .password-strength-bar {
          height: 4px;
          transition: all 0.3s ease;
        }
        /* Clases de utilidad para replicar el config de tailwind del original */
        .text-primary { color: var(--primary); }
        .bg-primary { background-color: var(--primary); }
        .text-accent { color: var(--accent); }
        .bg-accent { background-color: var(--accent); }
        .bg-warning { background-color: var(--warning); }
      `}} />

      <div className="bg-[#F8FAFC] min-h-screen flex text-gray-800">
        

        {/* Main Content */}
        <div className="flex-grow flex flex-col bg-white">
          

          <div className="flex-grow flex items-center justify-center p-6 bg-[#F8FAFC]">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-[#093E7A]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#093E7A] text-3xl">lock_reset</span>
                </div>
                <h2 className="text-2xl font-black text-gray-800">Seguridad de la Cuenta</h2>
                <p className="text-gray-500 mt-2 text-sm">Actualiza tu contraseña para mantener tu cuenta segura.</p>
              </div>

              <form className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Contraseña Actual</label>
                  <div className="relative">
                    <input className="w-full px-4 py-3 rounded-lg border-gray-300 bg-white text-gray-900 focus:ring-primary focus:border-primary transition-all pr-12" placeholder="••••••••" type="password"/>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" type="button">
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Nueva Contraseña</label>
                  <div className="relative">
                    <input className="w-full px-4 py-3 rounded-lg border-gray-300 bg-white text-gray-900 focus:ring-primary focus:border-primary transition-all pr-12" placeholder="••••••••" type="password"/>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" type="button">
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </button>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-gray-500 uppercase">Seguridad</span>
                      <span className="text-xs font-bold text-accent">Media</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                      <div className="bg-accent w-2/3 h-full rounded-full"></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 italic">Mínimo 8 caracteres, incluye una letra mayúscula y un número.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Confirmar Nueva Contraseña</label>
                  <div className="relative">
                    <input className="w-full px-4 py-3 rounded-lg border-gray-300 bg-white text-gray-900 focus:ring-primary focus:border-primary transition-all pr-12" placeholder="••••••••" type="password"/>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" type="button">
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex flex-col gap-4">
                  <button className="w-full py-4 bg-primary hover:bg-[#072f5d] text-white font-bold rounded-lg shadow-md transition-all transform active:scale-[0.98] uppercase tracking-widest text-sm" type="submit">
                    Actualizar Contraseña
                  </button>
                  <a className="text-center text-sm font-bold text-secondary hover:underline transition-all" href="#">
                    Cancelar y volver
                  </a>
                </div>
              </form>
            </div>
          </div>

          <footer className="p-6 text-center text-gray-400 text-xs bg-[#F8FAFC]">
            <p>© 2025 Campus Virtual Escolar. Todos los derechos reservados.</p>
          </footer>
        </div>

        {/* Floating Action Button */}
        <button className="fixed bottom-8 right-8 w-14 h-14 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group">
          <span className="material-symbols-outlined text-2xl">save</span>
        </button>
      </div>
    </>
  );
}