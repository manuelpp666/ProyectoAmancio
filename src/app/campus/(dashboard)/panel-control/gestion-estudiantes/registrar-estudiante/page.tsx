"use client";
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '@/src/lib/api';
import { RoleGuard } from '@/src/components/auth/RoleGuard';



// Interfaz para los grados que cargaremos del backend
interface Grado {
    id_grado: number;
    nombre: string;
    nivel?: { nombre: string };
}

export default function RegistroEstudiantePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [grados, setGrados] = useState<Grado[]>([]);

    // Estado del formulario para Alumno
    const [formData, setFormData] = useState({
        nombres: "",
        apellidos: "",
        dni: "",
        fecha_nacimiento: "",
        genero: "",
        direccion: "",
        enfermedad: "",
        talla_polo: "",
        colegio_procedencia: "",
        id_grado_ingreso: "",
        estado_ingreso: "ADMITIDO" // Por defecto, si lo registras manual, ya entra como admitido
    });

    // NUEVO: Estado del formulario para Familiar (Apoderado)
    const [familiarData, setFamiliarData] = useState({
        nombres: "",
        apellidos: "",
        dni: "",
        telefono: "",
        email: "",
        tipo_parentesco: ""
    });

    // Cargar los grados al montar la página
    useEffect(() => {
        const fetchGrados = async () => {
            try {
                const res = await apiFetch("/academic/grados/");
                if (res.ok) {
                    setGrados(await res.json());
                }
            } catch (error) {
                toast.error("Error al cargar los grados");
            }
        };
        fetchGrados();
    }, []);

    // Manejadores de cambios
    const handleChangeAlumno = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleChangeFamiliar = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        // Para diferenciar los IDs, los inputs del familiar tienen el prefijo "fam_"
        const fieldName = e.target.id.replace("fam_", "");
        setFamiliarData({ ...familiarData, [fieldName]: e.target.value });
    };

    // Función para enviar los datos al backend
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validación de DNI
        if (formData.dni.length !== 8) {
            toast.error("El DNI del estudiante debe tener exactamente 8 caracteres.");
            return;
        }
        if (familiarData.dni.length !== 8) {
            toast.error("El DNI del apoderado debe tener exactamente 8 caracteres.");
            return;
        }

        setIsLoading(true);

        // Limpiar los datos opcionales del alumno
        const payloadAlumno = {
            ...formData,
            id_grado_ingreso: formData.id_grado_ingreso ? parseInt(formData.id_grado_ingreso) : null,
            fecha_nacimiento: formData.fecha_nacimiento ? formData.fecha_nacimiento : null,
            genero: formData.genero || null,
            talla_polo: formData.talla_polo || null,
            direccion: formData.direccion || null,
            colegio_procedencia: formData.colegio_procedencia || null,
            enfermedad: formData.enfermedad || null,
        };

        // Limpiar los datos opcionales del familiar
        const payloadFamiliar = {
            nombres: familiarData.nombres,
            apellidos: familiarData.apellidos,
            dni: familiarData.dni,
            telefono: familiarData.telefono,
            email: familiarData.email || null,
            tipo_parentesco: familiarData.tipo_parentesco || null
        };

        try {
            // 1. Guardar Alumno
            const resAlumno = await apiFetch("/alumnos/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadAlumno)
            });

            if (!resAlumno.ok) {
                const errorData = await resAlumno.json();
                toast.error(errorData.detail?.[0]?.msg || errorData.detail || "Error al registrar el estudiante");
                setIsLoading(false);
                return;
            }

            // 2. Guardar Familiar (Apoderado)
            const resFamiliar = await apiFetch("/familiares/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payloadFamiliar)
            });

            if (!resFamiliar.ok) {
                const errorFam = await resFamiliar.json();
                toast.warning(`El estudiante se creó, pero hubo un problema con el apoderado: ${errorFam.detail || "Error desconocido"}`);
            } else {
                toast.success("Estudiante y Apoderado registrados correctamente");
            }
            
            // Redirigir a la lista de estudiantes
            router.push("/campus/panel-control/gestion-estudiantes");

        } catch (error) {
            toast.error("Error de conexión con el servidor");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        
        <RoleGuard modulo="gestion_estudiantes">
        
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        body { background-color: #FAFAFA; color: #1e293b; font-family: 'Lato', sans-serif; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
      `}} />

            <div className="flex min-h-screen">
                <div className="flex-1 mx-auto min-h-screen flex flex-col bg-white">
                    
                    {/* --- HEADER --- */}
                    <header className="h-20 border-b flex items-center justify-between px-8 bg-white shrink-0">
                        <div className="flex items-center gap-5 w-full">
                            <Link href="/campus/panel-control/gestion-estudiantes" className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#093E7A] transition-all">
                                <ArrowLeft size={24} />
                            </Link>
                            <div className="flex items-baseline gap-4 w-full">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight whitespace-nowrap">
                                    Registro de Nuevo Estudiante
                                </h2>
                                <div className="h-4 w-[1px] bg-gray-200 self-center"></div>
                            </div>
                        </div>
                    </header>

                    {/* --- FORMULARIO --- */}
                    <div className="px-10 py-8 max-w-5xl">
                        <form onSubmit={handleSubmit} className="space-y-12">
                            
                            {/* Sección 1: Datos Personales Obligatorios (ALUMNO) */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                                    <span className="material-symbols-outlined text-[#093E7A]">person</span>
                                    <h3 className="text-lg font-bold text-[#093E7A] uppercase tracking-wide">Datos Personales Principales</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="nombres">Nombres <span className="text-red-500">*</span></label>
                                        <input required id="nombres" value={formData.nombres} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="Ej. Juan Andrés" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="apellidos">Apellidos <span className="text-red-500">*</span></label>
                                        <input required id="apellidos" value={formData.apellidos} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="Ej. Pérez García" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="dni">DNI <span className="text-red-500">*</span></label>
                                        <input required id="dni" value={formData.dni} onChange={handleChangeAlumno} maxLength={8} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="00000000" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                                        <input id="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" type="date" />
                                    </div>
                                </div>
                            </section>

                            {/* Sección 2: Datos Adicionales (ALUMNO) */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                                    <span className="material-symbols-outlined text-[#093E7A]">badge</span>
                                    <h3 className="text-lg font-bold text-[#093E7A] uppercase tracking-wide">Información Adicional</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="genero">Género</label>
                                        <select id="genero" value={formData.genero} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 bg-white transition-shadow">
                                            <option value="">Seleccione...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="direccion">Dirección Domiciliaria</label>
                                        <input id="direccion" value={formData.direccion} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="Calle, Avenida, Distrito..." type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="talla_polo">Talla de Polo</label>
                                        <select id="talla_polo" value={formData.talla_polo} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 bg-white transition-shadow">
                                            <option value="">Seleccione...</option>
                                            <option value="4">Talla 4</option>
                                            <option value="6">Talla 6</option>
                                            <option value="8">Talla 8</option>
                                            <option value="10">Talla 10</option>
                                            <option value="12">Talla 12</option>
                                            <option value="14">Talla 14</option>
                                            <option value="16">Talla 16</option>
                                            <option value="S">S</option>
                                            <option value="M">M</option>
                                            <option value="L">L</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="enfermedad">Enfermedades / Alergias</label>
                                        <input id="enfermedad" value={formData.enfermedad} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="Ninguna o especifique..." type="text" />
                                    </div>
                                </div>
                            </section>

                            {/* Sección 3: Datos Académicos (ALUMNO) */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                                    <span className="material-symbols-outlined text-[#093E7A]">history_edu</span>
                                    <h3 className="text-lg font-bold text-[#093E7A] uppercase tracking-wide">Datos Académicos</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="id_grado_ingreso">Grado al que postula/ingresa</label>
                                        <select id="id_grado_ingreso" value={formData.id_grado_ingreso} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 bg-white transition-shadow">
                                            <option value="">Seleccione un grado</option>
                                            {grados.map((grado) => (
                                                <option key={grado.id_grado} value={grado.id_grado}>
                                                    {grado.nombre} {grado.nivel ? `(${grado.nivel.nombre})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="colegio_procedencia">Colegio de Procedencia</label>
                                        <input id="colegio_procedencia" value={formData.colegio_procedencia} onChange={handleChangeAlumno} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="Nombre de la I.E. anterior" type="text" />
                                    </div>
                                </div>
                            </section>

                            {/* Sección 4: Información del Apoderado (NUEVO FAMILIAR) */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                                    <span className="material-symbols-outlined text-[#093E7A]">family_restroom</span>
                                    <h3 className="text-lg font-bold text-[#093E7A] uppercase tracking-wide">Información del Apoderado Principal</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="fam_nombres">Nombres <span className="text-red-500">*</span></label>
                                        <input required id="fam_nombres" value={familiarData.nombres} onChange={handleChangeFamiliar} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="Ej. Carlos Arturo" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="fam_apellidos">Apellidos <span className="text-red-500">*</span></label>
                                        <input required id="fam_apellidos" value={familiarData.apellidos} onChange={handleChangeFamiliar} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="Ej. Pérez Silva" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="fam_dni">DNI <span className="text-red-500">*</span></label>
                                        <input required id="fam_dni" value={familiarData.dni} onChange={handleChangeFamiliar} maxLength={8} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="00000000" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="fam_telefono">Teléfono <span className="text-red-500">*</span></label>
                                        <input required id="fam_telefono" value={familiarData.telefono} onChange={handleChangeFamiliar} maxLength={9} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="999888777" type="tel" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="fam_email">Correo Electrónico</label>
                                        <input id="fam_email" value={familiarData.email} onChange={handleChangeFamiliar} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 transition-shadow" placeholder="correo@ejemplo.com" type="email" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="fam_tipo_parentesco">Parentesco</label>
                                        <select id="fam_tipo_parentesco" value={familiarData.tipo_parentesco} onChange={handleChangeFamiliar} className="w-full border border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] outline-none text-sm p-2.5 bg-white transition-shadow">
                                            <option value="">Seleccione...</option>
                                            <option value="Padre">Padre</option>
                                            <option value="Madre">Madre</option>
                                            <option value="Tutor">Tutor Legal</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Botones de Acción */}
                            <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
                                <Link href="/campus/panel-control/gestion-estudiantes">
                                    <button
                                        className="px-8 py-3 rounded-lg text-sm font-bold border-2 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all focus:outline-none"
                                        type="button"
                                        disabled={isLoading}
                                    >
                                        Cancelar
                                    </button>
                                </Link>

                                <button
                                    className="px-8 py-3 rounded-lg text-sm font-bold bg-[#093E7A] text-white hover:bg-[#072d5a] transition-all shadow-md flex items-center gap-2 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                            Guardando...
                                        </>
                                    ) : (
                                        "Guardar Registros"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
        </RoleGuard>
    );
}