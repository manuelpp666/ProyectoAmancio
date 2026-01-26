import Link from "next/link";
import { BookOpen, Users, Clock, ArrowRight } from "lucide-react";

export default function InicioDocentePage() {
  const resumen = [
    { label: "Cursos Asignados", val: "5", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
    { label: "Alumnos Totales", val: "124", icon: Users, color: "bg-green-50 text-green-600" },
    { label: "Pendientes de Calificar", val: "12", icon: Clock, color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#701C32]">Panel de Control</h1>
        <p className="text-gray-500">Resumen de actividad académica</p>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resumen.map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.color}`}>
              <item.icon size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{item.val}</p>
              <p className="text-sm text-gray-500">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ACCIONES RÁPIDAS */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg text-gray-800">Mis Cursos Recientes</h2>
          <Link href="/campus/campus-docente/inicio-docente/cursos" className="text-[#701C32] text-sm font-medium hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={16}/>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Card Curso 1 */}
           <Link href="/campus/campus-docente/inicio-docente/cursos/1" className="group block">
              <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow hover:border-[#701C32]/30 bg-white">
                 <div className="flex justify-between items-start mb-4">
                    <span className="bg-[#701C32]/10 text-[#701C32] text-xs font-bold px-2 py-1 rounded">5to Sec. A</span>
                 </div>
                 <h3 className="font-bold text-gray-900 group-hover:text-[#701C32] transition-colors">Matemáticas Avanzadas</h3>
                 <p className="text-xs text-gray-500 mt-2">32 Alumnos • 2 Tareas pendientes</p>
              </div>
           </Link>
           {/* Card Curso 2 */}
           <Link href="/campus/campus-docente/inicio-docente/cursos/2" className="group block">
              <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow hover:border-[#701C32]/30 bg-white">
                 <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">4to Sec. B</span>
                 </div>
                 <h3 className="font-bold text-gray-900 group-hover:text-[#701C32] transition-colors">Física Elemental</h3>
                 <p className="text-xs text-gray-500 mt-2">28 Alumnos • Al día</p>
              </div>
           </Link>
        </div>
      </div>
    </div>
  );
}