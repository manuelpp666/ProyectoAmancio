/**
 * Dirección del WebSocket de mensajería.
 *
 * Se deriva de NEXT_PUBLIC_API_URL en lugar de escribirse aparte: el socket lo
 * sirve el mismo backend que la API, así que tenerlo en dos variables solo
 * abriría la puerta a que una se actualice y la otra no.
 *
 * El esquema se toma de la propia URL de la API, no del protocolo de la página:
 * si la web va por https y el backend por http, `wss://` fallaría igualmente,
 * y así el error se ve en la configuración en vez de en el navegador.
 */
export const urlWebSocket = (idUsuario: number | string): string => {
  const api = process.env.NEXT_PUBLIC_API_URL;

  if (!api) {
    throw new Error(
      "NEXT_PUBLIC_API_URL no está definida: la mensajería en tiempo real no puede conectarse."
    );
  }

  // http -> ws, https -> wss. Se quita la barra final para no generar '//ws'.
  const base = api.trim().replace(/\/+$/, "").replace(/^http/, "ws");
  return `${base}/ws/${idUsuario}`;
};
