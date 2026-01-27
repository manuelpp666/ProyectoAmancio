import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";

export default function AsignacionEstudiantesPage() {
  return (
    <>
      {/* Estilos específicos portados del original */}
      <style dangerouslySetInnerHTML={{ __html: `
        body { 
            font-family: 'Lato', sans-serif; 
            background-color: #F8FAFC;
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
        /* Custom Scrollbar */
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
          

          {/* Navigation Tabs */}
          <HeaderPanel />

          {/* Header */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">person_add_alt</span>
                <h2 className="text-xl font-bold text-gray-800">Asignación de Estudiantes</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Periodo:</label>
                <select className="bg-gray-50 border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 pr-8">
                  <option>Matrícula 2025</option>
                  <option>Verano 2025</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Assignment Area */}
          <div className="flex-1 flex overflow-hidden p-8 gap-8">
            
            {/* Unassigned Students List */}
            <div className="w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b bg-gray-50/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight text-sm">
                    <span className="material-symbols-outlined text-[#093E7A] text-xl">person_search</span>
                    Estudiantes sin Asignar
                  </h3>
                  <span className="bg-[#093E7A]/10 text-[#093E7A] text-xs font-bold px-2.5 py-1 rounded-full">12 Pendientes</span>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                  <input className="w-full bg-white border-gray-200 rounded-lg pl-10 text-sm focus:ring-2 focus:ring-[#093E7A]/20" placeholder="Buscar por nombre o DNI..." type="text" />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100">
                  {['Alvarez Quispe, Mateo', 'Bermúdez Soto, Lucía', 'Cárdenas Ruiz, Sebastián', 'Díaz Morales, Valentina'].map((name, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 cursor-pointer group flex items-center gap-4 transition-colors">
                      <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center border border-gray-200">
                        <span className="material-symbols-outlined text-gray-400">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-500">DNI: 7283940{idx}</p>
                      </div>
                      <span className="material-symbols-outlined text-gray-300 group-hover:text-[#093E7A] transition-colors">drag_indicator</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Steps Column (Paso 1 y Paso 2) */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
              
              {/* Step 1: Nivel */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 shrink-0">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Paso 1: Seleccionar Nivel</h3>
                <div className="grid grid-cols-3 gap-4">
                  <button className="flex flex-col items-center gap-2 p-4 border-2 border-[#093E7A] bg-[#093E7A]/5 rounded-xl transition-all">
                    <span className="material-symbols-outlined text-[#093E7A] text-3xl">child_care</span>
                    <span className="text-sm font-black text-[#093E7A] uppercase">Primaria</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-100 hover:border-[#093E7A]/30 rounded-xl transition-all">
                    <span className="material-symbols-outlined text-gray-400 text-3xl">school</span>
                    <span className="text-sm font-black text-gray-400 uppercase">Secundaria</span>
                  </button>
                  <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-100 hover:border-[#093E7A]/30 rounded-xl transition-all">
                    <span className="material-symbols-outlined text-gray-400 text-3xl">rocket_launch</span>
                    <span className="text-sm font-black text-gray-400 uppercase">Pre-Academia</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Grado y Sección */}
              <div className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Paso 2: Grado y Sección de Destino</h3>
                </div>
                
                {/* Grade Tabs */}
                <div className="flex gap-4 mb-8 overflow-x-auto pb-2 shrink-0">
                  {['1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado'].map((grado, idx) => (
                    <button 
                      key={idx} 
                      className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${idx === 0 ? 'bg-[#093E7A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {grado}
                    </button>
                  ))}
                </div>

                {/* Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {/* Section A */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-[#093E7A]/40 hover:bg-[#093E7A]/5 transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">A</div>
                        <div>
                          <p className="font-black text-gray-900 leading-none">Sección Azul</p>
                          <p className="text-[10px] text-gray-400 uppercase mt-1">Primaria 1° A</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-[#093E7A]">08</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Vacantes</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg p-4 mb-4">
                      <span className="material-symbols-outlined text-3xl mb-1">add_circle</span>
                      <p className="text-xs font-bold uppercase">Arrastrar aquí</p>
                    </div>
                    <button className="w-full bg-[#093E7A] text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#093E7A]/90 transition-colors">
                      <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                      Asignar Seleccionados
                    </button>
                  </div>

                  {/* Section B */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-[#093E7A]/40 hover:bg-[#093E7A]/5 transition-all flex flex-col">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-black">B</div>
                        <div>
                          <p className="font-black text-gray-900 leading-none">Sección Roja</p>
                          <p className="text-[10px] text-gray-400 uppercase mt-1">Primaria 1° B</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-amber-600">03</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Vacantes</p>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-lg p-4 mb-4">
                      <span className="material-symbols-outlined text-3xl mb-1">add_circle</span>
                      <p className="text-xs font-bold uppercase">Arrastrar aquí</p>
                    </div>
                    <button className="w-full bg-[#093E7A] text-white py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#093E7A]/90 transition-colors">
                      <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                      Asignar Seleccionados
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          
        </div>
      </div>
    </>
  );
}