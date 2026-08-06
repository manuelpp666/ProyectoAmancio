"use client";
import { usePermisos } from "@/src/hooks/usePermisos";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface Props {
  children: React.ReactNode;
  modulo: string;
  subModulo?: string;
  /** Tercer nivel del catálogo, para las pestañas que tienen subpestañas */
  subSubModulo?: string;
}

export const RoleGuard = ({ children, modulo, subModulo, subSubModulo }: Props) => {
  const { tienePermiso, loading } = usePermisos();
  const router = useRouter();

  // Ruta del catálogo sin los niveles que no se hayan indicado
  const ruta = [modulo, subModulo, subSubModulo].filter(Boolean) as string[];
  const permitido = tienePermiso(...ruta);

  useEffect(() => {
    // Solo actuamos cuando loading es false
    if (!loading && !permitido) {
      router.push("/prohibido");
    }
  }, [loading, permitido, router]);

  if (loading) return <div>Cargando...</div>;
  if (!permitido) return null;

  return <>{children}</>;
};
