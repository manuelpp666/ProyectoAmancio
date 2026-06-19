"use client";
import { useUser } from "@/src/context/userContext";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Users, Clock, ArrowRight, Loader2, LayoutDashboard, GraduationCap } from "lucide-react";
import { CursoDocente } from "@/src/interfaces/academic";
import { apiFetch } from "@/src/lib/api";

export default function InicioDocentePage() {

  // 1. Extraer datos reales del contexto
  const { id_usuario, role, loading, username } = useUser();
  const [cursos, setCursos] = useState<CursoDocente[]>([]);
  const [resumenData, setResumenData] = useState({ cursos: 0, alumnos: 0, pendientes: 0 });
  const [loadingData, setLoadingData] = useState(true);

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
      setLoadingData(true);
      try {
        // Llamadas en paralelo para mayor velocidad
        const [resResumen, resCursos] = await Promise.all([
          apiFetch(`/gestion/resumen-docente/${id_usuario}`),
          apiFetch(`/gestion/mis-cursos-docente-dashboard/${id_usuario}`)
        ]);

        const dataResumen = resResumen.ok ? await resResumen.json() : null;
        const dataCursos = resCursos.ok ? await resCursos.json() : [];

        if (dataResumen) setResumenData(dataResumen);
        setCursos(Array.isArray(dataCursos) ? dataCursos : []);

        // Llamada extra para traer el nombre del docente
        if (username) {
          const resPerfil = await apiFetch(`/perfil/mi-perfil/${username}`);
          if (resPerfil.ok) {
            const dataPerfil = await resPerfil.json();
            setNombreDocente(dataPerfil.datos.nombres);
          }
        }
      } catch (error) {
        console.error("Error al cargar dashboard:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (!loading && role === "DOCENTE") {
      fetchData();
    }
  }, [id_usuario, loading, role, username]);

  // 3. Estado de carga mientras se recupera la sesión
  if (loading || loadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
      </div>
    );
  }

  if (!role) return null;

  const tarjetas = [
    { label: "Cursos Asignados", val: resumenData.cursos.toString(), icon: BookOpen, color: "bg-[#701C32]/10 text-[#701C32]" },
    { label: "Alumnos Totales", val: resumenData.alumnos.toString(), icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Pendientes de Calificar", val: resumenData.pendientes.toString(), icon: Clock, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">

      {/* 1. HEADER TEXT */}
      <div>
        <h1 className="text-3xl font-bold text-[#701C32] mb-1">
          ¡Hola, {nombreDocente || "docente"}!
        </h1>
        <p className="text-gray-500 text-sm">Bienvenido a tu Campus Virtual. Este es el resumen de tu actividad.</p>
      </div>

      {/* 2. BANNER DE BIENVENIDA */}
      <div className="relative overflow-hidden bg-[#701C32] rounded-2xl p-8 md:p-10 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute -right-4 bottom-[-60px] w-44 h-44 rounded-full bg-white/5 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-[10px] font-bold tracking-widest mb-4 backdrop-blur-sm uppercase">
            <LayoutDashboard size={12} /> Panel del Docente
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-2 leading-tight">
            ¡Bienvenido, Docente {nombreDocente || "..."}!
          </h2>
          <p className="text-sm md:text-base text-white/85 capitalize">{fechaActual}</p>
        </div>
      </div>

      {/* 3. TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tarjetas.map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}>
              <item.icon size={26} />
            </div>
            <div>
              <p className="text-3xl font-black text-gray-800 leading-none">{item.val}</p>
              <p className="text-sm text-gray-500 mt-1">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. MIS CURSOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <BookOpen className="text-[#701C32]" size={20} /> Mis cursos
          </h3>
          <Link
            href="/campus/campus-docente/inicio-docente/cursos"
            className="text-[11px] font-black text-[#701C32] flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-wide"
          >
            Ver todos <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cursos.length > 0 ? (
            cursos.map((c) => (
              <Link
                key={c.id_carga}
                href={`/campus/campus-docente/inicio-docente/cursos/${c.id_carga}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className="h-2 w-full bg-[#701C32]"></div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF1E3] border border-[#F8EBDD] flex items-center justify-center text-[#701C32] mb-4 group-hover:scale-105 transition-transform">
                    <BookOpen size={22} />
                  </div>
                  <h4 className="font-black text-gray-800 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-[#701C32] transition-colors">
                    {c.curso_nombre}
                  </h4>
                  <p className="text-[11px] text-gray-400 mb-4 flex items-center gap-1">
                    <GraduationCap size={12} /> {c.grado_nombre}
                  </p>
                  <span className="mt-auto text-[11px] font-black text-[#701C32] flex items-center gap-1 group-hover:gap-2 transition-all uppercase">
                    Gestionar <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No tienes cursos asignados para el año escolar actual.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
