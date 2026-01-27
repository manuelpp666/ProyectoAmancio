// src/app/campus-estudiante/inicio-campus/notificaciones/page.tsx
import { Megaphone, Star, Wallet, Calendar, CheckCheck, Clock } from "lucide-react";

export default function NotificacionesPage() {
  const notificaciones = [
    {
      id: 1,
      tipo: "INSTITUCIONAL",
      titulo: "Suspensión de clases",
      mensaje: "Se suspenden las clases el día lunes 15 por feriado nacional. Retomamos actividades el martes.",
      fecha: "Hace 2 horas",
      leido: false,
      icono: Megaphone,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      id: 2,
      tipo: "ACADÉMICO",
      titulo: "Nueva calificación publicada",
      mensaje: "El docente José Puicon ha subido tu nota del Examen Parcial de Química.",
      fecha: "Hace 4 horas",
      leido: false,
      icono: Star,
      color: "text-yellow-600",
      bg: "bg-yellow-50"
    },
    {
      id: 3,
      tipo: "TESORERÍA",
      titulo: "Recordatorio de pago",
      mensaje: "Tienes un pago pendiente de S/ 240.00 correspondiente a la pensión de Marzo.",
      fecha: "Ayer",
      leido: true,
      icono: Wallet,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    {
      id: 4,
      tipo: "EVENTOS",
      titulo: "Feria de Ciencias 2026",
      mensaje: "Ya están abiertas las inscripciones para presentar proyectos en la feria anual.",
      fecha: "Hace 2 días",
      leido: true,
      icono: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      id: 5,
      tipo: "ACADÉMICO",
      titulo: "Tarea entregada con éxito",
      mensaje: "Tu tarea de Matemáticas 'Ejercicios de Álgebra' ha sido recibida correctamente.",
      fecha: "Hace 3 días",
      leido: true,
      icono: CheckCheck,
      color: "text-green-600",
      bg: "bg-green-50"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#701C32]">Notificaciones</h1>
          <p className="text-gray-500 text-sm mt-1">Mantente al día con lo que sucede en tu colegio.</p>
        </div>
        
        <div className="flex gap-2">
            <button className="text-xs font-bold px-4 py-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition-colors">
                Marcar todas como leídas
            </button>
            <button className="text-xs font-bold px-4 py-2 bg-[#701C32] text-white rounded-full hover:bg-[#8a223d] transition-colors shadow-sm">
                Configuración
            </button>
        </div>
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['Todas', 'No leídas', 'Académico', 'Pagos', 'Institucional'].map((filtro, i) => (
            <button 
                key={i}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${i === 0 ? 'bg-[#701C32]/10 text-[#701C32]' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
                {filtro}
            </button>
        ))}
      </div>

      {/* LISTA DE NOTIFICACIONES */}
      <div className="space-y-4">
        {notificaciones.map((notif) => (
          <div 
            key={notif.id} 
            className={`group relative bg-white rounded-xl p-5 border transition-all hover:shadow-md flex gap-5 ${notif.leido ? 'border-gray-100' : 'border-l-4 border-l-[#701C32] border-y-gray-100 border-r-gray-100 shadow-sm'}`}
          >
            {/* Icono */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notif.bg} ${notif.color}`}>
              <notif.icono size={20} />
            </div>

            {/* Contenido */}
            <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md mb-1 inline-block ${notif.bg} ${notif.color}`}>
                        {notif.tipo}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} /> {notif.fecha}
                    </span>
                </div>
                
                <h3 className={`text-base font-bold mb-1 ${notif.leido ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notif.titulo}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                    {notif.mensaje}
                </p>
            </div>

            {/* Indicador de punto rojo si no está leído */}
            {!notif.leido && (
                <div className="absolute top-5 right-5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State (por si no hay notificaciones) */}
      {notificaciones.length === 0 && (
          <div className="text-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone size={24} className="opacity-50"/>
              </div>
              <p>No tienes notificaciones nuevas</p>
          </div>
      )}

    </div>
  );
}