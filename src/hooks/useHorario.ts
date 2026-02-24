// hooks/useHorario.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { HorarioAsignado} from "@/src/interfaces/academic";

export function useHorario(id_usuario: number, id_anio: string) {
  const [data, setData] = useState<HorarioAsignado[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHorario = useCallback(async () => {
    if (!id_usuario || !id_anio) return;
    setLoading(true);
    try {
      // Nota: Si el backend es el mismo para alumno/docente, 
      // la URL es genérica.
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/horarios/usuario/${id_usuario}?id_anio_escolar=${id_anio}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error("Error al cargar horario");
    } finally {
      setLoading(false);
    }
  }, [id_usuario, id_anio]);

  useEffect(() => { fetchHorario(); }, [fetchHorario]);

  return { data, loading };
}