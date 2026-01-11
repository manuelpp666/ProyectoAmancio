export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Contenedor de la Imagen Superior */}
      <div className="w-full h-64 md:h-80 bg-gray-100 border-b border-gray-300 flex items-center justify-center relative overflow-hidden">
        {/* El recuadro con la X simulando un placeholder de imagen */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-full h-full text-gray-300" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" />
            <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <span className="text-gray-400 z-10 font-medium">Espacio para Imagen/Banner</span>
      </div>

      {/* Contenido de Texto */}
      <div className="max-w-4xl mx-auto p-8 md:p-12 space-y-10">
        
        {/* Sección: Como institución */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Como institución:
          </h2>
          <p className="text-gray-600 leading-relaxed text-justify">
            Lorem ipsum dolor sit amet consectetur adipiscing elit aliquam sociis feugiat 
            lectus, curabitur condimentum curae donec turpis torquent ante metus venenatis 
            fames. Magnis ridiculus quam ornare imperdiet in sagittis, at cursus natoque apte 
            nt eleifend. Placerat nec varius ac nostra lacus leo proin egestas posuere senectu 
            s, imperdiet est scelerisque natoque non ultrices praesent ligula accumsan nisl.
          </p>
        </section>

        {/* Sección: Misión y Visión */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Misión y Visión
          </h2>
          <p className="text-gray-600 leading-relaxed text-justify">
            Lorem ipsum dolor sit amet consectetur adipiscing elit aliquam sociis feugiat 
            lectus, curabitur condimentum curae donec turpis torquent ante metus venenatis 
            fames. Magnis ridiculus quam ornare imperdiet in sagittis, at cursus natoque apte 
            nt eleifend. Placerat nec varius ac nostra lacus leo proin egestas posuere senectu 
            s, imperdiet est scelerisque natoque non ultrices praesent ligula accumsan nisl.
          </p>
        </section>

      </div>
    </main>
  );
}