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