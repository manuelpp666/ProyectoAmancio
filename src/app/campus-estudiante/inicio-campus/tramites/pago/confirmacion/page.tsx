import Link from 'next/link';
import { 
  Check, 
  ClipboardCheck, 
  ReceiptText, 
  WalletCards, 
  CreditCard, 
  ShieldCheck, 
  ArrowLeft,
  ChevronRight 
} from "lucide-react";

export default function Page() {
  return (
    <div className="bg-[#F3F4F6] text-slate-800 min-h-screen flex">
      
      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto space-y-6 pb-8">
        
        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-[#701C32]">Proceso de Pago</h1>
              <p className="text-slate-500 mt-1">Selecciona el método de pago para tus cuotas.</p>
            </div>

            {/* Steps Visual Progress */}
            <div className="flex items-center mb-10 overflow-x-auto pb-4">
              <div className="flex items-center text-emerald-600">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  <Check className="w-5 h-5" strokeWidth={3} />
                </div>
                <span className="ml-2 font-bold whitespace-nowrap">Selección de Cuotas</span>
              </div>
              <div className="w-12 h-px bg-emerald-600 mx-4 shrink-0"></div>
              <div className="flex items-center text-[#093E7A]">
                <div className="w-8 h-8 rounded-full bg-[#093E7A] text-white flex items-center justify-center font-bold text-sm ring-4 ring-[#093E7A]/20">2</div>
                <span className="ml-2 font-black whitespace-nowrap">Método de Pago</span>
              </div>
              <div className="w-12 h-px bg-slate-300 mx-4 shrink-0"></div>
              <div className="flex items-center text-slate-400">
                <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center font-bold text-sm">3</div>
                <span className="ml-2 whitespace-nowrap font-medium">Confirmación</span>
              </div>
            </div>

            <div className="space-y-6">
              {/* Summary Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h2 className="font-bold text-lg flex items-center text-slate-700">
                    <ClipboardCheck className="mr-2 text-[#701C32] w-5 h-5" />
                    Resumen de Selección
                  </h2>
                  <span className="bg-blue-50 text-[#093E7A] text-xs font-bold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-tight">1 Cuota Pendiente</span>
                </div>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-slate-100 rounded-xl text-[#701C32]">
                        <ReceiptText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Pensión Abril 2026</p>
                        <p className="text-sm text-slate-500">Vencimiento: 15/04/2026</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total a pagar</p>
                      <p className="text-3xl font-black text-[#093E7A]">S/ 450.00</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Payment Methods Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h2 className="font-bold text-lg flex items-center text-slate-700">
                    <WalletCards className="mr-2 text-[#701C32] w-5 h-5" />
                    Elige tu método de pago
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    
                    {/* Card Payment Option */}
                    <button className="group p-6 border-2 border-slate-100 hover:border-[#093E7A]/30 rounded-2xl transition-all duration-300 text-left bg-white flex items-start space-x-4">
                      <div className="bg-slate-100 group-hover:bg-[#093E7A]/10 text-slate-400 group-hover:text-[#093E7A] p-3 rounded-xl transition-colors">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-600 group-hover:text-[#093E7A] text-lg transition-colors">Tarjeta Débito / Crédito</p>
                        <p className="text-xs text-slate-500 mt-1 mb-3">Aceptamos todas las tarjetas</p>
                        <div className="flex space-x-2 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                          <div className="h-6 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-[8px] font-bold text-blue-800 italic">VISA</div>
                          <div className="h-6 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-[8px] font-bold text-red-600 italic">MC</div>
                        </div>
                      </div>
                    </button>

                    {/* Yape Payment Option - Selected */}
                    <button className="group p-6 border-4 border-[#093E7A] rounded-2xl transition-all duration-300 text-left bg-blue-50/30 flex items-start space-x-4 relative">
                      <div className="absolute -top-3 -right-3 bg-[#093E7A] text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </div>
                      <div className="bg-[#742284] text-white p-3 rounded-xl flex items-center justify-center w-12 h-12 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                          <span className="text-[#742284] font-black text-[10px]">YAPE</span>
                        </div>
                      </div>
                      <div>
                        <p className="font-black text-[#742284] text-lg">Yape</p>
                        <p className="text-xs text-slate-500 mt-1">Pago rápido con código QR o número</p>
                        <p className="text-[10px] font-bold text-[#093E7A] mt-2 uppercase tracking-tighter">Seleccionado</p>
                      </div>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center text-slate-500 space-x-2 text-sm">
                      <ShieldCheck className="text-emerald-500 w-5 h-5" />
                      <span className="font-medium">Pago 100% seguro y encriptado</span>
                    </div>
                    <div className="flex flex-col-reverse md:flex-row items-center space-y-reverse space-y-4 md:space-y-0 md:space-x-6 w-full md:w-auto">
                      <Link href="/campus-estudiante/inicio-campus/tramites/pago" className="w-full">
                       <button className="text-slate-500 hover:text-[#701C32] font-bold text-sm transition-colors flex items-center gap-1 group/back">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover/back:-translate-x-1" />
                        Volver al paso anterior
                      </button>
                      </Link>
                      
                      <button className="w-full md:w-64 bg-[#093E7A] text-white py-4 px-8 rounded-xl font-black text-lg hover:bg-[#062d59] transition-all shadow-xl active:scale-95 duration-100 uppercase tracking-wide flex items-center justify-center gap-2">
                        PAGAR AHORA
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Safety Logos */}
              <div className="flex items-center justify-center space-x-8 py-4 opacity-30 grayscale">
                <div className="text-xs font-black">VISA</div>
                <div className="text-xs font-black">MASTERCARD</div>
                <div className="text-xs font-black">PCI-DSS</div>
                <div className="text-xs font-black">SSL</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}