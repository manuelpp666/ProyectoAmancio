export const getCookie = (name: string): string | undefined => {
  if (typeof document === "undefined") return undefined; // Evita errores en el servidor
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

/**
 * Un wrapper de fetch que inyecta automáticamente el Token
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const isFormData = options.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {};
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    credentials: "include", // <--- Esto envía la cookie authToken automáticamente
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    sessionStorage.clear();
    // Borramos la cookie de rol (la que sí podemos ver)
    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
    if (typeof window !== "undefined") {
      window.location.href = "/campus";
    }
  }

  return response;
};

/**
 * Texto legible del error que devolvió la API.
 *
 * FastAPI responde de dos formas distintas: {"detail": "texto"} en los errores
 * de negocio (DNI repetido, sin permisos…) y {"detail": [{loc, msg}, …]} en los
 * de validación. Mostrar siempre un mensaje genérico deja al usuario sin saber
 * qué campo corregir, y a quien mantiene el sistema sin pista de qué falló.
 */
export const mensajeDeError = async (
  res: Response,
  porDefecto: string
): Promise<string> => {
  try {
    const cuerpo = await res.json();
    const detalle = cuerpo?.detail;

    if (typeof detalle === "string" && detalle.trim()) return detalle;

    if (Array.isArray(detalle) && detalle.length > 0) {
      const textos = detalle
        .map((e: { loc?: unknown[]; msg?: string }) => {
          if (!e?.msg) return null;
          const campo = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : null;
          return campo ? `${campo}: ${e.msg}` : e.msg;
        })
        .filter(Boolean);
      if (textos.length) return textos.join(" · ");
    }
  } catch {
    // Respuesta sin JSON (una pasarela caída, un HTML de error): no hay más
    // información que dar que el mensaje genérico.
  }
  return porDefecto;
};