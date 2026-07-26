export const getYouTubeID = (url: string): string | null => {
  if (!url) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Genera la URL de la miniatura de YouTube dado un ID.
 * Usa `hqdefault` porque siempre existe (a diferencia de `maxresdefault`).
 */
export const getYouTubeThumbnail = (id: string) => {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
};

/**
 * Devuelve la imagen de portada de una noticia.
 * Para videos genera la miniatura de YouTube (con fallback si el ID es inválido).
 * Para el resto usa la imagen de portada o un placeholder.
 */
export const getNoticiaImagen = (noticia: {
  categoria: string;
  imagen_portada_url?: string | null;
}): string => {
  if (noticia.categoria === "video") {
    const videoId = getYouTubeID(noticia.imagen_portada_url || "");
    if (videoId) return getYouTubeThumbnail(videoId);
    return "/placeholder-news.jpg";
  }
  return noticia.imagen_portada_url || "/placeholder-news.jpg";
};
