import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";

export default function GestionCursosPage() {
  return (
    <>
      {/* Estilos específicos portados del original */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
            --primary: #093E7A;
            --maroon-admin: #701C32;
            --background-light: #F8FAFC;
        }
        body { 
            font-family: 'Lato', sans-serif; 
            background-color: var(--background-light);
            color: #1e293b;
        }
        .sidebar-maroon { background-color: var(--maroon-admin); }
        .active-tab { 
            border-bottom: 3px solid var(--primary); 
            color: var(--primary); 
        }
        .text-primary { color: var(--primary); }
        .bg-primary { background-color: var(--primary); }
        .border-primary { border-color: var(--primary); }

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
          
          {/* Navigation Tabs (NavbarGestionAcademica) */}
          <HeaderPanel />
          
          {/* Sub-Header de la página */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">menu_book</span>
                <h2 className="text-xl font-bold text-gray-800">Cursos y Carga Horaria</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Año Académico:</label>
                <select className="bg-gray-50 border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] py-1 pr-8">
                  <option>2025</option>
                  <option>2024</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-lg hover:bg-[#093E7A]/90 transition-colors font-bold text-sm shadow-sm">
                <span className="material-symbols-outlined text-sm">add</span>
                Nuevo Curso
              </button>
            </div>
          </div>

          {/* Page Content - Scrollable Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-12">
            
            {/* SECCIÓN NIVEL PRIMARIA */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                <span className="material-symbols-outlined text-[#093E7A] fill-icon">child_care</span>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Nivel Primaria</h3>
                <span className="bg-[#093E7A]/10 text-[#093E7A] px-2 py-0.5 rounded text-[10px] font-bold">12 CURSOS ACTIVOS</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Curso / Asignatura</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Grados Asignados</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Carga Horaria</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Fila Matemática */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">calculate</span>
                          </div>
                          <span className="font-bold text-gray-800">Matemática</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {['1°', '2°', '3°', '4°', '5°', '6°'].map(g => (
                            <span key={g} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">{g}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black">
                          <span className="material-symbols-outlined text-sm">schedule</span> 6h / semana
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-[#093E7A] hover:bg-[#093E7A]/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-xl">edit_note</span></button>
                          <button className="p-2 text-[#701C32] hover:bg-[#701C32]/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                        </div>
                      </td>
                    </tr>
                    {/* Fila Comunicación */}
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-amber-50 text-amber-600 rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">translate</span>
                          </div>
                          <span className="font-bold text-gray-800">Comunicación</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {['1°', '2°', '3°', '4°', '5°', '6°'].map(g => (
                            <span key={g} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">{g}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black">
                          <span className="material-symbols-outlined text-sm">schedule</span> 5h / semana
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-[#093E7A] hover:bg-[#093E7A]/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-xl">edit_note</span></button>
                          <button className="p-2 text-[#701C32] hover:bg-[#701C32]/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECCIÓN NIVEL SECUNDARIA */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                <span className="material-symbols-outlined text-[#093E7A]">school</span>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Nivel Secundaria</h3>
                <span className="bg-[#093E7A]/10 text-[#093E7A] px-2 py-0.5 rounded text-[10px] font-bold">15 CURSOS ACTIVOS</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Curso / Asignatura</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Grados Asignados</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Carga Horaria</th>
                      <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center">
                            <span className="material-symbols-outlined text-sm">functions</span>
                          </div>
                          <span className="font-bold text-gray-800">Álgebra y Geometría</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">1°</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">2°</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">3°</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black">
                          <span className="material-symbols-outlined text-sm">schedule</span> 6h / semana
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-[#093E7A] hover:bg-[#093E7A]/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-xl">edit_note</span></button>
                          <button className="p-2 text-[#701C32] hover:bg-[#701C32]/10 rounded-lg transition-colors"><span className="material-symbols-outlined text-xl">delete</span></button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECCIÓN PRE-ESCOLAR (VISTA COLAPSADA) */}
            <section className="space-y-4 opacity-75">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                <span className="material-symbols-outlined text-[#093E7A]">bedroom_baby</span>
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Nivel Pre-Escolar</h3>
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] font-bold">4 CURSOS ACTIVOS</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center border-dashed">
                <span className="material-symbols-outlined text-gray-300 text-5xl mb-2">inventory_2</span>
                <p className="text-gray-400 font-medium italic">Haga clic para expandir y gestionar los cursos de Pre-Escolar</p>
              </div>
            </section>

          </div>

          
        </div>
      </div>
    </>
  );
}