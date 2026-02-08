// src/components/utils/Inputs.tsx
import React, { ReactNode } from 'react';

interface InputsProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: ReactNode; // Agregamos la propiedad opcional
}

export default function Inputs({ label, icon, className = "", ...props }: InputsProps) {
  return (
    <div className="flex flex-col space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      
      <div className="relative flex items-center">
        {/* Renderizado del icono si existe */}
        {icon && (
          <div className="absolute left-4 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          {...props}
          className={`
            w-full bg-gray-50 border-gray-200 rounded-xl py-3 px-4 
            text-sm font-bold text-gray-700 
            focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] 
            transition-all placeholder:text-gray-300
            ${icon ? "pl-11" : "px-4"} 
            ${className}
          `}
        />
      </div>
    </div>
  );
}