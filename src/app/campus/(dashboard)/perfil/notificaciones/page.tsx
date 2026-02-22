// src/app/campus-estudiante/inicio-campus/notificaciones/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/src/context/userContext";
import { Megaphone, Star, Wallet, Calendar, CheckCheck, Clock, Loader2 } from "lucide-react";

// Helper para definir estilos e iconos según el tipo de notificación
const getNotifStyle = (tipo: string) => {
  switch (tipo) {
    case "entrega": return { icono: CheckCheck, color: "text-green-600", bg: "bg-green-50" };
    case "nota": return { icono: Star, color: "text-yellow-600", bg: "bg-yellow-50" };
    case "pago": return { icono: Wallet, color: "text-red-600", bg: "bg-red-50" };
    case "evento": return { icono: Calendar, color: "text-purple-600", bg: "bg-purple-50" };
    default: return { icono: Megaphone, color: "text-blue-600", bg: "bg-blue-50" };
  }
};

export default function NotificacionesPage() {
  const { id_usuario, loading } = useUser();
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      if (!id_usuario) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gestion/notificaciones/${id_usuario}`);
        const data = await res.json();
        setNotificaciones(data.notificaciones || []);
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
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex gap-5 hover:shadow-md transition-all"
              >
                {/* Icono dinámico */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg} ${style.color}`}>
                  <style.icono size={20} />
                </div>

                {/* Contenido */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${style.bg} ${style.color}`}>
                      {notif.tipo}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {new Date(notif.fecha).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
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