// src/context/UserContext.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type Role = "estudiante" | "docente" | "admin" | null;

interface UserContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null); // Aquí se guardará el rol
  return (
    <UserContext.Provider value={{ role, setRole }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser debe usarse dentro de UserProvider");
  return context;
};