// src/components/utils/subidas.ts
//
// Subida de imágenes, videos y documentos al servidor del colegio.
//
// Sustituye a Cloudinary. Allí las imágenes dependían de una cuenta externa,
// y cuando esa cuenta se desactivó la página principal se quedó sin ninguna
// de un día para otro. Ahora se guardan en el backend (POST /multimedia/...).
//
// Cada función devuelve la URL COMPLETA del archivo, igual que devolvía
// Cloudinary, para que lo que se guarda en la base se pueda pintar tal cual
// en cualquier pantalla. Si algo falla LANZA un Error con un mensaje que se
// puede enseñar al usuario ("La imagen pesa 14 MB y el máximo son 10 MB"),
// en vez de devolver null y dejar que cada pantalla invente un "error al
// subir" genérico.

import { apiFetch, mensajeDeError } from "@/src/lib/api";

const MB = 1024 * 1024;

// Los mismos topes que el backend (app/modules/multimedia/service.py). Se
// comprueban también aquí para no hacer esperar a nadie a que termine de subir
// un archivo que el servidor va a rechazar.
export const LIMITE_IMAGEN_MB = 10;
export const LIMITE_VIDEO_MB = 25;
export const LIMITE_DOCUMENTO_MB = 10;

// Para el atributo `accept` de los <input type="file">. Solo filtra lo que el
// selector de archivos propone: quien decide es el servidor, que mira el
// contenido del archivo y no su nombre.
export const ACEPTA_IMAGEN = "image/jpeg,image/png,image/webp";
export const ACEPTA_MEDIA = `${ACEPTA_IMAGEN},video/mp4,video/webm`;
export const ACEPTA_DOCUMENTO = `${ACEPTA_IMAGEN},application/pdf`;

const urlCompleta = (ruta: string) =>
  /^https?:\/\//i.test(ruta) ? ruta : `${process.env.NEXT_PUBLIC_API_URL}${ruta}`;

async function subir(
  endpoint: string,
  file: File,
  limiteMB: number,
  nombre: string
): Promise<string> {
  if (file.size === 0) {
    throw new Error(`${nombre} está vacío.`);
  }
  if (file.size > limiteMB * MB) {
    throw new Error(
      `${nombre} pesa ${(file.size / MB).toFixed(1)} MB y el máximo son ${limiteMB} MB.`
    );
  }

  const formData = new FormData();
  formData.append("archivo", file);

  let res: Response;
  try {
    res = await apiFetch(endpoint, { method: "POST", body: formData });
  } catch {
    throw new Error("No hay conexión con el servidor. Revisa tu internet y vuelve a intentarlo.");
  }

  if (!res.ok) {
    throw new Error(await mensajeDeError(res, "No se pudo subir el archivo."));
  }

  const data = await res.json().catch(() => null);
  if (!data || typeof data.ruta !== "string") {
    throw new Error("El servidor no devolvió la dirección del archivo. Vuelve a intentarlo.");
  }
  return urlCompleta(data.ruta);
}

/** Imagen (JPG, PNG o WEBP). Se guarda comprimida y sin metadatos. Solo administradores. */
export const subirImagen = (file: File): Promise<string> =>
  subir("/multimedia/imagen", file, LIMITE_IMAGEN_MB, "La imagen");

/** Imagen o video (MP4/WEBM), para el fondo del inicio. Solo administradores. */
export const subirMedia = (file: File): Promise<string> =>
  file.type.startsWith("video/")
    ? subir("/multimedia/video", file, LIMITE_VIDEO_MB, "El video")
    : subirImagen(file);

/** Documento del formulario público de admisión: PDF o imagen. No requiere sesión. */
export const subirDocumentoAdmision = (file: File): Promise<string> =>
  subir("/multimedia/documento-admision", file, LIMITE_DOCUMENTO_MB, "El documento");

/** Mensaje de un error de subida, o el genérico si no trae ninguno. */
export const mensajeDeSubida = (error: unknown, porDefecto: string): string =>
  error instanceof Error && error.message ? error.message : porDefecto;
