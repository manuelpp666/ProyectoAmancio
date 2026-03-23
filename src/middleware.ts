import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // 1. CASO: No hay token (Sesión expirada o Logout)
  if (!token) {
    // Si intenta entrar a cualquier ruta de /campus que NO sea el login exacto
    if (pathname.startsWith('/campus') && pathname !== '/campus') {
      const response = NextResponse.redirect(new URL('/campus', request.url));
      // LIMPIEZA: Si no hay token, borramos el rol por si quedó "huérfano"
      response.cookies.delete('userRole');
      return response;
    }
    return NextResponse.next();
  }

  // 2. CASO: Hay token e intenta ir al Login (Evitar que vuelva a loguearse)
  if (pathname === '/campus') {
    let dest = '/campus/campus-estudiante/inicio-campus'; // Default
    if (role === 'ADMIN') dest = '/campus/panel-control';
    if (role === 'DOCENTE') dest = '/campus/campus-docente/inicio-docente';
    
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 3. CASO: Protección de Rutas por Rol (Evitar que un Alumno entre a Admin)
  // Usamos una lógica más limpia para evitar entrar a carpetas ajenas
  if (pathname.startsWith('/campus/panel-control') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }
  
  if (pathname.startsWith('/campus/campus-docente') && role !== 'DOCENTE') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }
  
  // Agregamos AUXILIAR y PSICOLOGO si ya los tienes en tu Type Role
  if (pathname.startsWith('/campus/campus-estudiante') && role !== 'ALUMNO') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Excluimos archivos estáticos y api para que el middleware no corra en cada imagen o fetch interno
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};