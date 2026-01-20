import { 
  Home, 
  BookOpen, 
  MessageSquare, 
  User, 
  ArrowLeftRight, 
  CreditCard, 
  FileText,   
  AlertCircle 
} from "lucide-react";
import Link from 'next/link';

export default function Page() {
  return (
    <div className="bg-[#F8FAFC] text-slate-800 min-h-screen flex">
      
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto space-y-6 pb-8">
        
        {/* Content */}
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-[#701C32] mb-1">Trámites y Pagos</h1>
            <p className="text-slate-500">Gestiona las pensiones y documentos administrativos de tus hijos.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Student Data */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <User className="text-[#701C32] w-5 h-5" />
                  <h2 className="font-bold text-lg">Datos del Estudiante</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">DNI</label>
                    <p className="font-bold text-slate-700">12345678</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Apellidos y Nombres</label>
                    <p className="font-bold text-slate-700">PUICON RIVERA, JOSE EMMANUEL WILFREDO</p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Escuela / Grado</label>
                    <p className="font-bold text-slate-700">SEXTO PRIMARIA A</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Año Académico</label>
                      <p className="font-bold text-slate-700">2026</p>
                    </div>
                    
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Pending Payments */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <ArrowLeftRight className="text-orange-500 w-5 h-5" />
                    PENSIONES PENDIENTES
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#701C32] px-3 py-1 bg-[#701C32]/10 rounded-full">3 vencidas</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
                        <th className="px-6 py-4">Fecha Venc.</th>
                        <th className="px-6 py-4">Concepto</th>
                        <th className="px-6 py-4 text-center">Estado</th>
                        <th className="px-6 py-4 text-right">Saldo (S/)</th>
                        <th className="px-6 py-4 text-right">Mora (S/)</th>
                        <th className="px-6 py-4 text-right">SubTotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">15/01/2026</td>
                        <td className="px-6 py-4">Cuota de Matrícula</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-black uppercase">Vencido</span>
                        </td>
                        <td className="px-6 py-4 text-right">450.00</td>
                        <td className="px-6 py-4 text-right text-red-500 font-bold">12.50</td>
                        <td className="px-6 py-4 text-right font-black">462.50</td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-700">05/02/2026</td>
                        <td className="px-6 py-4">Pensión Mensual 01</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-black uppercase">Por Vencer</span>
                        </td>
                        <td className="px-6 py-4 text-right">300.00</td>
                        <td className="px-6 py-4 text-right">0.00</td>
                        <td className="px-6 py-4 text-right font-black">300.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-red-50 flex items-center gap-3">
                  <AlertCircle className="text-red-600 w-4 h-4" />
                  <p className="text-xs text-red-700 font-medium italic">Tener en cuenta que llegada la fecha de vencimiento se anulará el cargo o se aplicará mora automática.</p>
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-slate-800 flex items-center gap-2">
                    <FileText className="text-green-500 w-5 h-5" />
                    HISTORIAL DE PAGOS
                  </h3>
                  <Link href="/campus-estudiante/inicio-campus/tramites/historial" className="w-full">
                  <button className="text-xs font-bold text-slate-400 hover:text-[#701C32] transition-colors uppercase tracking-wider">Ver todo el historial</button>
                  </Link>
                  
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
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-500">12/12/2025</td>
                        <td className="px-6 py-4 font-medium">Reserva de Vacante 2026</td>
                        <td className="px-6 py-4 font-mono text-xs">TR-9982312</td>
                        <td className="px-6 py-4 text-right font-black">250.00</td>
                        <td className="px-6 py-4 text-center">
                          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <BookOpen className="text-[#093E7A] w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-500">01/11/2025</td>
                        <td className="px-6 py-4 font-medium">Cuota APAFA</td>
                        <td className="px-6 py-4 font-mono text-xs">TR-9972100</td>
                        <td className="px-6 py-4 text-right font-black">50.00</td>
                        <td className="px-6 py-4 text-center">
                          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <BookOpen className="text-[#093E7A] w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}