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

// Función auxiliar para guardar cookies
const setCookie = (name: string, value: string, days = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
};

// Función auxiliar para borrar cookies
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};
const SECRET_KEY = process.env.NEXT_PUBLIC_PERMISOS_KEY
export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") as Role;
    const savedUser = localStorage.getItem("userName");
    const savedId = localStorage.getItem("userId");
    const encryptedPermisos = localStorage.getItem("userPermisos");
    // El token lo intentamos recuperar del estado o cookie si fuera necesario
    // Por simplicidad, aquí lo manejamos desde el login

    if (savedRole && savedUser && encryptedPermisos) {
      try {
        // DESCIFRADO: Intentamos recuperar los permisos originales
        const bytes = CryptoJS.AES.decrypt(encryptedPermisos, SECRET_KEY);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

        if (!decryptedData) throw new Error("Datos corruptos");

        setRole(savedRole);
        setUsername(savedUser);
        setIdUsuario(Number(savedId));
        setPermisos(JSON.parse(decryptedData));
      } catch (error) {
        console.error("Error de integridad en permisos. Cerrando sesión...");
        logout(); // Si alguien editó el LocalStorage, lo expulsamos
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
const encryptedPermisos = CryptoJS.AES.encrypt(
      JSON.stringify(newPermisos),
      SECRET_KEY
    ).toString();
    // Guardar en LocalStorage (lo no sensible)
    localStorage.setItem("userRole", newRole || "");
    localStorage.setItem("userName", newUser || "");
    localStorage.setItem("userId", String(newId));
    localStorage.setItem("userPermisos", encryptedPermisos);
    // Guardar en Cookies (lo sensible para el Middleware)
    setCookie("authToken", newToken);
    setCookie("userRole", newRole || "");
  };

  const logout = () => {
    setRole(null);
    setUsername(null);
    setIdUsuario(null);
    setToken(null);
    setPermisos(null);
    localStorage.clear();
    deleteCookie("authToken");
    deleteCookie("userRole");
    window.location.href = "/login";
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