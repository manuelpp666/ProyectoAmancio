// src/app/campus-estudiante/inicio-campus/notificaciones/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/src/context/userContext";
import { Megaphone, Star, Wallet, Calendar, CheckCheck, Clock, Loader2, HeartPulse, MessageSquare, ArrowLeft, GraduationCap, ShieldAlert, ClipboardCheck } from "lucide-react";
import { apiFetch } from "@/src/lib/api";
// Helper para definir estilos e iconos según el tipo de notificación
const getNotifStyle = (tipo: string) => {
  switch (tipo) {
    case "entrega": return { icono: CheckCheck, color: "text-green-600", bg: "bg-green-50", etiqueta: "Entrega" };
    case "nota": return { icono: Star, color: "text-yellow-600", bg: "bg-yellow-50", etiqueta: "Nota" };
    case "pago": return { icono: Wallet, color: "text-red-600", bg: "bg-red-50", etiqueta: "Pago" };
    case "evento": return { icono: Calendar, color: "text-purple-600", bg: "bg-purple-50", etiqueta: "Evento" };
    case "cita": return { icono: HeartPulse, color: "text-blue-600", bg: "bg-blue-50", etiqueta: "Cita" };
    case "mensaje": return { icono: MessageSquare, color: "text-[#701C32]", bg: "bg-[#701C32]/10", etiqueta: "Mensaje" };
    case "academico": return { icono: GraduationCap, color: "text-orange-600", bg: "bg-orange-50", etiqueta: "Académico" };
    case "conducta": return { icono: ShieldAlert, color: "text-amber-600", bg: "bg-amber-50", etiqueta: "Conducta" };
    case "inscripcion": return { icono: ClipboardCheck, color: "text-[#093E7A]", bg: "bg-[#093E7A]/10", etiqueta: "Inscripción" };
    default: return { icono: Megaphone, color: "text-blue-600", bg: "bg-blue-50", etiqueta: "Aviso" };
  }
};

// El backend deja la fecha en null cuando el dato de origen no la tiene (una
// cuota sin vencimiento, un año sin cierre de inscripción). `new Date(null)`
// da "Invalid Date" y se veía impreso en la tarjeta.
const formatearFecha = (valor: string | null | undefined) => {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toLocaleDateString();
};

export default function NotificacionesPage() {
  const { id_usuario, loading } = useUser();
  const router = useRouter();
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      if (!id_usuario) return;
      try {
        const res = await apiFetch(`/gestion/notificaciones/${id_usuario}`);
        const data = await res.json();
        const lista = data.notificaciones || [];
        setNotificaciones(lista);
        // Marcamos como vistas: guardamos la cantidad vista para el badge del header
        localStorage.setItem(`notif_seen_count_${id_usuario}`, String(lista.length));
        window.dispatchEvent(new Event("notif-seen"));
      } catch (error) {
        console.error("Error al cargar notificaciones:", error);
      } finally {
        setCargando(false);
      }
    };

    if (!loading) fetchNotificaciones();
  }, [id_usuario, loading]);

  if (loading || cargando) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-[#701C32]" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* CABECERA */}
      <div className="border-b border-gray-200 pb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#701C32] transition-colors mb-4"
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <h1 className="text-3xl font-bold text-[#701C32]">Notificaciones</h1>
        <p className="text-gray-500 text-sm mt-1">Mantente al día con lo que sucede en tu colegio.</p>
      </div>

      {/* LISTA DE NOTIFICACIONES */}
      <div className="space-y-4">
        {notificaciones.length > 0 ? (
          notificaciones.map((notif: any, index: number) => {
            const style = getNotifStyle(notif.tipo);
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-4 sm:p-5 border border-gray-100 shadow-sm flex gap-3 sm:gap-5 hover:shadow-md transition-all"
              >
                {/* Icono dinámico */}
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} ${style.color}`}>
                  <style.icono size={20} />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap justify-between items-start gap-x-2 gap-y-1 mb-1">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${style.bg} ${style.color}`}>
                      {style.etiqueta}
                    </span>
                    {formatearFecha(notif.fecha) && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} /> {formatearFecha(notif.fecha)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed break-words">
                    {notif.mensaje}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State */
          <div className="text-center py-20 text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone size={24} className="opacity-50"/>
            </div>
            <p>No tienes notificaciones nuevas por el momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}