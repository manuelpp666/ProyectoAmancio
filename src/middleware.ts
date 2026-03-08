import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // 1. SI NO HAY TOKEN:
  // Permitimos que entre a /campus (porque es el login), pero bloqueamos las sub-rutas
  if (!token && pathname.startsWith('/campus') && pathname !== '/campus') {
    return NextResponse.redirect(new URL('/campus', request.url));
  }

  // 2. SI YA HAY TOKEN e intenta entrar al login (/campus):
  // Lo mandamos a su panel correspondiente para que no se vuelva a loguear
  if (token && pathname === '/campus') {
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/campus/panel-control', request.url));
    if (role === 'DOCENTE') return NextResponse.redirect(new URL('/campus/campus-docente', request.url));
    // Por defecto a estudiante
    return NextResponse.redirect(new URL('/campus/campus-estudiante/inicio-campus', request.url));
  }

  
  // 3. PROTECCIÓN ESTRICTA DE RUTAS (IDOR preventer)
  
  // Solo ADMIN entra a panel-control
  if (pathname.startsWith('/campus/panel-control') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }

  // Solo DOCENTE  entra a campus-docente
  if (pathname.startsWith('/campus/campus-docente') && role !== 'DOCENTE') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }
  // Solo ALUMNO entra a campus-estudiante
  if (pathname.startsWith('/campus/campus-estudiante') && role !== 'ESTUDIANTE') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/campus/:path*', // Esto atrapa /campus y todas sus sub-rutas
  ],
};