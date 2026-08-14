"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/src/context/userContext";
import { apiFetch } from "@/src/lib/api";

const PANTALLA = "/campus/perfil/cambiar-contrasena";

/**
 * Lleva a la pantalla de primer ingreso a quien entre al campus con algo
 * pendiente: la contraseña inicial sin cambiar o, sobre todo, sin correo.
 *
 * Hasta ahora esa comprobación vivía solo en el formulario de acceso, así que
 * únicamente la veía quien acababa de escribir su usuario y su contraseña.
 * Quien ya tenía la sesión abierta —al recargar, al volver con el navegador o
 * al entrar desde un marcador— llegaba a su panel sin que nadie le pidiera
 * nada. Y quien ya había cambiado su contraseña no volvía a pasar por ahí
 * nunca más, de modo que si no tenía correo no había forma de pedírselo.
 *
 * Vale para los cinco roles: el backend ya sabe dónde guarda el correo cada
 * uno (el del personal en su ficha, el del alumno en la de su apoderado).
 */
export function GuardiaPrimerIngreso() {
  const router = useRouter();
  const pathname = usePathname();
  const { username, role, loading } = useUser();

  // Una vez que el servidor confirma que no falta nada, se deja de preguntar.
  // Si falta algo NO se marca, para que el aviso vuelva a salir si alguien
  // esquiva la pantalla escribiendo una dirección a mano.
  const resueltoPara = useRef<string | null>(null);
  const consultando = useRef(false);

  useEffect(() => {
    if (loading || !role || !username) return;
    // La propia pantalla queda fuera: si no, se redirigiría a sí misma.
    if (pathname.startsWith(PANTALLA)) return;
    if (resueltoPara.current === username || consultando.current) return;

    let vigente = true;
    consultando.current = true;

    (async () => {
      try {
        const res = await apiFetch("/perfil/auth/primer-ingreso");
        if (!res.ok || !vigente) return;
        const estado = await res.json();
        if (!vigente) return;

        if (estado.debe_cambiar_password || estado.debe_registrar_correo) {
          router.replace(`${PANTALLA}?inicial=1`);
        } else {
          resueltoPara.current = username;
        }
      } catch {
        // Sin conexión no se bloquea a nadie: el campus se abre igual y la
        // comprobación se repetirá en la siguiente navegación.
      } finally {
        if (vigente) consultando.current = false;
      }
    })();

    return () => {
      vigente = false;
      consultando.current = false;
    };
  }, [loading, role, username, pathname, router]);

  return null;
}
