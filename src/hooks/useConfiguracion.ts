// src/hooks/useConfiguracion.ts
import { useState, useEffect } from 'react';

export const useConfiguracion = (seccion: string) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/configuracion/${seccion}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConfig(); }, [seccion]);

  const updateField = (clave: string, valor: string) => {
    setData(prev => {
      const exists = prev.find(i => i.clave === clave);
      if (exists) return prev.map(i => i.clave === clave ? { ...i, valor } : i);
      return [...prev, { clave, valor, seccion }];
    });
  };

  return { data, updateField, loading, refresh: fetchConfig };
};