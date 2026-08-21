import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// En Next 16 este archivo se llama proxy.ts (antes middleware.ts) y la función
// exportada debe llamarse `proxy`.
//
// Ojo con lo que decide aquí: `userRole` es una cookie legible por el usuario,
// así que esta comprobación evita que alguien entre por error a un panel que no
// le toca, pero NO es la que protege los datos. De eso se encarga el backend,
// que valida el rol en cada endpoint contra el token firmado.
export function proxy(request: NextRequest) {
  const role = request.cookies.get('userRole')?.value;
  const { pathname } = request.nextUrl;

  // Qué se usa para saber si hay sesión, y por qué NO es `authToken`.
  //
  // `authToken` la emite la API, que vive en api.amanciovarona.com. Una cookie
  // sin atributo Domain es "host-only": el navegador solo la devuelve a ese
  // mismo host. Este código, en cambio, se ejecuta en el servidor de Next.js,
  // que es amanciovarona.com. Ahí `authToken` NUNCA llega.
  //
  // El efecto era un bucle silencioso: el login respondía 200 y guardaba su
  // cookie, el navegador iba a /campus/panel-control, aquí se leía `authToken`
  // como ausente y se devolvía al usuario a /campus. En pantalla parecía que el
  // botón de iniciar sesión no hacía nada.
  //
  // `userRole` sí sirve: la escribe el navegador en ESTE dominio al entrar y se
  // borra al salir. Y sigue valiendo `authToken` para cuando la web y la API
  // comparten dominio, donde sí es visible.
  const sesion = request.cookies.get('authToken')?.value ?? role;
  const token = sesion;

  // 1. CASO: No hay token (Sesión expirada o Logout)
  if (!token) {
    // Si intenta entrar a cualquier ruta de /campus que NO sea el login exacto
    if (pathname.startsWith('/campus') && pathname !== '/campus') {
      // Estaba dentro y ya no hay sesión: eso es que se le acabó el tiempo. Se
      // marca para que el login lo diga en vez de aparecer sin explicación.
      // (Al cerrar sesión a propósito se va directo a /campus, que no entra
      // por esta rama.)
      const response = NextResponse.redirect(
        new URL('/campus?sesion=caducada', request.url));
      // LIMPIEZA: Si no hay token, borramos el rol por si quedó "huérfano"
      response.cookies.delete('userRole');
      return response;
    }
    return NextResponse.next();
  }

  // 2. CASO: Hay token e intenta ir al Login (Evitar que vuelva a loguearse)
  //
  // Hace falta saber el rol, no solo que haya un token: sin rol se caía al
  // destino por defecto (el de alumno) y desde ahí al 403. Sin rol no hay a
  // dónde mandarlo, así que lo suyo es dejarle ver el login.
  if (pathname === '/campus' && role) {
    let dest = '/campus/campus-estudiante/inicio-campus'; // Default
    
    if (role === 'ADMIN') dest = '/campus/panel-control';
    if (role === 'DOCENTE') dest = '/campus/campus-docente/inicio-docente';
    if (role === 'AUXILIAR') dest = '/campus/campus-auxiliar/inicio';
    if (role === 'PSICOLOGO') dest = '/campus/campus-psicologo';
    
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 2 bis. CASO: hay rastro de sesión pero no sabemos de quién.
  //
  // Pasa siempre que la sesión caduca: `authToken` sigue puesta (el navegador
  // no sabe leer si el token de dentro venció; eso lo dice el backend al
  // usarlo), mientras que `userRole` ya la ha borrado la capa de red al recibir
  // el primer 401. Sin este corte se seguía a las comprobaciones de abajo, que
  // comparan un rol inexistente contra el que pide la ruta y siempre fallan:
  // al administrador se le echaba a /prohibido con un «no tienes los permisos
  // necesarios», cuando lo único que había pasado es que se le acabó la hora.
  //
  // Se limita a las rutas del campus: en local la web y la API comparten
  // `localhost` —las cookies no distinguen el puerto—, así que `authToken` sí
  // se ve aquí, y sin este límite una cookie caducada echaría del sitio público
  // a quien solo quería leer una noticia.
  if (!role && pathname.startsWith('/campus') && pathname !== '/campus') {
    const response = NextResponse.redirect(
      new URL('/campus?sesion=caducada', request.url));
    // Se retira también la cookie del token: es la que hacía creer que la
    // sesión seguía viva y la que provocaba este rebote.
    response.cookies.delete('authToken');
    return response;
  }

  // 3. CASO: Protección de Rutas por Rol (Evitar que un Alumno entre a Admin)
  // Usamos una lógica más limpia para evitar entrar a carpetas ajenas
  if (pathname.startsWith('/campus/panel-control') && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }
  
  if (pathname.startsWith('/campus/campus-docente') && role !== 'DOCENTE') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }
  
  if (pathname.startsWith('/campus/campus-auxiliar') && role !== 'AUXILIAR') {
    return NextResponse.redirect(new URL('/prohibido', request.url));
  }
  
  if (pathname.startsWith('/campus/campus-psicologo') && role !== 'PSICOLOGO') {
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