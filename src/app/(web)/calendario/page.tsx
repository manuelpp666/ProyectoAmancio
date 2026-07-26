import CalendarioClient from "./CalendarioClient";
import { fetchServer } from "@/src/components/utils/serverData";
import type { ConfigItem } from "@/src/hooks/useConfiguracion";
import { Evento } from "@/src/interfaces/evento";

export const revalidate = 60;

export default async function CalendarioPage() {
  const [eventos, config] = await Promise.all([
    fetchServer<Evento[]>("/web/eventos/todos", 60, []),
    fetchServer<ConfigItem[]>("/configuracion/calendario", 60, []),
  ]);

  return (
    <CalendarioClient
      eventos={Array.isArray(eventos) ? eventos : []}
      config={Array.isArray(config) ? config : []}
    />
  );
}
