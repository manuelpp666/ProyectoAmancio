"use client";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@/src/context/userContext";
import {
  User, BadgeCheck, Loader2, HeartPulse, Phone, Mail, Camera, Save, Pencil, X, Plus, MapPin
} from 'lucide-react';
import { apiFetch } from "@/src/lib/api";
import { uploadToCloudinary } from "@/src/components/utils/cloudinary";
import { toast } from "sonner";

export default function MisDatos() {
  // 1. Estados y Contexto
  const { username } = useUser();
  const [perfil, setPerfil] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("PERSONALES");

  // Estados de edición (administrador: telefono/email)
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ telefono: "", email: "" });
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Estados del ALUMNO ---
  // Dirección
  const [editandoDir, setEditandoDir] = useState(false);
  const [formDir, setFormDir] = useState("");
  const [guardandoDir, setGuardandoDir] = useState(false);
  // Datos médicos
  const [editandoMed, setEditandoMed] = useState(false);
  const [formEnf, setFormEnf] = useState("");
  const [guardandoMed, setGuardandoMed] = useState(false);
  // Familiares
  const [familiaresList, setFamiliaresList] = useState<any[]>([]);
  const [modalFam, setModalFam] = useState(false);
  const [guardandoFam, setGuardandoFam] = useState(false);
  const [formFam, setFormFam] = useState({
    nombres: "", apellidos: "", dni: "", telefono: "", email: "", direccion: "", tipo_parentesco: ""
  });

  // 2. Fetch de datos al backend
  useEffect(() => {
    const fetchDatos = async () => {
      if (!username) return;
      try {
        const response = await apiFetch(`/perfil/mi-perfil/${username}`);
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

  // Sincroniza el formulario cuando llega el perfil
  useEffect(() => {
    if (perfil?.datos) {
      setForm({ telefono: perfil.datos.telefono || "", email: perfil.datos.email || "" });
      setFotoUrl(perfil.datos.url_perfil || null);
      setFormDir(perfil.datos.direccion || "");
      setFormEnf(perfil.datos.enfermedad || "");
    }
    setFamiliaresList(perfil?.familiares || []);
  }, [perfil]);

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen es muy pesada (máximo 2MB)");
      return;
    }
    setSubiendoFoto(true);
    try {
      const url = await uploadToCloudinary(file);
      if (!url) throw new Error();
      const res = await apiFetch(`/perfil/admin/${username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url_perfil: url })
      });
      if (!res.ok) throw new Error();
      setFotoUrl(url);
      setPerfil((prev: any) => prev ? { ...prev, datos: { ...prev.datos, url_perfil: url } } : prev);
      toast.success("Foto de perfil actualizada");
    } catch {
      toast.error("No se pudo actualizar la foto");
    } finally {
      setSubiendoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const res = await apiFetch(`/perfil/admin/${username}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono: form.telefono, email: form.email })
      });
      if (!res.ok) throw new Error();
      setPerfil((prev: any) => prev ? { ...prev, datos: { ...prev.datos, telefono: form.telefono, email: form.email } } : prev);
      toast.success("Datos actualizados con éxito");
      setEditando(false);
    } catch {
      toast.error("Error al guardar los cambios");
    } finally {
      setGuardando(false);
    }
  };

  // --- Handlers del ALUMNO ---
  const guardarDireccion = async () => {
    if (!formDir.trim() || formDir.trim().length < 3) {
      toast.error("Ingresa una dirección válida");
      return;
    }
    setGuardandoDir(true);
    try {
      const res = await apiFetch(`/perfil/alumno/${username}/direccion`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direccion: formDir.trim() })
      });
      if (!res.ok) throw new Error();
      setPerfil((prev: any) => prev ? { ...prev, datos: { ...prev.datos, direccion: formDir.trim() } } : prev);
      toast.success("Dirección actualizada con éxito");
      setEditandoDir(false);
    } catch {
      toast.error("No se pudo actualizar la dirección");
    } finally {
      setGuardandoDir(false);
    }
  };

  const guardarMedicos = async () => {
    setGuardandoMed(true);
    try {
      const res = await apiFetch(`/perfil/alumno/${username}/medicos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enfermedad: formEnf.trim() })
      });
      if (!res.ok) throw new Error();
      const valor = formEnf.trim();
      setPerfil((prev: any) => prev ? { ...prev, datos: { ...prev.datos, enfermedad: valor } } : prev);
      toast.success("Datos médicos actualizados");
      setEditandoMed(false);
    } catch {
      toast.error("No se pudieron actualizar los datos médicos");
    } finally {
      setGuardandoMed(false);
    }
  };

  const agregarFamiliar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formFam.dni.length !== 8) {
      toast.error("El DNI debe tener 8 dígitos");
      return;
    }
    setGuardandoFam(true);
    try {
      const res = await apiFetch(`/perfil/alumno/${username}/familiares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres: formFam.nombres.trim(),
          apellidos: formFam.apellidos.trim(),
          dni: formFam.dni.trim(),
          telefono: formFam.telefono.trim() || null,
          email: formFam.email.trim() || null,
          direccion: formFam.direccion.trim() || null,
          tipo_parentesco: formFam.tipo_parentesco.trim()
        })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.detail || "Error al agregar familiar");
      setFamiliaresList((prev) => [...prev, body.familiar]);
      toast.success("Familiar agregado con éxito");
      setModalFam(false);
      setFormFam({ nombres: "", apellidos: "", dni: "", telefono: "", email: "", direccion: "", tipo_parentesco: "" });
    } catch (err: any) {
      toast.error(err.message || "No se pudo agregar el familiar");
    } finally {
      setGuardandoFam(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-[#093E7A]" size={48} />
    </div>
  );

  if (!perfil) return <div className="p-10 text-center text-slate-500">No se encontró información del perfil.</div>;

  const { datos, rol } = perfil;

  // Helpers para identificar grupos de roles
  const esPersonal = ["DOCENTE", "ADMIN", "AUXILIAR"].includes(rol);
  const esAlumno = rol === "ALUMNO";
  const esAdmin = rol === "ADMIN";

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

            {/* Banner Dinámico */}
            <div className="bg-[#701C32] rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="relative w-32 h-32 shrink-0">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-[#093E7A] flex items-center justify-center text-5xl font-bold uppercase overflow-hidden">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      datos.nombres?.[0] || "?"
                    )}
                  </div>
                  {esAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={subiendoFoto}
                        title="Cambiar foto de perfil"
                        className="absolute bottom-0 right-0 bg-white text-[#701C32] p-2.5 rounded-full shadow-lg hover:bg-gray-100 transition-all border border-gray-200 disabled:opacity-60"
                      >
                        {subiendoFoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      </button>
                      <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFoto} />
                    </>
                  )}
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
                    {datos.nombres} {datos.apellidos}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">Rol: {rol}</span>
                    {esAlumno && (
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">Estado: {datos.estado_ingreso}</span>
                    )}
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">DNI: {datos.dni}</span>
                    {esPersonal && !esAdmin && (
                      <span className="bg-emerald-500/40 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm border border-emerald-400">
                        Sueldo: S/ {datos.sueldo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenedor Principal */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Tabs Dinámicos */}
              <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("PERSONALES")}
                  className={`px-8 py-4 font-bold whitespace-nowrap transition-all ${activeTab === "PERSONALES" ? "text-[#093E7A] border-b-2 border-[#093E7A] bg-white" : "text-slate-400"}`}
                >
                  DATOS PERSONALES
                </button>
                {esAlumno && (
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
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <BadgeCheck size={16} className="text-[#093E7A]" /> Identidad y Contacto
                        </h3>
                        {esAdmin && (
                          editando ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditando(false);
                                  setForm({ telefono: datos.telefono || "", email: datos.email || "" });
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                              >
                                <X size={16} /> Cancelar
                              </button>
                              <button
                                onClick={handleGuardar}
                                disabled={guardando}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#701C32] hover:bg-[#5a1628] transition-all disabled:opacity-60"
                              >
                                {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditando(true)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-[#701C32] hover:bg-[#701C32]/10 transition-all"
                            >
                              <Pencil size={16} /> Editar
                            </button>
                          )
                        )}
                        {/* Alumno: solo puede editar la dirección */}
                        {esAlumno && (
                          editandoDir ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditandoDir(false); setFormDir(datos.direccion || ""); }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                              >
                                <X size={16} /> Cancelar
                              </button>
                              <button
                                onClick={guardarDireccion}
                                disabled={guardandoDir}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#701C32] hover:bg-[#5a1628] transition-all disabled:opacity-60"
                              >
                                {guardandoDir ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditandoDir(true)}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-[#701C32] hover:bg-[#701C32]/10 transition-all"
                            >
                              <Pencil size={16} /> Editar dirección
                            </button>
                          )
                        )}
                      </div>
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

                        {esAlumno && (
                          <>
                            <div className="flex flex-col">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Género</label>
                              <input className="custom-input text-slate-800 font-medium" readOnly value={datos.genero === 'M' ? 'Masculino' : 'Femenino'} />
                            </div>
                            <div className="flex flex-col lg:col-span-2">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Dirección</label>
                              {editandoDir ? (
                                <input
                                  type="text"
                                  autoFocus
                                  className="custom-input text-slate-800 font-medium"
                                  value={formDir}
                                  placeholder="Ingresa tu dirección"
                                  onChange={(e) => setFormDir(e.target.value)}
                                />
                              ) : (
                                <div className="flex items-center gap-2 custom-input">
                                  <span className="text-slate-800 font-medium">{datos.direccion || "No registrada"}</span>
                                  <MapPin size={14} className="text-slate-300 ml-auto" />
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {rol === "DOCENTE" && (
                          <div className="flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1">Especialidad</label>
                            <input className="custom-input text-slate-800 font-medium" readOnly value={datos.especialidad || "No asignada"} />
                          </div>
                        )}

                        {esPersonal && (
                          <>
                            <div className="flex flex-col">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                              {esAdmin && editando ? (
                                <input
                                  type="tel"
                                  className="custom-input text-slate-800 font-medium"
                                  value={form.telefono}
                                  maxLength={9}
                                  placeholder="Ingresa tu teléfono"
                                  onChange={(e) => setForm({ ...form, telefono: e.target.value.replace(/\D/g, "") })}
                                />
                              ) : (
                                <div className="flex items-center gap-2 custom-input">
                                  <span className="text-slate-800 font-medium">{datos.telefono || "Sin registrar"}</span>
                                  <Phone size={14} className="text-slate-300 ml-auto" />
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                              {esAdmin && editando ? (
                                <input
                                  type="email"
                                  className="custom-input text-slate-800 font-medium"
                                  value={form.email}
                                  placeholder="Ingresa tu email"
                                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                              ) : (
                                <div className="flex items-center gap-2 custom-input">
                                  <span className="text-slate-800 font-medium">{datos.email || "Sin registrar"}</span>
                                  <Mail size={14} className="text-slate-300 ml-auto" />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {/* TAB: DATOS MÉDICOS (Solo Alumnos) */}
                {activeTab === "MEDICOS" && esAlumno && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <section>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <HeartPulse size={16} className="text-[#093E7A]" /> Información de Salud
                        </h3>
                        {editandoMed ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => { setEditandoMed(false); setFormEnf(datos.enfermedad || ""); }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
                            >
                              <X size={16} /> Cancelar
                            </button>
                            <button
                              onClick={guardarMedicos}
                              disabled={guardandoMed}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#701C32] hover:bg-[#5a1628] transition-all disabled:opacity-60"
                            >
                              {guardandoMed ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditandoMed(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-[#701C32] hover:bg-[#701C32]/10 transition-all"
                          >
                            <Pencil size={16} /> {datos.enfermedad ? "Editar" : "Agregar"}
                          </button>
                        )}
                      </div>
                      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <label className="text-xs font-bold text-blue-600 uppercase mb-2 block tracking-wider">Alergias / Enfermedades</label>
                        {editandoMed ? (
                          <textarea
                            autoFocus
                            className="w-full bg-white border border-blue-200 rounded-lg p-3 text-slate-800 outline-none focus:ring-2 focus:ring-[#093E7A]/20 min-h-[120px]"
                            value={formEnf}
                            maxLength={150}
                            placeholder="Describe las alergias o condiciones médicas del estudiante (máx. 150 caracteres)..."
                            onChange={(e) => setFormEnf(e.target.value)}
                          />
                        ) : (
                          <p className="text-slate-800 font-semibold text-lg leading-relaxed">
                            {datos.enfermedad || "El estudiante no registra ninguna condición médica o alergia."}
                          </p>
                        )}
                        {editandoMed && (
                          <p className="text-[11px] text-blue-400 mt-2 text-right">{formEnf.length}/150</p>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {/* TAB: FAMILIARES (Solo Alumnos) */}
                {activeTab === "FAMILIARES" && esAlumno && (
                  <div className="animate-in fade-in duration-500">
                    <section>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <User size={16} className="text-[#093E7A]" /> Familiares
                        </h3>
                        <button
                          onClick={() => setModalFam(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#701C32] hover:bg-[#5a1628] transition-all"
                        >
                          <Plus size={16} /> Agregar familiar
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {familiaresList && familiaresList.length > 0 ? familiaresList.map((fam: any, idx: number) => (
                          <div key={fam.id_familiar || idx} className="p-6 border border-slate-100 rounded-xl bg-slate-50 flex flex-col md:flex-row justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold uppercase">
                                {fam.nombre?.[0] || "?"}
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
                                <p className="text-sm font-medium text-slate-700">{fam.telefono || '---'}</p>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 italic">
                            No hay familiares registrados.
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

      {/* MODAL: AGREGAR FAMILIAR */}
      {modalFam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-[#701C32] p-4 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold flex items-center gap-2">
                <Plus size={18} /> Agregar Familiar
              </h3>
              <button onClick={() => setModalFam(false)} className="hover:rotate-90 transition-transform">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={agregarFamiliar} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombres</label>
                  <input
                    required type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20"
                    value={formFam.nombres}
                    onChange={(e) => setFormFam({ ...formFam, nombres: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Apellidos</label>
                  <input
                    required type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20"
                    value={formFam.apellidos}
                    onChange={(e) => setFormFam({ ...formFam, apellidos: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">DNI</label>
                  <input
                    required type="text" maxLength={8}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20"
                    value={formFam.dni}
                    onChange={(e) => setFormFam({ ...formFam, dni: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Parentesco</label>
                  <select
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20"
                    value={formFam.tipo_parentesco}
                    onChange={(e) => setFormFam({ ...formFam, tipo_parentesco: e.target.value })}
                  >
                    <option value="">-- Selecciona --</option>
                    <option value="Padre">Padre</option>
                    <option value="Madre">Madre</option>
                    <option value="Apoderado">Apoderado</option>
                    <option value="Hermano(a)">Hermano(a)</option>
                    <option value="Abuelo(a)">Abuelo(a)</option>
                    <option value="Tío(a)">Tío(a)</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                  <input
                    type="tel" maxLength={9}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20"
                    value={formFam.telefono}
                    onChange={(e) => setFormFam({ ...formFam, telefono: e.target.value.replace(/\D/g, "") })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Opcional)</label>
                  <input
                    type="email"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20"
                    value={formFam.email}
                    onChange={(e) => setFormFam({ ...formFam, email: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección (Opcional)</label>
                  <input
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#701C32]/20"
                    value={formFam.direccion}
                    onChange={(e) => setFormFam({ ...formFam, direccion: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFam(false)}
                  className="flex-1 py-3 text-slate-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoFam}
                  className="flex-1 py-3 bg-[#701C32] text-white font-bold text-sm rounded-xl hover:bg-[#5a1628] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {guardandoFam ? <Loader2 className="animate-spin" size={18} /> : "Guardar familiar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
