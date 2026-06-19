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

    const sanitizarDigitos = (valor: string, max: number) => valor.replace(/\D/g, "").slice(0, max);

    return (

        <RoleGuard modulo="gestion_estudiantes">

        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .reg-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 0.5rem; outline: none; font-size: 0.875rem; padding: 0.625rem; background: #fff; transition: box-shadow .15s, border-color .15s; }
        .reg-input:focus { border-color: #093E7A; box-shadow: 0 0 0 3px rgba(9,62,122,0.12); }
        .reg-label { font-size: 0.7rem; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: .02em; }
      `}} />

            <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">

                {/* --- HEADER --- */}
                <header className="h-16 border-b flex items-center gap-3 px-8 bg-white shrink-0">
                    <Link href="/campus/panel-control/gestion-estudiantes" className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#093E7A] transition-all">
                        <ArrowLeft size={22} />
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#093E7A]">person_add</span>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 leading-tight">Registrar Nuevo Estudiante</h2>
                            <p className="text-[11px] text-gray-400 leading-none">Completa los datos del estudiante y de su apoderado principal</p>
                        </div>
                    </div>
                </header>

                {/* --- FORMULARIO --- */}
                <div className="flex-1 overflow-y-auto p-8">
                    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">

                        {/* Sección 1: Datos Personales (ALUMNO) */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                                <span className="material-symbols-outlined text-[#093E7A]">person</span>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Datos personales del estudiante</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="nombres">Nombres <span className="text-red-500">*</span></label>
                                    <input required id="nombres" value={formData.nombres} onChange={handleChangeAlumno} className="reg-input" placeholder="Ej. Juan Andrés" type="text" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="apellidos">Apellidos <span className="text-red-500">*</span></label>
                                    <input required id="apellidos" value={formData.apellidos} onChange={handleChangeAlumno} className="reg-input" placeholder="Ej. Pérez García" type="text" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="dni">DNI <span className="text-red-500">*</span></label>
                                    <input required id="dni" value={formData.dni}
                                        onChange={e => setFormData({ ...formData, dni: sanitizarDigitos(e.target.value, 8) })}
                                        inputMode="numeric" maxLength={8} className="reg-input" placeholder="8 dígitos" type="text" />
                                    <p className="text-[11px] text-gray-400">Será su nombre de usuario para iniciar sesión.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
                                    <input id="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChangeAlumno} className="reg-input" type="date" />
                                </div>
                            </div>
                        </section>

                        {/* Sección 2: Información Adicional (ALUMNO) */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                                <span className="material-symbols-outlined text-[#093E7A]">badge</span>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Información adicional</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5">
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="genero">Género</label>
                                    <select id="genero" value={formData.genero} onChange={handleChangeAlumno} className="reg-input">
                                        <option value="">Seleccione...</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="reg-label" htmlFor="direccion">Dirección Domiciliaria</label>
                                    <input id="direccion" value={formData.direccion} onChange={handleChangeAlumno} className="reg-input" placeholder="Calle, Avenida, Distrito..." type="text" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="talla_polo">Talla de Polo</label>
                                    <select id="talla_polo" value={formData.talla_polo} onChange={handleChangeAlumno} className="reg-input">
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
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="reg-label" htmlFor="enfermedad">Enfermedades / Alergias</label>
                                    <input id="enfermedad" value={formData.enfermedad} onChange={handleChangeAlumno} className="reg-input" placeholder="Ninguna o especifique..." type="text" />
                                </div>
                            </div>
                        </section>

                        {/* Sección 3: Datos Académicos (ALUMNO) */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                                <span className="material-symbols-outlined text-[#093E7A]">history_edu</span>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Datos académicos</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="id_grado_ingreso">Grado al que ingresa</label>
                                    <select id="id_grado_ingreso" value={formData.id_grado_ingreso} onChange={handleChangeAlumno} className="reg-input">
                                        <option value="">Seleccione un grado</option>
                                        {grados.map((grado) => (
                                            <option key={grado.id_grado} value={grado.id_grado}>
                                                {grado.nombre} {grado.nivel ? `(${grado.nivel.nombre})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="colegio_procedencia">Colegio de Procedencia</label>
                                    <input id="colegio_procedencia" value={formData.colegio_procedencia} onChange={handleChangeAlumno} className="reg-input" placeholder="Nombre de la I.E. anterior" type="text" />
                                </div>
                            </div>
                        </section>

                        {/* Sección 4: Apoderado (FAMILIAR) */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-5 border-b border-slate-100 pb-3">
                                <span className="material-symbols-outlined text-[#093E7A]">family_restroom</span>
                                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Apoderado principal</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="fam_nombres">Nombres <span className="text-red-500">*</span></label>
                                    <input required id="fam_nombres" value={familiarData.nombres} onChange={handleChangeFamiliar} className="reg-input" placeholder="Ej. Carlos Arturo" type="text" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="fam_apellidos">Apellidos <span className="text-red-500">*</span></label>
                                    <input required id="fam_apellidos" value={familiarData.apellidos} onChange={handleChangeFamiliar} className="reg-input" placeholder="Ej. Pérez Silva" type="text" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="fam_dni">DNI <span className="text-red-500">*</span></label>
                                    <input required id="fam_dni" value={familiarData.dni}
                                        onChange={e => setFamiliarData({ ...familiarData, dni: sanitizarDigitos(e.target.value, 8) })}
                                        inputMode="numeric" maxLength={8} className="reg-input" placeholder="8 dígitos" type="text" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="fam_telefono">Teléfono <span className="text-red-500">*</span></label>
                                    <input required id="fam_telefono" value={familiarData.telefono}
                                        onChange={e => setFamiliarData({ ...familiarData, telefono: sanitizarDigitos(e.target.value, 9) })}
                                        inputMode="numeric" maxLength={9} className="reg-input" placeholder="9 dígitos" type="tel" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="fam_email">Correo Electrónico</label>
                                    <input id="fam_email" value={familiarData.email} onChange={handleChangeFamiliar} className="reg-input" placeholder="correo@ejemplo.com" type="email" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="reg-label" htmlFor="fam_tipo_parentesco">Parentesco</label>
                                    <select id="fam_tipo_parentesco" value={familiarData.tipo_parentesco} onChange={handleChangeFamiliar} className="reg-input">
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
                        <div className="flex items-center justify-end gap-4 pb-2">
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
        </>
        </RoleGuard>
    );
}