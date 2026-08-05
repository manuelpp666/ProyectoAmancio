import HomeClient from "./HomeClient";
import { fetchServer } from "@/src/components/utils/serverData";
import type { ConfigItem } from "@/src/hooks/useConfiguracion";
import { NoticiaResponse } from "@/src/interfaces/noticia";

// Se revalida cada 60s: las visitas comparten la respuesta cacheada.
export const revalidate = 60;

interface InscripcionAbierta { id_anio_escolar: string; tipo: string; fin_inscripcion?: string; }
interface AdmisionEstado {
  abierto: boolean;
  tipo?: string;
  proxima_inscripcion?: string;
  inscripciones?: InscripcionAbierta[];
}

export default async function Home() {
  const [config, noticias, admision] = await Promise.all([
    fetchServer<ConfigItem[]>("/configuracion/inicio", 60, []),
    fetchServer<NoticiaResponse[]>("/web/noticias/", 60, []),
    fetchServer<AdmisionEstado>("/web/estado-admision", 60, { abierto: false }),
  ]);

  return (
    <HomeClient
      config={Array.isArray(config) ? config : []}
      noticias={Array.isArray(noticias) ? noticias.slice(0, 3) : []}
      admision={admision || { abierto: false }}
    />
  );
}
