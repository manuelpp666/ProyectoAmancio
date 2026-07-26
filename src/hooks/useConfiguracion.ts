// src/hooks/useConfiguracion.ts
import { useState, useEffect, useCallback } from 'react';

export interface ConfigItem {
  clave: string;
  valor: string;
  seccion?: string;
}

export const useConfiguracion = (seccion: string) => {
  const [data, setData] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion/${seccion}`);
      if (!res.ok) {
        setData([]);
        return;
      }
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
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

  return { data, updateField, loading, refresh: fetchConfig, getVal, getJsonVal };
};
