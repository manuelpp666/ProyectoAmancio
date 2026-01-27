"use client";
import React from 'react';
import HeaderPanel from "@/src/components/Campus/PanelControl/Header";
import { 
  FileUp, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Plus, 
  Filter, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Globe, 
  Lock,
  ChevronRight
} from "lucide-react";

export default function CalendarioPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] antialiased">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        
        <HeaderPanel />

        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
          
          {/* SECCIÓN 01: CARGA DE PDF */}
          <section className="max-w-6xl mx-auto w-full">
            <div className="mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Carga de Calendario (PDF)</h3>
              <p className="text-sm text-gray-500 font-medium">Actualiza el documento oficial del calendario escolar para descarga pública.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Dropzone Area */}
              <div className="lg:col-span-2 group relative border-2 border-dashed border-gray-200 rounded-[2rem] p-12 flex flex-col items-center justify-center bg-white hover:border-[#093E7A]/40 hover:bg-[#093E7A]/[0.02] transition-all cursor-pointer">
                <div className="bg-[#093E7A]/5 p-6 rounded-3xl mb-4 group-hover:scale-110 transition-transform duration-500">
                  <FileUp size={48} className="text-[#093E7A]" strokeWidth={1.5} />
                </div>
                <h4 className="text-lg font-black text-gray-900 tracking-tight">Arrastra el nuevo calendario aquí</h4>
                <p className="text-sm text-gray-400 mt-2 font-medium">O haz clic para seleccionar un archivo de tu computadora</p>
                <div className="mt-6 flex gap-3">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">PDF Permitido</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-widest">Máx 15MB</span>
                </div>
              </div>

              {/* Status Card */}
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                      Archivo Activo
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">Calendario_2024.pdf</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">Subido: 15 Dic, 2023</p>
                      <p className="text-[10px] text-[#093E7A] font-black mt-0.5">3.2 MB</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] shadow-lg shadow-[#093E7A]/20 transition-all font-black text-[11px] uppercase tracking-widest active:scale-[0.98]">
                    <Download size={16} strokeWidth={2.5} />
                    Descargar Actual
                  </button>
                  <button className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-black text-[11px] uppercase tracking-widest">
                    <Eye size={16} strokeWidth={2.5} />
                    Previsualizar
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 02: GESTIÓN DE EVENTOS */}
          <section className="max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase">Gestión de Eventos del Año</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Administra fechas clave, exámenes y ceremonias institucionales.</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 bg-white rounded-xl hover:bg-gray-50 transition-all text-gray-600 font-black text-[11px] uppercase tracking-widest">
                  <Filter size={16} />
                  Filtrar
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] shadow-lg shadow-[#093E7A]/10 transition-all font-black text-[11px] uppercase tracking-widest">
                  <Plus size={18} strokeWidth={3} />
                  Agregar Evento
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Evento / Actividad</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Fecha</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Categoría</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Visibilidad</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <EventRow 
                      title="Exámenes Bimestrales - I Periodo"
                      subtitle="Evaluaciones integrales para todos los niveles"
                      date="15 Abr - 19 Abr, 2024"
                      category="Académico"
                      categoryColor="bg-blue-50 text-blue-600"
                      isPublic={true}
                    />
                    <EventRow 
                      title="Día del Trabajador"
                      subtitle="Suspensión de labores académicas"
                      date="01 May, 2024"
                      category="Feriado"
                      categoryColor="bg-orange-50 text-orange-600"
                      isPublic={true}
                    />
                    <EventRow 
                      title="Ceremonia de Entrega de Diplomas"
                      subtitle="Evento protocolar en el auditorio principal"
                      date="22 May, 2024"
                      category="Ceremonia"
                      categoryColor="bg-purple-50 text-purple-600"
                      isPublic={false}
                    />
                  </tbody>
                </table>
              </div>
              <div className="p-5 bg-gray-50/50 flex justify-center">
                <button className="flex items-center gap-2 text-[11px] font-black text-[#093E7A] uppercase tracking-widest hover:gap-4 transition-all">
                  Ver todos los eventos del año
                  <ChevronRight size={14} strokeWidth={3} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function EventRow({ title, subtitle, date, category, categoryColor, isPublic }) {
  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="px-8 py-6">
        <div className="flex flex-col gap-0.5">
          <span className="font-black text-gray-900 text-sm tracking-tight">{title}</span>
          <span className="text-[11px] text-gray-400 font-medium">{subtitle}</span>
        </div>
      </td>
      <td className="px-8 py-6">
        <div className="flex items-center gap-2.5 text-gray-600">
          <Calendar size={14} className="text-gray-400" />
          <span className="text-[12px] font-bold">{date}</span>
        </div>
      </td>
      <td className="px-8 py-6">
        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${categoryColor}`}>
          {category}
        </span>
      </td>
      <td className="px-8 py-6">
        {isPublic ? (
          <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-wider">
            <Globe size={14} strokeWidth={2.5} /> Público
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-gray-400 font-black text-[10px] uppercase tracking-wider">
            <Lock size={14} strokeWidth={2.5} /> Privado
          </span>
        )}
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 text-gray-400 hover:text-[#093E7A] hover:bg-white rounded-lg shadow-sm transition-all border border-transparent hover:border-gray-100">
            <Edit3 size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm transition-all border border-transparent hover:border-gray-100">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}