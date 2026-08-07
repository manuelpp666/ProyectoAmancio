"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlumnoBase } from "@/src/interfaces/admision";
import EdadBadge from "@/src/components/utils/CalcularEdad";
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';
import { ModalEditarEstudiante } from "@/src/components/Campus/PanelControl/ModalEditarEstudiante";
import { usePermisos } from "@/src/hooks/usePermisos";

// Pestañas del apartado. Los `id` coinciden con el catálogo de permisos.
const PESTANAS_ESTUDIANTES = [
    { id: "estudiantes", label: "Estudiantes", icon: "group" },
    { id: "postulantes", label: "Solicitudes de Admisión", icon: "pending_actions" },
    { id: "renovaciones", label: "Renovaciones de Matrícula", icon: "autorenew" },
    { id: "verano", label: "Inscripciones de Verano", icon: "wb_sunny" },
] as const;

/**
 * Alumnos que ya forman parte del colegio: se pintan en verde.
 * Espejo de ACTIVOS en app/modules/users/alumno/estados.py (backend).
 * Antes esta lista incluía "ACTIVO", un estado que el sistema nunca escribe.
 */
const ESTADOS_ACTIVOS: string[] = ["ADMITIDO", "ESTUDIANTE"];

/**
 * Documentos que pide el formulario de admisión del año regular.
 * Es la misma lista que usa la web pública (DOCS_ADMISION en (web)/admision):
 * si allí se añade uno, hay que añadirlo aquí para que el colegio lo vea.
 */
const DOCS_ADMISION_REGULAR = [
    { campo: "doc_dni_menor", label: "DNI del menor", corto: "DNI menor" },
    { campo: "doc_dni_apoderado", label: "DNI del padre / apoderado", corto: "DNI apoderado" },
    { campo: "doc_fum", label: "Ficha Única de Matrícula (FUM)", corto: "FUM" },
    { campo: "doc_certificado_estudios", label: "Certificado de estudios anteriores", corto: "Certificado" },
] as const;

/** Los cuatro documentos del postulante, para abrirlos sin entrar al expediente. */
function DocumentosAdmision({ alumno }: { alumno: AlumnoBase }) {
    const adjuntos = DOCS_ADMISION_REGULAR.map((d) => ({
        ...d,
        url: (alumno as unknown as Record<string, string | null>)[d.campo] || null,
    }));
    const cuantos = adjuntos.filter((d) => d.url).length;

    return (
        <div className="space-y-1.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                cuantos === DOCS_ADMISION_REGULAR.length ? "bg-green-100 text-green-700"
                    : cuantos === 0 ? "bg-red-100 text-red-600"
                    : "bg-amber-100 text-amber-700"
            }`}>
                {cuantos} / {DOCS_ADMISION_REGULAR.length} adjuntos
            </span>
            <div className="flex flex-wrap gap-1">
                {adjuntos.map((d) => d.url ? (
                    <a
                        key={d.campo}
                        href={d.url}
                        target="_blank"
                        rel="noreferrer"
                        title={`Abrir: ${d.label}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#093E7A]/5 text-[#093E7A] text-[10px] font-bold hover:bg-[#093E7A]/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[13px]">description</span>
                        {d.corto}
                    </a>
                ) : (
                    <span
                        key={d.campo}
                        title={`Falta: ${d.label}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 text-slate-300 text-[10px] font-bold line-through"
                    >
                        {d.corto}
                    </span>
                ))}
            </div>
        </div>
    );
}

function InfoItem({ label, value }: { label: string, value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
            <p className="text-sm font-bold text-slate-800 leading-tight">{value || "---"}</p>
        </div>
    );
}

export default function GestionEstudiantesPage() {

    const [busqueda, setBusqueda] = useState("");
    const [alumnos, setAlumnos] = useState<AlumnoBase[]>([]);
    const [loading, setLoading] = useState(true);
    // Vista actual: "estudiantes" | "postulantes" | "renovaciones" | "verano"
    const [vista, setVista] = useState<"estudiantes" | "postulantes" | "renovaciones" | "verano">("estudiantes");
    const { tienePermiso, loading: loadingPermisos } = usePermisos();

    // Si la pestaña abierta no está permitida, se abre la primera que sí lo esté
    useEffect(() => {
        if (loadingPermisos) return;
        if (tienePermiso("gestion_estudiantes", vista)) return;
        const primera = PESTANAS_ESTUDIANTES.find((t) => tienePermiso("gestion_estudiantes", t.id));
        if (primera) setVista(primera.id);
    }, [loadingPermisos, vista, tienePermiso]);
    // --- Inscripciones de verano ---
    const [veranoSolicitudes, setVeranoSolicitudes] = useState<any[]>([]);
    const [modalInfo, setModalInfo] = useState<{ abierto: boolean, datos: any | null }>({
        abierto: false,
        datos: null
    });
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    // Estados para el Modal de Rechazo
    const [modalRechazo, setModalRechazo] = useState({ abierto: false, id: 0, nombre: "" });
    const [motivoRechazo, setMotivoRechazo] = useState("");
    // Estudiante en edición (null = modal cerrado)
    const [alumnoEditando, setAlumnoEditando] = useState<AlumnoBase | null>(null);

    // --- Renovaciones de matrícula ---
    const [renovaciones, setRenovaciones] = useState<any[]>([]);
    const [filtroRenovEstado, setFiltroRenovEstado] = useState<"PENDIENTE" | "APROBADA" | "RECHAZADA" | "TODAS">("PENDIENTE");
    const [modalDecision, setModalDecision] = useState<{ abierto: boolean, solicitud: any | null, aprobar: boolean }>({
        abierto: false, solicitud: null, aprobar: true
    });
    const [respuestaAdmin, setRespuestaAdmin] = useState("");
    const [procesando, setProcesando] = useState(false);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            let urlRuta = vista === "postulantes" ? "/alumnos/solicitudes-pendientes" : "/alumnos/";

            // La búsqueda acepta nombre, apellidos o DNI. Va codificada porque
            // un nombre lleva espacios y tildes, que no son válidos en una URL.
            if (busqueda.trim()) {
                const separador = urlRuta.includes("?") ? "&" : "?";
                urlRuta += `${separador}busqueda=${encodeURIComponent(busqueda.trim())}`;
            }

            // Usamos tu función apiFetch pasándole el string limpio
            const response = await apiFetch(urlRuta);
            if (!response.ok) throw new Error("Error al obtener datos");

            const data = await response.json();
            setAlumnos(data);
            return data as AlumnoBase[];
        } catch (error) {
            console.error("Error cargando alumnos:", error); // Para ver el error real en la consola de tu navegador
            toast.error("No se pudo conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    // Tras guardar, la lista se recarga y el modal vuelve a apuntar al dato del
    // servidor: así la cabecera y el formulario reflejan lo realmente guardado.
    const trasGuardarEstudiante = async () => {
        const data = await cargarDatos();
        setAlumnoEditando((actual) => {
            if (!actual || !data) return actual;
            return data.find((a) => a.id_alumno === actual.id_alumno) ?? actual;
        });
    };

    const cargarRenovaciones = async () => {
        setLoading(true);
        try {
            const estadoParam = filtroRenovEstado !== "TODAS" ? `?estado=${filtroRenovEstado}` : "";
            const response = await apiFetch(`/enrollment/renovacion-solicitudes/${estadoParam}`);
            if (!response.ok) throw new Error("Error al obtener solicitudes");
            const data = await response.json();
            setRenovaciones(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando renovaciones:", error);
            toast.error("No se pudieron cargar las solicitudes de renovación");
        } finally {
            setLoading(false);
        }
    };

    const cargarVerano = async () => {
        setLoading(true);
        try {
            const response = await apiFetch(`/verano/solicitudes`);
            if (!response.ok) throw new Error("Error al obtener inscripciones de verano");
            const data = await response.json();
            setVeranoSolicitudes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando inscripciones de verano:", error);
            toast.error("No se pudieron cargar las inscripciones de verano");
        } finally {
            setLoading(false);
        }
    };

    const admitirVerano = async (id: number) => {
        const promise = apiFetch(`/verano/solicitudes/${id}/admitir`, { method: "POST" }).then(async (res) => {
            const body = await res.json().catch(() => null);
            if (!res.ok) throw new Error(body?.detail || "No se pudo admitir");
            cargarVerano();
            return body;
        });
        toast.promise(promise, { loading: "Procesando...", success: "Alumno admitido y matrícula de verano creada", error: (e) => e.message });
    };

    useEffect(() => {
        if (vista === "renovaciones") {
            cargarRenovaciones();
            return;
        }
        if (vista === "verano") {
            cargarVerano();
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            cargarDatos();
        }, 300); // 300ms de debounce para no saturar la API mientras escribes

        return () => clearTimeout(delayDebounceFn);
    }, [vista, busqueda]);

    // Recargar renovaciones al cambiar el filtro de estado
    useEffect(() => {
        if (vista === "renovaciones") cargarRenovaciones();
    }, [filtroRenovEstado]);

    // Aprobar / rechazar una solicitud de renovación
    const decidirRenovacion = async () => {
        if (!modalDecision.solicitud) return;
        setProcesando(true);
        try {
            const res = await apiFetch(
                `/enrollment/renovacion-solicitudes/${modalDecision.solicitud.id_solicitud_matricula}/decidir`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ aprobado: modalDecision.aprobar, respuesta_admin: respuestaAdmin || null })
                }
            );
            if (!res.ok) {
                const body = await res.json().catch(() => null);
                throw new Error(body?.detail || "Error al procesar la solicitud");
            }
            toast.success(modalDecision.aprobar ? "Renovación aprobada y matrícula registrada" : "Solicitud rechazada");
            setModalDecision({ abierto: false, solicitud: null, aprobar: true });
            setRespuestaAdmin("");
            cargarRenovaciones();
        } catch (e: any) {
            toast.error(e.message || "No se pudo procesar la solicitud");
        } finally {
            setProcesando(false);
        }
    };

    const badgeRenovacion = (estado: string) => {
        const map: any = {
            PENDIENTE: "bg-blue-100 text-[#093E7A]",
            APROBADA: "bg-green-100 text-green-700",
            RECHAZADA: "bg-red-100 text-red-700",
        };
        return map[estado] || "bg-gray-100 text-gray-600";
    };
    const verDetalle = async (id: number) => {
        setCargandoDetalle(true);
        try {
            const res = await apiFetch(`/alumnos/detalle-completo/${id}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setModalInfo({ abierto: true, datos: data });
        } catch (error) {
            toast.error("No se pudo obtener la información detallada");
        } finally {
            setCargandoDetalle(false);
        }
    };
    // 2. Función Principal de Decisión
    const ejecutarDecision = async (id: number, aprobado: boolean, motivo?: string) => {
        setModalInfo({ abierto: false, datos: null });
        const url = `/alumnos/decidir-admision/${id}?aprobado=${aprobado}${motivo ? `&motivo=${motivo}` : ""}`;

        const promise = apiFetch(url, { method: "POST" }).then(async (res) => {
            if (!res.ok) throw new Error();
            cargarDatos();
            return res.json();
        });

        toast.promise(promise, {
            loading: 'Procesando...',
            success: aprobado ? 'Alumno admitido correctamente' : 'Postulación rechazada',
            error: 'Error al procesar la solicitud',
        });

        if (!aprobado) {
            setModalRechazo({ abierto: false, id: 0, nombre: "" });
            setMotivoRechazo("");
        }
    };

    return (
        
        <RoleGuard modulo="gestion_estudiantes">

    
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
            body { background-color: #FDFCFB; color: #111418; font-family: 'Lato', sans-serif; }
            .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        `}} />

            <div className="flex h-full overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">

                    {/* HEADER CON TABS */}
                    <div className="bg-white border-b px-4 md:px-8 shrink-0">
                        <div className="h-16 flex items-center">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#093E7A]">school</span>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {vista === "postulantes" ? "Solicitudes de Admisión"
                                        : vista === "renovaciones" ? "Renovaciones de Matrícula"
                                            : vista === "verano" ? "Inscripciones de Verano"
                                            : "Gestión de Estudiantes"}
                                </h2>
                            </div>
                        </div>

                        {/* PESTAÑAS: solo las permitidas para este administrador */}
                        <div className="barra-pestanas gap-x-5 md:gap-x-6">
                            {PESTANAS_ESTUDIANTES.filter((t) => tienePermiso("gestion_estudiantes", t.id)).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setVista(tab.id)}
                                    className={`py-4 border-b-2 flex items-center gap-2 text-sm font-bold transition-all ${vista === tab.id
                                            ? "border-[#093E7A] text-[#093E7A]"
                                            : "border-transparent text-gray-400 hover:text-gray-600"
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CUERPO */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {/* Barra de búsqueda + registro dedicado */}
                        {vista !== "renovaciones" && vista !== "verano" && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                                <div className="relative w-full sm:max-w-md">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        search
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o DNI del alumno..."
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#093E7A] outline-none transition-all"
                                    />
                                </div>
                                {vista === "estudiantes" && (
                                    <Link href="/campus/panel-control/gestion-estudiantes/registrar-estudiante" className="shrink-0">
                                        <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#093E7A] hover:bg-[#072d5a] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm">
                                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                                            <span>Registrar Nuevo Estudiante</span>
                                        </button>
                                    </Link>
                                )}
                            </div>
                        )}
                        {vista === "renovaciones" ? (
                            <div className="space-y-4">
                                {/* Filtro por estado de la solicitud */}
                                <div className="flex flex-wrap gap-2">
                                    {(["PENDIENTE", "APROBADA", "RECHAZADA", "TODAS"] as const).map((est) => (
                                        <button
                                            key={est}
                                            onClick={() => setFiltroRenovEstado(est)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${filtroRenovEstado === est
                                                    ? "bg-[#093E7A] border-[#093E7A] text-white"
                                                    : "bg-white border-gray-200 text-gray-500 hover:border-[#093E7A]/40"
                                                }`}
                                        >
                                            {est === "TODAS" ? "Todas" : est.charAt(0) + est.slice(1).toLowerCase()}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#fcfafa] border-b border-[#e5e7eb]">
                                                    <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Estudiante</th>
                                                    <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">DNI</th>
                                                    <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Progresión</th>
                                                    <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Año Destino</th>
                                                    <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Solicitado</th>
                                                    <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Estado</th>
                                                    <th className="px-6 py-4 text-xs font-black uppercase text-[#617489] text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#f3f4f6]">
                                                {loading ? (
                                                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm italic">Cargando solicitudes...</td></tr>
                                                ) : renovaciones.length === 0 ? (
                                                    <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No hay solicitudes de renovación {filtroRenovEstado !== "TODAS" ? `en estado "${filtroRenovEstado.toLowerCase()}"` : ""}.</td></tr>
                                                ) : (
                                                    renovaciones.map((sol) => (
                                                        <tr key={sol.id_solicitud_matricula} className="hover:bg-[#fcfafa] transition-colors">
                                                            <td className="px-6 py-4 text-sm font-bold text-[#111418]">{sol.alumno_nombre}</td>
                                                            <td className="px-6 py-4 text-sm text-[#4b5563]">{sol.alumno_dni || "—"}</td>
                                                            <td className="px-6 py-4 text-sm text-[#4b5563]">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <span className="text-gray-400">{sol.grado_actual || "—"}</span>
                                                                    <span className="material-symbols-outlined text-[16px] text-[#093E7A]">arrow_forward</span>
                                                                    <span className="font-bold text-[#093E7A]">{sol.grado_destino || "—"}</span>
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-[#4b5563]">{sol.anio_destino}</td>
                                                            <td className="px-6 py-4 text-sm text-[#4b5563]">
                                                                {sol.fecha_solicitud ? new Date(sol.fecha_solicitud).toLocaleDateString() : "—"}
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${badgeRenovacion(sol.estado)}`}>
                                                                    {sol.estado}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                {sol.estado === "PENDIENTE" ? (
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => { setRespuestaAdmin(""); setModalDecision({ abierto: true, solicitud: sol, aprobar: true }); }}
                                                                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors"
                                                                        >APROBAR</button>
                                                                        <button
                                                                            onClick={() => { setRespuestaAdmin(""); setModalDecision({ abierto: true, solicitud: sol, aprobar: false }); }}
                                                                            className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 transition-colors"
                                                                        >RECHAZAR</button>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400 italic">Resuelta</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : vista === "verano" ? (
                            <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#fcfafa] border-b border-[#e5e7eb]">
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Estudiante</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">DNI</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Origen</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Aula / Grupo</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Modalidad</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Cursos / Talleres</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Pago</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Estado</th>
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489] text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#f3f4f6]">
                                            {loading ? (
                                                <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm italic">Cargando inscripciones...</td></tr>
                                            ) : veranoSolicitudes.length === 0 ? (
                                                <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">No hay inscripciones de verano registradas.</td></tr>
                                            ) : (
                                                veranoSolicitudes.map((s) => (
                                                    <tr key={s.id} className="hover:bg-[#fcfafa] transition-colors">
                                                        <td className="px-6 py-4 text-sm font-bold text-[#111418]">{s.alumno_nombre || "—"}</td>
                                                        <td className="px-6 py-4 text-sm text-[#4b5563]">{s.alumno_dni || "—"}</td>
                                                        <td className="px-6 py-4 text-sm text-[#4b5563]">
                                                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                                s.origen === 'EXTERNO' ? 'bg-purple-100 text-purple-700' :
                                                                s.origen === 'NIVELACION' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                                            }`}>{s.origen}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-[#4b5563]">{s.grupo_label || "—"}</td>
                                                        <td className="px-6 py-4 text-sm text-[#4b5563]">{s.modalidad}</td>
                                                        <td className="px-6 py-4 text-xs text-[#4b5563] max-w-xs">
                                                            {(s.cursos || []).length ? (s.cursos || []).join(", ") : "—"}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase ${s.estado_pago === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {s.estado_pago || "—"}
                                                            </span>
                                                            {s.monto != null && <span className="ml-2 text-xs text-gray-500">S/ {Number(s.monto).toFixed(2)}</span>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${s.estado === 'ADMITIDO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-[#093E7A]'}`}>{s.estado}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {s.estado !== "ADMITIDO" ? (
                                                                <button
                                                                    onClick={() => admitirVerano(s.id)}
                                                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors"
                                                                    title="Confirmar pago y admitir"
                                                                >ADMITIR</button>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">Admitido</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                        <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#fcfafa] border-b border-[#e5e7eb]">
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Nombre Completo</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">DNI / Usuario</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Grado</th>
                                            {/* Los documentos solo se piden en la admisión regular, así que la
                                                columna aparece únicamente en esa pestaña. */}
                                            {vista === "postulantes" && (
                                                <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Documentos</th>
                                            )}
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489]">Estado</th>
                                            <th className="px-6 py-4 text-xs font-black uppercase text-[#617489] text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f3f4f6]">
                                        {loading ? (
                                            <tr><td colSpan={vista === "postulantes" ? 6 : 5} className="text-center py-10 text-gray-400 text-sm italic">Cargando registros...</td></tr>
                                        ) : (
                                            alumnos.map((alumno) => (
                                                <tr key={alumno.id_alumno} className="hover:bg-[#fcfafa] transition-colors">
                                                    <td className="px-6 py-4 text-sm font-bold text-[#111418]">{alumno.nombres} {alumno.apellidos}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-[#4b5563]">{alumno.dni}</div>
                                                        {/* Usuario con el que el alumno entra al campus */}
                                                        <div className="text-xs font-bold text-[#093E7A] tracking-wide">
                                                            {alumno.usuario?.username ?? "Sin cuenta"}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-[#4b5563]">
                                                        {alumno.grado_ingreso?.nombre || "No definido"}
                                                    </td>
                                                    {vista === "postulantes" && (
                                                        <td className="px-6 py-4">
                                                            <DocumentosAdmision alumno={alumno} />
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${ESTADOS_ACTIVOS.includes(alumno.estado_ingreso) ? 'bg-green-100 text-green-700' : alumno.estado_ingreso === 'RECHAZADO' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-[#093E7A]'}`}>
                                                            {alumno.estado_ingreso}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => verDetalle(alumno.id_alumno)}
                                                                title="Ver expediente"
                                                                className="p-2 text-slate-400 hover:text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                            </button>
                                                            <button
                                                                onClick={() => setAlumnoEditando(alumno)}
                                                                title="Editar estudiante y familiares"
                                                                className="p-2 text-slate-400 hover:text-[#093E7A] hover:bg-[#093E7A]/5 rounded-lg transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                                            </button>
                                                            {alumno.estado_ingreso === "POSTULANTE" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => ejecutarDecision(alumno.id_alumno, true)}
                                                                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors"
                                                                    >ADMITIR</button>
                                                                    <button
                                                                        onClick={() => setModalRechazo({ abierto: true, id: alumno.id_alumno, nombre: `${alumno.nombres} ${alumno.apellidos}` })}
                                                                        className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200 transition-colors"
                                                                    >RECHAZAR</button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL: EDITAR ESTUDIANTE Y SUS FAMILIARES (Z-60) --- */}
            <ModalEditarEstudiante
                alumno={alumnoEditando}
                onClose={() => setAlumnoEditando(null)}
                onSaved={trasGuardarEstudiante}
            />

            {/* --- MODAL DECISIÓN RENOVACIÓN (Z-70) --- */}
            {modalDecision.abierto && modalDecision.solicitud && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className={`p-5 text-white flex items-center gap-3 ${modalDecision.aprobar ? "bg-green-600" : "bg-red-600"}`}>
                            <span className="material-symbols-outlined">{modalDecision.aprobar ? "task_alt" : "cancel"}</span>
                            <h3 className="font-black text-lg">
                                {modalDecision.aprobar ? "Aprobar Renovación" : "Rechazar Renovación"}
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 text-sm mb-1">
                                Estudiante: <b className="text-gray-900">{modalDecision.solicitud.alumno_nombre}</b>
                            </p>
                            <p className="text-gray-500 text-xs mb-4">
                                {modalDecision.solicitud.grado_actual || "—"} → <b>{modalDecision.solicitud.grado_destino || "—"}</b> · Año {modalDecision.solicitud.anio_destino}
                            </p>

                            {modalDecision.aprobar ? (
                                <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4 text-xs text-green-800 leading-relaxed">
                                    Al aprobar se registrará automáticamente la matrícula del alumno para el año <b>{modalDecision.solicitud.anio_destino}</b> (sin sección). Podrás asignarle su sección en la pestaña <b>Asignar Estudiante</b>.
                                </div>
                            ) : (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-xs text-red-700 leading-relaxed">
                                    La solicitud quedará marcada como rechazada y el alumno verá tu respuesta.
                                </div>
                            )}

                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                {modalDecision.aprobar ? "Mensaje para el alumno (opcional)" : "Motivo del rechazo"}
                            </label>
                            <textarea
                                value={respuestaAdmin}
                                onChange={(e) => setRespuestaAdmin(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#093E7A] outline-none transition-all text-sm min-h-[90px]"
                                placeholder={modalDecision.aprobar ? "Ej: ¡Bienvenido nuevamente! Acércate a caja para el pago de matrícula." : "Ej: Tienes pensiones pendientes del año actual..."}
                            />

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setModalDecision({ abierto: false, solicitud: null, aprobar: true })}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={procesando || (!modalDecision.aprobar && !respuestaAdmin.trim())}
                                    onClick={decidirRenovacion}
                                    className={`flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 ${modalDecision.aprobar ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                                >
                                    {procesando ? "Procesando..." : modalDecision.aprobar ? "Confirmar Aprobación" : "Confirmar Rechazo"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 1: INFORMACIÓN DETALLADA (Z-60) --- */}
            {modalInfo.abierto && modalInfo.datos && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
                        {/* Header del expediente */}
                        <div className="p-6 bg-[#701C32] text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                                    <span className="material-symbols-outlined text-2xl">account_circle</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight leading-none">Expediente del Postulante</h3>
                                    <p className="text-red-100 text-[10px] mt-1 font-bold uppercase tracking-widest">Admisión Colegio Amancio</p>
                                </div>
                            </div>
                            <button onClick={() => setModalInfo({ abierto: false, datos: null })} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-8">
                                    <div>
                                        <h4 className="text-[#093E7A] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-[#093E7A] rounded-full"></span>
                                            Información Personal
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <InfoItem label="Nombres" value={modalInfo.datos.alumno.nombres} />
                                            <InfoItem label="Apellidos" value={modalInfo.datos.alumno.apellidos} />
                                            <InfoItem label="DNI" value={modalInfo.datos.alumno.dni} />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Fecha de Nacimiento</p>
                                                <div className="flex items-center">
                                                    <p className="text-sm font-bold text-slate-800 leading-tight">
                                                        {modalInfo.datos.alumno.fecha_nacimiento || "---"}
                                                    </p>
                                                    <EdadBadge fecha={modalInfo.datos.alumno.fecha_nacimiento} />
                                                </div>
                                            </div>
                                            <InfoItem label="Grado al que Postula" value={modalInfo.datos.alumno.grado} />
                                            <InfoItem label="Colegio" value={modalInfo.datos.alumno.colegio_procedencia || "No especifica"} />
                                            <InfoItem label="Dirección" value={modalInfo.datos.alumno.direccion} />
                                            <InfoItem label="Enfermedades/Alergias" value={modalInfo.datos.alumno.enfermedad || "Ninguna"} />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-emerald-600 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
                                            Contactos Familiares
                                        </h4>
                                        <div className="space-y-3">
                                            {modalInfo.datos.familiares.map((fam: any, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:border-emerald-200 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        {/* Ahora usamos un color neutro o azul, ya que no hay un "apoderado" marcado en esta tabla */}
                                                        <div className="p-2 rounded-lg bg-blue-50 text-[#093E7A]">
                                                            <span className="material-symbols-outlined">family_restroom</span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-700">{fam.nombre}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase">
                                                                {fam.parentesco} {fam.dni ? `• DNI: ${fam.dni}` : ''} • Tel: {fam.telefono || 'Sin número'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Documentos de admisión */}
                                    <div>
                                        <h4 className="text-[#701C32] font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-[#701C32] rounded-full"></span>
                                            Documentos de Admisión
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {DOCS_ADMISION_REGULAR.map((d) => {
                                                const url = modalInfo.datos.alumno[d.campo];
                                                return (
                                                    <div key={d.campo} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white">
                                                        <span className="text-xs font-bold text-slate-600">{d.label}</span>
                                                        {url ? (
                                                            <a href={url} target="_blank" rel="noreferrer" className="text-xs font-black text-[#093E7A] underline flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[16px]">description</span> Ver
                                                            </a>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-300 font-bold uppercase">No adjunto</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <div className="bg-slate-900 rounded-2xl p-6 text-white text-center">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Estado de Solicitud</p>
                                        <span className="text-lg font-black block mb-4">{modalInfo.datos.alumno.estado_ingreso}</span>
                                    </div>
                                    {modalInfo.datos.alumno.estado_ingreso === "POSTULANTE" && (
                                        <div className="space-y-3 mt-4">
                                            <button onClick={() => ejecutarDecision(modalInfo.datos.alumno.id_alumno, true)} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-lg">check_circle</span> ADMITIR
                                            </button>
                                            <button onClick={() => setModalRechazo({ abierto: true, id: modalInfo.datos.alumno.id_alumno, nombre: modalInfo.datos.alumno.nombres })} className="w-full py-4 bg-white border-2 border-red-50 text-red-500 rounded-xl font-black text-sm hover:bg-red-50 transition-all">
                                                RECHAZAR
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: RECHAZO (Z-70 - ENCIMA DE TODO) --- */}
            {modalRechazo.abierto && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-6">
                            <h3 className="text-xl font-black text-gray-900">Rechazar Postulación</h3>
                            <p className="text-gray-500 text-sm mt-1">
                                Indica el motivo por el cual no se admite a <b>{modalRechazo.nombre}</b>.
                            </p>

                            <textarea
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.target.value)}
                                className="w-full mt-4 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none transition-all text-sm min-h-[100px]"
                                placeholder="Ej: Documentación incompleta, vacantes agotadas..."
                            />

                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setModalRechazo({ abierto: false, id: 0, nombre: "" })} className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                                    Cancelar
                                </button>
                                <button
                                    disabled={!motivoRechazo.trim()}
                                    onClick={() => ejecutarDecision(modalRechazo.id, false, motivoRechazo)}
                                    className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    Confirmar Rechazo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
        </RoleGuard>
    );
}