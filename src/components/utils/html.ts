import DOMPurify from "isomorphic-dompurify";

/** Convierte HTML en texto plano y lo recorta para usarlo como extracto seguro. */
export const extractoTexto = (html: string, max = 150): string => {
  if (!html) return "";
  const texto = html
    .replace(/<[^>]*>/g, " ") // quita etiquetas
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return texto.length > max ? texto.slice(0, max).trimEnd() + "…" : texto;
};

/** Sanitiza HTML de confianza-parcial (contenido del editor) antes de inyectarlo. */
export const sanitizarHtml = (html: string): string => {
  if (!html) return "";
  return DOMPurify.sanitize(html);
};
