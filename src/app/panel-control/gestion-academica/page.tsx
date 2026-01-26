import HeaderPanel from "@/src/components/PanelControl/NavbarGestionAcademica";

export default function GestionAcademicaPage() {
  return (
    <>
      

      <style dangerouslySetInnerHTML={{ __html: `
        body { 
            font-family: 'Lato', sans-serif; 
            background-color: #F8FAFC;
            color: #1e293b; 
        }
        .sidebar-maroon { background-color: #701C32; }
        .active-tab { 
            border-bottom: 3px solid #093E7A; 
            color: #093E7A; 
        }
        .material-symbols-outlined { 
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; 
        }
        .fill-icon { 
            font-variation-settings: 'FILL' 1; 
        }
        /* Estilos de scrollbar personalizados del original */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
      `}} />

      <div className="flex h-screen overflow-hidden">
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
          
          

          {/* Tabs */}
          <HeaderPanel></HeaderPanel>

          <div className="h-16 border-b bg-white flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">account_tree</span>
                <h2 className="text-xl font-bold text-gray-800">Estructura Escolar</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Año Académico:</label>
                <select className="bg-gray-50 border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 pr-8">
                  <option>2025</option>
                  <option>2024</option>
                  <option>2023</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500"></span> Año en curso</span>
              </div>
              
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* Gestión Año */}
            <section className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-gray-900">Gestión del Año Académico</h3>
                <p className="text-sm text-gray-500">Administre el estado del periodo lectivo y herramientas de migración.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#093E7A]">event_available</span>
                      Apertura de Año
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Configure los parámetros iniciales para el nuevo ciclo escolar.</p>
                  </div>
                  <button className="w-full py-2.5 bg-[#093E7A] text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    Apertura de Año
                  </button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#701C32]">event_busy</span>
                      Cierre de Año
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Finalice los registros académicos y bloquee modificaciones.</p>
                  </div>
                  <button className="w-full py-2.5 bg-[#701C32] text-white font-bold rounded-lg text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Cierre de Año
                  </button>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">content_copy</span>
                      Herramienta Especial
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">Clone la estructura de grados y secciones del año anterior.</p>
                  </div>
                  <button className="w-full py-2.5 bg-gray-100 text-gray-700 border border-gray-200 font-bold rounded-lg text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm text-gray-500">auto_awesome_motion</span>
                    Copiar Estructura Anterior
                  </button>
                </div>
              </div>
            </section>

            {/* Grados y Secciones */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-gray-900">Grados y Secciones</h3>
                  <p className="text-sm text-gray-500">Organice los niveles educativos, sus grados y las secciones activas.</p>
                </div>
                
              </div>

              {/* Primaria */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#093E7A] fill-icon">child_care</span>
                    <h4 className="font-black text-gray-800 uppercase tracking-wide">Primaria</h4>
                    <span className="bg-[#093E7A]/10 text-[#093E7A] px-2 py-0.5 rounded text-[10px] font-bold">6 GRADOS</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">expand_less</span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-black text-gray-700">1° de Primaria</span>
                        <button className="text-gray-400 hover:text-[#093E7A]"><span className="material-symbols-outlined text-lg">edit</span></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="size-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200 cursor-default">A</div>
                        <div className="size-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs border border-green-200 cursor-default">B</div>
                        <div className="size-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs border border-amber-200 cursor-default">C</div>
                        <button className="size-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#093E7A] hover:text-[#093E7A] transition-colors">
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Capacidad: 25 alumnos/sección</p>
                    </div>
                    {/* ... (repite estructuras similares para otros grados) */}
                    <button className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 hover:border-[#093E7A] hover:text-[#093E7A] hover:bg-[#093E7A]/5 transition-all">
                      <span className="material-symbols-outlined text-2xl mb-1">add_circle</span>
                      <span className="text-xs font-bold uppercase">Añadir Grado</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Secundaria */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#093E7A]">school</span>
                    <h4 className="font-black text-gray-800 uppercase tracking-wide">Secundaria</h4>
                    <span className="bg-[#093E7A]/10 text-[#093E7A] px-2 py-0.5 rounded text-[10px] font-bold">5 GRADOS</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">expand_less</span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-sm font-black text-gray-700">1° de Secundaria</span>
                        <button className="text-gray-400 hover:text-[#093E7A]"><span className="material-symbols-outlined text-lg">edit</span></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="size-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">A</div>
                        <div className="size-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs border border-green-200">B</div>
                        <button className="size-8 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#093E7A] hover:text-[#093E7A] transition-colors">
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Capacidad: 30 alumnos/sección</p>
                    </div>
                    <button className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-gray-400 hover:border-[#093E7A] hover:text-[#093E7A] hover:bg-[#093E7A]/5 transition-all">
                      <span className="material-symbols-outlined text-2xl mb-1">add_circle</span>
                      <span className="text-xs font-bold uppercase">Añadir Grado</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Pre-Escolar (Inactivo) */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden opacity-60">
                <div className="px-6 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#093E7A]">bedroom_baby</span>
                    <h4 className="font-black text-gray-800 uppercase tracking-wide">Pre-Escolar</h4>
                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">INACTIVO</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-400">expand_more</span>
                </div>
              </div>
            </section>
          </div>

          
        </div>
      </div>
    </>
  );
}