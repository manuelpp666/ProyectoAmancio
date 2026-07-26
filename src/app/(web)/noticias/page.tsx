import NoticiasClient from "./NoticiasClient";
import { fetchServer } from "@/src/components/utils/serverData";
import type { ConfigItem } from "@/src/hooks/useConfiguracion";
import { NoticiaResponse } from "@/src/interfaces/noticia";

export const revalidate = 60;

export default async function NoticiasPage() {
  const [noticias, config] = await Promise.all([
    fetchServer<NoticiaResponse[]>("/web/noticias/", 60, []),
    fetchServer<ConfigItem[]>("/configuracion/noticias", 60, []),
  ]);

  return (
    <NoticiasClient
      noticias={Array.isArray(noticias) ? noticias : []}
      config={Array.isArray(config) ? config : []}
    />
  );
}
