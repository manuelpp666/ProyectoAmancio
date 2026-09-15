// Utilidades para distinguir imágenes de videos a partir de su URL.
// Se usa en el fondo del hero, donde el mismo campo puede guardar una
// imagen o un video (por la extensión, o por /video/upload/ en las URLs
// antiguas de Cloudinary que aún queden guardadas).

const EXT_VIDEO = [".mp4", ".webm", ".ogg", ".ogv", ".mov", ".m4v"];

export function esVideo(url?: string | null): boolean {
  if (!url) return false;
  const limpia = url.split("?")[0].toLowerCase();
  if (limpia.includes("/video/upload/")) return true; // URLs antiguas de Cloudinary
  return EXT_VIDEO.some((ext) => limpia.endsWith(ext));
}
