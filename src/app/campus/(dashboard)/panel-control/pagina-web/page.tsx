"use client";
import React from 'react';
import HeaderPanel from '@/src/components/Campus/PanelControl/Header';
import { 
  Save, 
  FileText, 
  Image as ImageIcon, 
  Upload, 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Twitter,
  Building2,
  PlusCircle,
  Globe
} from 'lucide-react';

export default function GestionContenidoPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="flex h-screen overflow-hidden">
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
          <HeaderPanel />

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-5xl mx-auto space-y-10">
              
              {/* Header de la Página */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight">Configuración General</h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">Edita los textos, imágenes y datos institucionales del sitio web.</p>
                </div>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#093E7A] text-white rounded-xl hover:bg-[#062d59] transition-all font-black text-sm shadow-lg shadow-[#093E7A]/20 active:scale-95 shrink-0">
                  <Save size={18} strokeWidth={3} />
                  GUARDAR TODO
                </button>
              </div>

              <div className="space-y-8">
                
                {/* SECCIÓN: Textos de Páginas */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-[#701C32]/10 rounded-lg">
                      <FileText size={20} className="text-[#701C32]" />
                    </div>
                    <h4 className="font-black text-[#701C32] uppercase tracking-wider text-sm">Textos de Páginas</h4>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Inicio / Bienvenida</label>
                      <textarea className="w-full border-gray-200 bg-gray-50/30 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] font-medium p-4 transition-all" placeholder="Texto de bienvenida..." rows={4}></textarea>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Nosotros / Historia</label>
                      <textarea className="w-full border-gray-200 bg-gray-50/30 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] font-medium p-4 transition-all" placeholder="Descripción del colegio..." rows={4}></textarea>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Misión Institucional</label>
                      <textarea className="w-full border-gray-200 bg-gray-50/30 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] font-medium p-4 transition-all" placeholder="Nuestra misión..." rows={3}></textarea>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">Visión Institucional</label>
                      <textarea className="w-full border-gray-200 bg-gray-50/30 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] font-medium p-4 transition-all" placeholder="Nuestra visión..." rows={3}></textarea>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN: Gestión de Imágenes */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-[#701C32]/10 rounded-lg">
                      <ImageIcon size={20} className="text-[#701C32]" />
                    </div>
                    <h4 className="font-black text-[#701C32] uppercase tracking-wider text-sm">Gestión de Multimedia</h4>
                  </div>
                  <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
                    <ImageUploader label="Banner Principal" hint="1920x600px recomendado" icon={<Upload size={20} />} />
                    <ImageUploader label="Galería Fotos" hint="Múltiples archivos" icon={<PlusCircle size={20} />} />
                    <ImageUploader label="Logos Oficiales" hint="PNG transparente" icon={<Building2 size={20} />} />
                  </div>
                </div>

                {/* SECCIÓN: Datos Institucionales */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="p-2 bg-[#701C32]/10 rounded-lg">
                      <Globe size={20} className="text-[#701C32]" />
                    </div>
                    <h4 className="font-black text-[#701C32] uppercase tracking-wider text-sm">Información de Contacto</h4>
                  </div>
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <InputWithIcon label="Dirección" icon={<MapPin size={16} />} defaultValue="Av. Principal 123, Ciudad" />
                      <InputWithIcon label="Teléfono Central" icon={<Phone size={16} />} defaultValue="+51 123 456 789" />
                      <InputWithIcon label="Correo de Admisión" icon={<Mail size={16} />} defaultValue="admision@colegio.edu.pe" />
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest block mb-5">Redes Sociales Oficiales</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SocialInput icon={<Facebook size={18} />} color="bg-blue-600" placeholder="facebook.com/colegio" />
                        <SocialInput icon={<Instagram size={18} />} color="bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500" placeholder="@colegio_oficial" />
                        <SocialInput icon={<Twitter size={18} />} color="bg-black" placeholder="twitter.com/colegio" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón Flotante/Final */}
              <div className="flex justify-center md:justify-end pt-4 pb-16">
                <button className="flex items-center gap-3 px-10 py-4 bg-[#093E7A] text-white rounded-2xl hover:bg-[#062d59] transition-all font-black text-base shadow-2xl shadow-[#093E7A]/30 active:scale-95">
                  <Save size={22} />
                  GUARDAR TODOS LOS CAMBIOS
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-componentes para limpieza de código
function ImageUploader({ label, hint, icon }: { label: string; hint: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/50 hover:border-[#093E7A]/20 transition-all cursor-pointer group">
        <div className="text-gray-400 group-hover:text-[#093E7A] group-hover:scale-110 transition-all mb-2">
          {icon}
        </div>
        <p className="text-[10px] font-black text-gray-500 group-hover:text-[#093E7A]">SUBIR ARCHIVO</p>
      </div>
      <p className="text-[10px] text-gray-400 font-medium italic text-center">{hint}</p>
    </div>
  );
}

function InputWithIcon({ label, icon, defaultValue }: { label: string; icon: React.ReactNode; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#093E7A] transition-colors">
          {icon}
        </div>
        <input 
          className="w-full pl-11 pr-4 py-3 border-gray-200 bg-gray-50/30 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A] font-bold text-gray-700 transition-all" 
          type="text" 
          defaultValue={defaultValue} 
        />
      </div>
    </div>
  );
}

function SocialInput({ icon, color, placeholder }: { icon: React.ReactNode; color: string; placeholder: string }) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 focus-within:border-[#093E7A]/30 focus-within:bg-white transition-all">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm`}>
        {icon}
      </div>
      <input className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 font-bold text-gray-600 placeholder:text-gray-300 placeholder:font-normal" placeholder={placeholder} type="text" />
    </div>
  );
}