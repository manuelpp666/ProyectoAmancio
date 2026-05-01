"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import CryptoJS from "crypto-js";

type Role = "ALUMNO" | "DOCENTE" | "ADMIN" | "AUXILIAR" | "PSICOLOGO" | null;

interface UserContextType {
  role: Role;
  username: string | null;
  id_usuario: number | null;
  token: string | null;
  permisos: any | null;
  setUserData: (role: Role, username: string, id_usuario: number, token: string, permisos: any) => void;
  logout: () => void;
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
  
  
  
  // EFECTO DE CARGA: Se ejecuta al entrar o al refrescar (F5)
  useEffect(() => {
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
      } else {
        // Si hay datos pero están corruptos, limpiar
        logout();
      }
    }
    setLoading(false);
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

  const logout = async () => {
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
  };

  return (
    <UserContext.Provider value={{ role, username, id_usuario: idUsuario, token, permisos, setUserData, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de UserProvider");
  return context;
};