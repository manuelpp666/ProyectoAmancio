"use client";
import { usePermisos } from "@/src/hooks/usePermisos";
import { sesionCaducada } from "@/src/lib/api";
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
    if (loading || permitido) return;
    // Quedarse sin permisos y perder la sesión se parecen desde aquí: en los
    // dos casos no hay nada guardado que consultar. Pero no son lo mismo, y
    // mandar a /prohibido a quien simplemente ha estado una hora sin tocar
    // nada le dice que no tiene acceso a algo que sí es suyo. Cuando la sesión
    // ha caducado, la capa de red ya está llevándolo al login: aquí no se
    // estorba.
    if (sesionCaducada()) return;
    router.push("/prohibido");
  }, [loading, permitido, router]);

  if (loading) return <div>Cargando...</div>;
  if (!permitido) return null;

  return <>{children}</>;
};
