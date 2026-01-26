"use client";
import HeaderPanel from "@/src/components/PanelControl/Header";
import Link from "next/link";
import { 
  Plus, 
  Filter, 
  FileText, 
  PlayCircle, 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  FileType2, 
  Eye, 
  Settings2,
  Phone,
  Mail,
  School
} from "lucide-react";

export default function GestionContenidoPage() {
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
                <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-all text-gray-700 font-bold text-sm shadow-sm active:scale-95">
                  <Filter size={18} className="text-gray-400" />
                  Filtrar
                </button>
                <Link href="/panel-control/pagina-web/noticias-web/nueva-noticia">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-black text-sm shadow-lg shadow-[#093E7A]/20 active:scale-95">
                    <Plus size={20} strokeWidth={3} />
                    NUEVA NOTICIA
                  </button>
                </Link>
              </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Título de la Noticia</th>
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Tipo</th>
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Publicación</th>
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">Estado</th>
                      <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-[0.1em] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Fila 1 */}
                    <tr className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-200 bg-cover bg-center shadow-inner shrink-0" 
                               style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCh32VtVoO8W4i7CVawGGKgBb-6N9NQ-6i3bUVsWp1zDUeWBNlnSXgowCEkImNleJtUFA1gXhVxWuZOM10VsqJqifUoHBeTBAfb39w2elDykLB7qNqdGAf6epKcSdptOAai9UMmQEak8k8gFj_D3r1j2_iTuZhFAtOSi2NNpmuu2pOa6Z0HbBA5rixlpaBzdEd2jsg4WNlxEXH3OA5lFOHHTVYMpQygtRfz_7CaG-saTkO2m9avMt7b6J4G8RVlaXVzJMFZgoOI2N66')" }}></div>
                          <span className="font-bold text-gray-900 group-hover:text-[#093E7A] transition-colors line-clamp-1">
                            Inauguración del nuevo laboratorio de ciencias
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 uppercase">
                          <FileText size={14} /> Texto
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">12 Oct 2023</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-emerald-50 text-emerald-700 uppercase">
                          <CheckCircle2 size={14} /> Publicado
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button className="p-2 text-gray-400 hover:text-[#093E7A] hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={18} /></button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                    {/* Fila 2 */}
                    <tr className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-200 bg-cover bg-center shadow-inner shrink-0" 
                               style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAf2uZYC4MPZIZdZEDpXUQQL4c5QGA56jWALoLzzMW_EU7cBAoZYQsNl8Y4Lh3I5iocEn8VqP0gqMKDz4yKsB7ReRBuMHQyC48NpD2Jgq_JWjYYAdCpjMXu4j1cmMtHPf_cIurbfsjZTqQeIJvf2OzzZthLZaOLtuy1CMpb-r4vUDekjWmlScNn1CD0LcIypHWj1m7LznzoZn-m4jjWmdroqLvvQM6PjHSWwAF05KQc1jNZ4PdnQCuHt3DgpsbNiW5xJE83qnxPc7o_')" }}></div>
                          <span className="font-bold text-gray-900 group-hover:text-[#093E7A] transition-colors line-clamp-1">
                            Resumen: Olimpiadas Matemáticas 2023
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-purple-50 text-purple-700 uppercase">
                          <PlayCircle size={14} /> Video
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">08 Oct 2023</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black bg-amber-50 text-amber-700 uppercase">
                          <Clock size={14} /> Borrador
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button className="p-2 text-gray-400 hover:text-[#093E7A] hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={18} /></button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* PDF Upload Card */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <FileType2 className="text-[#093E7A]" size={24} />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 tracking-tight">Calendario Anual</h4>
                  </div>
                  <span className="text-[10px] bg-gray-100 text-gray-500 font-black px-2 py-1 rounded uppercase tracking-widest">PDF Máx 10MB</span>
                </div>
                
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/50 hover:border-[#093E7A]/30 transition-all cursor-pointer group">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className="text-[#093E7A]" size={40} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-bold text-gray-900">Click para subir o arrastra el archivo</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Solo formato PDF oficial del año lectivo</p>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 group">
                  <div className="flex items-center gap-4">
                    <div className="bg-red-50 p-2 rounded-lg">
                      <FileText className="text-red-600" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Calendario_Escolar_2023-24.pdf</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Subido el 01/09/2023 • 2.4 MB</p>
                    </div>
                  </div>
                  <button className="bg-white p-2 text-gray-400 hover:text-[#093E7A] hover:shadow-md rounded-full transition-all">
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              {/* Quick Info Card */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Settings2 className="text-amber-600" size={24} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 tracking-tight">Información de Contacto</h4>
                </div>
                
                <div className="space-y-5">
                  <div className="group">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 px-1">
                      <School size={12} className="text-[#093E7A]" /> Nombre Institucional
                    </label>
                    <input className="w-full h-12 border-gray-200 bg-gray-50/50 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] font-bold text-gray-700 transition-all" type="text" defaultValue="Colegio Amancio Varona" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 px-1">
                        <Mail size={12} className="text-[#093E7A]" /> Email Central
                      </label>
                      <input className="w-full h-12 border-gray-200 bg-gray-50/50 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] font-bold text-gray-700 transition-all" type="email" defaultValue="info@amanciovarona.edu.pe" />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 px-1">
                        <Phone size={12} className="text-[#093E7A]" /> Teléfono
                      </label>
                      <input className="w-full h-12 border-gray-200 bg-gray-50/50 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] font-bold text-gray-700 transition-all" type="text" defaultValue="+51 987 654 321" />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button className="w-full py-4 bg-[#093E7A] text-white rounded-xl font-black text-sm hover:bg-[#062d59] transition-all shadow-xl shadow-[#093E7A]/20 uppercase tracking-widest active:scale-[0.98]">
                      GUARDAR CAMBIOS GENERALES
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}