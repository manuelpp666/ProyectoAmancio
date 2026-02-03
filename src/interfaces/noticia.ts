export interface NoticiaCreate {
  titulo: string;
  contenido: string;
  id_autor: number;
  categoria: string; // Usamos el tipo de contenido como categoría
  imagen_portada_url: string | null;
}

export interface NoticiaResponse extends NoticiaCreate {
  id_noticia: number;
  fecha_publicacion: string;
  activo: boolean;
}