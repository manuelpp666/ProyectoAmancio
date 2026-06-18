"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@/src/context/userContext";
import {
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Loader2,
  Stethoscope,
  HeartPulse,
  Info,
  CalendarCheck
} from "lucide-react";
import { Cita } from "@/src/interfaces/datos_alumno";
import { apiFetch } from "@/src/lib/api";

export default function ResumenCitasPage() {
  const { id_usuario, loading: userLoading } = useUser();
  const [proximaCita, setProximaCita] = useState<Cita | null>(null);
  const [citasProgramadas, setCitasProgramadas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCitas = useCallback(async (uid: number) => {
    setLoading(true);
    try {
      const [resProxima, resTodas] = await Promise.all([
        apiFetch(`/conducta/usuario/${uid}/proxima-cita`),
        apiFetch(`/conducta/usuario/${uid}/citas`)
      ]);

      const proxima = resProxima.ok ? await resProxima.json() : null;
      const todas = resTodas.ok ? await resTodas.json() : [];

      setProximaCita(proxima);
      // Solo citas activas (programadas/reprogramadas) para la agenda
      setCitasProgramadas(
        (Array.isArray(todas) ? todas : []).filter(
          (c: Cita) => ["PROGRAMADA", "REPROGRAMADA"].includes(c.estado)
        )
      );
    } catch (e) {
      console.error("Error al obtener las citas:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && id_usuario) fetchCitas(Number(id_usuario));
  }, [id_usuario, userLoading, fetchCitas]);

  if (userLoading || loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-[#701C32]" size={48} />
        <p className="text-gray-500 animate-pulse">Cargando tus citas...</p>
      </div>
    );
  }

  // La agenda muestra el resto de citas (sin repetir la próxima destacada)
  const otrasCitas = citasProgramadas.filter(c => c.id_cita !== proximaCita?.id_cita);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 px-4 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black text-[#701C32] flex items-center gap-3">
            <Stethoscope size={32} /> Citas Psicológicas
          </h1>
          <p className="text-gray-500 mt-2 text-sm">Acompañamiento y bienestar emocional del estudiante</p>
        </div>
        <Link
          href="/campus/campus-estudiante/inicio-campus/alumno/citas/mis-citas"
          className="text-sm font-bold text-[#701C32] hover:underline flex items-center gap-1 w-fit"
        >
          Ver historial completo <ArrowRight size={16} />
        </Link>
      </div>

      {/* PRÓXIMA CITA DESTACADA */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
          <CalendarCheck size={20} className="text-[#701C32]" /> Tu próxima cita
        </h3>

        {proximaCita ? (
          <div className={`relative overflow-hidden rounded-3xl p-7 text-white shadow-lg bg-[#701C32]`}>
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5 pointer-events-none"></div>
            {proximaCita.es_hoy && (
              <div className="absolute top-0 right-0 bg-amber-400 text-[#701C32] text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                ¡Es hoy!
              </div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex gap-4 items-start">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                  <HeartPulse size={26} className="text-[#FFF1E3]" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Motivo</p>
                  <h4 className="font-black text-xl leading-tight mb-3">{proximaCita.motivo}</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">
                      <Calendar size={14} /> {proximaCita.fecha}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">
                      <Clock size={14} /> {proximaCita.hora}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">
                      <MapPin size={14} /> Oficina de Psicología
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
            <Calendar size={40} className="mx-auto text-gray-300 mb-3" />
            <h4 className="font-bold text-gray-800 mb-1">No tienes citas próximas</h4>
            <p className="text-gray-400 text-sm">
              Cuando psicología programe una cita contigo, aparecerá aquí.
            </p>
          </div>
        )}
      </div>

      {/* OTRAS CITAS PROGRAMADAS */}
      {otrasCitas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-[#701C32]" /> También tienes agendado
          </h3>
          <div className="grid gap-4">
            {otrasCitas.map((c) => (
              <div key={c.id_cita} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-11 h-11 rounded-xl bg-[#FFF1E3] border border-[#F8EBDD] flex items-center justify-center text-[#701C32] shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{c.motivo}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <Calendar size={13} /> {c.fecha}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <Clock size={13} /> {c.hora}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full w-fit ${c.estado === "REPROGRAMADA" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                  {c.estado}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTA INFORMATIVA */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
        <Info className="text-blue-500 flex-shrink-0" size={20} />
        <p className="text-xs text-blue-700 leading-relaxed">
          Las citas son programadas por el área de Psicología del colegio. Si necesitas conversar con un
          psicólogo, puedes escribirle directamente desde el apartado de <Link href="/campus/campus-estudiante/inicio-campus/mensajeria" className="font-bold underline">Mensajería</Link>.
        </p>
      </div>
    </div>
  );
}
