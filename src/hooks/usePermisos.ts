// src/hooks/usePermisos.ts
import { useUser } from "@/src/context/userContext";
import { tieneAcceso } from "@/src/config/permisos";

export const usePermisos = () => {
  const { role, permisos, loading } = useUser();

  /**
   * ¿Puede entrar a este punto del panel?
   *
   * Acepta la ruta del catálogo con tantos niveles como haga falta:
   *   tienePermiso("academico")
   *   tienePermiso("academico", "horarios")
   *   tienePermiso("contenido_web", "info_general", "inicio")
   *
   * La lógica (incluido qué pasa con una clave sin configurar) vive en
   * src/config/permisos.ts, para que el panel y los checkboxes que los
   * editan usen exactamente la misma regla.
   */
  const tienePermiso = (...ruta: string[]): boolean => {
    if (loading) return false;
    if (!role || !permisos) return false;
    return tieneAcceso(permisos, ...ruta);
  };

  return { tienePermiso, loading };
};
