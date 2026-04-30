// src/context/UserContext.tsx
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

// --- Funciones Auxiliares ---
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

const setCookie = (name: string, value: string, days?: number) => {
  let cookie = `${name}=${value}; path=/; SameSite=Lax`;
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    cookie += "; Secure";
  }

  if (typeof days === "number") {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    cookie += `; expires=${expires}`;
  }

  document.cookie = cookie;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
};

// --- Provider ---
export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener los strings cifrados desde sessionStorage
    const encRole = sessionStorage.getItem("userRole");
    const encUser = sessionStorage.getItem("userName");
    const encId = sessionStorage.getItem("userId");
    const encPermisos = sessionStorage.getItem("userPermisos");

    if (encRole && encUser && encId && encPermisos) {
      // 2. Desencriptar todo
      const decRole = decrypt(encRole) as Role;
      const decUser = decrypt(encUser);
      const decId = decrypt(encId);
      const decPermisos = decrypt(encPermisos);

      // 3. Validar integridad
      if (decRole && decUser && decId && decPermisos) {
        setRole(decRole);
        setUsername(decUser);
        setIdUsuario(Number(decId));
        setPermisos(JSON.parse(decPermisos));
      } else {
        console.error("Integridad comprometida. Limpiando...");
        logout();
      }
    }
    setLoading(false);
  }, []);

  const setUserData = (newRole: Role, newUser: string, newId: number, newToken: string, newPermisos: any) => {
    // Actualizar estado
    setRole(newRole);
    setUsername(newUser);
    setIdUsuario(newId);
    setToken(newToken);
    setPermisos(newPermisos);

    // Guardar en sessionStorage: persiste solo mientras la sesión del navegador esté abierta
    sessionStorage.setItem("userRole", encrypt(newRole || ""));
    sessionStorage.setItem("userName", encrypt(newUser || ""));
    sessionStorage.setItem("userId", encrypt(String(newId)));
    sessionStorage.setItem("userPermisos", encrypt(JSON.stringify(newPermisos)));

    // Cookie de rol para middleware y navegación en el servidor
    setCookie("userRole", newRole || "");
  };

  const cleanupSession = () => {
    if (typeof window === "undefined") return;

    const url = `${process.env.NEXT_PUBLIC_API_URL}/usuarios/logout`;

    try {
      fetch(url, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      });
    } catch (error) {
      console.error("Error enviando logout en unload:", error);
    }

    sessionStorage.clear();
    deleteCookie("userRole");
  };

  useEffect(() => {
    const handleUnload = () => {
      cleanupSession();
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  const logout = async () => {
    try {
      // 1. Llamamos al backend para que borre la cookie HttpOnly
      // Usamos fetch directamente o tu apiFetch
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/usuarios/logout`, {
        method: "POST",
        credentials: "include", // CRUCIAL para que el navegador envíe la cookie que queremos borrar
      });
    } catch (error) {
      console.error("Error al cerrar sesión en el servidor:", error);
    } finally {
      // 2. Limpiamos el estado de React
      setRole(null);
      setUsername(null);
      setIdUsuario(null);
      setToken(null);
      setPermisos(null);

      // 3. Limpiamos sessionStorage porque este estado debe vivir solo en la sesión
      sessionStorage.clear();
      
      // 4. Borramos la cookie de rol (la que NO es HttpOnly)
      deleteCookie("userRole");

      // 5. Redirigimos al usuario
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