// src/context/UserContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Role = "ALUMNO" | "DOCENTE" | "ADMIN" | null;

interface UserContextType {
  role: Role;
  username: string | null;
  setUserData: (role: Role, username: string) => void;
  logout: () => void;
  loading: boolean; // Útil para saber si estamos recuperando la sesión
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // EFECTO: Recuperar datos al cargar la app
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") as Role;
    const savedUser = localStorage.getItem("userName");
    
    if (savedRole && savedUser) {
      setRole(savedRole);
      setUsername(savedUser);
    }
    setLoading(false);
  }, []);

  const setUserData = (newRole: Role, newUser: string) => {
    setRole(newRole);
    setUsername(newUser);
    // Guardar en el navegador
    localStorage.setItem("userRole", newRole || "");
    localStorage.setItem("userName", newUser);
  };

  const logout = () => {
    setRole(null);
    setUsername(null);
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
  };

  return (
    <UserContext.Provider value={{ role, username, setUserData, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de UserProvider");
  return context;
};