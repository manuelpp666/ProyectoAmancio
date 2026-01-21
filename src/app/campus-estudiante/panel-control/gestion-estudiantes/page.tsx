import Link from "next/link";

export default function GestionEstudiantesPage() {
    return (
        <>

            <style dangerouslySetInnerHTML={{
                __html: `
        body {
            background-color: #FDFCFB;
            color: #111418;
            font-family: 'Lato', sans-serif;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .active-nav {
            background-color: rgba(255, 255, 255, 0.15);
            border-left: 4px solid #ffffff;
        }
        /* Definición de colores del tema original */
        :root {
            --primary: #093E7A;
            --maroon: #701C32;
        }
      `}} />

            <div className="flex h-screen overflow-hidden bg-[#F8FAFC] antialiased">


                {/* Main Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    {/* Header Section */}
                    <div className="px-8 pt-8 pb-4">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-black text-[#111418] tracking-tight">Gestión de Estudiantes</h2>
                                <p className="text-[#617489] text-sm mt-1">Administración centralizada de alumnos matriculados.</p>
                            </div>
                            <Link href="/campus-estudiante/panel-control/gestion-estudiantes/registrar-estudiante">
                                <button className="flex items-center gap-2 bg-[#093E7A] hover:bg-[#072e5a] text-white px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-md">
                                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                    <span>Registrar Nuevo Estudiante</span>
                                </button>
                            </Link>


                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="px-8 py-4">
                        <div className="bg-white rounded-xl border border-[#e5e7eb] p-1 flex items-center shadow-sm">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <span className="material-symbols-outlined text-[#617489]">search</span>
                                </div>
                                <input
                                    className="block w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-[#111418] placeholder:text-[#617489] text-sm"
                                    placeholder="Buscar por nombre, grado, sección o representante..."
                                    type="text"
                                />
                            </div>
                            <button className="px-4 py-2 text-[#617489] hover:bg-gray-50 rounded-lg transition-colors">
                                <span className="material-symbols-outlined">tune</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="px-8 py-4 flex-1">
                        <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#fcfafa] border-b border-[#e5e7eb]">
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#617489]">Foto</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#617489]">Nombre Completo</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#617489]">Grado / Sección</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#617489]">Contacto Representante</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#617489]">Estado</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#617489] text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f3f4f6]">
                                        {/* Estudiante 1 */}
                                        <tr className="hover:bg-[#fcfafa] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="size-11 rounded-full bg-cover bg-center ring-2 ring-gray-50 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCEzY-mzj4DeVu1799EHEdUgyQl20weDqYHWGF8tLRHrsKlbVE_urFl97q1CqgzRr4_yu6mIYCL6SGqqOaMAoPx4-00PPgx83U4_lu6mq2Eh542qrHjlb-_pjQS2WYl10eunPjhUEm_u9ehoo4Ml7UKVzelkNPcdhU8syUbbAuysrryvWkYIzHGThqX1Jy-7oMhrXuv4KEbVxjYWokv0OmZ9m3H8YdgMxN2r2tJs7NO7xHBpzJFCOMjiIubcLb-xEESDOta8zob9mWG")' }}></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-[#111418]">Carlos Ruiz</div>
                                                <div className="text-xs text-[#617489]">ID: 2024-0012</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#4b5563]">10mo Grado - Sección A</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-[#4b5563]">
                                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                                    +58 412 555-0101
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#eef2ff] text-[#093E7A]">
                                                    Activo
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button className="p-2 text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button className="p-2 text-[#701C32] hover:bg-[#701C32]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Estudiante 2 */}
                                        <tr className="hover:bg-[#fcfafa] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="size-11 rounded-full bg-cover bg-center ring-2 ring-gray-50 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAw3a2qeVHtiL1zHgs62CdTZwL8aL98gsms6eqQKDLbCWklR2yPEor0VDoF5BhAsZQiXCoHCIEfhenCvbOIj0-azD7yFgxr4CzT9g3T2IgVjKpPw7ZwE-0YjNfj44ptiiWF_rPjJCV_3VvyRjoBtkhtEIPufoW9p8OQWDkyk14z161CAPIagMD-qE5Vu6pN3XaiXbfI0SKf2XPyUSGuttk2hPkek6EEyvvX4FaBLBY2ruqC-awuvPFGDLXCHqy4UcWKJhl_C_32m5Ht")' }}></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-[#111418]">Maria Garcia</div>
                                                <div className="text-xs text-[#617489]">ID: 2024-0045</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#4b5563]">11mo Grado - Sección B</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-[#4b5563]">
                                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                                    +58 424 555-0202
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                                    Inactivo
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button className="p-2 text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button className="p-2 text-[#701C32] hover:bg-[#701C32]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Estudiante 3 */}
                                        <tr className="hover:bg-[#fcfafa] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="size-11 rounded-full bg-cover bg-center ring-2 ring-gray-50 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDxM65pEgfV6JsaEBaVjB8rXGn5AnBBvpw5RFZAGJbWmeE488-MlbIehJ0BEAynjpO1WmmER0OjsY_q9vhC_82T6jLf2SSkmMGiqAtlGfNmnz5Dwj8C7SceOBQ3qijWnEteO7Eys7BIScV-DFsgVJYSjISlGkghUAs6pFrshm6B9SY-bxfOVjks3TtNXCmZjD1eU-zRgJ5Rw4CSllcxZntHMMtok2hAZBNL-yS3LphBPRdeqbw8JHfb_Q6aVAndKc1oRQVs4izJ4z80")' }}></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-[#111418]">Jose Hernandez</div>
                                                <div className="text-xs text-[#617489]">ID: 2024-0021</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#4b5563]">9no Grado - Sección C</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-[#4b5563]">
                                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                                    +58 414 555-0303
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#eef2ff] text-[#093E7A]">
                                                    Activo
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button className="p-2 text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button className="p-2 text-[#701C32] hover:bg-[#701C32]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {/* Estudiante 4 */}
                                        <tr className="hover:bg-[#fcfafa] transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="size-11 rounded-full bg-cover bg-center ring-2 ring-gray-50 shadow-sm" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC-rw9D7ZN686PkBXKXfW8e3IXv2546PSnJzIXYZzSD-2KriXvIsDsAcC9dakam6xnWZq2gYkX3Ynq39i2E-ZerxWShtWOMLAMklKiDyIHTLCXhmfZHBoabaMNIlKQq98UCHJln5Whj-FHh-G24g1iBBXxAoWhTF8eBMqk1bK5H-6hDYSQeBfGsz-i_1aEuTCzWUR1ZPIdz7RS_yWA2A0uVQIIOs5wS1sfH3hN_x0BN9bz7ZPF8UmHVC_l7PZ_2tbKAD6EDVCIGrgZs")' }}></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-[#111418]">Ana Martinez</div>
                                                <div className="text-xs text-[#617489]">ID: 2024-0089</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#4b5563]">10mo Grado - Sección A</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-[#4b5563]">
                                                    <span className="material-symbols-outlined text-[16px]">call</span>
                                                    +58 412 555-0404
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#eef2ff] text-[#093E7A]">
                                                    Activo
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button className="p-2 text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button className="p-2 text-[#701C32] hover:bg-[#701C32]/5 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 flex items-center justify-between bg-[#fcfafa] border-t border-[#e5e7eb]">
                                <p className="text-sm text-[#617489]">Mostrando 4 de 156 estudiantes</p>
                                <div className="flex items-center gap-1">
                                    <button className="p-2 text-[#111418] hover:bg-gray-200 rounded-lg disabled:opacity-30" disabled>
                                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                                    </button>
                                    <button className="size-8 flex items-center justify-center text-sm font-bold bg-[#093E7A] text-white rounded-lg shadow-sm">1</button>
                                    <button className="size-8 flex items-center justify-center text-sm text-[#111418] hover:bg-gray-200 rounded-lg">2</button>
                                    <button className="size-8 flex items-center justify-center text-sm text-[#111418] hover:bg-gray-200 rounded-lg">3</button>
                                    <span className="px-1 text-[#617489]">...</span>
                                    <button className="size-8 flex items-center justify-center text-sm text-[#111418] hover:bg-gray-200 rounded-lg">15</button>
                                    <button className="p-2 text-[#111418] hover:bg-gray-200 rounded-lg">
                                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Stats */}
                    <footer className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                            <div className="text-xs font-black text-[#617489] uppercase tracking-wider">Total Matriculados</div>
                            <div className="text-2xl font-black text-[#093E7A] mt-1">1,248</div>
                        </div>
                        <div className="p-5 bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                            <div className="text-xs font-black text-[#617489] uppercase tracking-wider">Nuevos este mes</div>
                            <div className="text-2xl font-black text-[#093E7A] mt-1">12</div>
                        </div>
                        <div className="p-5 bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
                            <div className="text-xs font-black text-[#617489] uppercase tracking-wider">Asistencia Promedio</div>
                            <div className="text-2xl font-black text-[#093E7A] mt-1">94.2%</div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}