"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, UserPlus, Edit, ShieldCheck, BookOpen, Briefcase, Power, PowerOff, X } from "lucide-react";
import { Personal } from "@/src/interfaces/personal";
import { TipoPersonal } from "@/src/interfaces/personal";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GestionPersonalPage() {
  const [activeTab, setActiveTab] = useState<TipoPersonal>("admin");
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    dni: "",
    email: "",
    telefono: "",
    sueldo: 0,
    password: ""
  });

  useEffect(() => {
    fetchPersonal(activeTab);
  }, [activeTab]);

  const fetchPersonal = async (tipo: TipoPersonal) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/personal/${tipo}`);
      if (res.ok) setPersonal(await res.json());
    } catch (e) {
      toast.error("Error cargando datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditing 
      ? `${API_URL}/personal/${activeTab}/${currentId}`
      : `${API_URL}/personal/${activeTab}`;
      
    const method = isEditing ? "PUT" : "POST";

    // SOLUCIÓN AL ERROR DE 'delete': 
    // Separamos el password del resto de los datos
    const { password, ...restData } = formData;
    
    // Si estamos editando y el password está vacío, enviamos 'restData' (sin password)
    // De lo contrario, enviamos 'formData' completo
    const payload = (isEditing && !password) ? restData : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(isEditing ? "Personal actualizado" : "Personal registrado");
        setIsModalOpen(false);
        fetchPersonal(activeTab);
      } else {
        toast.error("Error al guardar personal");
      }
    } catch (e) {
      toast.error("Error de conexión");
    }
  };

  const handleEstado = async (id: number, nuevoEstado: boolean) => {
    try {
      await fetch(`${API_URL}/personal/${activeTab}/${id}/estado?activo=${nuevoEstado}`, { method: "PATCH" });
      toast.success(nuevoEstado ? "Usuario habilitado" : "Usuario dado de baja");
      fetchPersonal(activeTab);
    } catch (e) {
      toast.error("Error al cambiar estado");
    }
  };

  const openNew = () => {
    setFormData({ nombres: "", apellidos: "", dni: "", email: "", telefono: "", sueldo: 0, password: "" });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (p: Personal) => {
    setFormData({
      nombres: p.nombres, apellidos: p.apellidos, dni: p.dni, email: p.email || "", 
      telefono: p.telefono || "", sueldo: p.sueldo, password: ""
    });
    setCurrentId(p.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* HEADER */}
      <div className="h-20 bg-white border-b px-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <Users size={28} />
            Gestión de Personal
          </h1>
          <p className="text-gray-500 text-sm">Administra los usuarios del sistema (Admin, Docentes y Auxiliares)</p>
        </div>
        <button onClick={openNew} className="bg-[#093E7A] text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md hover:opacity-90 flex items-center gap-2">
          <UserPlus size={18} />
          Nuevo Registro
        </button>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* TABS */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button onClick={() => setActiveTab("admin")} className={`flex items-center gap-2 px-6 py-3 font-bold border-b-2 transition-colors ${activeTab === "admin" ? "border-[#093E7A] text-[#093E7A]" : "border-transparent text-gray-500 hover:bg-gray-50"}`}>
            <ShieldCheck size={18} /> Administradores
          </button>
          <button onClick={() => setActiveTab("docente")} className={`flex items-center gap-2 px-6 py-3 font-bold border-b-2 transition-colors ${activeTab === "docente" ? "border-[#093E7A] text-[#093E7A]" : "border-transparent text-gray-500 hover:bg-gray-50"}`}>
            <BookOpen size={18} /> Docentes
          </button>
          <button onClick={() => setActiveTab("auxiliar")} className={`flex items-center gap-2 px-6 py-3 font-bold border-b-2 transition-colors ${activeTab === "auxiliar" ? "border-[#093E7A] text-[#093E7A]" : "border-transparent text-gray-500 hover:bg-gray-50"}`}>
            <Briefcase size={18} /> Auxiliares
          </button>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Personal</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">DNI / Usuario</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Sueldo (S/)</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-center">Estado</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Cargando datos...</td></tr>
              ) : personal.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">No hay personal registrado en esta área.</td></tr>
              ) : (
                personal.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.usuario.activo ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{p.apellidos}, {p.nombres}</div>
                      <div className="text-xs text-gray-500">{p.email || 'Sin correo'} | {p.telefono || 'Sin teléfono'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{p.dni}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#093E7A]">S/ {Number(p.sueldo).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${p.usuario.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.usuario.activo ? 'ACTIVO' : 'DADO DE BAJA'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Editar">
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleEstado(p.id, !p.usuario.activo)} 
                        className={`p-2 rounded-lg transition-colors ${p.usuario.activo ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                        title={p.usuario.activo ? "Dar de baja" : "Habilitar"}
                      >
                        {p.usuario.activo ? <PowerOff size={18} /> : <Power size={18} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#093E7A] px-6 py-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg">{isEditing ? 'Editar Personal' : `Nuevo ${activeTab.toUpperCase()}`}</h3>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-gray-300"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombres</label>
                  <input required type="text" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.nombres} onChange={e => setFormData({...formData, nombres: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellidos</label>
                  <input required type="text" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.apellidos} onChange={e => setFormData({...formData, apellidos: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI (Usuario)</label>
                  <input required type="text" maxLength={8} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sueldo (S/)</label>
                  <input required type="number" step="0.01" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.sueldo} onChange={e => setFormData({...formData, sueldo: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                  <input type="text" maxLength={9} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                  <input type="email" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Contraseña de Acceso {isEditing && "(Dejar en blanco para no cambiar)"}
                </label>
                <input 
                  required={!isEditing} type="text" 
                  placeholder={isEditing ? "********" : "Escriba una contraseña segura"}
                  className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                  value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#093E7A] text-white font-bold rounded-xl hover:bg-[#072d5a]">Guardar Personal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}