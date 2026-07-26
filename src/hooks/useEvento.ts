// @/src/hooks/useEvento.ts
import { useState, useEffect, useCallback } from 'react';
import { Evento } from '../interfaces/evento';

export function useEventos(tipo: 'actual' | 'todos' = 'actual') {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = tipo === 'actual' ? '/web/eventos/actual' : '/web/eventos/todos';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`);
      if (!response.ok) {
        setEventos([]);
        return;
      }
      const data = await response.json();
      setEventos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando eventos:", error);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  }, [tipo]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  return { eventos, loading, refetch: fetchEventos };
}