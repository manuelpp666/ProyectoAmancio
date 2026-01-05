import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* HERO SECTION */}
      <section className="relative h-[400px] flex flex-col items-center justify-center text-center border-b border-dashed">
        <h1 className="text-5xl font-black text-gray-800">Frase de colegio</h1>
        <p className="text-xl text-gray-600 mt-2">Sub frase de colegio</p>
        <button className="mt-6 bg-colegio-blue text-white px-6 py-2 text-xs rounded">
          Nuestro contenido
        </button>
        {/* Líneas cruzadas del mockup (decorativo) */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden opacity-10">
          <div className="absolute w-full h-[1px] bg-black rotate-12"></div>
          <div className="absolute w-full h-[1px] bg-black -rotate-12"></div>
        </div>
      </section>

      {/* PROPUESTA EDUCATIVA */}
      <section className="py-16 px-10 text-center">
        <h2 className="text-3xl font-bold mb-8">Propuesta Educativa</h2>
        <div className="max-w-4xl mx-auto border-2 border-gray-200 p-10 relative">
          <h3 className="text-2xl font-bold">Científico</h3>
          <div className="h-40 flex items-center justify-center my-4 border border-dashed border-gray-300">
             <p className="text-gray-500 italic">Lorem ipsum texto ahsduaksgda</p>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            <span className="w-3 h-3 rounded-full border-2 border-black"></span>
            <span className="w-3 h-3 rounded-full border-2 border-black bg-black"></span>
            <span className="w-3 h-3 rounded-full border-2 border-black"></span>
            <span className="w-3 h-3 rounded-full border-2 border-black"></span>
          </div>
        </div>
      </section>

      {/* METODOLOGÍA POR NIVELES */}
      <section className="py-16 bg-white text-center">
        <h2 className="text-2xl font-bold mb-10">Conoce nuestra metodología por niveles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-10 max-w-6xl mx-auto">
          {["Nivel Primaria", "Nivel secundario", "Academia Pre"].map((nivel) => (
            <div key={nivel} className="flex flex-col items-center">
              <div className="w-full aspect-square border-2 border-gray-300 mb-4 relative flex items-center justify-center">
                 <div className="absolute inset-0 opacity-20 flex items-center justify-center">
                    <div className="w-full h-[1px] bg-black rotate-45 absolute"></div>
                    <div className="w-full h-[1px] bg-black -rotate-45 absolute"></div>
                 </div>
              </div>
              <p className="font-bold">{nivel}</p>
            </div>
          ))}
        </div>
      </section>

      {/* NOTICIAS AMANCISTAS */}
      <section className="py-16 border-t-8 border-colegio-blue">
        <h2 className="text-center text-2xl font-bold mb-10">Noticias Amancistas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-10 max-w-6xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video border-2 border-gray-300 relative">
               <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-black rotate-12 absolute"></div>
                  <div className="w-full h-[1px] bg-black -rotate-12 absolute"></div>
               </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-8">
          <button className="bg-colegio-blue text-white px-6 py-2 text-sm flex items-center gap-2">
            Más noticias <span>→</span>
          </button>
        </div>
      </section>
    </main>
  );
}