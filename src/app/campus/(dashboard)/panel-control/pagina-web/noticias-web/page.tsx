"use client";
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import Link from "next/link";
import {
  Plus,
  Filter,
} from "lucide-react";
import { NoticiaResponse } from "@/src/interfaces/noticia";
import { NoticiaRow } from "@/src/components/Noticia/TablaNoticia";
import { useEffect, useState } from 'react';
import { Search, Newspaper, Video, Globe, Facebook } from "lucide-react";

export default function GestionContenidoPage() {

  const [noticias, setNoticias] = useState<NoticiaResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/`);
        const data = await response.json();
        setNoticias(data);
      } catch (error) {
        console.error("Error cargando noticias:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNoticias();
  }, []);

  const stats = {
    total: noticias.length,
    articulos: noticias.filter(n => n.categoria === 'texto').length,
    videos: noticias.filter(n => n.categoria === 'video').length,
    
  };

  if (loading) return <p className="p-8">Cargando noticias...</p>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex h-screen overflow-hidden">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header/Tabs Section */}
          <HeaderPanel />

          {/* Content Container */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Artículos y Multimedia</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">Administra las noticias, comunicados y videos del portal principal.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-80 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#093E7A] transition-colors">
                    <Search size={18} strokeWidth={2.5} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por título..."
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] transition-all font-medium text-sm shadow-sm"
                  />
                </div>
                <Link href="/campus/panel-control/pagina-web/noticias-web/nueva-noticia">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-black text-sm shadow-lg shadow-[#093E7A]/20 active:scale-95">
                    <Plus size={20} strokeWidth={3} />
                    NUEVA NOTICIA
                  </button>
                </Link>
              </div>
            </div>

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