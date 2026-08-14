/**
 * Catálogo de permisos del panel de administración.
 *
 * Es la única lista de qué puede tocar un administrador. Está desglosada por
 * apartado → pestaña → subpestaña, igual que la navegación real, y de aquí
 * salen tanto los checkboxes de Gestión de Personal como los candados que
 * esconden cada pestaña.
 *
 * Al añadir una pestaña nueva al panel basta con añadirla aquí.
 */

export interface NodoPermiso {
  /** Clave con la que se guarda en la base (no cambiarla a la ligera) */
  id: string;
  label: string;
  hijos?: NodoPermiso[];
}

export const CATALOGO_PERMISOS: NodoPermiso[] = [
  { id: "panel_control", label: "Dashboard" },

  {
    id: "gestion_estudiantes",
    label: "Gestión de Estudiantes",
    hijos: [
      { id: "estudiantes", label: "Estudiantes" },
      { id: "postulantes", label: "Solicitudes de Admisión" },
      { id: "renovaciones", label: "Renovaciones de Matrícula" },
      { id: "verano", label: "Inscripciones de Verano" },
      { id: "notas", label: "Notas Finales" },
    ],
  },

  {
    id: "gestion_personal",
    label: "Gestión de Personal",
    hijos: [
      { id: "admin", label: "Administradores" },
      { id: "docente", label: "Docentes" },
      { id: "auxiliar", label: "Auxiliares" },
      { id: "psicologo", label: "Psicólogos" },
    ],
  },

  {
    id: "tramites_finanzas",
    label: "Trámites y Finanzas",
    hijos: [
      { id: "config", label: "Tarifario / Trámites" },
      { id: "solicitudes", label: "Atención de Solicitudes" },
      { id: "tipos_pagos", label: "Tipos de Pagos" },
      { id: "recaudacion", label: "Caja y Recaudación" },
      { id: "conciliacion", label: "Conciliación BCP" },
    ],
  },

  {
    id: "academico",
    label: "Cursos y Materias",
    hijos: [
      { id: "estructura", label: "Estructura Escolar" },
      { id: "horarios", label: "Gestión de Horarios" },
      { id: "docentes", label: "Asignación de Docentes" },
      { id: "estudiantes", label: "Asignación de Estudiantes" },
      { id: "cursos", label: "Gestión de Cursos" },
    ],
  },

  {
    id: "contenido_web",
    label: "Contenido Web",
    hijos: [
      {
        id: "info_general",
        label: "Información General",
        // Las secciones editables dentro de la pestaña de información general
        hijos: [
          { id: "inicio", label: "Inicio" },
          { id: "login", label: "Inicio de Sesión" },
          { id: "nosotros", label: "Sobre Nosotros" },
          { id: "docentes", label: "Docentes" },
          { id: "calendario", label: "Calendario" },
          { id: "noticias", label: "Noticias" },
          { id: "admision", label: "Admisión" },
          { id: "footer", label: "Footer" },
        ],
      },
      { id: "noticias", label: "Noticias" },
      { id: "calendario", label: "Calendario Anual" },
    ],
  },

  { id: "chatbot", label: "Gestionar Chatbot" },
  { id: "mensajeria", label: "Mensajería" },
  { id: "seguridad", label: "Seguridad de las cuentas" },
];

export type Permisos = Record<string, unknown>;

/** Convierte el JSON guardado a objeto, tolerando que llegue como texto. */
export const comoObjeto = (permisos: unknown): Permisos | null => {
  if (!permisos) return null;
  if (typeof permisos === "string") {
    try {
      return JSON.parse(permisos) as Permisos;
    } catch {
      return null;
    }
  }
  return typeof permisos === "object" ? (permisos as Permisos) : null;
};

/** ¿Hay algún true en cualquier rama de este valor? */
const algunoActivo = (valor: unknown): boolean => {
  if (typeof valor === "boolean") return valor;
  if (valor && typeof valor === "object") {
    return Object.values(valor as Permisos).some(algunoActivo);
  }
  return false;
};

/**
 * ¿Tiene acceso a esta ruta del catálogo?
 *
 * Una clave ausente cuenta como permitida: así una pestaña nueva no deja
 * fuera a quien ya tenía sus permisos guardados de antes. Al guardar desde el
 * panel se escribe el objeto completo, y a partir de ahí solo entra lo marcado.
 */
export const tieneAcceso = (permisos: unknown, ...ruta: string[]): boolean => {
  const obj = comoObjeto(permisos);
  if (!obj) return false;
  if (obj.all === true) return true; // super administrador

  let actual: unknown = obj;
  for (const clave of ruta) {
    if (typeof actual === "boolean") return actual; // rama cortada más arriba
    if (!actual || typeof actual !== "object") return false;
    const siguiente = (actual as Permisos)[clave];
    if (siguiente === undefined) return true; // sin configurar = permitido
    actual = siguiente;
  }
  return algunoActivo(actual);
};

/** Objeto con todo el catálogo en true: lo que recibe un administrador nuevo. */
export const permisosCompletos = (nodos: NodoPermiso[] = CATALOGO_PERMISOS): Permisos => {
  const salida: Permisos = {};
  for (const nodo of nodos) {
    salida[nodo.id] = nodo.hijos?.length ? permisosCompletos(nodo.hijos) : true;
  }
  return salida;
};

/**
 * Completa lo guardado con el catálogo actual. Respeta lo que ya estaba
 * decidido y da por activado lo que nunca se configuró.
 */
export const normalizar = (
  permisos: unknown,
  nodos: NodoPermiso[] = CATALOGO_PERMISOS
): Permisos => {
  const obj = comoObjeto(permisos) ?? {};
  const todo = obj.all === true;
  const salida: Permisos = {};

  for (const nodo of nodos) {
    const guardado = todo ? true : obj[nodo.id];

    if (!nodo.hijos?.length) {
      salida[nodo.id] = guardado === undefined ? true : guardado === true;
      continue;
    }

    // Una rama guardada como booleano se propaga entera a sus hijos
    if (guardado === false) {
      salida[nodo.id] = apagar(nodo.hijos);
    } else if (guardado === true || guardado === undefined) {
      salida[nodo.id] = permisosCompletos(nodo.hijos);
    } else {
      salida[nodo.id] = normalizar(guardado, nodo.hijos);
    }
  }
  return salida;
};

/** Rama entera en false. */
export const apagar = (nodos: NodoPermiso[]): Permisos => {
  const salida: Permisos = {};
  for (const nodo of nodos) {
    salida[nodo.id] = nodo.hijos?.length ? apagar(nodo.hijos) : false;
  }
  return salida;
};

/**
 * Marca o desmarca un nodo. Al desmarcar un apartado se desmarcan sus
 * pestañas, y al marcarlo se vuelven a marcar todas: es lo que espera quien
 * usa la casilla del título para abrir o cerrar un módulo completo.
 */
export const establecer = (
  permisos: Permisos,
  ruta: string[],
  valor: boolean,
  nodos: NodoPermiso[] = CATALOGO_PERMISOS
): Permisos => {
  const [clave, ...resto] = ruta;
  const nodo = nodos.find((n) => n.id === clave);
  if (!nodo) return permisos;

  if (resto.length === 0) {
    return {
      ...permisos,
      [clave]: nodo.hijos?.length
        ? (valor ? permisosCompletos(nodo.hijos) : apagar(nodo.hijos))
        : valor,
    };
  }

  const actual = comoObjeto(permisos[clave]) ?? permisosCompletos(nodo.hijos ?? []);
  return {
    ...permisos,
    [clave]: establecer(actual, resto, valor, nodo.hijos ?? []),
  };
};

/** Cuántas pestañas de una rama están activas, para el contador del panel. */
export const contarCasillas = (
  permisos: Permisos,
  ruta: string[]
): { activas: number; total: number } => {
  let actual: unknown = permisos;
  for (const clave of ruta) {
    if (!actual || typeof actual !== "object") return { activas: 0, total: 0 };
    actual = (actual as Permisos)[clave];
  }

  const hojas: boolean[] = [];
  const recorrer = (v: unknown) => {
    if (typeof v === "boolean") hojas.push(v);
    else if (v && typeof v === "object") Object.values(v as Permisos).forEach(recorrer);
  };
  recorrer(actual);

  return { activas: hojas.filter(Boolean).length, total: hojas.length };
};

/** Estado visual de una casilla con hijos: todo, nada o a medias. */
export const estadoCasilla = (
  permisos: Permisos,
  ruta: string[]
): "todo" | "nada" | "parcial" => {
  let actual: unknown = permisos;
  for (const clave of ruta) {
    if (!actual || typeof actual !== "object") return "nada";
    actual = (actual as Permisos)[clave];
  }
  if (typeof actual === "boolean") return actual ? "todo" : "nada";
  if (!actual || typeof actual !== "object") return "nada";

  const hojas: boolean[] = [];
  const recorrer = (v: unknown) => {
    if (typeof v === "boolean") hojas.push(v);
    else if (v && typeof v === "object") Object.values(v as Permisos).forEach(recorrer);
  };
  recorrer(actual);

  if (hojas.every(Boolean)) return "todo";
  if (hojas.every((h) => !h)) return "nada";
  return "parcial";
};
