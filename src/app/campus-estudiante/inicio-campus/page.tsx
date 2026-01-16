export default function Page() {
  return (
    <div className="bg-[#f8fafc] text-slate-800 min-h-screen flex">
      

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-[#701C32] flex flex-col h-screen sticky top-0 transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10  rounded-full flex items-center justify-center shrink-0">
            <img
                    src="/logo.png"
                    alt="Logo Amancio Varona"
                    className="h-30 md:h-30 object-contain cursor-pointer"
                  />
          </div>
          <span className="text-white font-bold text-xl hidden lg:block tracking-tight">Campus Virtual</span>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-2">
          <a className="flex items-center gap-4 p-3 rounded-xl bg-white/10 text-white group" href="#">
            <span className="material-symbols-outlined">home</span>
            <span className="hidden lg:block font-medium">Inicio</span>
          </a>
          <a className="flex items-center gap-4 p-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all" href="#">
            <span className="material-symbols-outlined">book</span>
            <span className="hidden lg:block font-medium">Cursos</span>
          </a>
          <a className="flex items-center gap-4 p-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all" href="#">
            <span className="material-symbols-outlined">forum</span>
            <span className="hidden lg:block font-medium">Mensajería</span>
          </a>
          <a className="flex items-center gap-4 p-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all" href="#">
            <span className="material-symbols-outlined">person</span>
            <span className="hidden lg:block font-medium">Alumno</span>
          </a>
          <a className="flex items-center gap-4 p-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all" href="#">
            <span className="material-symbols-outlined">swap_horiz</span>
            <span className="hidden lg:block font-medium">Trámites</span>
          </a>
        </nav>

       
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header Superior Blanco */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end px-8 shrink-0">
          <div className="flex items-center gap-6">
            <button className="text-slate-400">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-sm font-bold leading-none">Gabriela Antonet</p>
                <p className="text-[10px] text-slate-500 mt-1">1er Año de Secundaria</p>
              </div>
              <img className="w-10 h-10 rounded-full border border-slate-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7b5QfDXJv-TIDshrAmqIXyfNO4BVhmsTxQkziWxh_YHjC_IHPAtaUgmm-cLFNcbKWrvs4ZcmBgDSml9cDUynT9ayJkkOrjD5UfOd-4fnITEP_h4ipxL7i7JDvTL2gw_IUoUmcVY1pv3shvzTwCgl2kg4dcfl8_oPY2-roIHXAD5FX1XXhRxpwzd0yBuO0qOs407w_QgIH2Ickj5ue73RnhdMfRG-SPAC3f54KVtoAW3ZRL3PmLtjImNAx_RAt0g-QDJGl5YY30BRR" alt="Avatar" />
            </div>
          </div>
        </header>

        {/* Área de scroll (Contenido + Panel Derecho) */}
        <div className="flex-1 overflow-y-auto bg-[#f1f3f6]">
          <div className="flex flex-col xl:flex-row p-6 lg:p-8 gap-8">
            
            {/* Columna Izquierda: Saludo, Banner y Cursos */}
            <div className="flex-1 space-y-8">
              <section>
                <h1 className="text-4xl font-black text-[#701C32]">!Hola, Gabriela!</h1>
                <p className=" text-[#701C32] font-medium">Bienvenido a tu nuevo Campus Virtual.</p>
              </section>

              {/* Banner de Próximo Evento */}
              <section className="bg-[#701C32] rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 max-w-md">
                   <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-4">PRÓXIMO EVENTO: 3 DÍAS</span>
                   <h2 className="text-4xl font-black mb-4">Inicio de clases</h2>
                   <p className="opacity-90 mb-6">Preparáte para la llegada del año 2026 con esmero y dedicación.</p>
                   <button className="border border-white/40 bg-white/10 px-6 py-2 rounded-xl font-bold">Ver próximos eventos</button>
                </div>
              </section>

              {/* Grid de Cursos Recientes */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-[#701C32] uppercase">Cursos Recientes</h3>
                  <a className="text-slate-500 text-sm flex items-center gap-1" href="#">Ver todos <span className="material-symbols-outlined text-sm">chevron_right</span></a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  {/* Aquí irían tus tarjetas de curso repetidas */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <img src="/matematicas.png" className="w-24 h-24 mb-4" />
                    <h4 className="font-bold text-sm">Matemática</h4>
                    <p className="text-[10px] text-slate-400 mb-4">Puicon Rivera, José Emmanuel</p>
                    <a href="#" className="text-[10px] font-bold text-[#701C32] flex items-center">Ir al curso <span className="material-symbols-outlined text-xs">arrow_forward</span></a>
                  </div>
                  
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <img src="/religion.png" className="w-24 h-24 mb-4" />
                    <h4 className="font-bold text-sm">Religión</h4>
                    <p className="text-[10px] text-slate-400 mb-4">Puicon Rivera, José Emmanuel</p>
                    <a href="#" className="text-[10px] font-bold text-[#701C32] flex items-center">Ir al curso <span className="material-symbols-outlined text-xs">arrow_forward</span></a>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <img src="/cienciasS.png" className="w-24 h-24 mb-4" />
                    <h4 className="font-bold text-sm">Ciencias sociales</h4>
                    <p className="text-[10px] text-slate-400 mb-4">Puicon Rivera, José Emmanuel</p>
                    <a href="#" className="text-[10px] font-bold text-[#701C32] flex items-center">Ir al curso <span className="material-symbols-outlined text-xs">arrow_forward</span></a>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <img src="/comunicacion.png" className="w-24 h-24 mb-4" />
                    <h4 className="font-bold text-sm">Comunicación</h4>
                    <p className="text-[10px] text-slate-400 mb-4">Puicon Rivera, José Emmanuel</p>
                    <a href="#" className="text-[10px] font-bold text-[#701C32] flex items-center">Ir al curso <span className="material-symbols-outlined text-xs">arrow_forward</span></a>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <img src="/quimica.png" className="w-24 h-24 mb-4" />
                    <h4 className="font-bold text-sm">Química</h4>
                    <p className="text-[10px] text-slate-400 mb-4">Puicon Rivera, José Emmanuel</p>
                    <a href="#" className="text-[10px] font-bold text-[#701C32] flex items-center">Ir al curso <span className="material-symbols-outlined text-xs">arrow_forward</span></a>
                  </div>
                  
                </div>
              </section>
            </div>

            {/* Columna Derecha: Tareas y Notificaciones (Tal como la imagen) */}
            <div className="w-full xl:w-80 space-y-6">
              {/* Card de Tareas Pendientes */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-black text-[#701C32] uppercase text-sm text-center mb-6">Tareas Pendientes</h3>
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-[#701C32]">MATEMÁTICA</p>
                    <p className="text-xs font-bold py-1">Lista de ejercicios para desarrollar</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1"><span className="material-symbols-outlined text-xs">schedule</span> Fecha entrega: 20/01/2026</p>
                  </div>
                  {/* ... más tareas ... */}
                </div>
              </div>

              {/* Card de Notificaciones */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-black text-[#701C32] uppercase text-sm text-center mb-6">Notificaciones</h3>
                <div className="space-y-6">
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-sm">campaign</span>
                    </div>
                    <div>
                      <p className="text-[11px] leading-tight"><span className="font-bold">Comunicado:</span> Suspensión de clases el día lunes por feriado nacional.</p>
                      <p className="text-[9px] text-slate-400 mt-1">Hace 2 horas</p>
                    </div>
                  </div>
                  {/* ... más notificaciones ... */}
                </div>
              </div>
            </div>

          </div>
        </div>

        
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 lg:hidden z-50">
        <button className="flex flex-col items-center text-[#701C32]">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">book</span>
          <span className="text-[10px] font-bold">Cursos</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">notifications</span>
          <span className="text-[10px] font-bold">Avisos</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </div>
    </div>
  );
}