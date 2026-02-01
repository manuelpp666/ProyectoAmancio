"use client";
import { useEffect, useState, use } from "react";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserCheck } from "lucide-react";
import { Docente, DocenteCreate } from "@/src/interfaces/docente";
import { DocenteForm } from "@/src/components/Docente/FormularioDocente";

export default function EditarDocentePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params); // Obtenemos el ID de la URL
  const [docente, setDocente] = useState<Docente | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // 1. Cargar datos del docente al montar la página
  useEffect(() => {
    const fetchDocente = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docentes/${resolvedParams.id}`);
        if (!response.ok) throw new Error("No se pudo cargar el docente");
        const data = await response.json();
        setDocente(data);
      } catch (error) {
        toast.error("Error al obtener los datos del docente");
        router.push("/campus/panel-control/pagina-web/docentes-web");
      } finally {
        setFetching(false);
      }
    };
    fetchDocente();
  }, [resolvedParams.id, router]);

  // 2. Función para actualizar (PUT)
  const handleUpdate = async (data: DocenteCreate) => {
    setLoading(true);
    const toastId = toast.loading("Actualizando información...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/docentes/${resolvedParams.id}`, {
        method: "PUT", // O PATCH según tu API
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Error al actualizar");

      toast.success("¡Docente actualizado correctamente!", { id: toastId });
      
      // Opcional: Redirigir después de 1.5 segundos
      setTimeout(() => router.push("/campus/panel-control/pagina-web/docentes-web"), 1500);
      
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center font-bold">Cargando datos del docente...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Toaster position="top-right" richColors />
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header idéntico al de registro pero con título de edición */}
          <header className="h-20 border-b bg-white flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-6">
              <Link href="/campus/panel-control/pagina-web/docentes-web" className="...">
                <ArrowLeft size={24} />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#093E7A]/10 rounded-xl flex items-center justify-center text-[#093E7A]">
                  <UserCheck size={22} strokeWidth={2.5} />
                </div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Editar Docente</h2>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto py-12 px-6">
              {/* Usamos el MISMO formulario, pero pasando initialData */}
              {docente && (
                <DocenteForm 
                  initialData={docente} 
                  onSubmit={handleUpdate} 
                  loading={loading} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}