// src/context/UserContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Role = "ALUMNO" | "DOCENTE" | "ADMIN" | null;

interface UserContextType {
  role: Role;
  username: string | null;
  id_usuario: number | null;
  setUserData: (role: Role, username: string, id_usuario: number) => void;
  logout: () => void;
  loading: boolean; // Útil para saber si estamos recuperando la sesión
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // EFECTO: Recuperar datos al cargar la app
  useEffect(() => {
    const savedRole = localStorage.getItem("userRole") as Role;
    const savedUser = localStorage.getItem("userName");
    const savedId = localStorage.getItem("userId");

    if (savedRole && savedUser) {
      setRole(savedRole);
      setUsername(savedUser);
      setIdUsuario(Number(savedId));
    }
    setLoading(false);
  }, []);

  const setUserData = (newRole: Role, newUser: string, newId: number) => {


    setRole(newRole);
    setUsername(newUser);
    setIdUsuario(newId);


    localStorage.setItem("userRole", newRole || "");
    localStorage.setItem("userName", newUser || "");
    localStorage.setItem("userId", String(newId));

  };

  const logout = () => {
    setRole(null);
    setUsername(null);
    setIdUsuario(null);
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
  };

  return (
    <UserContext.Provider value={{ role, username, id_usuario: idUsuario, setUserData, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de UserProvider");
  return context;
};