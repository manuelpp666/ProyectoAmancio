import HeaderPanel from "@/src/components/PanelControl/NavbarGestionAcademica";
export default function AsignacionDocentesPage() {
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
          
          <HeaderPanel></HeaderPanel>
          
          {/* Tabs */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#093E7A]">assignment_ind</span>
                <h2 className="text-xl font-bold text-gray-800">Asignación de Docentes a Cursos</h2>
              </div>
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase">Año Académico:</label>
                <select className="bg-gray-50 border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 pr-8">
                  <option >2025</option>
                  <option>2024</option>
                  <option>2023</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                <input className="w-full bg-gray-100 border-none rounded-lg pl-10 text-sm focus:ring-2 focus:ring-[#093E7A]/20" placeholder="Buscar docente o curso..." type="text" />
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
                  <span className="material-symbols-outlined">notifications</span>
                  <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
              </div>
            </div>
          </div>

          

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Vínculos Académicos</h3>
                <p className="text-sm text-gray-500">Defina qué docente dictará cada curso en las secciones correspondientes.</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-lg hover:bg-[#093E7A]/90 transition-colors font-bold text-sm shadow-sm">
                  <span className="material-symbols-outlined text-sm">add_link</span>
                  Nuevo Vínculo
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-[#093E7A] text-[#093E7A] rounded-lg hover:bg-[#093E7A]/5 transition-colors font-bold text-sm shadow-sm">
                  <span className="material-symbols-outlined text-sm">save</span>
                  Guardar Asignaciones
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider w-1/4">Curso</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider w-1/4">Grado y Sección</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider">Docente Asignado</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Row 1 */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                          <span className="material-symbols-outlined text-xl">functions</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">Matemáticas</span>
                          <span className="text-xs text-gray-400">ID: MAT-2025-01</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 uppercase">4to Secundaria</span>
                        <span className="text-xs text-gray-500">Sección: A</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="relative">
                        <div className="flex items-center gap-3 border border-gray-200 bg-white rounded-lg p-2 hover:border-[#093E7A] cursor-pointer transition-all">
                          <div className="size-8 rounded-full bg-cover bg-center border border-gray-100" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCh32VtVoO8W4i7CVawGGKgBb-6N9NQ-6i3bUVsWp1zDUeWBNlnSXgowCEkImNleJtUFA1gXhVxWuZOM10VsqJqifUoHBeTBAfb39w2elDykLB7qNqdGAf6epKcSdptOAai9UMmQEak8k8gFj_D3r1j2_iTuZhFAtOSi2NNpmuu2pOa6Z0HbBA5rixlpaBzdEd2jsg4WNlxEXH3OA5lFOHHTVYMpQygtRfz_7CaG-saTkO2m9avMt7b6J4G8RVlaXVzJMFZgoOI2N66')"}}></div>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-gray-800">Marco Antonio Solís</span>
                          </div>
                          <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-50 text-green-700 rounded-lg">
                          <span className="material-symbols-outlined text-xl">biotech</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">Ciencias Naturales</span>
                          <span className="text-xs text-gray-400">ID: BIO-2025-04</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 uppercase">1ero Secundaria</span>
                        <span className="text-xs text-gray-500">Sección: B</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="relative">
                        <div className="flex items-center gap-3 border border-gray-200 bg-white rounded-lg p-2 hover:border-[#093E7A] cursor-pointer transition-all">
                          <div className="size-8 rounded-full bg-cover bg-center border border-gray-100" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD-5md6LwjkOocfLBgGC8SCgPdh6HEC8nckBx2g8aticQgI7ZUwOuWqPxsIshywwVStW95e_XqXEsDEMZJrxqy_8HuSljxnt-TTIcE2micBxCF2XJ9hj7DUn_-yPrYvAWm3yQa-xuAuULyEbZ2SwSg1EhznIMEW9CFzrnxTpcjvRZzY1sGFPQCehp5s_EUaPnAdea-0EJAyGWZMxaSjxGkOHCTqBk9WdSOjaKcTCCBYIkZbWPHyMd-BbK1Lvz6usKUR2Bua4VybRcOp')"}}></div>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-gray-800">Elena Rodríguez</span>
                          </div>
                          <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>

                  {/* Row 3 - Empty State */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 text-orange-700 rounded-lg">
                          <span className="material-symbols-outlined text-xl">history_edu</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">Historia del Perú</span>
                          <span className="text-xs text-gray-400">ID: HIS-2025-02</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 uppercase">3ero Secundaria</span>
                        <span className="text-xs text-gray-500">Sección: A</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="relative">
                        <div className="flex items-center gap-3 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-2 hover:border-[#093E7A] hover:bg-white cursor-pointer transition-all">
                          <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400 text-sm">person</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-gray-400 italic">Asignar Docente...</span>
                          </div>
                          <span className="material-symbols-outlined text-gray-400 text-lg">search</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>

                  {/* Row 4 */}
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                          <span className="material-symbols-outlined text-xl">translate</span>
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 block">Inglés Avanzado</span>
                          <span className="text-xs text-gray-400">ID: ING-2025-05</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 uppercase">5to Secundaria</span>
                        <span className="text-xs text-gray-500">Sección: C</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="relative">
                        <div className="flex items-center gap-3 border border-gray-200 bg-white rounded-lg p-2 hover:border-[#093E7A] cursor-pointer transition-all">
                          <div className="size-8 rounded-full bg-cover bg-center border border-gray-100" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAf2uZYC4MPZIZdZEDpXUQQL4c5QGA56jWALoLzzMW_EU7cBAoZYQsNl8Y4Lh3I5iocEn8VqP0gqMKDz4yKsB7ReRBuMHQyC48NpD2Jgq_JWjYYAdCpjMXu4j1cmMtHPf_cIurbfsjZTqQeIJvf2OzzZthLZaOLtuy1CMpb-r4vUDekjWmlScNn1CD0LcIypHWj1m7LznzoZn-m4jjWmdroqLvvQM6PjHSWwAF05KQc1jNZ4PdnQCuHt3DgpsbNiW5xJE83qnxPc7o_')"}}></div>
                          <div className="flex-1">
                            <span className="text-sm font-bold text-gray-800">Carla Méndez</span>
                          </div>
                          <span className="material-symbols-outlined text-gray-400 text-lg">expand_more</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-[#093E7A] rounded-lg">
                    <span className="material-symbols-outlined text-3xl">assignment</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase">Total Cursos/Secciones</p>
                    <h4 className="text-2xl font-black text-gray-900">124</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-700 rounded-lg">
                    <span className="material-symbols-outlined text-3xl">task_alt</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase">Asignaciones Completas</p>
                    <h4 className="text-2xl font-black text-gray-900">118</h4>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
                    <span className="material-symbols-outlined text-3xl">pending_actions</span>
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase">Cursos por Asignar</p>
                    <h4 className="text-2xl font-black text-gray-900 text-amber-700">6</h4>
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