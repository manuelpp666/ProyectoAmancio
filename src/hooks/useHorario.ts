// hooks/useHorario.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { HorarioAsignado} from "@/src/interfaces/academic";
import { apiFetch } from "@/src/lib/api";

export function useHorario(id_usuario: number, id_anio: string) {
  const [data, setData] = useState<HorarioAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHorario = useCallback(async () => {
    if (!id_usuario || !id_anio) return;
    setLoading(true);
    setError(null);
    try {
      // Nota: Si el backend es el mismo para alumno/docente,
      // la URL es genérica.
      const res = await apiFetch(`/horarios/usuario/${id_usuario}?id_anio_escolar=${id_anio}`);
      const json = await res.json();

      if (!res.ok) {
        // El backend devuelve { detail: "..." } cuando no hay matrícula u horario
        setData([]);
        setError(json?.detail || "No se pudo obtener el horario");
        return;
      }

      setData(Array.isArray(json) ? json : []);
    } catch (e) {
      setData([]);
      setError("Error de conexión al cargar el horario");
      toast.error("Error al cargar horario");
    } finally {
      setLoading(false);
    }
  }, [id_usuario, id_anio]);

  useEffect(() => { fetchHorario(); }, [fetchHorario]);

  return { data, loading, error };
}
