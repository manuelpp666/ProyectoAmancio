import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";

export function useAnioAcademico() {
  const [anioPlanificacion, setAnioPlanificacion] = useState<string>("");
  const [listaAnios, setListaAnios] = useState<any[]>([]);
  const [loadingAnios, setLoadingAnios] = useState(true);

  const cargarAnios = useCallback(async () => {
    try {
      setLoadingAnios(true);
      const res = await apiFetch(`/academic/anios/`);
      const data = await res.json();
      setListaAnios(data);

      setAnioPlanificacion((prev) => {
        if (prev) return prev; // Mantiene el año actual si ya hay uno seleccionado
        const activo = data.find((a: any) => a.activo === true) || data[0];
        return activo ? activo.id_anio_escolar.toString() : "";
      });
    } catch (error) {
      toast.error("Error al cargar años académicos");
    } finally {
      setLoadingAnios(false);
    }
  }, []);

  useEffect(() => {
    cargarAnios();
  }, [cargarAnios]);

  // NUEVO: Devuelve el objeto completo del año seleccionado (para ver sus fechas en la UI)
  const anioObj = useMemo(() => {
    return listaAnios.find(a => a.id_anio_escolar?.toString() === anioPlanificacion);
  }, [anioPlanificacion, listaAnios]);

  return { 
    anioPlanificacion, 
    setAnioPlanificacion, 
    listaAnios, 
    loadingAnios,
    anioObj,               // <-- Soluciona el Error 1
    refreshAnios: cargarAnios // <-- Soluciona el Error 2
  };
}