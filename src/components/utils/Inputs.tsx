// src/components/utils/Inputs.tsx
import React from 'react';

interface InputsProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Inputs({ label, className = "", ...props }: InputsProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
        {...props}
      />
    </div>
  );
}