// Fetch cacheado en el servidor para páginas públicas.
// La respuesta se revalida cada `revalidate` segundos, de modo que muchas
// visitas comparten la misma respuesta en caché en vez de golpear la API en cada carga.
export async function fetchServer<T>(path: string, revalidate = 60, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
      next: { revalidate },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}
