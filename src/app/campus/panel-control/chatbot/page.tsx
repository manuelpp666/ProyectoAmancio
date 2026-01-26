"use client";
import React from 'react';
import { 
  CloudUpload, 
  FileText, 
  Search, 
  RefreshCw, 
  Trash2, 
  Settings2, 
  MessageSquare, 
  PlayCircle,
  CheckCircle2,
  Loader2,
  FileImage,
  Info
} from "lucide-react";

export default function ChatbotKnowledgePage() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] antialiased">
      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
        
        <div className="p-8 space-y-10 max-w-[1400px] mx-auto w-full">
          
          <header>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Entrenamiento del Chatbot</h2>
            <p className="text-sm text-gray-500 font-medium">Gestiona la información que alimenta la inteligencia del asistente virtual.</p>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* COLUMNA IZQUIERDA: GESTIÓN DE ARCHIVOS (8/12) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Card de Subida Estilo Dropzone */}
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-[#093E7A]/5 rounded-lg text-[#093E7A]">
                    <CloudUpload size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Subir Nueva Información</h3>
                </div>
                
                <div className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-12 flex flex-col items-center justify-center bg-gray-50/30 hover:bg-[#093E7A]/[0.02] hover:border-[#093E7A]/30 transition-all cursor-pointer group">
                  <div className="bg-white p-5 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform duration-500">
                    <FileText size={40} className="text-gray-400 group-hover:text-[#093E7A]" />
                  </div>
                  <p className="text-gray-900 font-black text-sm tracking-tight">Haz clic o arrastra archivos aquí</p>
                  <p className="text-gray-400 text-[11px] mt-1 font-bold uppercase tracking-tighter">PDF, DOCX, PNG (Máx. 10MB)</p>
                  
                  <button className="mt-8 bg-[#093E7A] text-white px-10 py-3 rounded-xl font-black text-[11px] uppercase tracking-[0.15em] shadow-lg shadow-[#093E7A]/20 hover:bg-[#062d59] transition-all active:scale-95">
                    Seleccionar Archivos
                  </button>
                </div>
              </div>

              {/* Tabla de Documentos */}
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Documentos Entrenados</h3>
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      className="w-full pl-11 pr-4 py-2.5 text-xs font-bold border border-gray-100 bg-gray-50 rounded-xl focus:ring-2 focus:ring-[#093E7A]/20 focus:bg-white transition-all outline-none" 
                      placeholder="BUSCAR DOCUMENTO..." 
                      type="text" 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre del Archivo</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      <KnowledgeRow 
                        name="Reglamento_Interno_2024.pdf" 
                        date="20 May, 2024" 
                        status="Procesado" 
                        icon={<FileText className="text-red-500" size={18} />}
                      />
                      <KnowledgeRow 
                        name="Guia_Admisiones_V2.docx" 
                        date="22 May, 2024" 
                        status="Entrenando" 
                        icon={<FileText className="text-blue-500" size={18} />}
                      />
                      <KnowledgeRow 
                        name="Mapa_Campus_Principal.png" 
                        date="24 May, 2024" 
                        status="Procesado" 
                        icon={<FileImage className="text-amber-500" size={18} />}
                      />
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: CONFIGURACIÓN (4/12) */}
            <div className="lg:col-span-4">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm sticky top-8 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#093E7A]/5 rounded-lg text-[#093E7A]">
                    <Settings2 size={20} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Configuración</h3>
                </div>

                <form className="space-y-6">

                  <div className="pt-4 flex flex-col gap-3">
                    <button className="w-full bg-[#093E7A] text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-[#093E7A]/20 hover:scale-[1.02] transition-all">
                      Guardar Cambios
                    </button>
                    <button className="w-full border border-gray-100 text-gray-600 py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                      <PlayCircle size={16} />
                      Probar Chatbot
                    </button>
                  </div>
                </form>
                
                {/* Status de Memoria */}
                <div className="pt-8 border-t border-gray-50">
                  <div className="flex justify-between items-end mb-3">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacidad Usada</p>
                      <p className="text-sm font-black text-gray-900">850 / 1000 Docs</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase">Óptimo</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-[#093E7A] h-full w-[85%] rounded-full shadow-[0_0_10px_rgba(9,62,122,0.3)]"></div>
                  </div>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}

function KnowledgeRow({ name, date, status, icon }) {
  const isProcessing = status === "Entrenando";

  return (
    <tr className="group hover:bg-gray-50/50 transition-colors">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-white transition-colors group-hover:shadow-sm group-hover:scale-110 duration-300">
            {icon}
          </div>
          <span className="text-sm font-black text-gray-900 tracking-tight">{name}</span>
        </div>
      </td>
      <td className="px-8 py-6 text-xs font-bold text-gray-500 uppercase tracking-tighter">
        {date}
      </td>
      <td className="px-8 py-6">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
          isProcessing ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {isProcessing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <CheckCircle2 size={12} />
          )}
          {status}
        </span>
      </td>
      <td className="px-8 py-6 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
          <button className="p-2 text-gray-400 hover:text-[#093E7A] hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all">
            <RefreshCw size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-100 transition-all">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}