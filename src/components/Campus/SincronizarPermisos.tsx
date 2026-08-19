"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/src/context/userContext";

// Mínimo entre dos comprobaciones. Sin esta espera, pasear por el panel
// disparaba una petición por cada clic del menú; con ella, un recorrido rápido
// por seis apartados hace una sola.
const MS_ENTRE_COMPROBACIONES = 15000;

// Cuándo se comprobó por última vez. Va FUERA del componente, no en un `useRef`,
// a propósito: en desarrollo React monta los efectos dos veces y cada montaje
// estrenaba su propio ref, así que la espera no se aplicaba y cada carga hacía
// dos peticiones en lugar de una. Al vivir en el módulo, el dato se comparte
// entre montajes y se olvida al recargar la página, que es justo lo que interesa.
let ultimaComprobacion = 0;

/**
 * Mantiene al día los permisos de la sesión mientras el campus está abierto.
 *
 * EL PROBLEMA QUE RESUELVE
 * Los permisos llegaban únicamente en la respuesta del login y se guardaban
 * cifrados en `sessionStorage`. Al refrescar la página se releían de ahí, no
 * del servidor, así que a un administrador al que otro le acababa de cambiar
 * los permisos le seguía saliendo el menú antiguo —incluso pulsando F5— hasta
 * que cerraba la pestaña y volvía a entrar. Nadie tenía por qué adivinar eso.
 *
 * CUÁNDO PREGUNTA
 *   · Al entrar al campus.
 *   · Al cambiar de apartado.
 *   · Al volver a la pestaña después de tenerla en segundo plano, que es el
 *     caso típico: te avisan por teléfono de que ya tienes el permiso, vuelves
 *     al navegador y ahí está.
 *
 * No pinta nada y no bloquea nada: si el servidor no contesta, se sigue con los
 * permisos que ya había.
 *
 * OJO: esto es comodidad, no seguridad. Lo que decide de verdad quién entra a
 * cada sitio es el backend; estos permisos solo dibujan el menú.
 */
export function SincronizarPermisos() {
  const { refrescarPermisos, role, loading } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !role) return;

    const comprobar = () => {
      const ahora = Date.now();
      if (ahora - ultimaComprobacion < MS_ENTRE_COMPROBACIONES) return;
      ultimaComprobacion = ahora;
      refrescarPermisos();
    };

    comprobar();

    // Al volver a la pestaña. Se escucha `visibilitychange` y no `focus`
    // porque `focus` no se dispara al cambiar de pestaña dentro de la misma
    // ventana, que es justo lo que hace quien tiene el campus de fondo.
    const alVolver = () => {
      if (!document.hidden) comprobar();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => document.removeEventListener("visibilitychange", alVolver);
  }, [loading, role, pathname, refrescarPermisos]);

  return null;
}
