
export default function Home() {

  return (
    <main className="min-h-screen">
      {/* SECCIÓN NOTICIAS AMANCISTAS */}
      <section className="py-20 bg-white relative overflow-hidden">
        
        {/* 1. FRANJAS DE FONDO - Ajustadas para no chocar con la navegación */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {/* Franja fila 1 */}
          <div className="absolute w-full h-60 bg-[#701C32]" style={{ top: '250px' }}></div>
          {/* Franja fila 2 */}
          <div className="absolute w-full h-60 bg-[#701C32]" style={{ top: '640px' }}></div>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <h2 className="text-4xl font-black text-center text-gray-800 mb-20">
            Noticias Amancistas
          </h2>

          {/* Grilla de Noticias */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-32 gap-x-8">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="flex flex-col items-center">
                <div className="w-full aspect-[4/3] bg-white border border-gray-300 relative shadow-xl">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="absolute w-full h-[1px] bg-gray-500 rotate-[37deg]"></div>
                    <div className="absolute w-full h-[1px] bg-gray-500 -rotate-[37deg]"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 2. NAVEGACIÓN - Asegurada en zona blanca con mt-28 */}
          <div className="mt-28 flex items-center justify-center gap-6 font-bold text-gray-800 relative z-20">
            <button className="flex items-center gap-2 hover:text-colegio-blue transition-colors group">
              <span className="text-xl group-hover:-translate-x-1 transition-transform">«</span> 
              Anterior
            </button>
            <button className="flex items-center gap-2 hover:text-colegio-blue transition-colors group">
              Siguiente 
              <span className="text-xl group-hover:translate-x-1 transition-transform">»</span>
            </button>
          </div>

        </div>
      </section>
    </main>
  );
}