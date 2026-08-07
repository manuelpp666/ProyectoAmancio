"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  UserPlus, Edit, ShieldCheck, BookOpen, Briefcase, HeartHandshake, Power, PowerOff, X, Search,
  LayoutDashboard, Users, UserCog, ClipboardList, GraduationCap, Globe, Bot, MessageSquare,
} from "lucide-react";
import { Personal } from "@/src/interfaces/personal";
import { TipoPersonal } from "@/src/interfaces/personal";
import { apiFetch, mensajeDeError } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';
import { usePermisos } from "@/src/hooks/usePermisos";
import {
  CATALOGO_PERMISOS, NodoPermiso, Permisos,
  normalizar, establecer, estadoCasilla, contarCasillas, permisosCompletos, apagar,
} from "@/src/config/permisos";

const TIPO_CONFIG: Record<string, { label: string; icon: any; desc: string }> = {
  admin: {
    label: "Administrador",
    icon: ShieldCheck,
    desc: "Tendrá acceso al panel de control y a los módulos que le asignes."
  },
  docente: {
    label: "Docente",
    icon: BookOpen,
    desc: "Podrá dictar cursos, registrar notas y comunicarse con sus alumnos."
  },
  auxiliar: {
    label: "Auxiliar",
    icon: Briefcase,
    desc: "Brindará apoyo administrativo y en la gestión de la disciplina."
  },
  psicologo: {
    label: "Psicólogo",
    icon: HeartHandshake,
    desc: "Atenderá citas y velará por el bienestar emocional de los estudiantes."
  }
};

// Pasa el texto a minúsculas y le quita las tildes, para que "perez" encuentre
// a PÉREZ. El filtro es en el navegador, así que aquí no ayuda la colación
// de la base de datos.
const ACENTOS = new RegExp("[\\u0300-\\u036f]", "g"); // marcas de acento sueltas
const sinTildes = (texto: string) =>
  (texto ?? "").normalize("NFD").replace(ACENTOS, "").toLowerCase();

// Pestañas de este apartado. Los `id` coinciden con el catálogo de permisos.
const PESTANAS_PERSONAL: { id: TipoPersonal; label: string; icon: any }[] = [
  { id: "admin", label: "Administradores", icon: ShieldCheck },
  { id: "docente", label: "Docentes", icon: BookOpen },
  { id: "auxiliar", label: "Auxiliares", icon: Briefcase },
  { id: "psicologo", label: "Psicólogos", icon: HeartHandshake },
];

export default function GestionPersonalPage() {
  const { tienePermiso, loading: loadingPermisos } = usePermisos();
  const [activeTab, setActiveTab] = useState<TipoPersonal>("admin");
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  //Editar permisos
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Personal | null>(null);

  // Los permisos guardados se completan contra el catálogo actual: lo que ya
  // estaba decidido se respeta y lo que nunca se configuró entra activado.
  const openPermisos = (p: Personal) => {
    setSelectedUser({ ...p, permisos: normalizar(p.permisos) });
    setIsPermisosModalOpen(true);
  };

  // Cambia un nodo del árbol de permisos del administrador seleccionado
  const cambiarPermiso = (ruta: string[], valor: boolean) => {
    setSelectedUser((prev) =>
      prev ? { ...prev, permisos: establecer((prev.permisos ?? {}) as Permisos, ruta, valor) } : prev
    );
  };
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    dni: "",
    email: "",
    telefono: "",
    password: ""
  });

  // Si la pestaña abierta no está permitida, se salta a la primera que sí lo
  // esté; sin esto quedaría cargando datos de una pestaña que no puede ver.
  useEffect(() => {
    if (loadingPermisos) return;
    if (tienePermiso("gestion_personal", activeTab)) return;
    const primera = PESTANAS_PERSONAL.find((t) => tienePermiso("gestion_personal", t.id));
    if (primera) setActiveTab(primera.id);
  }, [loadingPermisos, activeTab, tienePermiso]);

  useEffect(() => {
    setBusqueda("");
    if (!tienePermiso("gestion_personal", activeTab)) return;
    fetchPersonal(activeTab);
  }, [activeTab, loadingPermisos]);

  // Se busca por nombre, apellidos o DNI. Cada palabra debe aparecer en algún
  // dato, sin importar el orden: "perez ana" y "ana perez" dan lo mismo.
  const palabrasBuscadas = sinTildes(busqueda).split(/[\s,]+/).filter(Boolean);
  const personalFiltrado = personal.filter((p) => {
    if (palabrasBuscadas.length === 0) return true;
    const datos = sinTildes(`${p.nombres} ${p.apellidos} ${p.dni}`);
    return palabrasBuscadas.every((palabra) => datos.includes(palabra));
  });

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
        // El backend dice exactamente qué falló ("Ya existe un usuario ADMIN
        // con el DNI...", "El teléfono debe tener 9 dígitos"). Ocultarlo tras
        // un "Error al guardar" deja al usuario probando a ciegas.
        toast.error(await mensajeDeError(res, "Error al guardar personal"));
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
    setFormData({ nombres: "", apellidos: "", dni: "", email: "", telefono: "", password: "" });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEdit = (p: Personal) => {
    setFormData({
      nombres: p.nombres, apellidos: p.apellidos, dni: p.dni, email: p.email || "",
      telefono: p.telefono || "", password: ""
    });
    setCurrentId(p.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  return (
    
    <RoleGuard modulo="gestion_personal">
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">

        {/* HEADER CON TABS */}
        <div className="bg-white border-b px-4 md:px-8 shrink-0">
          <div className="h-16 flex items-center">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#093E7A]">groups</span>
              <h2 className="text-xl font-bold text-gray-800">Gestión de Personal</h2>
            </div>
          </div>

          {/* TABS: solo las que el administrador tenga permitidas */}
          <div className="barra-pestanas gap-x-5 md:gap-x-6">
            {PESTANAS_PERSONAL.filter((t) => tienePermiso("gestion_personal", t.id)).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`py-4 border-b-2 flex items-center gap-2 text-sm font-bold transition-all ${activeTab === t.id ? "border-[#093E7A] text-[#093E7A]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              >
                <t.icon size={18} /> {t.label}
              </button>
            ))}
          </div>
        </div>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto">

        {/* BARRA: BÚSQUEDA POR NOMBRE O DNI + REGISTRO DEDICADO */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Buscar ${TIPO_CONFIG[activeTab].label.toLowerCase()} por nombre o DNI...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#093E7A]/20 focus:border-[#093E7A]"
            />
          </div>
          <button onClick={openNew} className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d5a] transition-all shrink-0">
            <UserPlus size={18} />
            Nuevo {TIPO_CONFIG[activeTab].label}
          </button>
        </div>

        {/* TABLA */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Personal</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">DNI / Usuario</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-center">Estado</th>
                <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={4} className="py-10 text-center text-gray-400">Cargando datos...</td></tr>
              ) : personalFiltrado.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-gray-400">
                  {busqueda.trim()
                    ? `No se encontró personal que coincida con "${busqueda}".`
                    : "No hay personal registrado en esta área."}
                </td></tr>
              ) : (
                personalFiltrado.map(p => (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${!p.usuario.activo ? 'opacity-60 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{p.apellidos}, {p.nombres}</div>
                      <div className="text-xs text-gray-500">{p.email || 'Sin correo'} | {p.telefono || 'Sin teléfono'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-600">{p.dni}</div>
                      {/* Usuario con el que inicia sesión: el prefijo indica el rol
                          (ADM-, DOC-, AUX-, PSI-), por eso una misma persona puede
                          tener cuenta en dos roles con el mismo DNI. */}
                      <div className="text-xs font-bold text-[#093E7A] tracking-wide">
                        {p.usuario?.username ?? "—"}
                      </div>
                    </td>
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
                          className="p-2 text-[#701C32] hover:bg-[#701C32]/10 rounded-lg transition-colors"
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
      {isModalOpen && (() => {
        const config = TIPO_CONFIG[activeTab];
        const IconoTipo = config.icon;
        return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Cabecera dedicada al tipo */}
            <div className="bg-[#093E7A] px-6 py-5 text-white flex justify-between items-start shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                  <IconoTipo size={24} />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-tight">
                    {isEditing ? `Editar ${config.label}` : `Nuevo ${config.label}`}
                  </h3>
                  <p className="text-[11px] text-white/70 mt-0.5 max-w-sm leading-snug">{config.desc}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-gray-300 mt-0.5"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">

              {/* SECCIÓN: DATOS PERSONALES */}
              <section className="space-y-3">
                <h4 className="text-[11px] font-black text-[#093E7A] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">badge</span> Datos personales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombres</label>
                    <input required type="text" placeholder="Ej. María Fernanda" className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                      value={formData.nombres} onChange={e => setFormData({ ...formData, nombres: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Apellidos</label>
                    <input required type="text" placeholder="Ej. Gómez Salas" className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                      value={formData.apellidos} onChange={e => setFormData({ ...formData, apellidos: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">DNI</label>
                    <input required type="text" inputMode="numeric" maxLength={8} placeholder="8 dígitos"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                      value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value.replace(/\D/g, "") })} />
                    <p className="text-[11px] text-gray-400 mt-1">Se usará como nombre de usuario para iniciar sesión.</p>
                  </div>
                </div>
              </section>

              {/* SECCIÓN: CONTACTO */}
              <section className="space-y-3">
                <h4 className="text-[11px] font-black text-[#093E7A] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">contact_phone</span> Contacto
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                    <input type="text" inputMode="numeric" maxLength={9} placeholder="9 dígitos"
                      className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                      value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value.replace(/\D/g, "") })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Electrónico</label>
                    <input type="email" placeholder="correo@ejemplo.com" className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A]"
                      value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
              </section>

              {/* SECCIÓN: ACCESO */}
              <section className="space-y-3">
                <h4 className="text-[11px] font-black text-[#093E7A] uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">lock</span> Acceso al sistema
                </h4>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Contraseña {isEditing && "(Dejar en blanco para no cambiar)"}
                  </label>
                  <input
                    required={!isEditing} type="text"
                    placeholder={isEditing ? "********" : "Escriba una contraseña segura"}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-[#093E7A] bg-white"
                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </section>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-[#093E7A] text-white font-bold rounded-xl hover:bg-[#072d5a]">
                  {isEditing ? "Guardar cambios" : `Registrar ${config.label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* MODAL DE PERMISOS */}
      {isPermisosModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* CABECERA */}
            <div className="bg-[#701C32] px-6 py-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} />
                <div>
                  <h3 className="font-bold text-lg">Gestionar Privilegios</h3>
                  <p className="text-xs text-[#FFF1E3]/80 font-medium">Configurando a: {selectedUser.nombres} {selectedUser.apellidos}</p>
                </div>
              </div>
              <button onClick={() => setIsPermisosModalOpen(false)} className="hover:text-[#FFF1E3]"><X size={24} /></button>
            </div>

            {/* BARRA DE RESUMEN: fija, para no perder el contador al bajar */}
            {(() => {
              const permisos = (selectedUser.permisos ?? {}) as Permisos;
              const { activas, total } = contarCasillas({ raiz: permisos }, ["raiz"]);
              return (
                <div className="px-6 py-3 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <p className="text-xs text-gray-500">
                    Verá únicamente lo marcado ·{" "}
                    <span className="font-black text-[#701C32]">{activas} de {total}</span> accesos
                  </p>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedUser({ ...selectedUser, permisos: permisosCompletos() })}
                      className="text-[11px] font-bold text-[#093E7A] px-3 py-1.5 rounded-lg hover:bg-[#093E7A]/5 transition-colors"
                    >
                      Marcar todo
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedUser({ ...selectedUser, permisos: apagar(CATALOGO_PERMISOS) })}
                      className="text-[11px] font-bold text-gray-400 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Desmarcar todo
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="p-6 overflow-y-auto bg-[#F8FAFC] space-y-5">
              {/* Apartados de una sola pantalla: agrupados en una lista compacta
                  en vez de una tarjeta por cada uno, que dejaba huecos. */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Accesos directos
                  </h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {CATALOGO_PERMISOS.filter((n) => !n.hijos?.length).map((nodo) => (
                    <FilaPermiso
                      key={nodo.id}
                      nodo={nodo}
                      permisos={(selectedUser.permisos ?? {}) as Permisos}
                      onChange={cambiarPermiso}
                    />
                  ))}
                </div>
              </div>

              {/* Apartados con pestañas: una tarjeta cada uno */}
              {CATALOGO_PERMISOS.filter((n) => n.hijos?.length).map((nodo) => (
                <ApartadoPermisos
                  key={nodo.id}
                  nodo={nodo}
                  permisos={(selectedUser.permisos ?? {}) as Permisos}
                  onChange={cambiarPermiso}
                />
              ))}
            </div>

            {/* PIE FIJO: los botones no se pierden al final del scroll */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white flex gap-3 shrink-0">
              <button
                onClick={() => setIsPermisosModalOpen(false)}
                className="flex-1 py-3 bg-white text-gray-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSavePermisos(selectedUser.permisos)}
                className="flex-[2] py-3 bg-[#701C32] text-white font-bold rounded-xl shadow-lg shadow-[#701C32]/25 hover:bg-[#5a1628] transition-all text-sm"
              >
                Guardar cambios de acceso
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </RoleGuard>
  );
}

// Icono de cada apartado, para poder distinguirlos de un vistazo.
const ICONO_APARTADO: Record<string, any> = {
  panel_control: LayoutDashboard,
  gestion_estudiantes: Users,
  gestion_personal: UserCog,
  tramites_finanzas: ClipboardList,
  academico: GraduationCap,
  contenido_web: Globe,
  chatbot: Bot,
  mensajeria: MessageSquare,
  seguridad: ShieldCheck,
};

/** Fila de un apartado sin pestañas, dentro de la lista de accesos directos. */
function FilaPermiso({ nodo, permisos, onChange }: {
  nodo: NodoPermiso;
  permisos: Permisos;
  onChange: (ruta: string[], valor: boolean) => void;
}) {
  const activo = estadoCasilla(permisos, [nodo.id]) === "todo";
  const Icono = ICONO_APARTADO[nodo.id];

  return (
    <label className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50/70 transition-colors">
      {Icono && (
        <span className={`shrink-0 ${activo ? "text-[#701C32]" : "text-gray-300"}`}>
          <Icono size={17} />
        </span>
      )}
      <span className={`flex-1 text-sm font-bold ${activo ? "text-gray-800" : "text-gray-400"}`}>
        {nodo.label}
      </span>
      <CasillaPermiso estado={activo ? "todo" : "nada"} onChange={(v) => onChange([nodo.id], v)} />
    </label>
  );
}

/** Una tarjeta por apartado con pestañas. */
function ApartadoPermisos({ nodo, permisos, onChange }: {
  nodo: NodoPermiso;
  permisos: Permisos;
  onChange: (ruta: string[], valor: boolean) => void;
}) {
  const estado = estadoCasilla(permisos, [nodo.id]);
  const { activas, total } = contarCasillas(permisos, [nodo.id]);
  const Icono = ICONO_APARTADO[nodo.id];

  // Las pestañas con subpestañas ocupan la fila entera; las simples van de dos
  // en dos, para que la tarjeta no crezca más de lo necesario.
  const hijos = nodo.hijos ?? [];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <label className="flex items-center gap-3 px-5 py-3.5 bg-gray-50/70 border-b border-gray-100 cursor-pointer hover:bg-gray-100/70 transition-colors">
        {Icono && (
          <span className={`shrink-0 ${estado === "nada" ? "text-gray-300" : "text-[#701C32]"}`}>
            <Icono size={18} />
          </span>
        )}
        <span className={`flex-1 text-sm font-black ${estado === "nada" ? "text-gray-400" : "text-gray-800"}`}>
          {nodo.label}
        </span>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
          estado === "todo" ? "bg-[#701C32]/10 text-[#701C32]"
            : estado === "parcial" ? "bg-amber-100 text-amber-700"
            : "bg-gray-100 text-gray-400"
        }`}>
          {activas} / {total}
        </span>
        <CasillaPermiso estado={estado} onChange={(v) => onChange([nodo.id], v)} grande />
      </label>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {hijos.map((hijo) => (
          <PestanaPermiso
            key={hijo.id}
            nodo={hijo}
            rutaPadre={[nodo.id]}
            permisos={permisos}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

/** Pestaña del apartado; si tiene subpestañas, las despliega debajo. */
function PestanaPermiso({ nodo, rutaPadre, permisos, onChange }: {
  nodo: NodoPermiso;
  rutaPadre: string[];
  permisos: Permisos;
  onChange: (ruta: string[], valor: boolean) => void;
}) {
  const ruta = [...rutaPadre, nodo.id];
  const estado = estadoCasilla(permisos, ruta);
  const tieneHijos = !!nodo.hijos?.length;
  const { activas, total } = contarCasillas(permisos, ruta);

  return (
    <div className={`rounded-xl border transition-colors ${
      estado === "nada" ? "border-gray-100 bg-gray-50/40" : "border-[#701C32]/15 bg-[#701C32]/[0.03]"
    } ${tieneHijos ? "sm:col-span-2" : ""}`}>
      <label className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer">
        <CasillaPermiso estado={estado} onChange={(v) => onChange(ruta, v)} />
        <span className={`flex-1 text-xs font-bold ${estado === "nada" ? "text-gray-400" : "text-gray-700"}`}>
          {nodo.label}
        </span>
        {tieneHijos && (
          <span className="text-[10px] font-black text-gray-400 shrink-0">{activas}/{total}</span>
        )}
      </label>

      {tieneHijos && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 border-t border-gray-100/80 mt-0.5">
          {nodo.hijos!.map((sub) => {
            const rutaSub = [...ruta, sub.id];
            const activo = estadoCasilla(permisos, rutaSub) === "todo";
            return (
              <label key={sub.id} className="flex items-center gap-2 cursor-pointer group">
                <CasillaPermiso
                  estado={activo ? "todo" : "nada"}
                  onChange={(v) => onChange(rutaSub, v)}
                  pequena
                />
                <span className={`text-[11px] font-medium truncate ${
                  activo ? "text-gray-600 group-hover:text-gray-900" : "text-gray-400"
                }`}>
                  {sub.label}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Casilla de tres estados: marcada, vacía o a medias cuando solo algunas de
 * sus pestañas están activas. El "a medias" evita que un apartado parezca
 * cerrado cuando en realidad conserva alguna pestaña abierta.
 */
function CasillaPermiso({ estado, onChange, grande = false, pequena = false }: {
  estado: "todo" | "nada" | "parcial";
  onChange: (v: boolean) => void;
  grande?: boolean;
  pequena?: boolean;
}) {
  const tamano = grande ? "w-5 h-5" : pequena ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <input
      type="checkbox"
      className={`${tamano} shrink-0 accent-[#701C32] cursor-pointer`}
      checked={estado === "todo"}
      ref={(el) => { if (el) el.indeterminate = estado === "parcial"; }}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}
