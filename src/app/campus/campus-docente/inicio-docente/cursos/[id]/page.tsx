import { Plus, FileText, Calendar, Users, BarChart3, Search, MoreVertical } from "lucide-react";

export default function DetalleCursoDocente() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* --- CABECERA DEL CURSO --- */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
               5to Secundaria "A"
             </span>
             <span className="text-gray-400 text-xs flex items-center gap-1">
               <Users size={14}/> 32 Alumnos
             </span>
          </div>
          <h1 className="text-3xl font-bold text-[#701C32]">Matemáticas Avanzadas</h1>
          <p className="text-gray-500 text-sm">Año Académico 2026 • Periodo I</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition">
              <BarChart3 size={18}/> Reportes
           </button>
           <button className="flex items-center gap-2 bg-[#701C32] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#8a223d] transition shadow-md">
              <Plus size={18}/> Crear Nuevo
           </button>
        </div>
      </div>

      {/* --- TABS (PESTAÑAS) --- */}
      {/* Aquí simulamos que estamos en la pestaña "Notas", que es la más compleja visualmente */}
      <div className="border-b border-gray-200 flex gap-6">
         <button className="pb-3 text-gray-500 hover:text-gray-700 font-medium text-sm">Tareas (4)</button>
         <button className="pb-3 text-gray-500 hover:text-gray-700 font-medium text-sm">Exámenes (2)</button>
         <button className="pb-3 border-b-2 border-[#701C32] text-[#701C32] font-bold text-sm">Registro de Notas</button>
         <button className="pb-3 text-gray-500 hover:text-gray-700 font-medium text-sm">Asistencia</button>
      </div>

      {/* --- CONTENIDO: TABLA DE NOTAS (Ejemplo) --- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Barra de herramientas de la tabla */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
           <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input 
                type="text" 
                placeholder="Buscar alumno..." 
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#701C32]"
              />
           </div>
           <div className="flex gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase self-center mr-2">Bimestre:</span>
              <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg p-2 focus:outline-none cursor-pointer">
                  <option>I Bimestre</option>
                  <option>II Bimestre</option>
              </select>
           </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-10">#</th>
                <th className="px-6 py-4">Apellidos y Nombres</th>
                <th className="px-4 py-4 text-center w-24 bg-blue-50/50 text-blue-800">Tarea 1</th>
                <th className="px-4 py-4 text-center w-24 bg-blue-50/50 text-blue-800">Tarea 2</th>
                <th className="px-4 py-4 text-center w-24 bg-purple-50/50 text-purple-800">Parcial</th>
                <th className="px-4 py-4 text-center w-24 bg-orange-50/50 text-orange-800">Final</th>
                <th className="px-6 py-4 text-center w-24 font-bold text-gray-900 bg-gray-50">Promedio</th>
                <th className="px-4 py-4 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Alumno 1 */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">1</td>
                <td className="px-6 py-4 font-bold text-gray-800">Alvarado Montenegro, Juan</td>
                <td className="px-4 py-4 text-center"><span className="bg-gray-100 px-2 py-1 rounded">15</span></td>
                <td className="px-4 py-4 text-center"><span className="bg-gray-100 px-2 py-1 rounded">14</span></td>
                <td className="px-4 py-4 text-center"><span className="bg-gray-100 px-2 py-1 rounded">16</span></td>
                <td className="px-4 py-4 text-center"><input type="text" placeholder="-" className="w-10 text-center border-b border-gray-300 focus:border-[#701C32] outline-none bg-transparent"/></td>
                <td className="px-6 py-4 text-center font-bold text-[#701C32]">15</td>
                <td className="px-4 py-4 text-center text-gray-400 hover:text-gray-600 cursor-pointer"><MoreVertical size={16}/></td>
              </tr>
              {/* Alumno 2 */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">2</td>
                <td className="px-6 py-4 font-bold text-gray-800">Benavides Torres, Maria</td>
                <td className="px-4 py-4 text-center"><span className="bg-gray-100 px-2 py-1 rounded">18</span></td>
                <td className="px-4 py-4 text-center"><span className="bg-gray-100 px-2 py-1 rounded">19</span></td>
                <td className="px-4 py-4 text-center"><span className="bg-gray-100 px-2 py-1 rounded">17</span></td>
                <td className="px-4 py-4 text-center"><input type="text" placeholder="-" className="w-10 text-center border-b border-gray-300 focus:border-[#701C32] outline-none bg-transparent"/></td>
                <td className="px-6 py-4 text-center font-bold text-blue-600">18</td>
                <td className="px-4 py-4 text-center text-gray-400 hover:text-gray-600 cursor-pointer"><MoreVertical size={16}/></td>
              </tr>
              {/* Alumno 3 */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium">3</td>
                <td className="px-6 py-4 font-bold text-gray-800">Castillo Vasquez, Pedro</td>
                <td className="px-4 py-4 text-center"><span className="bg-red-50 text-red-600 px-2 py-1 rounded">08</span></td>
                <td className="px-4 py-4 text-center"><span className="bg-gray-100 px-2 py-1 rounded">11</span></td>
                <td className="px-4 py-4 text-center"><span className="bg-gray-100 px-2 py-1 rounded">10</span></td>
                <td className="px-4 py-4 text-center"><input type="text" placeholder="-" className="w-10 text-center border-b border-gray-300 focus:border-[#701C32] outline-none bg-transparent"/></td>
                <td className="px-6 py-4 text-center font-bold text-red-600">09</td>
                <td className="px-4 py-4 text-center text-gray-400 hover:text-gray-600 cursor-pointer"><MoreVertical size={16}/></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}