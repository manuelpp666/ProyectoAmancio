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
    return "/placeholder-news.svg";
  }
  return noticia.imagen_portada_url || "/placeholder-news.svg";
};

/** Cuántas imágenes admite una noticia. El backend recorta a este mismo número. */
export const MAXIMO_IMAGENES = 4;

/**
 * Las imágenes de una noticia, en orden, sea cual sea su antigüedad.
 *
 * Las noticias creadas con la galería traen `imagenes`. Las de antes solo
 * tienen `imagen_portada_url`, y se devuelven como una lista de una para que
 * el resto del código no tenga que distinguir los dos casos. Las de video no
 * tienen galería: ahí la portada es la URL de YouTube, no una imagen.
 */
export const imagenesDeNoticia = (noticia?: {
  categoria?: string;
  imagen_portada_url?: string | null;
  imagenes?: string[] | null;
} | null): string[] => {
  if (!noticia || noticia.categoria === "video") return [];
  const galeria = (noticia.imagenes ?? []).filter(Boolean);
  if (galeria.length) return galeria.slice(0, MAXIMO_IMAGENES);
  return noticia.imagen_portada_url ? [noticia.imagen_portada_url] : [];
};
