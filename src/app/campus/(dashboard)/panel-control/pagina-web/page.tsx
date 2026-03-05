// src/app/campus/(dashboard)/panel-control/pagina-web/page.tsx
"use client";
import { useState } from 'react';
import { useConfiguracion } from '@/src/hooks/useConfiguracion';
import ImageUpload from '@/src/components/utils/ImageUpload';
import { uploadToCloudinary } from "@/src/components/utils/cloudinary";
import * as LucideIcons from "lucide-react";
import HeaderPanel from '@/src/components/Campus/PanelControl/Header';
import { Save, Home, Users, Footprints, Loader2,ChevronRight} from 'lucide-react';
import { toast } from "sonner";


const SECCIONES = [
  {
    id: 'inicio', label: 'Inicio', icon: Home, campos: [
      { clave: 'hero_titulo', label: 'Título Principal', tipo: 'text' },
      { clave: 'hero_subtitulo', label: 'Subtítulo Hero', tipo: 'text' },
      { clave: 'hero_imagen', label: 'Imagen de Fondo', tipo: 'image' },
      { clave: 'home_enfoques', label: 'Enfoques Educativos (Lista)', tipo: 'enfoques' },
      { clave: 'home_niveles', label: 'Niveles Académicos (Lista)', tipo: 'niveles' },
    ]
  },
  {
    id: 'nosotros', label: 'Sobre Nosotros', icon: Users, campos: [
      { clave: 'nosotros_titulo', label: 'Título Sección', tipo: 'text' },
      { clave: 'nosotros_contenido', label: 'Historia / Contenido', tipo: 'textarea' },
      { clave: 'nosotros_imagen', label: 'Imagen Historia', tipo: 'image' },
      { clave: 'mision', label: 'Misión', tipo: 'textarea' },
      { clave: 'vision', label: 'Visión', tipo: 'textarea' },
      { clave: 'nosotros_frase', label: 'Frase Inspiradora', tipo: 'textarea' },
      { clave: 'nosotros_frase_autor', label: 'Subtexto de la Frase', tipo: 'text' },
    ]
  },
  {
    id: 'footer', label: 'Footer', icon: Footprints, campos: [
      { clave: 'footer_direccion', label: 'Dirección', tipo: 'text' },
      { clave: 'footer_correo', label: 'Email de Contacto', tipo: 'text' },
      { clave: 'footer_telefono', label: 'Teléfono', tipo: 'text' },
      { clave: 'footer_descripcion', label: 'Descripción Breve', tipo: 'textarea' },
    ]
  }
];

export default function GestionWebPage() {
  const [tab, setTab] = useState('inicio');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const { data, updateField, loading } = useConfiguracion(tab);

  const getVal = (clave: string) => data.find(i => i.clave === clave)?.valor || "";
  const getJsonVal = (clave: string, defecto: any) => {
    const val = getVal(clave);
    try { return val ? JSON.parse(val) : defecto; }
    catch { return defecto; }
  };
  const handleSave = async () => {

    if (uploadingField) {
      toast.error("Espera a que la imagen termine de subirse");
      return;
    }
    const camposActuales = SECCIONES.find(s => s.id === tab)?.campos || [];
    const promesas = camposActuales.map(campo => {
      const valor = getVal(campo.clave);
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion/${campo.clave}?seccion=${tab}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor })
      });
    });
    try {
      await Promise.all(promesas);
      toast.success("¡Cambios guardados correctamente!");
    } catch (error) {
      toast.error("Error al guardar los cambios");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <HeaderPanel />
      {/* BARRA SUPERIOR (HEADER) */}
      <div className="bg-white px-8">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <div className="text-2xl font-black text-[#701C32] tracking-tighter uppercase">
              Editor Web
            </div>
            
            {/* NAVEGACIÓN ESTILO TABS */}
            <div className="hidden md:flex bg-slate-100 p-1 rounded-2xl">
              {SECCIONES.map(s => (
                <div
                  key={s.id}
                  onClick={() => setTab(s.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer transition-all ${
                    tab === s.id 
                    ? 'bg-white text-[#701C32] shadow-sm scale-100' 
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <s.icon size={16} /> {s.label}
                </div>
              ))}
            </div>
          </div>

          <div 
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#093E7A] text-white px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-[#072d59] transition-all shadow-lg shadow-blue-900/10 active:scale-95"
          >
            <Save size={18} /> GUARDAR CAMBIOS
          </div>
        </div>
      </div>

      {/* CUERPO DEL EDITOR */}
      <div className="flex-1 p-6 md:p-12">
        <div className="max-w-5xl mx-auto">
          
          {/* TÍTULO DE SECCIÓN */}
          <div className="mb-10 flex items-center gap-3">
            <div className="text-slate-400 font-medium">Panel de Control</div>
            <ChevronRight size={16} className="text-slate-300" />
            <div className="text-[#701C32] font-bold uppercase tracking-widest text-sm">
              {SECCIONES.find(s => s.id === tab)?.label}
            </div>
          </div>

          {/* LISTADO DE CAMPOS EN CARDS */}
          <div className="space-y-8">
            {SECCIONES.find(s => s.id === tab)?.campos.map(campo => (
              <div key={campo.clave} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 transition-all hover:shadow-md">
                
                {campo.tipo === 'enfoques' || campo.tipo === 'niveles' ? (
                  <EditorListaDinamica
                    tipo={campo.tipo}
                    data={getJsonVal(campo.clave, [])}
                    onChange={(newData) => updateField(campo.clave, JSON.stringify(newData))}
                  />
                ) : campo.tipo === 'image' ? (
                  <div className="relative">
                    <ImageUpload
                      label={campo.label}
                      initialImage={getVal(campo.clave)}
                      onImageChange={async (file) => {
                        if (file) {
                          setUploadingField(campo.clave);
                          try {
                            const url = await uploadToCloudinary(file);
                            if (url) {
                              updateField(campo.clave, url);
                              toast.success("Imagen lista para guardar");
                            }
                          } catch (err) {
                            toast.error("Error al subir imagen");
                          } finally {
                            setUploadingField(null);
                          }
                        }
                      }}
                    />
                    {uploadingField === campo.clave && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-3xl backdrop-blur-[2px]">
                        <Loader2 className="animate-spin text-[#093E7A]" size={32} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {campo.label}
                      </div>
                      <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold">
                        CAMPO DE TEXTO
                      </div>
                    </div>
                    <textarea
                      className="w-full border-2 border-slate-100 bg-slate-50/50 rounded-2xl p-5 text-base font-medium focus:bg-white focus:border-[#093E7A] focus:ring-4 focus:ring-[#093E7A]/5 outline-none transition-all placeholder:text-slate-400"
                      rows={campo.tipo === 'textarea' ? 5 : 1}
                      placeholder={`Escribe aquí el contenido para ${campo.label.toLowerCase()}...`}
                      value={getVal(campo.clave)}
                      onChange={(e) => updateField(campo.clave, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const ICONOS_SUGERIDOS = [
  "Beaker", "Book", "BookOpen", "GraduationCap", "Trophy", "Music", "Palette",
  "Dribbble", "Baby", "Award", "Lightbulb", "Library", "Microscope", "Globe",
  "Calculator", "Languages", "Users", "Star", "Heart", "Rocket"
];

function EditorListaDinamica({ data, onChange, tipo }: { data: any[], onChange: (d: any[]) => void, tipo: 'enfoques' | 'niveles' }) {
  const [selectorAbierto, setSelectorAbierto] = useState<{ index: number, campo: string } | null>(null);

  const agregar = () => {
    const nuevoItem = tipo === 'enfoques'
      ? { titulo: "", descripcion: "", icon: "Beaker", badge: "Lightbulb" }
      : { titulo: "", descripcion: "", icon: "BookOpen" };
    onChange([...data, nuevoItem]);
  };

  const actualizar = (i: number, k: string, v: string) => {
    const copia = [...data];
    copia[i] = { ...copia[i], [k]: v };
    onChange(copia);
  };

  return (
    <div className="space-y-6 border-l-4 border-[#093E7A] pl-6 py-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase text-[#701C32] tracking-widest">
          {tipo === 'enfoques' ? 'Pasos de la Propuesta Educativa' : 'Niveles Académicos'}
        </label>
        <button onClick={agregar} className="bg-[#093E7A] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#701C32] transition-all shadow-md">
          + AÑADIR NUEVO
        </button>
      </div>

      <div className="grid gap-4">
        {data.map((item, i) => (
          <div key={i} className="relative group bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <button
              onClick={() => onChange(data.filter((_, idx) => idx !== i))}
              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white"
            >
              <LucideIcons.Trash2 size={16} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* SELECTORES DE ICONOS */}
              <div className="md:col-span-3 flex flex-row md:flex-col gap-4 justify-center items-center bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Icono Principal</p>
                  <button
                    onClick={() => setSelectorAbierto({ index: i, campo: 'icon' })}
                    className="w-16 h-16 bg-white rounded-2xl border-2 border-[#093E7A]/20 flex items-center justify-center text-[#093E7A] hover:border-[#093E7A] hover:bg-[#093E7A]/5 transition-all"
                  >
                    {(() => {
                      const Icon = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;
                      return <Icon size={32} />;
                    })()}
                  </button>
                </div>

                {tipo === 'enfoques' && (
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Badge</p>
                    <button
                      onClick={() => setSelectorAbierto({ index: i, campo: 'badge' })}
                      className="w-12 h-12 bg-white rounded-xl border-2 border-[#701C32]/20 flex items-center justify-center text-[#701C32] hover:border-[#701C32] hover:bg-[#701C32]/5 transition-all"
                    >
                      {(() => {
                        const Icon = (LucideIcons as any)[item.badge] || LucideIcons.HelpCircle;
                        return <Icon size={20} />;
                      })()}
                    </button>
                  </div>
                )}
              </div>

              {/* TEXTOS */}
              <div className="md:col-span-9 space-y-4">
                <input
                  className="w-full text-lg font-black text-[#093E7A] border-b border-gray-100 focus:border-[#093E7A] outline-none transition-all"
                  placeholder="Título del enfoque..."
                  value={item.titulo}
                  onChange={e => actualizar(i, 'titulo', e.target.value)}
                />
                <textarea
                  className="w-full text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border-none focus:ring-2 focus:ring-[#093E7A]/10 outline-none resize-none"
                  rows={3}
                  placeholder="Escribe la descripción aquí..."
                  value={item.descripcion}
                  onChange={e => actualizar(i, 'descripcion', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL SELECTOR DE ICONOS */}
      {selectorAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-[#701C32]">Selecciona un Icono</h3>
              <button onClick={() => setSelectorAbierto(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <LucideIcons.X size={24} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-4 max-h-[300px] overflow-y-auto p-2">
              {ICONOS_SUGERIDOS.map((iconName) => {
                const Icon = (LucideIcons as any)[iconName];
                return (
                  <button
                    key={iconName}
                    onClick={() => {
                      actualizar(selectorAbierto.index, selectorAbierto.campo, iconName);
                      setSelectorAbierto(null);
                    }}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-[#093E7A] hover:text-white transition-all border border-gray-100"
                  >
                    <Icon size={24} />
                    <span className="text-[8px] mt-2 opacity-50 uppercase">{iconName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}