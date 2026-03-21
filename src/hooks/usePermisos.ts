// src/hooks/usePermisos.ts
import { useUser } from "@/src/context/userContext";

export const usePermisos = () => {
  const { role, permisos,loading } = useUser();

  const tienePermiso = (modulo: string, subModulo?: string): boolean => {
    if (loading) return false;
    if (!role || !permisos) return false;

    // --- CORRECCIÓN CRÍTICA ---
    // Si 'permisos' llega como String por un error de parseo en el Contexto, lo convertimos.
    let permisosObj = permisos;
    if (typeof permisos === 'string') {
      try {
        permisosObj = JSON.parse(permisos);
      } catch (e) {
        console.error("Error al parsear permisos en el hook:", e);
        return false;
      }
    }
    // ---------------------------

    const dataModulo = (permisosObj as any)[modulo];

    // Si el módulo no existe en el objeto
    if (dataModulo === undefined) return false;

    // CASO A: Módulo simple (ej: gestion_personal)
    if (!subModulo) {
      if (typeof dataModulo === 'boolean') return dataModulo;
      
      // Si es un objeto (ej: academico), devolvemos true si tiene alguna sub-propiedad en true
      if (typeof dataModulo === 'object' && dataModulo !== null) {
        return Object.values(dataModulo).some(val => val === true);
      }
      return false;
    }

    // CASO B: Sub-módulo (ej: modulo='academico', subModulo='horarios')
    if (typeof dataModulo === 'object' && dataModulo !== null) {
      return !!dataModulo[subModulo];
    }

    return false;
  };

  return { tienePermiso, loading };
};