"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, UserPlus, Edit, ShieldCheck, BookOpen, Briefcase, HeartHandshake, Power, PowerOff, X, Globe } from "lucide-react";
import { Personal } from "@/src/interfaces/personal";
import { TipoPersonal } from "@/src/interfaces/personal";
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';

export default function GestionPersonalPage() {
  const [activeTab, setActiveTab] = useState<TipoPersonal>("admin");
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  //Editar permisos
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Personal | null>(null);

  const openPermisos = (p: Personal) => {
  // 1. Estructura base para evitar que el modal explote si el JSON está vacío
  const estructuraBase = {
    panel_control: true,
    gestion_estudiantes: false,
    gestion_personal: false,
    tramites_finanzas: false,
    chatbot: false,
    academico: { estructura: false, horarios: false, docentes: false, estudiantes: false, cursos: false },
    contenido_web: { info_general: false, noticias: false, calendario: false }
  };

  // 2. Combinamos lo que viene de la base de datos (p.permisos) con la base
  // Usamos una combinación manual para asegurar que los objetos anidados existan
  const permisosActuales = {
    ...estructuraBase,
    ...(p.permisos || {}),
    academico: {
      ...estructuraBase.academico,
      ...(p.permisos?.academico || {})
    },
    contenido_web: {
      ...estructuraBase.contenido_web,
      ...(p.permisos?.contenido_web || {})
    }
  };

  // 3. Seteamos el usuario seleccionado con sus permisos reales
  setSelectedUser({
    ...p,
    permisos: permisosActuales
  });
  
  setIsPermisosModalOpen(true);
};
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
      const res = await apiFetch(`/personal/${tipo}`);
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
      ? `/personal/${activeTab}/${currentId}`
      : `/personal/${activeTab}`;

    const method = isEditing ? "PUT" : "POST";

    const { password, ...restData } = formData;
    const payload = (isEditing && !password) ? restData : formData;

    try {
      const res = await apiFetch(url, {
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
  const handleSavePermisos = async (nuevosPermisos: any) => {
    if (!selectedUser) return;
    try {
      const res = await apiFetch(`/personal/admin/${selectedUser.id}/permisos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permisos: nuevosPermisos })
      });

      if (res.ok) {
        toast.success("Permisos actualizados con éxito");
        setIsPermisosModalOpen(false);
        fetchPersonal(activeTab);
      } else {
        toast.error("Error al actualizar permisos");
      }
    } catch (e) {
      toast.error("Error de conexión");
    }
  };
  const handleEstado = async (id: number, nuevoEstado: boolean) => {
    try {
      await apiFetch(`/personal/${activeTab}/${id}/estado?activo=${nuevoEstado}`, { method: "PATCH" });
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
    
    <RoleGuard modulo="gestion_personal">
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      {/* HEADER */}
      <div className="h-20 bg-white border-b px-8 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#093E7A] flex items-center gap-3">
            <Users size={28} />
            Gestión de Personal
          </h1>
          <p className="text-gray-500 text-sm">Administra los usuarios del sistema (Admin, Docentes, Auxiliares y Psicólogos)</p>
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
          <button onClick={() => setActiveTab("psicologo")} className={`flex items-center gap-2 px-6 py-3 font-bold border-b-2 transition-colors ${activeTab === "psicologo" ? "border-[#093E7A] text-[#093E7A]" : "border-transparent text-gray-500 hover:bg-gray-50"}`}>
            <HeartHandshake size={18} /> Psicólogos
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
                      {activeTab === "admin" && (
                        <button
                          onClick={() => openPermisos(p)}
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Gestionar Permisos"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}
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
                    value={formData.nombres} onChange={e => setFormData({ ...formData, nombres: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellidos</label>
                  <input required type="text" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.apellidos} onChange={e => setFormData({ ...formData, apellidos: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI (Usuario)</label>
                  <input required type="text" maxLength={8} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Sueldo (S/)</label>
                  <input required type="number" step="0.01" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.sueldo} onChange={e => setFormData({ ...formData, sueldo: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                  <input type="text" maxLength={9} className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                  <input type="email" className="w-full border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
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
                  value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
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

      {/* MODAL DE PERMISOS */}
      {isPermisosModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-amber-500 px-6 py-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} />
                <div>
                  <h3 className="font-bold text-lg">Gestionar Privilegios</h3>
                  <p className="text-xs text-amber-100 font-medium">Configurando a: {selectedUser.nombres} {selectedUser.apellidos}</p>
                </div>
              </div>
              <button onClick={() => setIsPermisosModalOpen(false)} className="hover:text-amber-200"><X size={24} /></button>
            </div>

            <div className="p-8 overflow-y-auto bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* SECCIÓN: ACCESO GENERAL */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b pb-2">Módulos Principales</h4>

                  <PermissionToggle
                    label="Panel de Control (Dashboard)"
                    checked={true} // Siempre activo
                    disabled={true} // No se puede quitar
                    onChange={() => { }}
                  />
                  <PermissionToggle
                    label="Gestión de Estudiantes"
                    checked={selectedUser.permisos?.gestion_estudiantes || false}
                    onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, gestion_estudiantes: val } })}
                  />
                  <PermissionToggle
                    label="Gestión de Personal (RRHH)"
                    checked={selectedUser.permisos?.gestion_personal || false}
                    onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, gestion_personal: val } })}
                  />
                  <PermissionToggle
                    label="Trámites y Finanzas"
                    checked={selectedUser.permisos?.tramites_finanzas || false}
                    onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, tramites_finanzas: val } })}
                  />
                  <PermissionToggle
                    label="Gestionar Chatbot AI"
                    checked={selectedUser.permisos?.chatbot || false}
                    onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, chatbot: val } })}
                  />
                </div>

                {/* SECCIÓN: PERMISOS DETALLADOS (SUB-TABS) */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-xs font-black text-[#093E7A] uppercase mb-4 flex items-center gap-2">
                      <BookOpen size={16} /> Gestión Académica
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <SubPermissionCheck
                        label="Estructura Escolar"
                        checked={selectedUser.permisos?.academico?.estructura || false}
                        onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, academico: { ...selectedUser.permisos?.academico, estructura: val } } })}
                      />
                      <SubPermissionCheck
                        label="Gestión de Horarios"
                        checked={selectedUser.permisos?.academico?.horarios || false}
                        onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, academico: { ...selectedUser.permisos?.academico, horarios: val } } })}
                      />
                      <SubPermissionCheck
                        label="Asignación de Docentes"
                        checked={selectedUser.permisos?.academico?.docentes || false}
                        onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, academico: { ...selectedUser.permisos?.academico, docentes: val } } })}
                      />
                      <SubPermissionCheck
                        label="Asignación de Estudiantes"
                        checked={selectedUser.permisos?.academico?.estudiantes || false}
                        onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, academico: { ...selectedUser.permisos?.academico, estudiantes: val } } })}
                      />
                      <SubPermissionCheck
                        label="Gestión de Cursos"
                        checked={selectedUser.permisos?.academico?.cursos || false}
                        onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, academico: { ...selectedUser.permisos?.academico, cursos: val } } })}
                      />
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-xs font-black text-green-600 uppercase mb-4 flex items-center gap-2">
                      <Globe size={16} /> Contenido Web
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      <SubPermissionCheck
                        label="Información General"
                        checked={selectedUser.permisos?.contenido_web?.info_general || false}
                        onChange={(val) => setSelectedUser({
                          ...selectedUser,
                          permisos: {
                            ...selectedUser.permisos,
                            contenido_web: { ...selectedUser.permisos?.contenido_web, info_general: val }
                          }
                        })}
                      />
                      <SubPermissionCheck
                        label="Noticias"
                        checked={selectedUser.permisos?.contenido_web?.noticias || false}
                        onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, contenido_web: { ...selectedUser.permisos?.contenido_web, noticias: val } } })}
                      />
                      <SubPermissionCheck
                        label="Calendario Anual"
                        checked={selectedUser.permisos?.contenido_web?.calendario || false}
                        onChange={(val) => setSelectedUser({ ...selectedUser, permisos: { ...selectedUser.permisos, contenido_web: { ...selectedUser.permisos?.contenido_web, calendario: val } } })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-4">
                <button
                  onClick={() => setIsPermisosModalOpen(false)}
                  className="flex-1 py-3 bg-white text-gray-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSavePermisos(selectedUser.permisos)}
                  className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all"
                >
                  Guardar Cambios de Acceso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </RoleGuard>
  );
}

function PermissionToggle({ label, checked, onChange, disabled = false }: { label: string, checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between p-3 rounded-xl border transition-all ${disabled ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-80' : 'bg-white border-gray-100 hover:border-gray-300 cursor-pointer'}`}>
      <span className={`text-sm font-bold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}</span>
      <input
        type="checkbox"
        disabled={disabled}
        className="w-5 h-5 accent-[#093E7A] cursor-pointer disabled:cursor-not-allowed"
        checked={checked || false}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function SubPermissionCheck({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        className="w-4 h-4 accent-amber-500"
        checked={checked || false}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-xs font-medium text-gray-600">{label}</span>
    </div>
  );
}