import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Next.js lee todas las cookies disponibles (incluidas las HttpOnly)
  const token = request.cookies.get('authToken')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;
console.log(`Ruta: ${pathname} | Token detectado: ${!!token} | Rol: ${role}`);
  // 1. Si no hay token y quiere entrar a rutas protegidas
  if (!token && pathname.startsWith('/campus') && pathname !== '/campus') {
    return NextResponse.redirect(new URL('/campus', request.url));
  }

  // 2. Si hay token e intenta ir al Login, lo mandamos a su panel
  if (token && pathname === '/campus') {
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/campus/panel-control', request.url));
    if (role === 'DOCENTE') return NextResponse.redirect(new URL('/campus/campus-docente/inicio-docente', request.url));
    return NextResponse.redirect(new URL('/campus/campus-estudiante/inicio-campus', request.url));
  }

  // 3. Protección por Roles (IDOR)
  if (pathname.startsWith('/campus/panel-control') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }
  if (pathname.startsWith('/campus/campus-docente') && role !== 'DOCENTE') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }
  if (pathname.startsWith('/campus/campus-estudiante') && role !== 'ALUMNO') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/campus/:path*'],
};