import {
    CheckSquare,
    WalletCards,
    CreditCard,
    ReceiptText,
    Info,
    ShieldCheck,
    ChevronRight
} from "lucide-react";
import Link from 'next/link';



export default function Page() {
    return (
        <div className="bg-[#F3F4F6] text-slate-800 min-h-screen flex">

            {/* Main Content */}
            <div className="max-w-[1600px] mx-auto space-y-6 pb-8">

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-6 lg:p-10">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-black text-[#701C32]">Proceso de Pago</h1>
                            <p className="text-slate-500 mt-1">Realiza el pago de tus pensiones de forma segura y rápida.</p>
                        </div>

                        {/* Steps Visual Guide */}
                        <div className="flex items-center mb-10 overflow-x-auto pb-4">
                            <div className="flex items-center text-[#093E7A]">
                                <div className="w-8 h-8 rounded-full bg-[#093E7A] text-white flex items-center justify-center font-bold text-sm">1</div>
                                <span className="ml-2 font-bold whitespace-nowrap">Selección de Cuotas</span>
                            </div>
                            <div className="w-12 h-px bg-slate-300 mx-4 shrink-0"></div>
                            <div className="flex items-center text-slate-400">
                                <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center font-bold text-sm">2</div>
                                <span className="ml-2 whitespace-nowrap font-medium">Método de Pago</span>
                            </div>
                            <div className="w-12 h-px bg-slate-300 mx-4 shrink-0"></div>
                            <div className="flex items-center text-slate-400">
                                <div className="w-8 h-8 rounded-full border-2 border-slate-300 flex items-center justify-center font-bold text-sm">3</div>
                                <span className="ml-2 whitespace-nowrap font-medium">Confirmación</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Pending Quotas */}
                                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                                        <h2 className="font-bold text-lg flex items-center text-slate-700">
                                            <CheckSquare className="mr-2 text-[#701C32] w-5 h-5" />
                                            Selecciona las cuotas pendientes
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    <th className="pb-4 w-10"></th>
                                                    <th className="pb-4">Concepto</th>
                                                    <th className="pb-4 text-center">Vencimiento</th>
                                                    <th className="pb-4 text-right">Monto (S/)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr className="group hover:bg-slate-50 transition-colors">
                                                    <td className="py-4">
                                                        <input defaultChecked className="rounded border-slate-300 text-[#701C32] focus:ring-[#701C32] h-5 w-5 cursor-pointer" type="checkbox" />
                                                    </td>
                                                    <td className="py-4">
                                                        <p className="font-bold text-slate-700">Pensión Abril 2026</p>
                                                        <p className="text-xs text-slate-500">Ciclo 2026-0</p>
                                                    </td>
                                                    <td className="py-4 text-center text-sm text-slate-600">15/04/2026</td>
                                                    <td className="py-4 text-right font-black text-slate-800">S/ 450.00</td>
                                                </tr>
                                                <tr className="group hover:bg-slate-50 transition-colors">
                                                    <td className="py-4">
                                                        <input className="rounded border-slate-300 text-[#701C32] focus:ring-[#701C32] h-5 w-5 cursor-pointer" type="checkbox" />
                                                    </td>
                                                    <td className="py-4">
                                                        <p className="font-bold text-slate-700">Pensión Mayo 2026</p>
                                                        <p className="text-xs text-slate-500">Ciclo 2026-0</p>
                                                    </td>
                                                    <td className="py-4 text-center text-sm text-slate-600">15/05/2026</td>
                                                    <td className="py-4 text-right font-black text-slate-800">S/ 450.00</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>

                                {/* Payment Methods */}
                                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50">
                                        <h2 className="font-bold text-lg flex items-center text-slate-700">
                                            <WalletCards className="mr-2 text-[#701C32] w-5 h-5" />
                                            Elige tu método de pago
                                        </h2>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button className="group p-6 border-2 border-[#093E7A]/10 hover:border-[#093E7A] rounded-2xl transition-all duration-300 text-left bg-blue-50/30 flex items-start space-x-4">
                                            <div className="bg-[#093E7A] text-white p-3 rounded-xl">
                                                <CreditCard className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-black text-[#093E7A] text-lg">Tarjeta Débito / Crédito</p>
                                                <p className="text-xs text-slate-500 mt-1 mb-3">Aceptamos todas las tarjetas</p>
                                                <div className="flex space-x-2">
                                                    <div className="h-6 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-[8px] font-bold text-blue-800 italic">VISA</div>
                                                    <div className="h-6 w-10 bg-white border border-slate-200 rounded flex items-center justify-center text-[8px] font-bold text-red-600 italic">MC</div>
                                                </div>
                                            </div>
                                        </button>
                                        <button className="group p-6 border-2 border-slate-200 hover:border-[#742284] rounded-2xl transition-all duration-300 text-left bg-white flex items-start space-x-4">
                                            <div className="bg-[#742284] text-white p-3 rounded-xl flex items-center justify-center w-12 h-12">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                                    <span className="text-[#742284] font-black text-[10px]">YAPE</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-black text-[#742284] text-lg">Yape</p>
                                                <p className="text-xs text-slate-500 mt-1">Pago rápido con código QR o número</p>
                                            </div>
                                        </button>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column - Summary */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-10 space-y-6">
                                    <div className="bg-[#701C32] text-white rounded-3xl p-8 shadow-xl shadow-[#701C32]/20">
                                        <h3 className="font-black text-xl mb-6 flex items-center">
                                            <ReceiptText className="mr-2 w-6 h-6" />
                                            Resumen de Pago
                                        </h3>
                                        <div className="space-y-4 mb-8">
                                            <div className="flex justify-between text-sm opacity-90">
                                                <span>Cuotas seleccionadas</span>
                                                <span className="font-bold">1</span>
                                            </div>
                                            <div className="flex justify-between text-sm opacity-90">
                                                <span>Subtotal</span>
                                                <span className="font-bold">S/ 450.00</span>
                                            </div>
                                            <div className="flex justify-between text-sm opacity-90">
                                                <span>Mora / Recargos</span>
                                                <span className="font-bold">S/ 0.00</span>
                                            </div>
                                            <div className="border-t border-white/20 pt-4 mt-4">
                                                <div className="flex justify-between items-end">
                                                    <span className="font-bold">Total a Pagar</span>
                                                    <span className="text-3xl font-black">S/ 450.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href="/campus/campus-estudiante/inicio-campus/tramites/pago/confirmacion" className="w-full">
                                            <button className="w-full bg-white text-[#701C32] py-4 rounded-xl font-black text-lg hover:bg-slate-100 transition-all shadow-lg active:scale-95 duration-100 flex items-center justify-center gap-2">
                                                CONFIRMAR PAGO
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </Link>
                                        <div className="flex items-center justify-center gap-2 mt-6 opacity-60">
                                            <ShieldCheck className="w-4 h-4" />
                                            <p className="text-[10px] text-center">
                                                SSL Pago Seguro
                                            </p>
                                        </div>
                                    </div>

                                    {/* Alert Section */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200">
                                        <h4 className="font-bold text-slate-700 mb-2 flex items-center text-sm">
                                            <Info className="text-amber-500 w-4 h-4 mr-2" />
                                            Importante
                                        </h4>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            Recuerde que los pagos realizados después de las 8:00 PM podrían procesarse al siguiente día hábil. Guarde su comprobante electrónico.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}