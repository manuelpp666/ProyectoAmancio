"use client";
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import Link from "next/link";
import { NoticiaResponse } from "@/src/interfaces/noticia";
import { NoticiaRow } from "@/src/components/Noticia/TablaNoticia";
import { useEffect, useState } from 'react';
import { Search, Newspaper, Video, Globe, Plus } from "lucide-react";
import { RoleGuard } from '@/src/components/auth/RoleGuard';

export default function GestionContenidoPage() {

  const [noticias, setNoticias] = useState<NoticiaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const fetchNoticias = async () => {
      // Opcional: solo poner loading true si es la primera carga
      // setLoading(true); 
      try {
        let url = `${process.env.NEXT_PUBLIC_API_URL}/web/noticias/`;
        if (searchTerm) {
          url += `?search=${encodeURIComponent(searchTerm)}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setNoticias(data);
      } catch (error) {
        console.error("Error cargando noticias:", error);
      } finally {
        setLoading(false);
      }
    };

    // 2. Debounce de 400ms
    const timer = setTimeout(() => {
      fetchNoticias();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);



  const stats = {
    total: noticias.length,
    articulos: noticias.filter(n => n.categoria === 'texto').length,
    videos: noticias.filter(n => n.categoria === 'video').length,

  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-[#F8FAFC]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#093E7A] mb-4"></div>
      <p className="font-bold">Cargando noticias...</p>
    </div>
  );

  return (
    
    <RoleGuard modulo="contenido_web" subModulo="noticias">
    <div className="h-full bg-[#F8FAFC]">
      <div className="flex h-full overflow-hidden">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header/Tabs Section */}
          <HeaderPanel />

          {/* BARRA SUPERIOR ESTÁNDAR */}
          <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0 gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-[#093E7A]">newspaper</span>
              <h2 className="text-xl font-bold text-gray-800">Gestión de Noticias</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#093E7A] transition-colors">
                  <Search size={16} strokeWidth={2.5} />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar noticia..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] transition-all text-sm"
                />
              </div>
              <Link href="/campus/panel-control/pagina-web/noticias-web/nueva-noticia">
                <button className="flex items-center gap-2 px-5 py-2 bg-[#093E7A] text-white rounded-lg hover:bg-[#062d59] transition-all font-bold text-sm shadow-sm active:scale-95">
                  <Plus size={18} strokeWidth={3} />
                  Nueva Noticia
                </button>
              </Link>
            </div>
          </div>

          {/* Content Container */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

            {/* STATS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Total Publicado"
                value={stats.total.toString()}
                icon={<Globe size={24} />}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <StatCard
                label="Artículos de Texto"
                value={stats.articulos.toString()}
                icon={<Newspaper size={24} />}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <StatCard
                label="Videos YouTube"
                value={stats.videos.toString()}
                icon={<Video size={24} />}
                color="text-red-600"
                bg="bg-red-50"
              />

            </div>

            {/* TABLA */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Noticia</th>
                      <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">Categoría</th>
                      <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">F. Publicación</th>
                      <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-center">Estado</th>
                      <th className="px-8 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {noticias.map((n) => (
                      <NoticiaRow key={n.id_noticia} noticia={n} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
    </RoleGuard>
  );
}

function StatCard({ label, value, icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
      <div className="flex items-center gap-5">
        <div className={`p-4 ${bg} ${color} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
          <h4 className="text-3xl font-black text-gray-900 mt-1">{value}</h4>
        </div>
      </div>
    </div>
  );
}