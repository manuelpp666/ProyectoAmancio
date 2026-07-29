// src/hooks/useConfiguracion.ts
import { useState, useEffect, useCallback, useMemo } from 'react';

export interface ConfigItem {
  clave: string;
  valor: string;
  seccion?: string;
}

// Construye un mapa clave -> valor para comparar estados sin importar el orden
const aMapa = (arr: ConfigItem[]): Record<string, string> => {
  const m: Record<string, string> = {};
  for (const i of arr) m[i.clave] = i.valor ?? "";
  return m;
};

export const useConfiguracion = (seccion: string) => {
  const [data, setData] = useState<ConfigItem[]>([]);
  // Copia "original" tal como vino del servidor, para detectar cambios y revertir
  const [baseline, setBaseline] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion/${seccion}`);
      if (!res.ok) {
        setData([]);
        setBaseline([]);
        return;
      }
      const json = await res.json();
      const arr = Array.isArray(json) ? json : [];
      setData(arr);
      setBaseline(arr);
    } catch {
      setData([]);
      setBaseline([]);
    } finally {
      setLoading(false);
    }
  }, [seccion]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const updateField = (clave: string, valor: string) => {
    setData(prev => {
      const exists = prev.find(i => i.clave === clave);
      if (exists) return prev.map(i => i.clave === clave ? { ...i, valor } : i);
      return [...prev, { clave, valor, seccion }];
    });
  };

  // ¿Hay cambios sin guardar respecto a lo que vino del servidor?
  const isDirty = useMemo(() => {
    const a = aMapa(baseline);
    const b = aMapa(data);
    const claves = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of claves) {
      if ((a[k] ?? "") !== (b[k] ?? "")) return true;
    }
    return false;
  }, [data, baseline]);

  // Descarta los cambios locales y vuelve al último estado guardado
  const revert = useCallback(() => setData(baseline), [baseline]);

  // Marca el estado actual como "guardado" (llamar tras un guardado exitoso)
  const commit = useCallback(() => setBaseline(data), [data]);

  // Devuelve el valor de una clave, o el valor por defecto si no existe/está vacío.
  const getVal = (clave: string, defecto = "") =>
    data.find(i => i.clave === clave)?.valor?.trim() || defecto;

  // Parsea un valor JSON de configuración con un valor por defecto seguro.
  const getJsonVal = <T,>(clave: string, defecto: T): T => {
    const val = data.find(i => i.clave === clave)?.valor;
    try {
      return val ? (JSON.parse(val) as T) : defecto;
    } catch {
      return defecto;
    }
  };

  return { data, updateField, loading, refresh: fetchConfig, getVal, getJsonVal, isDirty, revert, commit };
};
