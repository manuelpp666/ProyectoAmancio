// src/components/utils/AnioSelector.tsx
interface Props {
  value: string;
  onChange: (val: string) => void;
  anios: any[];
  loading?: boolean;
}

export const AnioSelector = ({ value, onChange, anios, loading }: Props) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-bold text-gray-400 uppercase">Año Académico:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 px-3 outline-none cursor-pointer min-w-[140px]"
      >
        {loading && <option value="">Cargando...</option>}
        {!loading && anios.map((anio) => (
          <option key={anio.id_anio_escolar} value={anio.id_anio_escolar}>
            {anio.id_anio_escolar} ({anio.tipo})
          </option>
        ))}
      </select>
    </div>
  );
};