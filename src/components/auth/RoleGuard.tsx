"use client";
import { usePermisos } from "@/src/hooks/usePermisos";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  modulo: string;
  subModulo?: string;
}

export const RoleGuard = ({ children, modulo, subModulo }: Props) => {
  const { tienePermiso, loading } = usePermisos();
  const router = useRouter();

  useEffect(() => {
    // Solo actuamos cuando loading es false
    if (!loading) {
      const permisoConcedido = tienePermiso(modulo, subModulo);
      if (!permisoConcedido) {
        router.push("/prohibido");
      }
    }
  }, [loading, modulo, subModulo, router, tienePermiso]);

  if (loading) return <div>Cargando...</div>;
  if (!tienePermiso(modulo, subModulo)) return null;

  return <>{children}</>;
};