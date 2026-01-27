import HeaderPanel from "@/src/components/Campus/PanelControl/NavbarGestionAcademica";

export default function ConstructorHorariosPage() {
  // Definición de las filas para no repetir código manualmente
  const scheduleRows = [
    { time: "07:00 - 08:30", type: "slots" },
    { time: "08:30 - 10:00", type: "slots" },
    { time: "10:00 - 10:30", type: "break", label: "Receso Escolar" },
    { time: "10:30 - 12:00", type: "slots" },
    { time: "12:00 - 13:30", type: "slots" },
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: 'Lato', sans-serif; background-color: #F8FAFC; color: #1e293b; }
        .sidebar-maroon { background-color: #701C32; }
        .active-tab { border-bottom: 3px solid #093E7A; color: #093E7A; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .fill-icon { font-variation-settings: 'FILL' 1; }
        .schedule-grid { display: grid; grid-template-columns: 100px repeat(5, 1fr); }
        .time-slot { height: 100px; border-bottom: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}} />

      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
          <HeaderPanel />
          
          {/* Header principal */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#093E7A]">calendar_month</span>
              <h2 className="text-xl font-bold text-gray-800">Constructor de Horarios Escolares</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button className="px-3 py-1.5 text-xs font-bold bg-white shadow-sm rounded-md text-[#093E7A]">Edición</button>
                <button className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700">Vista Previa</button>
              </div>
              <button className="flex items-center gap-2 px-5 py-2 bg-[#093E7A] text-white rounded-lg hover:bg-[#093E7A]/90 transition-colors font-bold text-sm shadow-sm">
                <span className="material-symbols-outlined text-sm">save</span>
                Guardar Horario
              </button>
            </div>
          </div>

          {/* Tabs de Grados */}
          <div className="bg-white px-8 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <button className="active-tab py-4 px-2 text-sm font-bold flex items-center gap-2">1ero Secundaria - A</button>
                <button className="py-4 px-2 text-sm font-bold text-gray-400 hover:text-gray-700 border-b-[3px] border-transparent">1ero Secundaria - B</button>
                <button className="py-4 px-2 text-sm font-bold text-gray-400 hover:text-gray-700 border-b-[3px] border-transparent">2do Secundaria - A</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Periodo:</span>
                <select className="text-sm border-none bg-gray-50 font-bold text-gray-700 focus:ring-0 rounded-md">
                  <option>2024 - Ciclo I</option>
                  <option>2024 - Ciclo II</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Izquierda - Materias */}
            <div className="w-72 bg-white border-r flex flex-col shrink-0">
              <div className="p-6 border-b bg-gray-50/50">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Materias Disponibles</h3>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
                  <input className="w-full bg-white border-gray-200 rounded-lg pl-10 text-sm focus:ring-[#093E7A]/20" placeholder="Buscar materia..." type="text"/>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Materia 1 */}
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-move hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-blue-700 uppercase">Matemáticas</span>
                    <span className="material-symbols-outlined text-blue-400 text-sm">drag_indicator</span>
                  </div>
                  <p className="text-xs text-blue-600/80 mb-2">6 Horas semanales</p>
                  <div className="flex items-center gap-1">
                    <div className="size-5 rounded-full bg-blue-200 text-[10px] flex items-center justify-center font-bold text-blue-700">MS</div>
                    <span className="text-[10px] text-blue-700 font-medium">Marco Solís</span>
                  </div>
                </div>

                {/* Materia 2 */}
                <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg cursor-move hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-black text-purple-700 uppercase">Historia</span>
                    <span className="material-symbols-outlined text-purple-400 text-sm">drag_indicator</span>
                  </div>
                  <p className="text-xs text-purple-600/80 mb-2">3 Horas semanales</p>
                  <div className="flex items-center gap-1">
                    <div className="size-5 rounded-full bg-purple-200 text-[10px] flex items-center justify-center font-bold text-purple-700">CM</div>
                    <span className="text-[10px] text-purple-700 font-medium">Carla Méndez</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 border-t">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="material-symbols-outlined text-sm">info</span>
                  <span className="text-[10px] font-bold uppercase">Validación Activa</span>
                </div>
                <p className="text-[10px] text-red-600/70 mt-1">Conflictos de docente o aula se marcarán en rojo.</p>
              </div>
            </div>

            {/* Visualizador de Horario */}
            <div className="flex-1 overflow-auto bg-gray-100 p-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-w-[900px] overflow-hidden">
                {/* Cabecera del Grid */}
                <div className="schedule-grid bg-gray-50 border-b border-gray-200 text-center font-bold text-[11px] text-gray-400 uppercase tracking-widest">
                  <div className="p-4 border-r">Hora</div>
                  <div className="p-4 border-r text-gray-700">Lunes</div>
                  <div className="p-4 border-r text-gray-700">Martes</div>
                  <div className="p-4 border-r text-gray-700">Miércoles</div>
                  <div className="p-4 border-r text-gray-700">Jueves</div>
                  <div className="p-4 text-gray-700">Viernes</div>
                </div>

                {/* Cuerpo del Horario */}
                <div className="relative">
                  {scheduleRows.map((row, idx) => (
                    row.type === "break" ? (
                      /* Fila de Receso */
                      <div key={idx} className="schedule-grid bg-slate-100 border-y border-slate-200">
                        <div className="h-8 bg-slate-200/50 flex items-center justify-center border-r">
                          <span className="text-[9px] font-black text-slate-500">{row.time.split(' ')[0]}</span>
                        </div>
                        <div className="col-span-5 h-8 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">{row.label}</span>
                        </div>
                      </div>
                    ) : (
                      /* Fila de Clases */
                      <div key={idx} className="schedule-grid">
                        <div className="time-slot flex items-center justify-center text-[10px] font-bold text-gray-400 bg-gray-50/30">
                          {row.time}
                        </div>
                        
                        {/* Lunes: Ejemplo de Clase Normal */}
                        <div className="time-slot p-2">
                          <div className="h-full w-full bg-blue-50 border border-blue-200 rounded-lg p-2 flex flex-col justify-between hover:shadow-sm transition-all">
                            <div>
                              <p className="text-[10px] font-black text-blue-700 uppercase truncate">Matemáticas</p>
                              <p className="text-[9px] text-blue-600">Marco S.</p>
                            </div>
                            <span className="text-[9px] font-bold text-blue-400 self-end">Aula 102</span>
                          </div>
                        </div>

                        {/* Martes: Ejemplo de Conflicto (Rojo) */}
                        <div className="time-slot p-2">
                          {idx === 0 ? (
                            <div className="h-full w-full bg-red-50 border-2 border-red-400 rounded-lg p-2 flex flex-col justify-between relative">
                              <div>
                                <p className="text-[10px] font-black text-red-700 uppercase truncate">Ciencias</p>
                                <p className="text-[9px] text-red-600 font-bold">Conflicto Docente</p>
                              </div>
                              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full size-5 flex items-center justify-center shadow-lg">
                                <span className="material-symbols-outlined text-[12px] fill-icon">warning</span>
                              </div>
                              <span className="text-[9px] font-bold text-red-400 self-end">Lab 01</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Otros días vacíos */}
                        <div className="time-slot p-2 bg-gray-50/10"></div>
                        <div className="time-slot p-2 bg-gray-50/10"></div>
                        <div className="time-slot p-2 bg-gray-50/10"></div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Leyenda y Progreso */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="size-3 bg-red-400 rounded-sm"></div>
                    <span className="text-xs text-gray-500">Conflicto detectado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="size-3 bg-blue-100 border border-blue-200 rounded-sm"></div>
                    <span className="text-xs text-gray-500">Clase asignada</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs text-gray-400 font-bold">Carga Horaria: <span className="text-gray-700">18 / 30 hrs</span></p>
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#093E7A]" style={{ width: '60%' }}></div>
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