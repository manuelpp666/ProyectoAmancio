"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/src/context/userContext"; 
import { 
  User, BadgeCheck, Globe, MapPin, Info, 
  CalendarDays, Loader2, HeartPulse, Phone, Mail
} from 'lucide-react';

export default function MisDatos() {
  // 1. Estados y Contexto
  const { username, role } = useUser();
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PERSONALES");

  // 2. Fetch de datos al backend
  useEffect(() => {
    const fetchDatos = async () => {
      if (!username) return; 
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/perfil/mi-perfil/${username}`);
        if (response.ok) {
          const data = await response.json();
          setPerfil(data);
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [username]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#093E7A]" size={48} />
    </div>
  );

  if (!perfil) return <div className="p-10 text-center text-slate-500">No se encontró información del perfil.</div>;

  const { datos, rol, familiares } = perfil;

  return (
    <div className="bg-[#F3F4F6] min-h-screen text-slate-800 font-['Lato']">
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-input {
            border: none;
            border-bottom: 2px solid #E5E7EB;
            border-radius: 0;
            padding: 0.5rem 0;
            background: transparent;
            width: 100%;
        }
        .custom-input:focus {
            box-shadow: none;
            border-bottom-color: #093E7A;
            outline: none;
        }
      `}} />

      <div className="flex min-h-[calc(100vh-64px)]">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Banner Dinámico con Color Institucional */}
            <div className="bg-[#701C32] rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-amber-500 flex items-center justify-center text-5xl font-bold uppercase">
                  {datos.nombres[0]}
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                    {datos.nombres} {datos.apellidos}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">Rol: {rol}</span>
                    {rol === "ALUMNO" && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">Estado: {datos.estado_ingreso}</span>
                    )}
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">DNI: {datos.dni}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenedor Principal de Información */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Tabs Dinámicos según Rol */}
              <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
                <button 
                  onClick={() => setActiveTab("PERSONALES")}
                  className={`px-8 py-4 font-bold whitespace-nowrap transition-all ${activeTab === "PERSONALES" ? "text-[#093E7A] border-b-2 border-[#093E7A] bg-white" : "text-slate-400"}`}
                >
                  DATOS PERSONALES
                </button>
                {rol === "ALUMNO" && (
                  <>
                    <button 
                      onClick={() => setActiveTab("MEDICOS")}
                      className={`px-8 py-4 font-bold whitespace-nowrap transition-all ${activeTab === "MEDICOS" ? "text-[#093E7A] border-b-2 border-[#093E7A] bg-white" : "text-slate-400"}`}
                    >
                      DATOS MÉDICOS
                    </button>
                    <button 
                      onClick={() => setActiveTab("FAMILIARES")}
                      className={`px-8 py-4 font-bold whitespace-nowrap transition-all ${activeTab === "FAMILIARES" ? "text-[#093E7A] border-b-2 border-[#093E7A] bg-white" : "text-slate-400"}`}
                    >
                      FAMILIARES
                    </button>
                  </>
                )}
              </div>

              <div className="p-8 space-y-12">
                
                {/* TAB: DATOS PERSONALES */}
                {activeTab === "PERSONALES" && (
                  <div className="animate-in fade-in duration-500">
                    <section>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <BadgeCheck size={16} className="text-[#093E7A]" /> Identidad y Contacto
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Nombres</label>
                          <input className="custom-input text-slate-800 font-medium" readOnly value={datos.nombres} />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1">Apellidos</label>
                          <input className="custom-input text-slate-800 font-medium" readOnly value={datos.apellidos} />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1">DNI</label>
                          <input className="custom-input text-slate-800 font-medium" readOnly value={datos.dni} />
                        </div>

                        {/* Género solo para Alumnos */}
                        {rol === "ALUMNO" && (
                          <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Género</label>
                            <input className="custom-input text-slate-800 font-medium" readOnly value={datos.genero === 'M' ? 'Masculino' : 'Femenino'} />
                          </div>
                        )}

                        {/* Especialidad solo para Docentes */}
                        {rol === "DOCENTE" && (
                          <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Especialidad</label>
                            <input className="custom-input text-slate-800 font-medium" readOnly value={datos.especialidad || "No asignada"} />
                          </div>
                        )}

                        {/* Dirección solo para Alumnos */}
                        {rol === "ALUMNO" && (
                          <div className="flex flex-col lg:col-span-2">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Dirección de Residencia</label>
                            <input className="custom-input text-slate-800 font-medium" readOnly value={datos.direccion || "No registrada"} />
                          </div>
                        )}

                        {/* Email y Teléfono (Disponibles en Docente) */}
                        {rol === "DOCENTE" && (
                          <>
                            <div className="flex flex-col">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                              <div className="flex items-center gap-2 custom-input">
                                <span className="text-slate-800 font-medium">{datos.telefono || "Sin registrar"}</span>
                                <Phone size={14} className="text-slate-300 ml-auto" />
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Correo Institucional</label>
                              <div className="flex items-center gap-2 custom-input">
                                <span className="text-slate-800 font-medium">{datos.email || "Sin registrar"}</span>
                                <Mail size={14} className="text-slate-300 ml-auto" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {/* TAB: DATOS MÉDICOS (Solo Alumnos) */}
                {activeTab === "MEDICOS" && rol === "ALUMNO" && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <section>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <HeartPulse size={16} className="text-[#093E7A]" /> Información de Salud
                      </h3>
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <label className="text-xs font-bold text-blue-600 uppercase mb-2 block tracking-wider">Alergias / Enfermedades</label>
                        <p className="text-slate-800 font-semibold text-lg leading-relaxed">
                          {datos.enfermedad || "El estudiante no registra ninguna condición médica o alergia."}
                        </p>
                      </div>
                    </section>
                  </div>
                )}

                {/* TAB: FAMILIARES (Solo Alumnos) */}
                {activeTab === "FAMILIARES" && rol === "ALUMNO" && (
                  <div className="animate-in fade-in duration-500">
                    <section>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <User size={16} className="text-[#093E7A]" /> Contactos de Emergencia y Familiares
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {familiares && familiares.length > 0 ? familiares.map((fam: any, idx: number) => (
                          <div key={idx} className="p-6 border border-slate-100 rounded-xl bg-slate-50 flex flex-col md:flex-row justify-between items-center hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                {fam.nombre[0]}
                              </div>
                              <div>
                                <p className="text-lg font-bold text-slate-800">{fam.nombre}</p>
                                <p className="text-sm text-[#093E7A] font-bold uppercase tracking-tighter">{fam.parentesco}</p>
                              </div>
                            </div>
                            <div className="text-right mt-4 md:mt-0 flex gap-6">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Documento</p>
                                <p className="text-sm font-medium text-slate-700">{fam.dni}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Contacto</p>
                                <p className="text-sm font-medium text-slate-700">{fam.telefono || 'Sin número'}</p>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-slate-400 italic">No hay familiares registrados en el sistema.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}