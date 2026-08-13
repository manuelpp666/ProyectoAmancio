// hooks/useHorario.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { BloqueHorario, HorarioAsignado } from "@/src/interfaces/academic";
import { apiFetch } from "@/src/lib/api";

export function useHorario(id_usuario: number, id_anio: string) {
  const [data, setData] = useState<HorarioAsignado[]>([]);
  // La rejilla (duración del bloque y recesos) la calcula el backend a partir
  // de la configuración del colegio, así que se pide junto con el horario.
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHorario = useCallback(async () => {
    if (!id_usuario || !id_anio) return;
    setLoading(true);
    setError(null);
    try {
      // Nota: Si el backend es el mismo para alumno/docente,
      // la URL es genérica.
      const [res, resBloques] = await Promise.all([
        apiFetch(`/horarios/usuario/${id_usuario}?id_anio_escolar=${id_anio}`),
        apiFetch(`/horarios/bloques/usuario/${id_usuario}?id_anio_escolar=${id_anio}`),
      ]);
      const json = await res.json();

      // La rejilla es un extra: si falla, la tabla se apaña con las clases.
      if (resBloques.ok) {
        const b = await resBloques.json();
        setBloques(Array.isArray(b) ? b : []);
      } else {
        setBloques([]);
      }

      if (!res.ok) {
        // El backend devuelve { detail: "..." } cuando no hay matrícula u horario
        setData([]);
        setError(json?.detail || "No se pudo obtener el horario");
        return;
      }

      setData(Array.isArray(json) ? json : []);
    } catch (e) {
      setData([]);
      setBloques([]);
      setError("Error de conexión al cargar el horario");
      toast.error("Error al cargar horario");
    } finally {
      setLoading(false);
    }
  }, [id_usuario, id_anio]);

  useEffect(() => { fetchHorario(); }, [fetchHorario]);

  return { data, bloques, loading, error };
}
