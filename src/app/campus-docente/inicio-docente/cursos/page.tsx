import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export default function MisCursosDocente() {
  const cursos = [
    { id: 1, nombre: "Matemática", grado: "5to Secundaria", seccion: "A", alumnos: 32, img: "/matematicas.png" },
    { id: 2, nombre: "Física", grado: "4to Secundaria", seccion: "B", alumnos: 28, img: "/cienciasS.png" },
    { id: 3, nombre: "Matemática", grado: "3ro Secundaria", seccion: "C", alumnos: 30, img: "/matematicas.png" },
    { id: 4, nombre: "Raz. Matemático", grado: "5to Secundaria", seccion: "Unica", alumnos: 35, img: "/quimica.png" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-[#701C32]">Mis Cursos Asignados</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cursos.map((curso) => (
          <div key={curso.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col">
            <div className="h-32 bg-gray-50 flex items-center justify-center p-4 border-b border-gray-100">
               <img src={curso.img} alt={curso.nombre} className="h-full object-contain opacity-90" />
            </div>
            <div className="p-5 flex-1 flex flex-col">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{curso.grado} - {curso.seccion}</span>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                     <Users size={12}/> {curso.alumnos}
                  </div>
               </div>
               <h3 className="font-bold text-gray-900 text-lg mb-4">{curso.nombre}</h3>
               
               <div className="mt-auto">
                 <Link 
                   href={`/campus-docente/inicio-docente/cursos/${curso.id}`}
                   className="w-full flex items-center justify-center gap-2 bg-white border border-[#701C32] text-[#701C32] py-2 rounded-lg font-bold text-sm hover:bg-[#701C32] hover:text-white transition-colors"
                 >
                   Gestionar Curso <ArrowRight size={16}/>
                 </Link>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}