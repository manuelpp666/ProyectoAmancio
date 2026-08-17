// src/components/utils/AnioSelector.tsx
interface Props {
  value: string;
  onChange: (val: string) => void;
  anios: any[];
  loading?: boolean;
}

export const AnioSelector = ({ value, onChange, anios, loading }: Props) => {
  return (
    // En móvil la etiqueta se acorta a "Año:": completa ocupa unos 110px y,
    // sumada al desplegable, no dejaba sitio al resto de la barra.
    <div className="flex items-center gap-2 min-w-0">
      <label className="text-xs font-bold text-gray-400 uppercase shrink-0">
        <span className="sm:hidden">Año:</span>
        <span className="hidden sm:inline">Año Académico:</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-[#093E7A] focus:ring-[#093E7A] focus:border-[#093E7A] py-1 px-3 outline-none cursor-pointer min-w-0 sm:min-w-[140px]"
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