
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RegistroEstudiantePage() {
    return (
        <>


            <style dangerouslySetInnerHTML={{
                __html: `
        body {
            background-color: #FAFAFA;
            color: #1e293b; /* slate-800 */
            font-family: 'Lato', sans-serif;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .active-nav {
            background-color: rgba(255, 255, 255, 0.1);
            border-left: 4px solid #ffffff;
        }
        /* Definición de colores personalizados del tema */
        :root {
            --primary: #093E7A;
            --maroon: #701C32;
        }
      `}} />

            <div className="flex min-h-screen">

                {/* Main Content Area */}
                <div className="flex-1 mx-auto min-h-screen flex flex-col bg-white">
                    <header className="h-20 border-b flex items-center justify-between px-8 bg-white shrink-0">
                        <div className="flex items-center gap-5 w-full">
                            {/* Botón de regreso */}
                            <Link
                                href="/campus/panel-control/gestion-estudiantes"
                                className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-[#701C32] transition-all"
                            >
                                <ArrowLeft size={24} />
                            </Link>

                            {/* Contenedor de Texto: Ahora en horizontal */}
                            <div className="flex items-baseline gap-4 w-full">
                                <h2 className="text-xl font-black text-gray-900 tracking-tight whitespace-nowrap">
                                    Registro de Nuevo Estudiante
                                </h2>

                                {/* Separador visual opcional (una línea vertical suave) */}
                                <div className="h-4 w-[1px] bg-gray-200 self-center"></div>

                            </div>
                        </div>
                    </header>

                    <div className="px-10 py-8 max-w-5xl">
                        <form className="space-y-12">
                            {/* Sección: Datos Personales */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                                    <span className="material-symbols-outlined text-[#701C32]">person</span>
                                    <h3 className="text-lg font-bold text-[#701C32] uppercase tracking-wide">Datos Personales</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="nombres">Nombres</label>
                                        <input className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 transition-shadow" id="nombres" placeholder="Ej. Juan Andrés" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="apellidos">Apellidos</label>
                                        <input className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 transition-shadow" id="apellidos" placeholder="Ej. Pérez García" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="dni">ID / DNI</label>
                                        <input className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 transition-shadow" id="dni" placeholder="000000000" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="dob">Fecha de Nacimiento</label>
                                        <input className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 transition-shadow" id="dob" type="date" />
                                    </div>
                                </div>
                            </section>

                            {/* Sección: Datos Académicos */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                                    <span className="material-symbols-outlined text-[#701C32]">history_edu</span>
                                    <h3 className="text-lg font-bold text-[#701C32] uppercase tracking-wide">Datos Académicos</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="grado">Grado / Sección</label>
                                        <select className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 bg-white transition-shadow" id="grado">
                                            <option value="">Seleccione una opción</option>
                                            <option value="10-a">10mo Grado - Sección A</option>
                                            <option value="10-b">10mo Grado - Sección B</option>
                                            <option value="11-a">11mo Grado - Sección A</option>
                                            <option value="11-b">11mo Grado - Sección B</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="enrollment">Año de Ingreso</label>
                                        <input className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 transition-shadow" id="enrollment" placeholder="2024" type="number" defaultValue="2024" />
                                    </div>
                                </div>
                            </section>

                            {/* Sección: Información del Apoderado */}
                            <section>
                                <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                                    <span className="material-symbols-outlined text-[#701C32]">family_restroom</span>
                                    <h3 className="text-lg font-bold text-[#701C32] uppercase tracking-wide">Información del Apoderado</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="apoderado_nombre">Nombre Completo del Apoderado</label>
                                        <input className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 transition-shadow" id="apoderado_nombre" placeholder="Nombre y Apellido" type="text" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="parentesco">Parentesco</label>
                                        <select className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 bg-white transition-shadow" id="parentesco">
                                            <option value="">Seleccione</option>
                                            <option value="padre">Padre</option>
                                            <option value="madre">Madre</option>
                                            <option value="tutor">Tutor Legal</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="telefono">Teléfono de Contacto</label>
                                        <input className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 transition-shadow" id="telefono" placeholder="+58 4XX XXXXXXX" type="tel" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-bold text-slate-700 uppercase" htmlFor="email">Correo Electrónico</label>
                                        <input className="w-full border-slate-200 rounded-lg focus:ring-[#093E7A] focus:border-[#093E7A] text-sm p-2.5 transition-shadow" id="email" placeholder="correo@ejemplo.com" type="email" />
                                    </div>
                                </div>
                            </section>

                            {/* Botones de Acción */}
                            <div className="flex items-center justify-end gap-4 pt-8 border-t border-slate-100">
                                <Link href="/campus/panel-control/gestion-estudiantes">
                                    <button
                                        className="px-8 py-3 rounded-lg text-sm font-bold border-2 border-[#701C32] text-[#701C32] hover:bg-[#701C32] hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#701C32] focus:ring-offset-2"
                                        type="button"
                                    >
                                        Cancelar
                                    </button>
                                </Link>

                                <button
                                    className="px-8 py-3 rounded-lg text-sm font-bold bg-[#093E7A] text-white hover:bg-[#073263] transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#093E7A] focus:ring-offset-2"
                                    type="submit"
                                >
                                    Guardar Estudiante
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}