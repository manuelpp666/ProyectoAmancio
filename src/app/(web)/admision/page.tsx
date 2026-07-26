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
  CalendarClock
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useConfiguracion } from "@/src/hooks/useConfiguracion";
import { formatearFechaLarga } from "@/src/components/utils/fecha";

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
  }, []);

  // Helpers de actualización de estado
  const setAlumno = (campo: string, valor: string) =>
    setFormData(prev => ({ ...prev, alumno: { ...prev.alumno, [campo]: valor } }));
  const setFamiliar = (campo: string, valor: string) =>
    setFormData(prev => ({ ...prev, familiar: { ...prev.familiar, [campo]: valor } }));
  const soloDigitos = (v: string) => v.replace(/\D/g, "");

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

    setLoading(true);

    const dataToSend = {
      ...formData,
      familiar: {
        ...formData.familiar,
        direccion: mismaDireccion ? formData.alumno.direccion : formData.familiar.direccion,
      },
      alumno: {
        ...formData.alumno,
        id_grado_ingreso: parseInt(formData.alumno.id_grado_ingreso),
      },
    };

    const promise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/admision/postular`, {
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
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{getVal('admision_titulo', 'Proceso de Admisión')}</h1>
          <p className="text-[#FFF1E3] text-base md:text-lg font-light">{getVal('admision_subtitulo', 'Completa los datos para iniciar la postulación de tu menor hijo(a).')}</p>
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
              <div className="grid grid-cols-2 gap-4">
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
                  <School size={16} className="mr-2" /> Grado al que Postula
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
