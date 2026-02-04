"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NoticiaForm } from "@/src/components/Noticia/FormulatioNoticia";
import { NoticiaCreate } from "@/src/interfaces/noticia";
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

export default function CrearNoticiaPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePublicar = async (noticiaPayload: NoticiaCreate) => {
    setLoading(true);
    const toastId = toast.loading("Enviando noticia al servidor...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/web/noticias/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noticiaPayload),
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

  return (
    <div className="min-h-screen bg-[#F6F7F8] flex flex-col">
      {/* Header Superior */}
      <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/noticias" className="p-2.5 hover:bg-gray-50 rounded-xl transition-colors text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Crear Nueva Noticia</h1>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Panel de Redacción</p>
          </div>
        </div>
      </header>

      {/* Componente de Formulario */}
      <NoticiaForm onSubmit={handlePublicar} loading={loading} />
    </div>
  );
}