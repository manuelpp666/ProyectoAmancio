"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/src/context/userContext";
import {

  BookOpen

} from "lucide-react";
import { toast } from "sonner";


export default function HistorialPage() {
  const { id_usuario } = useUser();
  const [historial, setHistorial] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (!id_usuario) return;

    const cargarDatos = async () => {
      try {
        // 1. Primero, obtenemos el alumno para tener su ID real
        const resAlumno = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alumnos/alumnos/usuario/${id_usuario}`);
        const alumno = await resAlumno.json();

        // Aseguramos que tenemos el ID antes de hacer la segunda llamada
        if (alumno && alumno.id_alumno) {
          // 2. Usamos el ID real obtenido (alumno.id_alumno)
          const resHistorial = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/pagos/historial/${alumno.id_alumno}`);

          if (!resHistorial.ok) throw new Error("Error al obtener historial");

          const data = await resHistorial.json();
          setHistorial(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Error al cargar los datos:", e);
        toast.error("No se pudo cargar el historial completo");
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, [id_usuario]);

  // Lógica de filtrado
  const historialFiltrado = (historial || []).filter((pago) =>
    pago.concepto?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black mb-6">Historial Completo de Pagos</h1>

      {/* Filtros */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por concepto..."
          className="w-full p-3 border rounded-xl"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Tabla completa */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Fecha Pago</th>
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4">Nro Operación</th>
                <th className="px-6 py-4 text-right">Importe</th>
                <th className="px-6 py-4 text-center">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {historialFiltrado.map((pago) => (
                <tr key={pago.id_pago} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-500 font-medium">
                    {new Date(pago.fecha_pago).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{pago.concepto}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{pago.codigo_operacion_bcp}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-800">S/ {Number(pago.monto_total).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <BookOpen className="text-[#093E7A] w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}