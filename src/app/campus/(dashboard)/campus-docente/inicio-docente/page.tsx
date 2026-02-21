"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, Users, Clock, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"
import { useState } from "react";
interface CursoDocente {
  id_carga: number;
  nombre: string;
  grado_seccion: string;
}

export default function InicioDocentePage() {

  // 1. Extraer datos reales del contexto

  const router = useRouter();
  const { id_usuario, role, loading } = useUser();
  const [cursos, setCursos] = useState<CursoDocente[]>([]);
const [resumenData, setResumenData] = useState({ cursos: 0, alumnos: 0, pendientes: 0 });
  useEffect(() => {
  const fetchData = async () => {
    if (!id_usuario) return;
    try {
      // Llamadas en paralelo para mayor velocidad
      const [resResumen, resCursos] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/resumen-docente/${id_usuario}`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/mis-cursos-docente-dashboard/${id_usuario}`)
      ]);
      
      const dataResumen = await resResumen.json();
      const dataCursos = await resCursos.json();
      
      setResumenData(dataResumen);
      setCursos(dataCursos);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    }
  };

  if (!loading && role === "DOCENTE") {
    fetchData();
  }
}, [id_usuario, loading, role]);
  // 2. Proteger la ruta: Si no es estudiante, lo expulsamos
  useEffect(() => {
    if (!loading) {
      if (!role) {
        router.push("/campus"); // No ha iniciado sesión
      } else if (role !== "DOCENTE") {
        router.push("/prohibido"); // Es admin o estudiante intentando entrar aquí
      }
    }
  }, [role, loading, router]);

  // 3. Estado de carga mientras se recupera la sesión del localStorage
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
      </div>
    );
  }

  // Si no hay rol (y ya terminó de cargar), no renderizamos nada para evitar parpadeos
  if (!role) return null;


  const tarjetas = [
  { label: "Cursos Asignados", val: resumenData.cursos.toString(), icon: BookOpen, color: "bg-blue-50 text-blue-600" },
  { label: "Alumnos Totales", val: resumenData.alumnos.toString(), icon: Users, color: "bg-green-50 text-green-600" },
  { label: "Pendientes de Calificar", val: resumenData.pendientes.toString(), icon: Clock, color: "bg-orange-50 text-orange-600" },
];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#701C32]">Panel de Control</h1>
        <p className="text-gray-500">Resumen de actividad académica</p>
      </div>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tarjetas.map((item, i) => (
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
            Ver todos <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cursos.length > 0 ? (
            cursos.map((c) => (
              <Link
                key={c.id_carga}
                href={`/campus/campus-docente/inicio-docente/cursos/${c.id_carga}`}
                className="group block"
              >
                <div className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                  <span className="bg-[#701C32]/10 text-[#701C32] text-xs font-bold px-2 py-1 rounded">
                    {c.grado_seccion}
                  </span>
                  <h3 className="font-bold text-gray-900 mt-2 group-hover:text-[#701C32]">{c.nombre}</h3>
                </div>
              </Link>
            ))
          ) : (
            // Mensaje cuando no hay cursos
            <div className="col-span-full py-10 text-center border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-gray-500">No tienes cursos asignados para el año escolar actual.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}