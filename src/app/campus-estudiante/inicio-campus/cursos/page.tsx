// src/app/campus-estudiante/inicio-campus/cursos/page.tsx
import { ArrowRight, ChevronDown } from "lucide-react";

export default function CursosPage() {
  const cursos = [
    { title: "Matemática", prof: "Puicon Rivera, José Emmanuel", img: "/matematicas.png" }, // Reemplaza con tus rutas reales
    { title: "Religión", prof: "Puicon Rivera, José Emmanuel", img: "/religion.png" },
    { title: "Ciencias Sociales", prof: "Puicon Rivera, José Emmanuel", img: "/cienciasS.png" },
    { title: "Comunicación", prof: "Puicon Rivera, José Emmanuel", img: "/comunicacion.png" },
    { title: "Química", prof: "Puicon Rivera, José Emmanuel", img: "/quimica.png" },
    { title: "Cívica", prof: "Puicon Rivera, José Emmanuel", img: "/matematicas.png" }, // Placeholder
    { title: "Educación Física", prof: "Puicon Rivera, José Emmanuel", img: "/religion.png" },
    { title: "Relaciones Humanas", prof: "Puicon Rivera, José Emmanuel", img: "/cienciasS.png" },
    { title: "Razonamiento Verbal", prof: "Puicon Rivera, José Emmanuel", img: "/comunicacion.png" },
    { title: "Razonamiento Matemático", prof: "Puicon Rivera, José Emmanuel", img: "/quimica.png" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-8">
      
      {/* CABECERA Y FILTROS */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32] mb-4">Mis Cursos</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Ordenar por</span>
            <div className="relative">
              <select className="appearance-none bg-white border border-[#701C32] text-[#701C32] text-sm font-bold py-1.5 pl-3 pr-8 rounded focus:outline-none cursor-pointer">
                <option>Nombre</option>
                <option>Progreso</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#701C32] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#701C32]">Año académico</span>
            <div className="relative">
              <select className="appearance-none bg-white border border-[#701C32] text-gray-700 text-sm py-1.5 pl-3 pr-8 rounded focus:outline-none cursor-pointer">
                <option>2026</option>
                <option>2025</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
        </div>
      </div>

      {/* GRILLA DE CURSOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {cursos.map((curso, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full">
            {/* Imagen */}
            <div className="h-32 w-full flex items-center justify-center mb-4 p-2">
               {/* IMPORTANTE: Asegúrate de que las rutas 'img' existan en /public o usa placehold.co */}
              <img src={curso.img} alt={curso.title} className="h-full w-auto object-contain" />
            </div>
            
            {/* Contenido */}
            <div className="flex flex-col flex-1">
              <h3 className="font-bold text-gray-900 text-sm mb-1">{curso.title}</h3>
              <p className="text-[11px] text-gray-500 mb-4">{curso.prof}</p>
              
              <div className="mt-auto flex justify-end">
                <button className="text-[11px] font-bold text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all">
                  Ir al curso <ArrowRight size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}