"use client";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Eye, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link2, 
  Image as ImageIcon, 
  Quote, 
  Settings, 
  Youtube, 
  Camera, 
  Info,
  Clock
} from "lucide-react";

export default function CrearNoticiaPage() {
  return (
    <div className="min-h-screen bg-[#F6F7F8]">
      <div className="flex h-screen overflow-hidden">
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          
          {/* Header Superior */}
          <header className="h-20 border-b flex items-center justify-between px-8 bg-white shrink-0">
            <div className="flex items-center gap-5">
              <Link 
                href="/panel-control/pagina-web/noticias-web"
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#701C32] transition-all"
              >
                <ArrowLeft size={24} />
              </Link>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Crear Nueva Noticia</h2>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  <Clock size={12} className="text-emerald-500" />
                  Último guardado: Justo ahora
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
            <div className="max-w-6xl mx-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Editor Section */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Título Input */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] px-1">Título de la Noticia</label>
                    <input 
                      className="w-full bg-white border border-gray-200 rounded-2xl py-5 px-6 text-2xl font-black text-gray-900 focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] outline-none transition-all placeholder:text-gray-200" 
                      placeholder="Escribe un título impactante..." 
                      type="text" 
                    />
                  </div>

                  {/* Editor de Texto */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] px-1">Contenido del Artículo</label>
                    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-[#093E7A]/5 transition-all">
                      {/* Barra de Herramientas */}
                      <div className="bg-gray-50/80 border-b border-gray-100 p-3 flex flex-wrap gap-1">
                        <EditorButton icon={<Bold size={18} />} title="Negrita" />
                        <EditorButton icon={<Italic size={18} />} title="Cursiva" />
                        <EditorButton icon={<Underline size={18} />} title="Subrayado" />
                        <div className="w-px h-6 bg-gray-200 mx-2 self-center"></div>
                        <EditorButton icon={<List size={18} />} title="Lista" />
                        <EditorButton icon={<ListOrdered size={18} />} title="Lista Numerada" />
                        <div className="w-px h-6 bg-gray-200 mx-2 self-center"></div>
                        <EditorButton icon={<Link2 size={18} />} title="Insertar Enlace" />
                        <EditorButton icon={<ImageIcon size={18} />} title="Insertar Imagen" />
                        <EditorButton icon={<Quote size={18} />} title="Cita" />
                      </div>
                      <textarea 
                        className="w-full border-none p-8 text-gray-700 focus:ring-0 resize-none placeholder:text-gray-300 leading-relaxed text-lg min-h-[500px]" 
                        placeholder="Comienza a redactar tu noticia aquí..." 
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Sidebar de Configuración */}
                <div className="space-y-8">
                  
                  {/* Card: Configuración */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Settings size={18} className="text-[#093E7A]" /> Configuración
                    </h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Contenido</label>
                        <select className="w-full bg-gray-50 border-gray-200 rounded-xl py-2.5 text-sm font-bold text-gray-700 focus:ring-[#093E7A] transition-all">
                          <option value="texto">Artículo de Texto</option>
                          <option value="video">Video de YouTube</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">URL del Video</label>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-500 transition-colors">
                            <Youtube size={18} />
                          </div>
                          <input 
                            className="w-full bg-gray-50 border-gray-200 border rounded-xl pl-10 py-2.5 text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all font-medium" 
                            placeholder="https://youtube.com/..." 
                            type="text" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Portada */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                      <ImageIcon size={18} className="text-[#093E7A]" /> Portada
                    </h3>
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/50 hover:border-[#093E7A]/20 transition-all cursor-pointer group">
                      <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Camera size={28} className="text-gray-400 group-hover:text-[#093E7A]" />
                      </div>
                      <p className="text-xs font-black text-gray-600">SUBIR PORTADA</p>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">1200 x 630 px (Máx 2MB)</p>
                    </div>
                  </div>

                  {/* Tip Informativo */}
                  <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                    <Info className="absolute -right-2 -bottom-2 w-24 h-24 text-white/10 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative z-10">
                      <p className="text-xs font-black uppercase tracking-[0.2em] mb-2 opacity-80">Publicación</p>
                      <p className="text-sm font-bold leading-relaxed">
                        Al publicar, la noticia aparecerá automáticamente en el apartado de noticias de la página
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <footer className="h-24 border-t bg-white px-8 flex items-center justify-between shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
            <button className="flex items-center gap-2 px-6 py-3 text-[#701C32] border-2 border-[#701C32] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95">
              <Save size={18} />
              Guardar Borrador
            </button>
            
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 text-gray-500 font-black text-xs uppercase tracking-widest hover:text-gray-900 transition-colors">
                <Eye size={18} />
                Vista Previa
              </button>
              <button className="flex items-center gap-3 px-10 py-4 bg-[#093E7A] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#062d59] transition-all shadow-xl shadow-[#093E7A]/30 active:scale-95">
                <Send size={20} />
                Publicar Noticia
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

// Sub-componente para los botones del editor
function EditorButton({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <button 
      title={title}
      className="p-2.5 text-gray-400 hover:text-[#093E7A] hover:bg-white rounded-lg transition-all shadow-none hover:shadow-sm"
    >
      {icon}
    </button>
  );
}