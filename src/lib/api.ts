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
  const token = getCookie("authToken");

  const isFormData = options.body instanceof FormData;

  const defaultHeaders: Record<string, string> = {
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Manejo global de errores (opcional pero recomendado)
  if (response.status === 401) {
    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.clear();
    window.location.href = "/login?error=session_expired";
  }

  return response;
};