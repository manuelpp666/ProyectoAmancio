import { 
  Download, 
  Landmark, 
  Building2, 
  Banknote, 
  Wallet, 
  PiggyBank, 
  CreditCard, 
  Clock, 
  Smartphone, 
  ListOrdered, 
  QrCode, 
  FileText, 
  AlertTriangle,
  Menu 
} from "lucide-react";

export default function Page() {
  return (
    <div className="bg-[#F3F4F6] text-slate-800 min-h-screen flex">
      
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto space-y-6 pb-8">
        
        {/* Content */}
        <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-[#701C32] mb-2">Manual de Instrucciones de Pago</h2>
              <p className="text-slate-600">Estimado padre de familia, aquí encontrará las guías detalladas para realizar sus pagos de pensión de manera segura.</p>
            </div>
            <button className="bg-[#701C32] text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Download className="w-5 h-5" />
              Descargar PDF
            </button>
          </div>

          {/* Section A - Bank Payment */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#093E7A] p-5 flex items-center gap-3">
              <Landmark className="text-white w-6 h-6" />
              <h3 className="text-white font-bold text-xl uppercase tracking-wider">A. Pago Presencial y Bancario</h3>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Authorized Banks */}
              <div className="space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 text-[#701C32] font-bold mb-4">
                    <Building2 className="w-5 h-5" /> Bancos Autorizados
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-lg flex flex-col items-center text-center group hover:border-[#093E7A] transition-colors bg-slate-50">
                      <Banknote className="text-[#093E7A] w-8 h-8 mb-2" />
                      <p className="font-bold text-sm">BCP</p>
                      <p className="text-[10px] text-slate-500 uppercase">Banco de Crédito</p>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-lg flex flex-col items-center text-center group hover:border-[#093E7A] transition-colors bg-slate-50">
                      <Wallet className="text-[#093E7A] w-8 h-8 mb-2" />
                      <p className="font-bold text-sm">Interbank</p>
                      <p className="text-[10px] text-slate-500 uppercase">Global Net</p>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-lg flex flex-col items-center text-center group hover:border-[#093E7A] transition-colors bg-slate-50">
                      <PiggyBank className="text-[#093E7A] w-8 h-8 mb-2" />
                      <p className="font-bold text-sm">BBVA</p>
                      <p className="text-[10px] text-slate-500 uppercase">Continental</p>
                    </div>
                    <div className="p-4 border border-slate-100 rounded-lg flex flex-col items-center text-center group hover:border-[#093E7A] transition-colors bg-slate-50">
                      <CreditCard className="text-[#093E7A] w-8 h-8 mb-2" />
                      <p className="font-bold text-sm">Scotiabank</p>
                      <p className="text-[10px] text-slate-500 uppercase">Quiero Quiero</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Hours */}
              <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200">
                <h4 className="flex items-center gap-2 text-[#701C32] font-bold mb-4">
                  <Clock className="w-5 h-5" /> Horarios de Atención en Colegio
                </h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="font-medium text-slate-600">Lunes a Viernes</span>
                    <span className="bg-[#701C32] text-white text-xs px-3 py-1 rounded-full">08:00 AM - 04:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-200">
                    <span className="font-medium text-slate-600">Sábados</span>
                    <span className="bg-[#701C32] text-white text-xs px-3 py-1 rounded-full">09:00 AM - 01:00 PM</span>
                  </div>
                  <p className="text-sm text-slate-500 italic mt-4">
                    * Se recomienda asistir con su DNI y el código del alumno para agilizar el proceso en ventanilla.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section B - Yape Payment */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-[#093E7A] p-5 flex items-center gap-3">
              <Smartphone className="text-white w-6 h-6" />
              <h3 className="text-white font-bold text-xl uppercase tracking-wider">B. Pago vía Yape</h3>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Steps */}
              <div className="lg:col-span-2 space-y-6">
                <h4 className="flex items-center gap-2 text-[#701C32] font-bold mb-4">
                  <ListOrdered className="w-5 h-5" /> Pasos a seguir
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-lg bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-[#701C32] text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                    <p className="text-slate-700">Escanee el código QR que se muestra a la derecha desde su aplicación Yape.</p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-[#701C32] text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                    <p className="text-slate-700">Ingrese el monto exacto correspondiente a la pensión o trámite solicitado.</p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-slate-50">
                    <div className="w-8 h-8 rounded-full bg-[#701C32] text-white flex items-center justify-center font-bold flex-shrink-0">3</div>
                    <p className="text-slate-700">En la glosa o descripción, <strong>obligatoriamente</strong> escriba el nombre completo del alumno y el ciclo.</p>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-[#701C32]/10 border border-[#701C32]/20">
                    <div className="w-8 h-8 rounded-full bg-[#701C32] text-white flex items-center justify-center font-bold flex-shrink-0">4</div>
                    <p className="text-slate-700">Tome una captura de pantalla y envíela al WhatsApp de tesorería: <strong>+51 987 654 321</strong></p>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-8 text-center border-2 border-slate-200">
                <div className="mb-4 text-[#701C32] font-bold uppercase tracking-widest text-sm">Escanear Aquí</div>
                <div className="w-48 h-48 bg-white p-4 rounded-xl shadow-inner flex items-center justify-center mb-6">
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 border-4 border-slate-200 border-dashed animate-pulse"></div>
                    {/* Placeholder para QR - Se mantiene el img pero con icono de respaldo */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <QrCode className="w-20 h-20 text-slate-300" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-medium">CUENTA INSTITUCIONAL OFICIAL</p>
                <p className="text-sm font-bold text-slate-800 mt-1">Institución Educativa Campus</p>
              </div>
            </div>
          </section>

        </div>
      </div>

    </div>
  );
}