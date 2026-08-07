import type { NextConfig } from "next";

// Cabeceras que el servidor manda en cada respuesta. Son la defensa que no
// depende de acordarse de nada al programar: valen para todas las páginas.
const cabecerasSeguridad = [
  // Nada de cargar el sitio dentro de un iframe ajeno (clickjacking).
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // El navegador respeta el tipo declarado y no "adivina" que un .txt es JS.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al salir del sitio no se filtra la ruta completa en el Referer: algunas
  // URLs del campus llevan identificadores.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No se usan cámara, micrófono ni geolocalización: se niegan de entrada.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Obliga a HTTPS durante un año. Solo tiene efecto sobre https, así que en
  // local es inofensiva.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Empaqueta el servidor con solo las dependencias que usa: la carpeta que se
  // sube pasa de cientos de MB a unas decenas.
  output: "standalone",

  // Comprime el HTML y el JSON que sirve Next.
  compress: true,

  // La cabecera delata la tecnología y versión sin aportar nada.
  poweredByHeader: false,

  images: {
    // Las imágenes del colegio se alojan en Cloudinary. Declararlo permite que
    // next/image las optimice en lugar de rechazarlas por ser de otro dominio.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: cabecerasSeguridad }];
  },
};

export default nextConfig;
