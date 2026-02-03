export const getYouTubeID = (url: string): string | null => {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Genera la URL de la miniatura de YouTube dado un ID.
 */
export const getYouTubeThumbnail = (id: string) => {
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
};