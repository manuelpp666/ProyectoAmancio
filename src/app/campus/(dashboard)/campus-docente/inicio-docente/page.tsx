"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, Users, Clock, ArrowRight, Loader2, LayoutDashboard } from "lucide-react";
import { useRouter } from "next/navigation"
import { useState } from "react";
import { CursoDocente } from "@/src/interfaces/academic";
import { apiFetch } from "@/src/lib/api";

export default function InicioDocentePage() {

  // 1. Extraer datos reales del contexto
  const router = useRouter();
  const { id_usuario, role, loading, username } = useUser();
  const [cursos, setCursos] = useState<CursoDocente[]>([]);
  const [resumenData, setResumenData] = useState({ cursos: 0, alumnos: 0, pendientes: 0 });

  // --- NUEVOS ESTADOS ---
  const [nombreDocente, setNombreDocente] = useState("");
  const [fechaActual, setFechaActual] = useState("");

  // --- OBTENER FECHA ACTUAL ---
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const formatted = new Intl.DateTimeFormat('es-PE', options).format(new Date());
    setFechaActual(formatted.charAt(0).toUpperCase() + formatted.slice(1));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id_usuario) return;
      try {
        // Llamadas en paralelo para mayor velocidad
        const [resResumen, resCursos] = await Promise.all([
          apiFetch(`/gestion/resumen-docente/${id_usuario}`),
          apiFetch(`/gestion/mis-cursos-docente-dashboard/${id_usuario}`)
        ]);

        const dataResumen = await resResumen.json();
        const dataCursos = await resCursos.json();

        setResumenData(dataResumen);
        setCursos(dataCursos);

        // Llamada extra para traer el nombre del docente
        if (username) {
          const resPerfil = await apiFetch(`/perfil/mi-perfil/${username}`);
          if (resPerfil.ok) {
            const dataPerfil = await resPerfil.json();
            setNombreDocente(dataPerfil.datos.nombres); // Extrae los nombres de la BD
          }
        }
      } catch (error) {
        console.error("Error al cargar dashboard:", error);
      }
    };

    if (!loading && role === "DOCENTE") {
      fetchData();
    }
  }, [id_usuario, loading, role, username]);

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
      
      {/* BANNER DE BIENVENIDA (El recuadro rojo que solicitaste) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#701C32] to-[#922a44] rounded-2xl p-8 shadow-lg shadow-[#701C32]/10">
        <div className="relative z-10">
          <h3 className="text-white text-3xl font-black italic tracking-tight">
            ¡Bienvenido, Docente {nombreDocente || "..."}!
          </h3>
          <p className="text-white/80 mt-2 font-medium">
            {fechaActual}
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
          <LayoutDashboard className="w-48 h-48 text-white" />
        </div>
      </div>

      {/* TARJETAS RESUMEN (Tus tarjetas originales intactas) */}
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

      {/* ACCIONES RÁPIDAS (Tus listas de cursos originales intactas) */}
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
                    {c.grado_nombre}
                  </span>
                  <h3 className="font-bold text-gray-900 mt-2 group-hover:text-[#701C32]">{c.curso_nombre}</h3>
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