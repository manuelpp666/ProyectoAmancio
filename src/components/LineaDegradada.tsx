export function Degradado() {
  return (
    <div className="flex items-center w-full h-[30px]">
      {/* Barra negra izquierda */}
      <div className="w-1 h-full bg-[#1a1a1a]"></div>
      
      {/* Degradado principal - Ocupa todo el espacio restante */}
      <div 
        className="flex-grow h-full"
        style={{
          background: 'linear-gradient(to right, #701C32, #093E7A)'
        }}
      ></div>
      
      {/* Barra negra derecha */}
      <div className="w-1 h-full bg-[#1a1a1a]"></div>
    </div>
  );
}