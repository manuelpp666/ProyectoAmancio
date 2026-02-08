"use client";
import { useState, useEffect  } from "react";
import {

  User,
  Mail,
  Fingerprint,
  Award,
  Phone,
  BookOpen,
  XCircle,
  Save
} from "lucide-react";
import { DocenteCreate, Docente } from "@/src/interfaces/docente";
import FormInput from '@/src/components/utils/Inputs';
import { useForm } from '@/src/hooks/useForm';
import ImageUpload from "@/src/components/utils/ImageUpload";
import { uploadToCloudinary } from "@/src/components/utils/cloudinary";
import { toast } from "sonner";

interface DocenteFormProps {
  initialData?: Docente; // Si existe, estamos editando
  onSubmit: (data: DocenteCreate) => Promise<void>;
  loading: boolean;
}

export function DocenteForm({ initialData, onSubmit, loading }: DocenteFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [portada, setPortada] = useState<File | null>(null);

  // El hook usa los datos iniciales si existen, sino empieza vacío
  const { formData, handleChange , setFormData} = useForm<DocenteCreate>(
    initialData || {
      nombres: '', apellidos: '', dni: '', email: '',
      especialidad: '', telefono: '', descripcion: '', url_perfil: ''
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        nombres: initialData.nombres,
        apellidos: initialData.apellidos,
        dni: initialData.dni,
        email: initialData.email,
        especialidad: initialData.especialidad,
        telefono: initialData.telefono || '',
        descripcion: initialData.descripcion || '',
        url_perfil: initialData.url_perfil || ''
      });
      // Limpiamos el archivo local para que use la URL de la base de datos
      setPortada(null);
    }
  }, [initialData, setFormData]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Iniciamos carga local para la imagen
    setIsUploading(true);

    try {
      let urlFinal = formData.url_perfil || "";

      // 2. Si hay una foto nueva seleccionada, la subimos (Igual que en noticias)
      if (portada) {
        const urlSubida = await uploadToCloudinary(portada);
        if (urlSubida) {
          urlFinal = urlSubida;
        }
      }

      // 3. Construimos el objeto final combinando el formData + la URL de la imagen
      const docentePayload: DocenteCreate = {
        ...formData,
        url_perfil: urlFinal
      };

      // 4. Enviamos al padre (que hará la petición a FastAPI)
      await onSubmit(docentePayload);

    } catch (error) {
      toast.error("Error al procesar el registro del docente");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">

      {/* Sección 01: Información Personal */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <h3 className="text-[11px] font-black text-[#093E7A] uppercase tracking-[0.2em] flex items-center gap-2">
            <User size={16} />
            01. Información Personal
          </h3>
        </div>

        <div className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Subida de Foto */}
            <div className="md:col-span-1 flex flex-col items-center space-y-4">
              <ImageUpload
                key={initialData?.url_perfil || "new-docente"}
                label="Subir foto"
                initialImage={initialData?.url_perfil}
                onImageChange={(file) => setPortada(file)}
              />
              <p className="text-[9px] text-gray-400 text-center font-bold uppercase leading-relaxed tracking-widest">
                JPG o PNG<br />Máximo 2MB
              </p>
            </div>

            {/* Inputs Personales */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
              <FormInput
                name="nombres"
                value={formData.nombres}
                onChange={handleChange}
                label="Nombres"
                placeholder="Ej. Juan Carlos"
                icon={<User size={14} />}
                required
              />
              <FormInput
                name="apellidos"
                value={formData.apellidos}
                onChange={handleChange}
                label="Apellidos"
                placeholder="Ej. Pérez García"
                icon={<User size={14} />}
                required
              />
              <FormInput
                name="dni"
                value={formData.dni}
                onChange={handleChange}
                label="DNI / Documento"
                placeholder="Ej. 70123456"
                icon={<Fingerprint size={14} />}
                required
              />
              <FormInput
                name="email"
                value={formData.email}
                onChange={handleChange}
                label="Correo Electrónico"
                type="email"
                icon={<Mail size={14} />}
                required
              />
            </div>
          </div>
        </div>
      </section>

      {/* Sección 02: Especialidad */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/30">
          <h3 className="text-[11px] font-black text-[#093E7A] uppercase tracking-[0.2em] flex items-center gap-2">
            <Award size={16} />
            02. Perfil Académico
          </h3>
        </div>
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Especialidad Principal</label>
            <div className="relative">
              <select name="especialidad"
                value={formData.especialidad || ""}
                onChange={handleChange} className="w-full bg-gray-50 border-gray-200 rounded-xl py-3 px-4 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] transition-all appearance-none cursor-pointer" required>
                <option value="">Seleccione especialidad</option>
                <option value="Matemáticas">Matemáticas</option>
                <option value="Comunicación">Comunicación</option>
                <option value="Ciencias">Ciencias Naturales</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <BookOpen size={16} />
              </div>
            </div>
          </div>
          <FormInput
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            label="Teléfono"
            placeholder="999 999 999"
            icon={<Phone size={16} />}
          />
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Resumen Profesional</label>
            <textarea
            name="descripcion"
              value={formData.descripcion || ""}
              onChange={handleChange}
              className="w-full bg-gray-50 border-gray-200 rounded-2xl p-5 text-sm font-medium text-gray-700 focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] transition-all min-h-[120px] placeholder:text-gray-300"
              placeholder="Describe brevemente la trayectoria y logros del docente..."
            ></textarea>
          </div>
        </div>
      </section>



      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-6 pt-6 pb-20">
        
        <button type="submit"
          disabled={loading} className="flex items-center gap-3 px-10 py-4 bg-[#093E7A] text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-[#062d59] shadow-xl shadow-[#093E7A]/20 transition-all active:scale-95">
          <Save size={18} strokeWidth={2.5} />
          {loading ? "Registrando..." : "Guardar y Registrar"}
        </button>
      </div>
    </form>
  );
}