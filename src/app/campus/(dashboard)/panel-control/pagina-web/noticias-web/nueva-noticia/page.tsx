"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NoticiaForm } from "@/src/components/Noticia/FormulatioNoticia";
import { NoticiaCreate } from "@/src/interfaces/noticia";
import { toast } from 'sonner';
import { useRouter } from "next/navigation";
import { useUser } from "@/src/context/userContext";
import { apiFetch } from "@/src/lib/api";
import { RoleGuard } from '@/src/components/auth/RoleGuard';


export default function CrearNoticiaPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { id_usuario, loading: userLoading } = useUser();
  const handlePublicar = async (noticiaPayload: NoticiaCreate) => {
    // 3. Validar que tengamos el ID del autor
    if (!id_usuario) {
      toast.error("No se pudo identificar al autor. Por favor, inicia sesión de nuevo.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Enviando noticia al servidor...");

    try {

      const payloadConAutor = {
        ...noticiaPayload,
        id_autor: id_usuario
      };
      const response = await apiFetch(`/web/noticias/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadConAutor),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.detail || "Error al registrar la noticia");
      }

      toast.success("¡Noticia publicada exitosamente!", { id: toastId });
      router.push("/campus/panel-control/pagina-web/noticias-web"); // Redirigir al listado tras el éxito
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error inesperado", { id: toastId });
    } finally {
      setLoading(false);
    }
  };
  if (userLoading) return <div className="p-10 text-center">Cargando sesión...</div>;
  return (
    <RoleGuard modulo="contenido_web" subModulo="noticias">
    
    <div className="h-full bg-[#F8FAFC] flex flex-col overflow-hidden">
      {/* Header Superior */}
      {/* min-h-16 en vez de h-16: en móvil el título y su subtítulo necesitan
          dos líneas, y con la altura fija se recortaban. */}
      <header className="min-h-16 bg-white border-b border-gray-100 px-4 md:px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/campus/panel-control/pagina-web/noticias-web" className="w-9 h-9 shrink-0 flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#093E7A] shrink-0">post_add</span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">Crear Nueva Noticia</h1>
              <p className="text-[11px] text-gray-400 leading-tight">Redacta y publica una noticia para la página web</p>
            </div>
          </div>
        </div>
      </header>

      {/* Componente de Formulario */}
      <NoticiaForm onSubmit={handlePublicar} loading={loading} />
    </div>
    </RoleGuard>
  );
}