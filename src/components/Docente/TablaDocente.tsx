import { Mail, GraduationCap, CheckCircle2, PauseCircle, XCircle, Edit3, UserMinus, MoreVertical, Phone } from 'lucide-react';
import { Docente } from "@/src/interfaces/docente";
import Link from 'next/link';

// Definimos qué recibe el componente
interface TeacherRowProps {
    docente: Docente;
    status?: 'activo' | 'licencia' | 'inactivo'; // Opcional mientras lo agregas a la DB
    img?: string;
}

export const TeacherRow = ({ docente, status = 'activo', img = '1' }: TeacherRowProps) => {
    const statusStyles = {
        activo: { bg: "bg-emerald-50", text: "text-emerald-700", icon: <CheckCircle2 size={14} />, label: "Activo" },
        licencia: { bg: "bg-amber-50", text: "text-amber-700", icon: <PauseCircle size={14} />, label: "En Licencia" },
        inactivo: { bg: "bg-red-50", text: "text-red-700", icon: <XCircle size={14} />, label: "Inactivo" }
    };

    const currentStatus = statusStyles[status];

    return (
        <tr className={`hover:bg-gray-50/50 transition-colors group ${status === 'inactivo' ? 'opacity-60' : ''}`}>
            {/* DOCENTE */}
            <td className="px-8 py-5">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div
                            className="w-11 h-11 rounded-full bg-gray-200 border-2 border-white shadow-sm bg-cover bg-center"
                            style={{ backgroundImage: `url('https://i.pravatar.cc/150?u=${docente.id_docente}')` }}
                        ></div>
                        {status === 'activo' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>}
                    </div>
                    <div>
                        <span className="font-bold text-gray-900 block leading-tight">{docente.nombres} {docente.apellidos}</span>
                        <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                            DNI: {docente.dni}
                        </span>
                    </div>
                </div>
            </td>

            {/* ESPECIALIDAD */}
            <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                    <GraduationCap size={16} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">{docente.especialidad || 'General'}</span>
                </div>
            </td>

            {/* TELÉFONO (Nuevo campo agregado) */}
            <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{docente.telefono}</span>
                </div>
            </td>

            {/* CORREO */}
            <td className="px-8 py-5 text-right">
                <span className="text-sm text-gray-500 font-medium">{docente.email}</span>
            </td>

            {/* ESTADO */}
            <td className="px-6 py-5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentStatus.bg} ${currentStatus.text}`}>
                    {currentStatus.icon}
                    {currentStatus.label}
                </span>
            </td>

            {/* ACCIONES */}
            <td className="px-4 py-5 text-right">
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                    <Link href={`/campus/panel-control/pagina-web/docentes-web/editar/${docente.id_docente}`}>
                        <button className="p-2 text-gray-400 hover:text-[#093E7A] rounded-xl transition-all">
                            <Edit3 size={18} />
                        </button>
                    </Link>

                    <button className="p-2 text-gray-400 hover:text-[#701C32] rounded-xl transition-all">
                        <UserMinus size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
};