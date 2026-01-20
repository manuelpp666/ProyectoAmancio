import Link from 'next/link';

export default function HistorialPagos() {
  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen flex">


      <div className="max-w-[1600px] mx-auto space-y-6 pb-8">


        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-primary mb-1">Historial de Pagos Completo</h1>
              <p className="text-slate-500">Consulta el detalle de todas tus transacciones realizadas.</p>
            </div>
            <Link href="/campus-estudiante/inicio-campus/tramites" className="w-full">
              <button className="flex items-center gap-2 text-sm font-bold text-secondary hover:underline">
                <span className="material-symbols-outlined text-lg">arrow_back</span>
                Volver a Trámites
              </button>
            </Link>

          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Desde</label>
                  <input className="w-full border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary" type="date" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Hasta</label>
                  <input className="w-full border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary" type="date" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Concepto de Pago</label>
                  <select className="w-full border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary">
                    <option>Todos los conceptos</option>
                    <option>Pensión Mensual</option>
                    <option>Matrícula</option>
                    <option>Reserva de Vacante</option>
                    <option>Derecho de Examen</option>
                    <option>Materiales</option>
                  </select>
                </div>
                <div>
                  <button className="w-full bg-primary text-white py-2 px-4 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-lg">filter_alt</span>
                    Aplicar Filtros
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4">Fecha de Pago</th>
                    <th className="px-6 py-4">Concepto</th>
                    <th className="px-6 py-4">Nro. de Operación</th>
                    <th className="px-6 py-4">Método de Pago</th>
                    <th className="px-6 py-4 text-right">Importe (S/)</th>
                    <th className="px-6 py-4 text-center">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-medium">15/01/2026</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Matrícula Escolar 2026</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">TR-9982312</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-lg">credit_card</span>
                        Tarjeta Visa
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black">450.00</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 hover:bg-red-50 rounded-full transition-colors group">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">picture_as_pdf</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-medium">12/12/2025</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Reserva de Vacante 2026</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">TR-9972100</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-lg">qr_code_2</span>
                        Yape
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black">250.00</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 hover:bg-red-50 rounded-full transition-colors group">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">picture_as_pdf</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-medium">01/11/2025</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Cuota APAFA 2026</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">TR-9965401</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-lg">account_balance</span>
                        Transferencia BCP
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black">50.00</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 hover:bg-red-50 rounded-full transition-colors group">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">picture_as_pdf</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-medium">05/10/2025</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Pensión Mensual 09 - 2025</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">TR-9954322</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-lg">credit_card</span>
                        Tarjeta Visa
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black">300.00</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 hover:bg-red-50 rounded-full transition-colors group">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">picture_as_pdf</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600 font-medium">05/09/2025</td>
                    <td className="px-6 py-4 font-bold text-slate-800">Pensión Mensual 08 - 2025</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">TR-9941098</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-lg">payments</span>
                        Efectivo (Agente)
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black">300.00</td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 hover:bg-red-50 rounded-full transition-colors group">
                        <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">picture_as_pdf</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
              <p className="text-xs text-slate-500 font-medium">Mostrando 5 de 42 transacciones</p>
              <div className="flex items-center gap-2">
                <button className="p-2 border border-slate-200 rounded hover:bg-white transition-colors disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-lg leading-none">chevron_left</span>
                </button>
                <button className="px-3 py-1 bg-primary text-white text-xs font-bold rounded">1</button>
                <button className="px-3 py-1 text-slate-600 hover:bg-white text-xs font-bold rounded">2</button>
                <button className="px-3 py-1 text-slate-600 hover:bg-white text-xs font-bold rounded">3</button>
                <span className="text-slate-400 text-xs">...</span>
                <button className="px-3 py-1 text-slate-600 hover:bg-white text-xs font-bold rounded">9</button>
                <button className="p-2 border border-slate-200 rounded hover:bg-white transition-colors">
                  <span className="material-symbols-outlined text-lg leading-none">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button className="bg-white border border-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">print</span>
              Imprimir Reporte
            </button>
            <button className="bg-secondary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">download</span>
              Descargar Historial (Excel)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}