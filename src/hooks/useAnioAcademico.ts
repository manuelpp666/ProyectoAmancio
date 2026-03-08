import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/src/lib/api";

export function useAnioAcademico() {
  const [anioPlanificacion, setAnioPlanificacion] = useState<string>("");
  const [listaAnios, setListaAnios] = useState<any[]>([]);
  const [loadingAnios, setLoadingAnios] = useState(true);

  useEffect(() => {
    const cargarAnios = async () => {
      try {
        setLoadingAnios(true);
        const res = await apiFetch(`/academic/anios/`);
        const data = await res.json();
        setListaAnios(data);

        const activo = data.find((a: any) => a.estado === "activo") || data[0];
        if (activo) setAnioPlanificacion(activo.id_anio_escolar.toString());
      } catch (error) {
        toast.error("Error al cargar años académicos");
      } finally {
        setLoadingAnios(false);
      }
    };
    cargarAnios();
  }, []);

  return { anioPlanificacion, setAnioPlanificacion, listaAnios, loadingAnios };
}