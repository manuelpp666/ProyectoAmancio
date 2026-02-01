import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const FormInput = ({ label, icon, ...props }: FormInputProps) => {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#093E7A] transition-colors">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-gray-50 border border-gray-200 rounded-xl py-3 ${
            icon ? 'pl-11' : 'px-4'
          } pr-4 text-sm font-bold text-gray-700 focus:ring-4 focus:ring-[#093E7A]/5 focus:border-[#093E7A] outline-none transition-all placeholder:text-gray-300`}
        />
      </div>
    </div>
  );
};

export default FormInput;