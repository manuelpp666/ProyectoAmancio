"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Stethoscope, 
  Shirt, 
  School,
  Send,
  ArrowLeft
} from "lucide-react";
import Header from "@/src/components/Pagina-Web/Header";
import Footer from "@/src/components/Pagina-Web/Footer";
import Link from "next/link";
import { toast } from "sonner";

export default function AdmisionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Estado del formulario basado en tu AdmisionPostulante Schema
  const [formData, setFormData] = useState({
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
    },
    familiar: {
      dni: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      email: "",
      direccion: "",
    },
    tipo_parentesco: "PADRE"
  });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const promise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/admision/postular`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formData),
  }).then(async (res) => {
    const data = await res.json(); // Leemos el JSON siempre
    
    if (!res.ok) {
      // Si el error viene de Pydantic (FastAPI), 'detail' puede ser una lista o un string
      let errorMsg = "Error en el servidor";
      
      if (typeof data.detail === "string") {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        // Si es la lista por defecto de FastAPI: "Campo: mensaje"
        errorMsg = `${data.detail[0].loc[1]}: ${data.detail[0].msg}`;
      }
      
      throw new Error(errorMsg);
    }
    return data;
  });

  toast.promise(promise, {
    loading: 'Procesando tu postulación...',
    success: () => {
      router.push("/");
      return `¡Postulación enviada con éxito!`;
    },
    // Aquí 'err.message' ya será el string que extrajimos arriba
    error: (err) => `${err.message}`, 
  });

  setLoading(false);
};

  return (
    <div className="bg-slate-50 min-h-screen">
      <Header />
      
      {/* Banner de Título */}
      <section className="bg-[#701C32] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="text-white/80 hover:text-white flex items-center justify-center mb-6 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Volver al inicio
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Proceso de Admisión</h1>
          <p className="text-[#FFF1E3] text-lg font-light">Completa los datos para iniciar la postulación de tu menor hijo(a).</p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 -mt-10 pb-24">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECCIÓN ALUMNO */}
          <div className="bg-white rounded-[2rem] shadow-xl p-8 md:p-12 border border-slate-100">
            <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-[#FFF1E3] p-3 rounded-2xl text-[#701C32]">
                <User size={28} />
              </div>
              <h2 className="text-2xl font-black text-[#093E7A]">Datos del Estudiante</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">DNI del Alumno</label>
                <input 
                  required
                  maxLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#701C32] focus:outline-none transition-all"
                  placeholder="8 dígitos"
                  onChange={(e) => setFormData({...formData, alumno: {...formData.alumno, dni: e.target.value}})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Género</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                    onChange={(e) => setFormData({...formData, alumno: {...formData.alumno, genero: e.target.value}})}
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                    onChange={(e) => setFormData({...formData, alumno: {...formData.alumno, fecha_nacimiento: e.target.value}})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nombres</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, alumno: {...formData.alumno, nombres: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, alumno: {...formData.alumno, apellidos: e.target.value}})}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Dirección de Residencia</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                    placeholder="Av. Ejemplo 123, Distrito"
                    onChange={(e) => setFormData({...formData, alumno: {...formData.alumno, direccion: e.target.value}})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Stethoscope size={16} className="mr-2" /> Enfermedades/Alergias
                </label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  placeholder="Ninguna"
                  onChange={(e) => setFormData({...formData, alumno: {...formData.alumno, enfermedad: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <School size={16} className="mr-2" /> Colegio de Procedencia
                </label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, alumno: {...formData.alumno, colegio_procedencia: e.target.value}})}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN FAMILIAR */}
          <div className="bg-white rounded-[2rem] shadow-xl p-8 md:p-12 border border-slate-100">
            <div className="flex items-center space-x-4 mb-8 border-b border-slate-100 pb-4">
              <div className="bg-slate-100 p-3 rounded-2xl text-[#093E7A]">
                <Users size={28} />
              </div>
              <h2 className="text-2xl font-black text-[#093E7A]">Datos del Padre / Madre / Tutor</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">DNI del Familiar</label>
                <input 
                  required
                  maxLength={8}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, familiar: {...formData.familiar, dni: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Parentesco</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, tipo_parentesco: e.target.value})}
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, familiar: {...formData.familiar, nombres: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Apellidos</label>
                <input 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, familiar: {...formData.familiar, apellidos: e.target.value}})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Phone size={16} className="mr-2" /> Teléfono
                </label>
                <input 
                  required
                  maxLength={9}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, familiar: {...formData.familiar, telefono: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Mail size={16} className="mr-2" /> Correo Electrónico
                </label>
                <input 
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
                  onChange={(e) => setFormData({...formData, familiar: {...formData.familiar, email: e.target.value}})}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-slate-500 text-sm max-w-md text-center">
              Al hacer clic en "Enviar Postulación", usted declara que la información proporcionada es verídica y acepta ser contactado por nuestra oficina de admisiones.
            </p>
            <button 
              type="submit"
              disabled={loading}
              className={`bg-[#093E7A] text-white px-12 py-5 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl flex items-center space-x-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <span>{loading ? "Enviando..." : "Enviar Postulación"}</span>
              <Send size={20} />
            </button>
          </div>

        </form>
      </main>
      <Footer />
    </div>
  );
}