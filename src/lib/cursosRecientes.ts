// Registro local de los cursos que el alumno visita, para mostrarlos en el inicio
export interface CursoReciente {
  id_curso: number;
  nombre: string;
  docente: string;
  anio: string;
  visitado_en: number; // timestamp
}

const MAX_RECIENTES = 4;

const storageKey = (idUsuario: number | string) => `cursos_recientes_${idUsuario}`;

export function registrarCursoVisitado(
  idUsuario: number | string,
  curso: Omit<CursoReciente, "visitado_en">
) {
  if (typeof window === "undefined" || !idUsuario || !curso.id_curso) return;
  try {
    const previos = obtenerCursosRecientes(idUsuario).filter(
      (c) => c.id_curso !== curso.id_curso
    );
    const actualizados: CursoReciente[] = [
      { ...curso, visitado_en: Date.now() },
      ...previos,
    ].slice(0, MAX_RECIENTES);
    localStorage.setItem(storageKey(idUsuario), JSON.stringify(actualizados));
  } catch {
    // Si localStorage falla (modo incógnito, etc.) simplemente no registramos
  }
}

export function obtenerCursosRecientes(idUsuario: number | string): CursoReciente[] {
  if (typeof window === "undefined" || !idUsuario) return [];
  try {
    const raw = localStorage.getItem(storageKey(idUsuario));
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
