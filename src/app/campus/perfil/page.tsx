
import { 
  User, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  FileText, 
  HelpCircle, 
  Menu, 
  ChevronDown, 
  BadgeCheck, 
  Globe, 
  MapPin, 
  Info, 
  CalendarDays, 
  Pencil 
} from 'lucide-react';

export default function MisDatos() {
  return (
    <div className="bg-[#F3F4F6] min-h-screen text-slate-800 font-['Lato']">
      {/* Estilos para los inputs personalizados */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-input {
            border: none;
            border-bottom: 2px solid #E5E7EB;
            border-radius: 0;
            padding-left: 0;
            padding-right: 0;
            background: transparent;
        }
        .custom-input:focus {
            box-shadow: none;
            border-bottom-color: #093E7A;
            outline: none;
        }
      `}} />


      <div className="flex min-h-[calc(100vh-64px)]">
        

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Banner de Bienvenida Estilo Cyan */}
            <div className="bg-[#701C32] rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full -ml-10 -mb-10"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-amber-500 flex items-center justify-center text-5xl font-bold text-white">
                    J
                  </div>
                  <div className="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-2 border-white"></div>
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">Emmanuel Puicon Rivera</h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">Rol: Alumno</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">Grado: Secundaria Quinto Año "U"</span>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">ID: 20240982</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenedor Principal de Datos */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50/50">
                <button className="px-8 py-4 text-[#093E7A] font-bold border-b-2 border-[#093E7A] bg-white">DATOS PERSONALES</button>
                <button className="px-8 py-4 text-slate-400 font-medium hover:text-slate-600 transition-colors">DATOS MÉDICOS</button>
                <button className="px-8 py-4 text-slate-400 font-medium hover:text-slate-600 transition-colors">FAMILIARES</button>
              </div>

              <div className="p-8 space-y-12">
                {/* SECCIÓN: Identidad Personal */}
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BadgeCheck size={16} className="text-[#093E7A]" />
                    Identidad Personal
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Apellido Paterno</label>
                      <input className="custom-input text-slate-800 font-medium" readOnly type="text" value="PUICON" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Apellido Materno</label>
                      <input className="custom-input text-slate-800 font-medium" readOnly type="text" value="RIVERA" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Nombres</label>
                      <input className="custom-input text-slate-800 font-medium" readOnly type="text" value="Joe Daniel" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Documento</label>
                      <input className="custom-input text-slate-800 font-medium" readOnly type="text" value="DNI" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Nro. Documento</label>
                      <input className="custom-input text-slate-800 font-medium" readOnly type="text" value="61301082" />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Sexo</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">Masculino</span>
                        <ChevronDown size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECCIÓN: Origen y Nacimiento */}
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Globe size={16} className="text-[#093E7A]" />
                    Origen y Nacimiento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Nacimiento</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">04/02/2008</span>
                        <CalendarDays size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Nacionalidad</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">Peruana</span>
                        <ChevronDown size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">País de Nacimiento</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">Perú</span>
                        <ChevronDown size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECCIÓN: Ubigeo de Residencia */}
                <section>
                  <div className="bg-slate-100 rounded-lg p-3 mb-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={16} />
                      Ubigeo de Residencia
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-8 gap-x-12">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Departamento</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">LIMA</span>
                        <ChevronDown size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Provincia</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">LIMA</span>
                        <ChevronDown size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Distrito</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">SANTIAGO DE SURCO</span>
                        <ChevronDown size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                  </div>
                </section>

                {/* SECCIÓN: Información Adicional */}
                <section>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Info size={16} className="text-[#093E7A]" />
                    Información Adicional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Ingreso</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">20/06/2018</span>
                        <CalendarDays size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Religión</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">Católica</span>
                        <ChevronDown size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1">Bautizo</label>
                      <div className="flex items-center custom-input">
                        <span className="text-slate-800 font-medium">Si</span>
                        <ChevronDown size={16} className="text-slate-400 ml-auto" />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón flotante Editar */}
      <button 
        className="fixed bottom-8 right-8 bg-[#093E7A] text-white w-16 h-16 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group z-50 overflow-hidden" 
        title="Editar Perfil"
      >
        <Pencil size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
}