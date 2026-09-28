"use client";

/**
 * Aviso para una pantalla que es, entera, una acción (registrar un estudiante,
 * redactar una noticia...) cuando el administrador no tiene ese permiso.
 *
 * Se llega aquí escribiendo la dirección a mano o desde un enlace guardado: el
 * botón que lleva hasta esta pantalla ya no se le enseña. Sin este aviso vería
 * el formulario, lo rellenaría entero y el servidor se lo rechazaría al final.
 */

import Link from "next/link";
import { Lock } from "lucide-react";

export function SinPermiso({ accion, volverA, textoVolver = "Volver" }: {
  /** Qué no puede hacer, en minúsculas: "registrar estudiantes" */
  accion: string;
  volverA: string;
  textoVolver?: string;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#701C32]/10 text-[#701C32] flex items-center justify-center mx-auto mb-4">
          <Lock size={26} aria-hidden="true" />
        </div>
        <h2 className="text-lg font-black text-gray-800">No tienes permiso para {accion}</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Si lo necesitas para tu trabajo, pídeselo a quien administra los permisos del panel
          en Gestión de Personal.
        </p>
        <Link
          href={volverA}
          className="inline-flex items-center justify-center mt-6 px-6 py-2.5 rounded-xl bg-[#093E7A] hover:bg-[#072d5a] text-white text-sm font-bold transition-colors"
        >
          {textoVolver}
        </Link>
      </div>
    </div>
  );
}
