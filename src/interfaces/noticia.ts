export interface Noticia {
  id_noticia: number;
  titulo: string;
  contenido: string;
  id_autor: number;
  categoria: string; // Usamos el tipo de contenido como categoría
  imagen_portada_url: string | null;
  /** Galería, en el orden en que se subieron. La primera es la portada.
   *  Null en las noticias anteriores a la galería y en las de video. */
  imagenes?: string[] | null;
  fecha_publicacion: string;
  activo: boolean;

}

export interface NoticiaCreate {
  titulo: string;
  contenido: string;
  id_autor: number;
  categoria: string; // Usamos el tipo de contenido como categoría
  imagen_portada_url: string | null;
  imagenes?: string[] | null;
}

export interface NoticiaResponse extends NoticiaCreate {
  id_noticia: number;
  fecha_publicacion: string;
  activo: boolean;
}