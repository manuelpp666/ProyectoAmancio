// src/app/campus/(dashboard)/panel-control/pagina-web/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useConfiguracion } from '@/src/hooks/useConfiguracion';
import ImageUpload from '@/src/components/utils/ImageUpload';
import MediaUpload from '@/src/components/utils/MediaUpload';
import { uploadToCloudinary, uploadMediaToCloudinary } from "@/src/components/utils/cloudinary";
import * as LucideIcons from "lucide-react";
import HeaderPanel from '@/src/components/Campus/PanelControl/Header';
import { Save, Home, Users, Footprints, Loader2, GraduationCap, CalendarDays, Newspaper, ClipboardList, RotateCcw, AlertTriangle, LogIn } from 'lucide-react';
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';

const SECCIONES = [
  {
    id: 'inicio', label: 'Inicio', icon: Home, campos: [
      { clave: 'hero_titulo', label: 'Título Principal', tipo: 'text' },
      { clave: 'hero_subtitulo', label: 'Subtítulo Hero', tipo: 'text' },
      { clave: 'hero_imagen', label: 'Fondo del Hero (Imagen o Video)', tipo: 'media' },
      { clave: 'home_enfoques', label: 'Enfoques Educativos (Lista)', tipo: 'enfoques' },
      { clave: 'home_niveles', label: 'Niveles Académicos (Lista)', tipo: 'niveles' },
    ]
  },
  {
    id: 'login', label: 'Inicio de Sesión', icon: LogIn, campos: [
      { clave: 'login_imagen', label: 'Imagen de Fondo (Login)', tipo: 'image' },
    ]
  },
  {
    id: 'nosotros', label: 'Sobre Nosotros', icon: Users, campos: [
      { clave: 'nosotros_header_titulo', label: 'Título de Cabecera', tipo: 'text' },
      { clave: 'nosotros_header_desc', label: 'Descripción de Cabecera', tipo: 'textarea' },
      { clave: 'nosotros_header_imagen', label: 'Imagen de Portada', tipo: 'image' },
      { clave: 'nosotros_titulo', label: 'Título Sección', tipo: 'text' },
      { clave: 'nosotros_contenido', label: 'Historia / Contenido', tipo: 'textarea' },
      { clave: 'nosotros_imagen', label: 'Imagen Historia', tipo: 'image' },
      { clave: 'mision', label: 'Misión', tipo: 'textarea' },
      { clave: 'mision_imagen', label: 'Imagen de Misión', tipo: 'image' },
      { clave: 'vision', label: 'Visión', tipo: 'textarea' },
      { clave: 'vision_imagen', label: 'Imagen de Visión', tipo: 'image' },
      { clave: 'himno_titulo', label: 'Título del Himno', tipo: 'text' },
      { clave: 'himno_contenido', label: 'Letra del Himno', tipo: 'textarea' },
      { clave: 'nosotros_frase', label: 'Frase Inspiradora', tipo: 'textarea' },
      { clave: 'nosotros_frase_autor', label: 'Subtexto de la Frase', tipo: 'text' },
    ]
  },
  {
    id: 'docentes', label: 'Docentes', icon: GraduationCap, campos: [
      { clave: 'docentes_titulo', label: 'Título de la Página', tipo: 'text' },
      { clave: 'docentes_subtitulo', label: 'Subtítulo / Descripción', tipo: 'textarea' },
      { clave: 'docentes_imagen', label: 'Imagen de Fondo (Opcional)', tipo: 'image' },
      { clave: 'docentes_visibilidad', label: 'Docentes visibles en la web', tipo: 'docentes_visibilidad' },
    ]
  },
  {
    id: 'calendario', label: 'Calendario', icon: CalendarDays, campos: [
      { clave: 'calendario_titulo', label: 'Título de la Página', tipo: 'text' },
      { clave: 'calendario_subtitulo', label: 'Subtítulo / Descripción', tipo: 'textarea' },
    ]
  },
  {
    id: 'noticias', label: 'Noticias', icon: Newspaper, campos: [
      { clave: 'noticias_titulo', label: 'Título de la Página', tipo: 'text' },
      { clave: 'noticias_subtitulo', label: 'Subtítulo / Descripción', tipo: 'textarea' },
    ]
  },
  {
    id: 'admision', label: 'Admisión', icon: ClipboardList, campos: [
      { clave: 'admision_titulo', label: 'Título de la Página', tipo: 'text' },
      { clave: 'admision_subtitulo', label: 'Subtítulo / Descripción', tipo: 'textarea' },
    ]
  },
  {
    id: 'footer', label: 'Footer', icon: Footprints, campos: [
      { clave: 'footer_direccion', label: 'Dirección', tipo: 'text' },
      { clave: 'footer_correo', label: 'Email de Contacto', tipo: 'text' },
      { clave: 'footer_telefono', label: 'Teléfono', tipo: 'text' },
      { clave: 'footer_descripcion', label: 'Descripción Breve', tipo: 'textarea' },
      { clave: 'footer_facebook', label: 'Enlace de Facebook (URL)', tipo: 'text' },
      { clave: 'footer_youtube', label: 'Enlace de YouTube (URL)', tipo: 'text' },
      { clave: 'footer_tiktok', label: 'Enlace de TikTok (URL)', tipo: 'text' },
    ]
  }
];

export default function GestionWebPage() {
  const [tab, setTab] = useState('inicio');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  // Pestaña a la que se quiere ir cuando hay cambios sin guardar (dispara el aviso)
  const [pestanaPendiente, setPestanaPendiente] = useState<string | null>(null);
  const { data, updateField, loading, isDirty, revert, commit } = useConfiguracion(tab);

  const getVal = (clave: string) => data.find(i => i.clave === clave)?.valor || "";
  const getJsonVal = (clave: string, defecto: any) => {
    const val = getVal(clave);
    try { return val ? JSON.parse(val) : defecto; }
    catch { return defecto; }
  };

  // Guarda los cambios de la pestaña actual. Devuelve true si todo salió bien.
  const handleSave = async (): Promise<boolean> => {
    if (uploadingField) {
      toast.error("Espera a que el archivo termine de subirse");
      return false;
    }
    if (!isDirty) return true; // nada que guardar
    const camposActuales = (SECCIONES.find(s => s.id === tab)?.campos || [])
      .filter(campo => campo.tipo !== 'docentes_visibilidad');
    setGuardando(true);
    try {
      await Promise.all(camposActuales.map(async (campo) => {
        const valor = getVal(campo.clave);
        const res = await apiFetch(`/configuracion/${campo.clave}?seccion=${tab}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Error ${res.status}`);
        }
      }));
      commit(); // el estado actual pasa a ser el "guardado" (ya no hay cambios pendientes)
      toast.success("¡Cambios guardados correctamente!");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Error al guardar los cambios");
      return false;
    } finally {
      setGuardando(false);
    }
  };

  // Intento de cambio de pestaña: si hay cambios sin guardar, pide confirmación
  const intentarCambiarTab = (nuevoTab: string) => {
    if (nuevoTab === tab) return;
    if (isDirty) {
      setPestanaPendiente(nuevoTab);
    } else {
      setTab(nuevoTab);
    }
  };

  // Acciones del aviso de cambios sin guardar
  const guardarYCambiar = async () => {
    const ok = await handleSave();
    if (ok && pestanaPendiente) {
      setTab(pestanaPendiente);
      setPestanaPendiente(null);
    }
  };
  const descartarYCambiar = () => {
    revert();
    if (pestanaPendiente) setTab(pestanaPendiente);
    setPestanaPendiente(null);
  };

  // Aviso del navegador al recargar/cerrar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return (
    <RoleGuard modulo="contenido_web" subModulo="info_general">
    
    
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
        <HeaderPanel />

        {/* BARRA SUPERIOR ESTÁNDAR */}
        <div className="h-16 border-b bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#093E7A]">language</span>
            <h2 className="text-xl font-bold text-gray-800">Editor Web</h2>
            {isDirty && (
              <span className="ml-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Cambios sin guardar
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <button
                onClick={revert}
                disabled={guardando}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-bold text-sm hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={16} /> Revertir
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!isDirty || guardando || !!uploadingField}
              className="flex items-center gap-2 px-5 py-2 bg-[#093E7A] text-white rounded-lg font-bold text-sm shadow-sm hover:bg-[#072d59] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#093E7A] disabled:active:scale-100"
            >
              {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>

        {/* TABS DE SECCIÓN */}
        <div className="bg-white px-8 border-b shrink-0 flex gap-6 overflow-x-auto">
          {SECCIONES.map(s => (
            <button
              key={s.id}
              onClick={() => intentarCambiarTab(s.id)}
              className={`py-4 px-2 text-sm font-bold whitespace-nowrap border-b-[3px] transition-all flex items-center gap-2 ${
                tab === s.id
                  ? 'text-[#093E7A] border-[#093E7A]'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              <s.icon size={16} /> {s.label}
            </button>
          ))}
        </div>

        {/* AVISO DE CAMBIOS SIN GUARDAR AL CAMBIAR DE PESTAÑA */}
        {pestanaPendiente && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="text-amber-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-800">Cambios sin guardar</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Tienes cambios sin guardar en esta sección. ¿Qué deseas hacer antes de continuar?
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={guardarYCambiar}
                  disabled={guardando || !!uploadingField}
                  className="flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-[#093E7A] text-white rounded-lg font-bold text-sm hover:bg-[#072d59] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {guardando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {guardando ? "Guardando..." : "Guardar y continuar"}
                </button>
                <button
                  onClick={descartarYCambiar}
                  disabled={guardando}
                  className="w-full px-5 py-2.5 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Descartar cambios
                </button>
                <button
                  onClick={() => setPestanaPendiente(null)}
                  disabled={guardando}
                  className="w-full px-5 py-2.5 text-gray-500 rounded-lg font-bold text-sm hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUERPO DEL EDITOR */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {SECCIONES.find(s => s.id === tab)?.campos.map(campo => (
              <div key={campo.clave} className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 transition-all hover:shadow-md">
                
                {campo.tipo === 'docentes_visibilidad' ? (
                  <EditorVisibilidadDocentes />
                ) : campo.tipo === 'enfoques' || campo.tipo === 'niveles' ? (
                  <EditorListaDinamica
                    tipo={campo.tipo}
                    data={getJsonVal(campo.clave, [])}
                    onChange={(newData) => updateField(campo.clave, JSON.stringify(newData))}
                    onUploadingChange={(activo) => setUploadingField(activo ? campo.clave : null)}
                  />
                ) : campo.tipo === 'media' ? (
                  <div className="relative">
                    <MediaUpload
                      label={campo.label}
                      maxVideoMB={80}
                      initialMedia={getVal(campo.clave)}
                      onMediaChange={async (file) => {
                        if (file) {
                          setUploadingField(campo.clave);
                          try {
                            const url = await uploadMediaToCloudinary(file);
                            if (url) {
                              updateField(campo.clave, url);
                              toast.success("Archivo listo para guardar");
                            } else {
                              toast.error("No se pudo subir el archivo");
                            }
                          } catch {
                            toast.error("Error al subir el archivo");
                          } finally {
                            setUploadingField(null);
                          }
                        } else {
                          updateField(campo.clave, "");
                        }
                      }}
                    />
                    <p className="mt-3 text-xs text-gray-400">
                      Puedes subir una imagen o un video corto. El video se reproduce en bucle,
                      silenciado y sin controles, como fondo animado.
                    </p>
                    {uploadingField === campo.clave && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-3xl backdrop-blur-[2px]">
                        <Loader2 className="animate-spin text-[#093E7A]" size={32} />
                      </div>
                    )}
                  </div>
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
                        } else {
                          // Imagen eliminada: limpiamos el campo para que se guarde vacío
                          updateField(campo.clave, "");
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
    </RoleGuard>
  );
}

interface DocenteVis {
  id_docente: number;
  nombres: string;
  apellidos: string;
  especialidad: string | null;
  url_perfil: string | null;
  visible_web?: boolean;
  usuario?: { activo: boolean };
}

function EditorVisibilidadDocentes() {
  const [docentes, setDocentes] = useState<DocenteVis[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    apiFetch(`/docentes/`)
      .then(res => res.json())
      .then((data) => setDocentes(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Error al cargar docentes"))
      .finally(() => setLoading(false));
  }, []);

  const toggleVisible = async (id: number, nuevoValor: boolean) => {
    setSavingId(id);
    // Optimista
    setDocentes(prev => prev.map(d => d.id_docente === id ? { ...d, visible_web: nuevoValor } : d));
    try {
      const res = await apiFetch(`/docentes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible_web: nuevoValor })
      });
      if (!res.ok) throw new Error();
      toast.success(nuevoValor ? "Docente visible en la web" : "Docente oculto de la web");
    } catch {
      // Revertir
      setDocentes(prev => prev.map(d => d.id_docente === id ? { ...d, visible_web: !nuevoValor } : d));
      toast.error("No se pudo actualizar la visibilidad");
    } finally {
      setSavingId(null);
    }
  };

  const visibles = docentes.filter(d => d.visible_web !== false).length;

  return (
    <div className="space-y-5 border-l-4 border-[#093E7A] pl-6 py-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black uppercase text-[#701C32] tracking-widest">
          Docentes visibles en la página pública
        </label>
        {!loading && (
          <span className="text-[10px] bg-[#093E7A]/10 text-[#093E7A] px-3 py-1 rounded-full font-bold">
            {visibles} de {docentes.length} visibles
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400">Activa el interruptor de cada docente para mostrarlo u ocultarlo en la sección de Docentes de la web. Los cambios se guardan al instante.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-6">
          <Loader2 className="animate-spin" size={20} /> <span className="text-sm font-bold">Cargando docentes...</span>
        </div>
      ) : docentes.length === 0 ? (
        <p className="text-sm text-gray-400 italic py-6">No hay docentes registrados todavía.</p>
      ) : (
        <div className="grid gap-3">
          {docentes.map(d => {
            const visible = d.visible_web !== false;
            const inactivo = d.usuario && d.usuario.activo === false;
            const foto = d.url_perfil && d.url_perfil.trim() !== ""
              ? d.url_perfil
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(d.nombres + ' ' + d.apellidos)}&background=093E7A&color=fff&size=128`;
            return (
              <div key={d.id_docente} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <img src={foto} alt="" className="w-11 h-11 rounded-full object-cover border border-gray-200" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{d.nombres} {d.apellidos}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {d.especialidad || 'Docente'}{inactivo ? ' · (usuario inactivo)' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={savingId === d.id_docente}
                  onClick={() => toggleVisible(d.id_docente, !visible)}
                  title={visible ? "Ocultar de la web" : "Mostrar en la web"}
                  className={`relative w-12 h-6 rounded-full transition-colors shrink-0 disabled:opacity-50 ${visible ? 'bg-[#093E7A]' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${visible ? 'translate-x-6' : ''}`}></span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditorListaDinamica({ data, onChange, tipo, onUploadingChange }: { data: any[], onChange: (d: any[]) => void, tipo: 'enfoques' | 'niveles', onUploadingChange?: (activo: boolean) => void }) {
  // Contador de subidas en curso; avisa al padre para bloquear "Guardar"
  const [subiendo, setSubiendo] = useState(0);
  const cambiarSubiendo = (delta: number) => {
    setSubiendo(prev => {
      const next = Math.max(0, prev + delta);
      onUploadingChange?.(next > 0);
      return next;
    });
  };

  const agregar = () => {
    // Se conserva un icono por defecto como respaldo por si aún no se sube imagen
    const nuevoItem = tipo === 'enfoques'
      ? { titulo: "", descripcion: "", imagen: "", icon: "Beaker", badge: "Lightbulb" }
      : { titulo: "", descripcion: "", imagen: "", icon: "BookOpen" };
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
              className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 hover:text-white z-10"
            >
              <LucideIcons.Trash2 size={16} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* IMAGEN DEL ITEM */}
              <div className="md:col-span-4">
                <ImageUpload
                  label="Imagen"
                  initialImage={item.imagen || ""}
                  onImageChange={async (file) => {
                    if (file) {
                      cambiarSubiendo(1);
                      try {
                        const url = await uploadToCloudinary(file);
                        if (url) {
                          actualizar(i, 'imagen', url);
                          toast.success("Imagen lista para guardar");
                        } else {
                          toast.error("No se pudo subir la imagen");
                        }
                      } catch {
                        toast.error("Error al subir imagen");
                      } finally {
                        cambiarSubiendo(-1);
                      }
                    } else {
                      actualizar(i, 'imagen', "");
                    }
                  }}
                />
              </div>

              {/* TEXTOS */}
              <div className="md:col-span-8 space-y-4">
                <input
                  className="w-full text-lg font-black text-[#093E7A] border-b border-gray-100 focus:border-[#093E7A] outline-none transition-all"
                  placeholder={tipo === 'enfoques' ? "Título del enfoque..." : "Título del nivel..."}
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
        {data.length === 0 && (
          <p className="text-sm text-gray-400 italic py-4">Aún no hay elementos. Usa “+ Añadir nuevo” para crear el primero.</p>
        )}
      </div>
    </div>
  );
}