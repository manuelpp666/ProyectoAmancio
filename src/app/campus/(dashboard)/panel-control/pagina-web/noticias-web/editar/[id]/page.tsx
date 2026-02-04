"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { NoticiaForm } from "@/src/components/Noticia/FormulatioNoticia";
import { Noticia, NoticiaCreate } from "@/src/interfaces/noticia";
import { toast } from "sonner";

export default function EditarNoticiaPage() {
  const params = useParams();
  const router = useRouter();
  const [noticia, setNoticia] = useState<Noticia | undefined>(undefined);
  const [loadingFetch, setLoadingFetch] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 1. Cargar la noticia al iniciar
  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/${params.id}`);
        if (!response.ok) throw new Error("No se pudo obtener la noticia");
        const data = await response.json();
        setNoticia(data);
      } catch (error) {
        toast.error("Error al cargar la noticia");
        router.push("/noticias");
      } finally {
        setLoadingFetch(false);
      }
    };

    if (params.id) fetchNoticia();
  }, [params.id, router]);

  // 2. Función para manejar la actualización (PUT)
  const handleUpdate = async (noticiaPayload: NoticiaCreate) => {
    setIsUpdating(true);
    const toastId = toast.loading("Actualizando noticia...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noticiaPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al actualizar");
      }

      toast.success("Noticia actualizada correctamente", { id: toastId });
      router.push("/campus/panel-control/pagina-web/noticias-web");
      router.refresh(); // Refrescar datos de la lista
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loadingFetch) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Loader2 className="animate-spin text-[#093E7A] mb-4" size={40} />
        <p className="text-gray-500 font-bold animate-pulse">CARGANDO NOTICIA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F8] flex flex-col">
      {/* Header */}
      <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/campus/panel-control/pagina-web/noticias-web" className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Editar Noticia</h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-[#093E7A]">
              ID: #{params.id}
            </p>
          </div>
        </div>
      </header>

      {/* Formulario con datos iniciales */}
      <NoticiaForm 
        initialData={noticia} 
        onSubmit={handleUpdate} 
        loading={isUpdating} 
      />
    </div>
  );
}