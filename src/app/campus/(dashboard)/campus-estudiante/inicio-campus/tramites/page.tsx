"use client";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/src/context/userContext";
import { toast } from "sonner";
import {
  BookOpen,
  ArrowLeftRight,
  CreditCard,
  FileText
} from "lucide-react";
import Link from 'next/link';

export default function Page() {

  const { id_usuario } = useUser();
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [alumno, setAlumno] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Cargar datos del alumno
  const fetchAlumnoData = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/alumnos/alumnos/usuario/${id_usuario}`);
      const data = await res.json();
      setAlumno(data);
      fetchPagos(data.id_alumno);
    } catch (e) {
      setIsLoading(false);
    }
  }, [id_usuario]);

  // 2. Cargar pagos (Pendientes e Historial)
  const fetchPagos = async (id_alumno: number) => {
    try {
      // Es recomendable tener dos endpoints o un filtro en el front
      const [resPendientes, resHistorial] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/alumnos/${id_alumno}/deudas`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/finance/pagos/historial/${id_alumno}`)
      ]);

      setPendientes(await resPendientes.json());
      setHistorial(await resHistorial.json());
    } catch (e) {
      toast.error("Error al cargar los pagos");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (id_usuario) fetchAlumnoData();
  }, [id_usuario, fetchAlumnoData]);

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-6">

        {/* Título */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#701C32] mb-1">Trámites y Pagos</h1>
          <p className="text-slate-500">Gestiona las pensiones y documentos administrativos.</p>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Pendiente</p>
              <h2 className="text-3xl font-black text-[#701C32]">
                S/ {pendientes.reduce((acc, p) => acc + Number(p.monto_total), 0).toFixed(2)}
              </h2>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl">
              <CreditCard className="text-orange-500 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Pagos Realizados</p>
              <h2 className="text-3xl font-black text-slate-700">{historial.length}</h2>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <FileText className="text-green-500 w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Tablas (Ocupando ancho completo) */}
        <div className="space-y-8">
          {/* Tabla Pendientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <ArrowLeftRight className="text-orange-500 w-5 h-5" />
                PENSIONES PENDIENTES
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Fecha Venc.</th>
                    <th className="px-6 py-4">Concepto</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Saldo</th>
                    <th className="px-6 py-4 text-right">Mora</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendientes.map((pago) => (
                    <tr key={pago.id_pago} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700">{new Date(pago.fecha_vencimiento).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{pago.concepto}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${pago.mora > 0 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                          {pago.mora > 0 ? "Vencido" : "Por Vencer"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">{Number(pago.monto).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-red-500 font-bold">{Number(pago.mora).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right font-black">S/ {Number(pago.monto_total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <FileText className="text-green-500 w-5 h-5" />
                HISTORIAL DE PAGOS
              </h3>
              {historial.length !== 0 && (
                <Link href="/campus/campus-estudiante/inicio-campus/tramites/historial" className="w-full">
                  <button className="text-xs font-bold text-slate-400 hover:text-[#701C32] transition-colors uppercase tracking-wider">Ver todo el historial</button>
                </Link>
              )}


            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">

                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Fecha Pago</th>
                    <th className="px-6 py-4">Concepto</th>
                    <th className="px-6 py-4">Nro Operación</th>
                    <th className="px-6 py-4 text-right">Importe</th>
                    <th className="px-6 py-4 text-center">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {historial.slice(0, 5).map((pago) => (
                    <tr key={pago.id_pago} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500">{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-medium">{pago.concepto}</td>
                      <td className="px-6 py-4 font-mono text-xs">{pago.codigo_operacion_bcp}</td>
                      <td className="px-6 py-4 text-right font-black">S/ {Number(pago.monto_total).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                          <BookOpen className="text-[#093E7A] w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 italic">No hay historial de pagos disponible.</td>
                    </tr>
                  )}
                </tbody>
              </table>


            </div>
          </div>
        </div>
      </div>
    </div>

  );
}