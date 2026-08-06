"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Grado } from "@/src/interfaces/academic";
import {
  User,
  Users,
  MapPin,
  Phone,
  Mail,
  Stethoscope,
  School,
  Send,
  ArrowLeft,
  Loader2,
  CalendarClock,
  FileText,
  Upload,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useConfiguracion } from "@/src/hooks/useConfiguracion";
import { formatearFechaLarga } from "@/src/components/utils/fecha";
import { uploadMediaToCloudinary } from "@/src/components/utils/cloudinary";

const DOCS_ADMISION = [
  { campo: "doc_dni_menor", label: "Copia simple del DNI del menor" },
  { campo: "doc_dni_apoderado", label: "Copia simple del DNI del padre / apoderado" },
  { campo: "doc_fum", label: "Ficha Única de Matrícula (FUM)" },
  { campo: "doc_certificado_estudios", label: "Certificado de estudios anteriores (colegio de procedencia)" },
] as const;

interface EstadoAdmision {
  abierto: boolean;
  tipo?: string;
  proxima_inscripcion?: string;
}

const ESTADO_INICIAL = {
  alumno: {
    dni: "",
    nombres: "",
    apellidos: "",
    fecha_nacimiento: "",
    genero: "M",
    direccion: "",
    enfermedad: "",
    talla_polo: "",
    colegio_procedencia: "",
    id_grado_ingreso: "",
    doc_dni_menor: "",
    doc_dni_apoderado: "",
    doc_fum: "",
    doc_certificado_estudios: "",
  },
  familiar: {
    dni: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    email: "",
    direccion: "",
  },
  tipo_parentesco: "PADRE",
};

export default function AdmisionPage() {
  const router = useRouter();
  const { getVal } = useConfiguracion('admision');
  const [loading, setLoading] = useState(false);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [estado, setEstado] = useState<EstadoAdmision | null>(null);
  const [mismaDireccion, setMismaDireccion] = useState(true);
  const [formData, setFormData] = useState(ESTADO_INICIAL);

  // --- Modo verano ---
  const [esVerano, setEsVerano] = useState(false);
  const [veranoAnio, setVeranoAnio] = useState<string>("");
  const [modalidadVerano, setModalidadVerano] = useState<"CURSOS" | "TALLER" | "CURSOS_Y_TALLER">("CURSOS");
  const [cursosFijos, setCursosFijos] = useState<{ id_curso: number; nombre: string }[]>([]);
  const [talleres, setTalleres] = useState<{ id_curso: number; nombre: string }[]>([]);
  const [grupoLabel, setGrupoLabel] = useState<string>("");
  const [cursosSel, setCursosSel] = useState<number[]>([]);
  const [talleresSel, setTalleresSel] = useState<number[]>([]);

  // Verificar si la admisión está abierta (evita postulaciones fuera de fecha)
  useEffect(() => {
    const fetchEstado = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/estado-admision`);
        if (res.ok) {
          const data = await res.json();
          setEstado(data || { abierto: false });
        } else {
          setEstado({ abierto: false });
        }
      } catch {
        setEstado({ abierto: false });
      }
    };
    fetchEstado();

    const fetchGrados = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/academic/grados/`);
        if (res.ok) {
          const data = await res.json();
          setGrados(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error cargando grados:", error);
      }
    };
    fetchGrados();

    // Modo verano. Cuando hay DOS convocatorias abiertas a la vez (regular y
    // verano) no basta con detectar que verano está disponible: hay que
    // respetar el botón que pulsó el postulante, que llega en ?tipo=.
    // Tipo elegido en el inicio (?tipo=REGULAR o ?tipo=VERANO). Se lee aquí
    // y no con useSearchParams para no obligar a envolver la página en un
    // <Suspense>, que es lo que exige Next al prerenderizarla.
    const tipoPedido = new URLSearchParams(window.location.search)
      .get("tipo")?.toUpperCase() || "";

    const fetchVerano = async () => {
      if (tipoPedido === "REGULAR") return;  // eligió explícitamente regular
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/verano/estado`);
        if (res.ok) {
          const data = await res.json();
          if (data?.disponible && data?.abierto) {
            setEsVerano(true);
            setVeranoAnio(data.id_anio_escolar);
          }
        }
      } catch { /* modo regular por defecto */ }
    };
    fetchVerano();
  }, []);

  // Cargar cursos fijos + talleres de verano según el grado elegido
  useEffect(() => {
    if (!esVerano || !formData.alumno.id_grado_ingreso) {
      setCursosFijos([]); setTalleres([]); setGrupoLabel("");
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/verano/cursos/${formData.alumno.id_grado_ingreso}`)
      .then(r => r.ok ? r.json() : { fijos: [], talleres: [] })
      .then(d => { setCursosFijos(d.fijos || []); setTalleres(d.talleres || []); setGrupoLabel(d.grupo_label || ""); })
      .catch(() => { setCursosFijos([]); setTalleres([]); setGrupoLabel(""); });
  }, [esVerano, formData.alumno.id_grado_ingreso]);

  const toggle = (arr: number[], id: number) =>
    arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];

  // Helpers de actualización de estado
  const setAlumno = (campo: string, valor: string) =>
    setFormData(prev => ({ ...prev, alumno: { ...prev.alumno, [campo]: valor } }));
  const setFamiliar = (campo: string, valor: string) =>
    setFormData(prev => ({ ...prev, familiar: { ...prev.familiar, [campo]: valor } }));
  const soloDigitos = (v: string) => v.replace(/\D/g, "");

  // Subida de documentos de admisión (regular)
  const [subiendoDoc, setSubiendoDoc] = useState<Record<string, boolean>>({});
  const handleDocUpload = async (campo: string, file?: File | null) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe superar los 10 MB.");
      return;
    }
    setSubiendoDoc(prev => ({ ...prev, [campo]: true }));
    const url = await uploadMediaToCloudinary(file);
    setSubiendoDoc(prev => ({ ...prev, [campo]: false }));
    if (url) {
      setAlumno(campo, url);
      toast.success("Documento subido correctamente");
    } else {
      toast.error("No se pudo subir el documento. Intenta de nuevo.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validaciones mínimas de cliente
    if (formData.alumno.dni.length !== 8) {
      toast.error("El DNI del alumno debe tener 8 dígitos.");
      return;
    }
    if (formData.familiar.dni.length !== 8) {
      toast.error("El DNI del apoderado debe tener 8 dígitos.");
      return;
    }
    if (formData.familiar.telefono.length !== 9) {
      toast.error("El teléfono debe tener 9 dígitos.");
      return;
    }
    // En admisión regular los documentos son obligatorios
    if (!esVerano) {
      const faltante = DOCS_ADMISION.find(d => !(formData.alumno as any)[d.campo]);
      if (faltante) {
        toast.error(`Falta adjuntar: ${faltante.label}.`);
        return;
      }
      if (Object.values(subiendoDoc).some(Boolean)) {
        toast.error("Espera a que terminen de subirse los documentos.");
        return;
      }
    }

    if (esVerano && modalidadVerano !== "TALLER" && cursosSel.length === 0 && cursosFijos.length > 0) {
      toast.error("Selecciona al menos un curso fijo de verano.");
      return;
    }
    if (esVerano && modalidadVerano !== "CURSOS" && talleresSel.length === 0 && talleres.length > 0) {
      toast.error("Selecciona al menos un taller de verano.");
      return;
    }

    setLoading(true);

    const alumnoData = {
      ...formData.alumno,
      id_grado_ingreso: parseInt(formData.alumno.id_grado_ingreso),
    };
    const familiarData = {
      ...formData.familiar,
      direccion: mismaDireccion ? formData.alumno.direccion : formData.familiar.direccion,
    };

    const endpoint = esVerano ? "/verano/postular-externo" : "/admision/postular";
    const dataToSend = esVerano
      ? {
          alumno: alumnoData,
          familiar: familiarData,
          tipo_parentesco: formData.tipo_parentesco,
          id_anio_escolar: veranoAnio,
          modalidad: modalidadVerano,
          cursos_ids: modalidadVerano === "TALLER" ? [] : cursosSel,
          talleres_ids: modalidadVerano === "CURSOS" ? [] : talleresSel,
        }
      : { alumno: alumnoData, familiar: familiarData, tipo_parentesco: formData.tipo_parentesco };

    const promise = fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        let errorMsg = "Error en el servidor";
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = `${data.detail[0].loc[1]}: ${data.detail[0].msg}`;
        }
        throw new Error(errorMsg);
      }
      return data;
    });

    toast.promise(promise, {
      loading: 'Procesando tu postulación...',
      success: () => (
        <div>
          <p className="font-bold">¡Postulación enviada con éxito!</p>
          <p className="text-sm font-normal opacity-90">
            Por favor, espere una respuesta de nuestra oficina en su teléfono o el correo que usted envió en los próximos 30 días.
          </p>
        </div>
      ),
      error: (err) => `${err.message}`,
    });

    try {
      await promise;
      // Éxito: limpiamos el formulario y redirigimos
      setFormData(ESTADO_INICIAL);
      setCursosSel([]); setTalleresSel([]);
      setMismaDireccion(true);
      setTimeout(() => router.push("/"), 5000);
    } catch {
      // El error ya se muestra vía toast
    } finally {
      setLoading(false);
    }
  };

  // Estado de carga inicial
  if (estado === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-[#701C32]" size={40} />
      </div>
    );
  }

  // Admisión cerrada: no permitimos postular
  if (!estado.abierto) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-12 text-center">
          <div className="w-16 h-16 bg-[#FFF1E3] rounded-2xl flex items-center justify-center text-[#701C32] mx-auto mb-6">
            <CalendarClock size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#701C32] mb-4">Admisión cerrada</h1>
          <p className="text-slate-600 mb-6">
            En este momento no hay un proceso de admisión abierto.
            {estado.proxima_inscripcion
              ? ` Las próximas inscripciones serán el ${formatearFechaLarga(estado.proxima_inscripcion)}.`
              : " Vuelve pronto para conocer las próximas fechas."}
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-[#093E7A] text-white px-8 py-3.5 rounded-full font-bold hover:bg-[#073365] transition-all shadow-lg">
            <ArrowLeft size={18} /> Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Banner de Título */}
      <section className="bg-[#701C32] py-14 md:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="text-white/80 hover:text-white flex items-center justify-center mb-6 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Volver al inicio
          </Link>
          {esVerano && (
            <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-orange-500/90 text-white text-xs font-black uppercase tracking-wide">
              Inscripción a Verano
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
            {esVerano ? "Inscripción al Año de Verano" : getVal('admision_titulo', 'Proceso de Admisión')}
          </h1>
          <p className="text-[#FFF1E3] text-base md:text-lg font-light">
            {esVerano
              ? "Completa tus datos para inscribirte al programa académico de verano."
              : getVal('admision_subtitulo', 'Completa los datos para iniciar la postulación de tu menor hijo(a).')}
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 -mt-8 md:-mt-10 pb-20 md:pb-24">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* SECCIÓN ALUMNO */}
          <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 md:p-12 border border-slate-100">
            <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-[#FFF1E3] p-3 rounded-2xl text-[#701C32] shrink-0">
                <User size={28} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-[#093E7A]">Datos del Estudiante</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">DNI del Alumno</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={8}
                  value={formData.alumno.dni}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none transition-all"
                  placeholder="8 dígitos"
                  onChange={(e) => setAlumno("dni", soloDigitos(e.target.value))}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Género</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                    value={formData.alumno.genero}
                    onChange={(e) => setAlumno("genero", e.target.value)}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Fecha Nac.</label>
                  <input
                    type="date"
                    required
                    value={formData.alumno.fecha_nacimiento}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                    onChange={(e) => setAlumno("fecha_nacimiento", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombres</label>
                <input
                  required
                  value={formData.alumno.nombres}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  onChange={(e) => setAlumno("nombres", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos</label>
                <input
                  required
                  value={formData.alumno.apellidos}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  onChange={(e) => setAlumno("apellidos", e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Dirección de Residencia</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    required
                    value={formData.alumno.direccion}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                    placeholder="Av. Ejemplo 123, Distrito"
                    onChange={(e) => setAlumno("direccion", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Stethoscope size={16} className="mr-2" /> Enfermedades/Alergias
                </label>
                <input
                  value={formData.alumno.enfermedad}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  placeholder="Ninguna"
                  onChange={(e) => setAlumno("enfermedad", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <School size={16} className="mr-2" /> Colegio de Procedencia
                </label>
                <input
                  value={formData.alumno.colegio_procedencia}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  onChange={(e) => setAlumno("colegio_procedencia", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <School size={16} className="mr-2" /> {esVerano ? "Grado / Año en el que está" : "Grado al que Postula"}
                </label>
                <select
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none transition-all"
                  value={formData.alumno.id_grado_ingreso}
                  onChange={(e) => setAlumno("id_grado_ingreso", e.target.value)}
                >
                  <option value="">Seleccione un grado</option>
                  {grados.map((g) => (
                    <option key={g.id_grado} value={g.id_grado}>
                      {g.nombre} {g.nivel?.nombre ? `(${g.nivel.nombre})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECCIÓN DOCUMENTOS (ADMISIÓN REGULAR) */}
          {!esVerano && (
            <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 md:p-12 border border-slate-100">
              <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-4">
                <div className="bg-[#FFF1E3] p-3 rounded-2xl text-[#701C32] shrink-0">
                  <FileText size={28} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-[#093E7A]">Documentos requeridos</h2>
                  <p className="text-sm text-slate-500">Adjunta una copia (imagen o PDF, máx. 10 MB por archivo).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {DOCS_ADMISION.map(doc => {
                  const valor = (formData.alumno as any)[doc.campo] as string;
                  const cargando = !!subiendoDoc[doc.campo];
                  return (
                    <div key={doc.campo}>
                      <label className="block text-sm font-bold text-slate-700 mb-2">{doc.label}</label>
                      <label className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                        valor ? "border-green-300 bg-green-50" : "border-slate-200 hover:border-[#701C32]"
                      }`}>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={cargando}
                          onChange={(e) => handleDocUpload(doc.campo, e.target.files?.[0])}
                        />
                        {cargando ? (
                          <><Loader2 size={18} className="animate-spin text-[#701C32]" /><span className="text-sm text-slate-500">Subiendo...</span></>
                        ) : valor ? (
                          <><CheckCircle2 size={18} className="text-green-600" /><span className="text-sm font-bold text-green-700">Archivo cargado</span>
                            <a href={valor} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="ml-auto text-xs text-[#093E7A] underline">Ver</a></>
                        ) : (
                          <><Upload size={18} className="text-slate-400" /><span className="text-sm text-slate-500">Seleccionar archivo</span></>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECCIÓN CURSOS DE VERANO */}
          {esVerano && (
            <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 md:p-12 border border-orange-100">
              <div className="flex items-center space-x-4 mb-6 border-b border-slate-100 pb-4">
                <div className="bg-orange-100 p-3 rounded-2xl text-orange-600 shrink-0">
                  <School size={28} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-[#093E7A]">Inscripción a Verano</h2>
                  <p className="text-sm text-slate-500">Elige cómo deseas inscribirte al programa de verano.</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Modalidad</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { v: "CURSOS", t: "Solo cursos fijos" },
                    { v: "TALLER", t: "Solo taller(es)" },
                    { v: "CURSOS_Y_TALLER", t: "Cursos + taller(es)" },
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.v}
                      onClick={() => setModalidadVerano(opt.v as any)}
                      className={`px-4 py-3 rounded-xl border font-bold text-sm transition-all ${
                        modalidadVerano === opt.v
                          ? "bg-[#701C32] text-white border-[#701C32]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#701C32]"
                      }`}
                    >
                      {opt.t}
                    </button>
                  ))}
                </div>
              </div>

              {grupoLabel && formData.alumno.id_grado_ingreso && (
                <div className="mb-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-100 text-orange-700 text-sm font-bold">
                  <School size={16} /> Aula de verano asignada: {grupoLabel}
                </div>
              )}

              {!formData.alumno.id_grado_ingreso ? (
                <p className="text-sm text-slate-400 italic">Selecciona primero el grado / año en el que está para ver los cursos disponibles.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {modalidadVerano !== "TALLER" && (
                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-2">Cursos fijos de verano</p>
                      {cursosFijos.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay cursos fijos configurados para este grado.</p>
                      ) : (
                        <div className="space-y-2">
                          {cursosFijos.map(c => (
                            <label key={c.id_curso} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-[#701C32]"
                                checked={cursosSel.includes(c.id_curso)}
                                onChange={() => setCursosSel(prev => toggle(prev, c.id_curso))}
                              />
                              <span className="text-sm text-slate-600 font-medium">{c.nombre}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {modalidadVerano !== "CURSOS" && (
                    <div>
                      <p className="text-sm font-bold text-slate-700 mb-2">Talleres</p>
                      {talleres.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay talleres configurados.</p>
                      ) : (
                        <div className="space-y-2">
                          {talleres.map(c => (
                            <label key={c.id_curso} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="w-4 h-4 accent-[#701C32]"
                                checked={talleresSel.includes(c.id_curso)}
                                onChange={() => setTalleresSel(prev => toggle(prev, c.id_curso))}
                              />
                              <span className="text-sm text-slate-600 font-medium">{c.nombre}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500 mt-6 bg-orange-50 border border-orange-100 rounded-xl p-3">
                Tras enviar la inscripción se generará un <strong>pago fijo de verano</strong> que deberás cancelar por completo para ser admitido.
              </p>
            </div>
          )}

          {/* SECCIÓN FAMILIAR */}
          <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-8 md:p-12 border border-slate-100">
            <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-slate-100 p-3 rounded-2xl text-[#093E7A] shrink-0">
                <Users size={28} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-[#093E7A]">Datos del Padre / Madre / Tutor</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">DNI del Familiar</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={8}
                  value={formData.familiar.dni}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  placeholder="8 dígitos"
                  onChange={(e) => setFamiliar("dni", soloDigitos(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Parentesco</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  value={formData.tipo_parentesco}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo_parentesco: e.target.value }))}
                >
                  <option value="PADRE">Padre</option>
                  <option value="MADRE">Madre</option>
                  <option value="TUTOR">Tutor Legal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombres</label>
                <input
                  required
                  value={formData.familiar.nombres}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  onChange={(e) => setFamiliar("nombres", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos</label>
                <input
                  required
                  value={formData.familiar.apellidos}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  onChange={(e) => setFamiliar("apellidos", e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Phone size={16} className="mr-2" /> Teléfono
                </label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={9}
                  value={formData.familiar.telefono}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  placeholder="9 dígitos"
                  onChange={(e) => setFamiliar("telefono", soloDigitos(e.target.value))}
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Mail size={16} className="mr-2" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={formData.familiar.email}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                  onChange={(e) => setFamiliar("email", e.target.value)}
                />
              </div>

              {/* Dirección del familiar */}
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mismaDireccion}
                    onChange={(e) => setMismaDireccion(e.target.checked)}
                    className="w-4 h-4 accent-[#701C32]"
                  />
                  El apoderado reside en la misma dirección del alumno
                </label>
                {!mismaDireccion && (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                    <input
                      required
                      value={formData.familiar.direccion}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none"
                      placeholder="Dirección del apoderado"
                      onChange={(e) => setFamiliar("direccion", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-slate-500 text-sm max-w-md text-center">
              Al hacer clic en &ldquo;Enviar Postulación&rdquo;, usted declara que la información proporcionada es verídica y acepta ser contactado por nuestra oficina de admisiones.
            </p>
            <button
              type="submit"
              disabled={loading}
              className={`bg-[#093E7A] text-white px-10 md:px-12 py-4 md:py-5 rounded-full font-bold text-lg md:text-xl hover:scale-105 transition-all shadow-2xl flex items-center space-x-3 ${loading ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''}`}
            >
              <span>{loading ? "Enviando..." : "Enviar Postulación"}</span>
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
