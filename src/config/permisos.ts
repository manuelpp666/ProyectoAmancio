/**
 * Catálogo de permisos del panel de administración.
 *
 * Es la única lista de qué puede tocar un administrador. Está desglosada por
 * apartado → pestaña → subpestaña, igual que la navegación real, y de aquí
 * salen tanto los checkboxes de Gestión de Personal como los candados que
 * esconden cada pestaña y cada botón.
 *
 * Tiene un espejo en el servidor: ProyectoAmancio-Backend/app/core/util/
 * permisos.py. Al añadir una pestaña o una acción hay que añadirla en los dos
 * sitios; si solo se hace aquí, al guardar el servidor la descarta.
 *
 * ACCIONES
 *   Una pestaña puede llevar `acciones`: agregar, editar y/o eliminar, solo las
 *   que esa pantalla tiene de verdad. Entonces se guarda como
 *   { ver, agregar, editar, eliminar } en vez de como un booleano. `ver` es la
 *   casilla de siempre (entrar a la pestaña) y sin ella no vale ninguna acción.
 *   El servidor comprueba las acciones: esconder un botón aquí es solo para
 *   que no se ofrezca lo que luego se va a rechazar.
 */

export type Accion = "agregar" | "editar" | "eliminar";

export const ACCIONES: Accion[] = ["agregar", "editar", "eliminar"];

export const NOMBRE_ACCION: Record<Accion, string> = {
  agregar: "Agregar",
  editar: "Editar",
  eliminar: "Eliminar",
};

export interface NodoPermiso {
  /** Clave con la que se guarda en la base (no cambiarla a la ligera) */
  id: string;
  label: string;
  hijos?: NodoPermiso[];
  /** Acciones que se pueden permitir por separado en esta pestaña */
  acciones?: Accion[];
}

const TODAS: Accion[] = ["agregar", "editar", "eliminar"];

export const CATALOGO_PERMISOS: NodoPermiso[] = [
  { id: "panel_control", label: "Dashboard" },

  {
    id: "gestion_estudiantes",
    label: "Gestión de Estudiantes",
    hijos: [
      // Agregar = registrar o reincorporar; eliminar = retirar del colegio.
      { id: "estudiantes", label: "Estudiantes", acciones: TODAS },
      { id: "postulantes", label: "Solicitudes de Admisión", acciones: ["editar"] },
      { id: "renovaciones", label: "Renovaciones de Matrícula", acciones: ["editar"] },
      { id: "verano", label: "Inscripciones de Verano", acciones: ["editar"] },
      { id: "notas", label: "Notas Finales" },
      { id: "asistencia", label: "Reporte de Asistencia" },
      { id: "faltas", label: "Catálogo de Faltas", acciones: TODAS },
    ],
  },

  {
    id: "gestion_personal",
    label: "Gestión de Personal",
    hijos: [
      // Eliminar = dar de baja (y volver a habilitar).
      { id: "admin", label: "Administradores", acciones: TODAS },
      { id: "docente", label: "Docentes", acciones: TODAS },
      { id: "auxiliar", label: "Auxiliares", acciones: TODAS },
      { id: "psicologo", label: "Psicólogos", acciones: TODAS },
    ],
  },

  {
    id: "tramites_finanzas",
    label: "Trámites y Finanzas",
    hijos: [
      { id: "config", label: "Tarifario / Trámites", acciones: ["agregar", "editar"] },
      { id: "solicitudes", label: "Atención de Solicitudes", acciones: ["editar"] },
      { id: "tipos_pagos", label: "Tipos de Pagos", acciones: TODAS },
      { id: "recaudacion", label: "Caja y Recaudación", acciones: TODAS },
      { id: "conciliacion", label: "Conciliación BCP", acciones: ["agregar", "editar"] },
    ],
  },

  {
    id: "academico",
    label: "Cursos y Materias",
    hijos: [
      { id: "estructura", label: "Estructura Escolar", acciones: TODAS },
      { id: "horarios", label: "Gestión de Horarios", acciones: TODAS },
      { id: "docentes", label: "Asignación de Docentes", acciones: TODAS },
      { id: "estudiantes", label: "Asignación de Estudiantes", acciones: ["editar"] },
      { id: "cursos", label: "Gestión de Cursos", acciones: TODAS },
    ],
  },

  {
    id: "contenido_web",
    label: "Contenido Web",
    hijos: [
      {
        id: "info_general",
        // La clave se queda como está: es la que está guardada en la base de
        // cada administrador. Solo cambia el nombre que se lee.
        label: "Editor Web",
        // Cada sección es, en sí misma, el permiso de editarla.
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
      { id: "noticias", label: "Noticias", acciones: TODAS },
      { id: "calendario", label: "Calendario Anual", acciones: TODAS },
    ],
  },

  { id: "chatbot", label: "Gestionar Chatbot", acciones: ["agregar", "eliminar"] },
  { id: "mensajeria", label: "Mensajería" },
  { id: "seguridad", label: "Seguridad de las cuentas", acciones: ["editar"] },
];

export type Permisos = Record<string, unknown>;

const esAccion = (clave: string): clave is Accion => (ACCIONES as string[]).includes(clave);

/**
 * Hijos de un nodo a efectos de guardar y contar. Una pestaña con acciones se
 * guarda como si tuviera las hojas { ver, agregar, editar, eliminar }.
 */
export const hijosDe = (nodo: NodoPermiso): NodoPermiso[] | undefined => {
  if (nodo.hijos?.length) return nodo.hijos;
  if (nodo.acciones?.length) {
    return [
      { id: "ver", label: "Ver" },
      ...nodo.acciones.map((a) => ({ id: a, label: NOMBRE_ACCION[a] })),
    ];
  }
  return undefined;
};

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
 *   tieneAcceso(p, "gestion_estudiantes", "faltas")            → puede entrar
 *   tieneAcceso(p, "gestion_estudiantes", "faltas", "agregar") → puede agregar
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
    const nodo = actual as Permisos;
    // Una acción exige también poder entrar a la pestaña
    if (esAccion(clave) && nodo.ver === false) return false;
    const siguiente = nodo[clave];
    if (siguiente === undefined) return true; // sin configurar = permitido
    actual = siguiente;
  }
  // La pestaña con acciones se "ve" según su casilla `ver`
  if (actual && typeof actual === "object" && "ver" in (actual as Permisos)) {
    return (actual as Permisos).ver !== false;
  }
  return algunoActivo(actual);
};

/** Objeto con todo el catálogo en true: lo que recibe un administrador nuevo. */
export const permisosCompletos = (nodos: NodoPermiso[] = CATALOGO_PERMISOS): Permisos => {
  const salida: Permisos = {};
  for (const nodo of nodos) {
    const hijos = hijosDe(nodo);
    salida[nodo.id] = hijos ? permisosCompletos(hijos) : true;
  }
  return salida;
};

/** Rama entera en false. */
export const apagar = (nodos: NodoPermiso[]): Permisos => {
  const salida: Permisos = {};
  for (const nodo of nodos) {
    const hijos = hijosDe(nodo);
    salida[nodo.id] = hijos ? apagar(hijos) : false;
  }
  return salida;
};

/** Sin `ver` no hay acciones: se apagan para no dejar un permiso escondido. */
const coherente = (nodo: NodoPermiso, valor: Permisos): Permisos => {
  if (!nodo.acciones?.length || valor.ver !== false) return valor;
  const salida = { ...valor };
  for (const a of nodo.acciones) salida[a] = false;
  return salida;
};

/**
 * Completa lo guardado con el catálogo actual. Respeta lo que ya estaba
 * decidido y da por activado lo que nunca se configuró. Una pestaña guardada
 * como `true` de antes de existir las acciones las conserva todas.
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
    const hijos = hijosDe(nodo);

    if (!hijos) {
      salida[nodo.id] = guardado === undefined ? true : guardado === true;
      continue;
    }

    // Una rama guardada como booleano se propaga entera a sus hijos
    if (guardado === false) {
      salida[nodo.id] = apagar(hijos);
    } else if (guardado === true || guardado === undefined) {
      salida[nodo.id] = permisosCompletos(hijos);
    } else {
      salida[nodo.id] = coherente(nodo, normalizar(guardado, hijos));
    }
  }
  return salida;
};

/**
 * Marca o desmarca un nodo. Al desmarcar un apartado se desmarcan sus
 * pestañas, y al marcarlo se vuelven a marcar todas: es lo que espera quien
 * usa la casilla del título para abrir o cerrar un módulo completo.
 *
 * En una pestaña con acciones: marcar una acción marca también `ver` (no se
 * puede agregar en una pestaña que no se ve), y quitar `ver` quita las
 * acciones.
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
  const hijos = hijosDe(nodo);

  if (resto.length === 0) {
    return {
      ...permisos,
      [clave]: hijos ? (valor ? permisosCompletos(hijos) : apagar(hijos)) : valor,
    };
  }

  const actual = comoObjeto(permisos[clave]) ?? permisosCompletos(hijos ?? []);

  if (nodo.acciones?.length && resto.length === 1) {
    const [hoja] = resto;
    let siguiente: Permisos = { ...actual, [hoja]: valor };
    if (hoja === "ver" && !valor) siguiente = coherente(nodo, siguiente);
    if (hoja !== "ver" && valor) siguiente.ver = true;
    return { ...permisos, [clave]: siguiente };
  }

  return {
    ...permisos,
    [clave]: establecer(actual, resto, valor, hijos ?? []),
  };
};

/** Cuántas casillas de una rama están activas, para el contador del panel. */
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
