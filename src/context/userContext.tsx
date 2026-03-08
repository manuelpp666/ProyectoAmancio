// src/context/UserContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Role = "ALUMNO" | "DOCENTE" | "ADMIN" | "AUXILIAR" | null;

interface UserContextType {
  role: Role;
  username: string | null;
  id_usuario: number | null;
  token: string | null;
  setUserData: (role: Role, username: string, id_usuario: number, token: string) => void;
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") as Role;
    const savedUser = localStorage.getItem("userName");
    const savedId = localStorage.getItem("userId");
    // El token lo intentamos recuperar del estado o cookie si fuera necesario
    // Por simplicidad, aquí lo manejamos desde el login
    
    if (savedRole && savedUser) {
      setRole(savedRole);
      setUsername(savedUser);
      setIdUsuario(Number(savedId));
    }
    setLoading(false);
  }, []);

  const setUserData = (newRole: Role, newUser: string, newId: number, newToken: string) => {
    setRole(newRole);
    setUsername(newUser);
    setIdUsuario(newId);
    setToken(newToken);

    // Guardar en LocalStorage (lo no sensible)
    localStorage.setItem("userRole", newRole || "");
    localStorage.setItem("userName", newUser || "");
    localStorage.setItem("userId", String(newId));

    // Guardar en Cookies (lo sensible para el Middleware)
    setCookie("authToken", newToken);
    setCookie("userRole", newRole || "");
  };

  const logout = () => {
    setRole(null);
    setUsername(null);
    setIdUsuario(null);
    setToken(null);
    localStorage.clear();
    deleteCookie("authToken");
    deleteCookie("userRole");
    window.location.href = "/login";
  };

  return (
    <UserContext.Provider value={{ role, username, id_usuario: idUsuario, token, setUserData, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de UserProvider");
  return context;
};