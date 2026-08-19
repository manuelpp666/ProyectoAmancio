"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from "react";
import CryptoJS from "crypto-js";
import { apiFetch } from "@/src/lib/api";

type Role = "ALUMNO" | "DOCENTE" | "ADMIN" | "AUXILIAR" | "PSICOLOGO" | null;

interface UserContextType {
  role: Role;
  username: string | null;
  id_usuario: number | null;
  token: string | null;
  permisos: any | null;
  setUserData: (role: Role, username: string, id_usuario: number, token: string, permisos: any) => void;
  logout: () => void;
  /**
   * Vuelve a preguntarle al servidor qué permisos tiene esta cuenta AHORA.
   *
   * Los permisos llegaban solo en la respuesta del login, y de ahí a
   * `sessionStorage`. Como al refrescar la página se releen de ese
   * almacenamiento y no del servidor, a un administrador al que le acababan de
   * cambiar los permisos le seguía saliendo el menú antiguo hasta que cerraba
   * la pestaña. Esto los pone al día sin obligar a nadie a cerrar sesión.
   *
   * Nunca lanza: si el servidor no responde se deja lo que ya había.
   */
  refrescarPermisos: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const SECRET_KEY = process.env.NEXT_PUBLIC_PERMISOS_KEY || "fallback-key-segura";

const encrypt = (data: string) => CryptoJS.AES.encrypt(data, SECRET_KEY).toString();

const decrypt = (cipherText: string) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || null;
  } catch {
    return null;
  }
};

const setCookie = (name: string, value: string) => {
  // Eliminamos cualquier expiración para que sea de sesión
  document.cookie = `${name}=${value}; path=/; SameSite=Lax; Secure=${window.location.protocol === "https:"}`;
};

const deleteCookie = (name: string) => {
  // Intentamos borrarla de las dos formas más comunes (con y sin dominio explícito)
  const base = "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
  document.cookie = `${name}${base}`;
  document.cookie = `${name}${base}; domain=${window.location.hostname}`;
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Evita que dos comprobaciones de permisos se pisen entre sí.
  const refrescando = useRef(false);

  useEffect(() => {
    const initAuth = async () => {
      const tabActive = sessionStorage.getItem("tab_session_active");

      // CASO A: Pestaña nueva (Cerró la pestaña antes o abrió una nueva)
      if (!tabActive) {
        // 1. Limpiamos rastro local
        sessionStorage.clear();
        deleteCookie("userRole");

        // 2. Intentamos limpiar la cookie HttpOnly del servidor 
        // de forma silenciosa para que no haya rastro de sesiones viejas.
        try {
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/logout`, {
            method: "POST",
            credentials: "include",
          });
        } catch (e) {
          console.error("Error limpiando sesión previa:", e);
        }

        // 3. Marcamos esta pestaña como activa y terminamos carga
        sessionStorage.setItem("tab_session_active", "true");
        setLoading(false);
      } 
      // CASO B: Refresco de página (F5)
      else {
        const encRole = sessionStorage.getItem("userRole");
        const encUser = sessionStorage.getItem("userName");
        const encId = sessionStorage.getItem("userId");
        const encPermisos = sessionStorage.getItem("userPermisos");

        if (encRole && encUser && encId && encPermisos) {
          const decRole = decrypt(encRole) as Role;
          const decUser = decrypt(encUser);
          const decId = decrypt(encId);
          const decPermisos = decrypt(encPermisos);

          if (decRole && decUser && decId && decPermisos) {
            setRole(decRole);
            setUsername(decUser);
            setIdUsuario(Number(decId));
            setPermisos(JSON.parse(decPermisos));
          }
        }
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const setUserData = (newRole: Role, newUser: string, newId: number, newToken: string, newPermisos: any) => {
    setRole(newRole);
    setUsername(newUser);
    setIdUsuario(newId);
    setToken(newToken);
    setPermisos(newPermisos);

    // Persiste en sessionStorage (sobrevive a F5, muere al cerrar pestaña)
    sessionStorage.setItem("userRole", encrypt(newRole || ""));
    sessionStorage.setItem("userName", encrypt(newUser || ""));
    sessionStorage.setItem("userId", encrypt(String(newId)));
    sessionStorage.setItem("userPermisos", encrypt(JSON.stringify(newPermisos)));

    // Cookie de sesión para el Middleware
    setCookie("userRole", newRole || "");
  };

  const logout = useCallback(async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      // Limpieza total y redirección
      sessionStorage.clear();
      deleteCookie("userRole");
      setRole(null);
      setUsername(null);
      setIdUsuario(null);
      setToken(null);
      setPermisos(null);
      window.location.href = "/campus";
    }
  }, []);

  const refrescarPermisos = useCallback(async () => {
    if (typeof window === "undefined") return;

    // Sin sesión guardada no hay nada que refrescar. Se consulta el
    // almacenamiento y no el estado de React porque esta función la llaman
    // efectos que no queremos volver a crear en cada render.
    const rolCifrado = sessionStorage.getItem("userRole");
    if (!rolCifrado) return;

    // Al navegar rápido entre apartados se solapaban las peticiones y la última
    // en llegar podía no ser la última en pedirse.
    if (refrescando.current) return;
    refrescando.current = true;

    try {
      const res = await apiFetch("/usuarios/mis-permisos");
      if (!res.ok) return;
      const datos = await res.json();

      // Cuenta dada de baja mientras tenía la sesión abierta: se cierra ya.
      if (datos.activo === false) {
        await logout();
        return;
      }

      // Se comparan los permisos EN CLARO, no cifrados: AES produce un texto
      // distinto en cada llamada, así que comparar los cifrados daría "han
      // cambiado" siempre y provocaría un render en cada comprobación.
      const textoNuevo = JSON.stringify(datos.permisos ?? null);
      const permisosCifrados = sessionStorage.getItem("userPermisos");
      if (!permisosCifrados || decrypt(permisosCifrados) !== textoNuevo) {
        setPermisos(datos.permisos ?? null);
        sessionStorage.setItem("userPermisos", encrypt(textoNuevo));
      }

      // El rol también puede haber cambiado. Se actualiza además la cookie, que
      // es lo que lee el middleware para decidir a qué campus se puede entrar.
      if (datos.rol && datos.rol !== decrypt(rolCifrado)) {
        setRole(datos.rol as Role);
        sessionStorage.setItem("userRole", encrypt(datos.rol));
        setCookie("userRole", datos.rol);
      }
    } catch {
      // Sin conexión se deja lo que ya había: es preferible un menú algo
      // desfasado a vaciar los permisos y dejar el panel en blanco.
    } finally {
      refrescando.current = false;
    }
  }, [logout]);

  return (
    <UserContext.Provider value={{ role, username, id_usuario: idUsuario, token, permisos, setUserData, logout, refrescarPermisos, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de UserProvider");
  return context;
};