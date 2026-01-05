import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-colegio-red text-white pt-16 pb-6">
            <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start gap-10">

                {/* Lado Izquierdo: Logo */}
                <div className="flex-shrink-0">
                    <img
                        src="/logo.png"
                        alt="Logo Amancio Varona"
                        className="h-24 md:h-32 object-contain"
                    />
                </div>

                {/* Lado Derecho: Contacto */}
                <div className="space-y-8 w-full md:w-auto">
                    <h3 className="text-xl font-bold">Contactános</h3>

                    <div className="space-y-6">
                        {/* Dirección */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <img
                                    src="/ubicacion.png"
                                    alt="Icono Ubicación"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-lg">Dirección Real</p>
                        </div>

                        {/* Correo */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <img
                                    src="/correo.png"
                                    alt="Icono Correo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-lg">correo@gmail.com</p>
                        </div>

                        {/* Teléfono */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 flex items-center justify-center">
                                <img
                                    src="/telefono.png"
                                    alt="Icono Teléfono"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <p className="text-lg">123456789</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright Inferior */}
            <div className="mt-16 border-t border-white/10 pt-6 text-center">
                <p className="text-[12px] font-light opacity-80 uppercase tracking-wider">
                    2026 © Copyright Amancio Varona Tumán | Todos los Derechos Reservados
                </p>
            </div>
        </footer>
    );
}