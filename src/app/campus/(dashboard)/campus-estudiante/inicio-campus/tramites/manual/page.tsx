import { Landmark, Building2, Banknote, Clock, FileText, Download } from "lucide-react";

export default function Page() {
  return (
    <div className="bg-[#F3F4F6] text-slate-800 min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div>
          <h2 className="text-3xl font-black text-[#701C32] mb-2">Manual de Pagos y Trámites</h2>
          <p className="text-slate-600">Estimado padre de familia, cumpla con sus obligaciones financieras siguiendo los canales oficiales de la I.E. Amancio Varona.</p>
        </div>

        {/* Sección A - Pago BCP */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#093E7A] p-5 flex items-center gap-3">
            <Landmark className="text-white w-6 h-6" />
            <h3 className="text-white font-bold text-xl uppercase">A. Pago de Pensiones (BCP)</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="font-bold text-[#093E7A] mb-2">Medio Oficial: Banco de Crédito del Perú (BCP)</h4>
              <p className="text-sm text-slate-700">El pago se efectúa exclusivamente por el sistema financiero.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="font-bold text-sm mb-2">Vía Agente BCP</p>
                <p className="text-xs text-slate-600">Indique el servicio: <strong>Corporación educativa NEGOCIOS E INVERSIONES SERQUEN SAC</strong>. Brinde el DNI del menor y el monto a pagar.</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="font-bold text-sm mb-2">Vía Banca Móvil BCP</p>
                <p className="text-xs text-slate-600">En "Pagos de servicios", busque: <strong>Corporación educativa Montehermozo SAC</strong>. Ingrese el DNI del menor.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección B - Trámites en Secretaría */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-[#701C32] p-5 flex items-center gap-3">
            <FileText className="text-white w-6 h-6" />
            <h3 className="text-white font-bold text-xl uppercase">B. Atención en Secretaría</h3>
          </div>
          <div className="p-6">
            <p className="text-slate-700 mb-4">Para permisos, justificaciones de inasistencias o trámites administrativos, la atención es estrictamente <strong>presencial</strong>.</p>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg">
              <Clock className="text-[#701C32] w-6 h-6" />
              <div>
                <p className="font-bold">Horario de atención</p>
                <p className="text-sm text-slate-600">Acuda al plantel en los horarios de jornada escolar establecidos según el Nivel .</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">* Recuerde traer su DNI y los documentos probatorios necesarios para cualquier solicitud.</p>
          </div>
        </section>

      </div>
    </div>
  );
}