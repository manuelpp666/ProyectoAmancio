// src/hooks/usePermisos.ts
import { useUser } from "@/src/context/userContext";
import { tieneAcceso, Accion } from "@/src/config/permisos";

export const usePermisos = () => {
  const { role, permisos, loading } = useUser();

  /**
   * ¿Puede entrar a este punto del panel?
   *
   * Acepta la ruta del catálogo con tantos niveles como haga falta:
   *   tienePermiso("academico")
   *   tienePermiso("academico", "horarios")
   *   tienePermiso("contenido_web", "info_general", "inicio")
   *   tienePermiso("gestion_estudiantes", "faltas", "agregar")
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

  /**
   * Qué puede hacer en una pestaña: { agregar, editar, eliminar }.
   *
   *   const puede = acciones("gestion_estudiantes", "faltas");
   *   {puede.agregar && <button>Nueva falta</button>}
   *
   * Los permisos por acción son solo del panel de administración. Para
   * cualquier otro rol devuelve todo en true: si un componente se comparte
   * con docentes o auxiliares, no les esconde nada (lo que pueden hacer ellos
   * lo decide el servidor por su rol, como siempre).
   *
   * Esconder el botón es comodidad, no seguridad: el servidor rechaza la
   * acción igualmente si no está permitida.
   */
  const acciones = (...ruta: string[]): Record<Accion, boolean> => {
    if (!loading && role && role !== "ADMIN") {
      return { agregar: true, editar: true, eliminar: true };
    }
    return {
      agregar: tienePermiso(...ruta, "agregar"),
      editar: tienePermiso(...ruta, "editar"),
      eliminar: tienePermiso(...ruta, "eliminar"),
    };
  };

  return { tienePermiso, acciones, loading };
};
