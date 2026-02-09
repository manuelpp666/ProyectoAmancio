// @/src/components/utils/CalculadoraEdad.tsx

/**
 * Función pura para calcular la edad exacta
 */
export const calcularEdad = (fechaNacimiento: string | Date): number | null => {
    if (!fechaNacimiento) return null;
    
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const mes = hoy.getMonth() - cumple.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < cumple.getDate())) {
        edad--;
    }
    return edad;
};

/**
 * Componente visual para mostrar la edad con formato
 */
export default function EdadBadge({ fecha }: { fecha: string | Date }) {
    const edad = calcularEdad(fecha);
    
    if (edad === null) return null;

    return (
        <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold">
            {edad} AÑOS
        </span>
    );
}