import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIES = ['accessToken', 'refreshToken', 'baseToken'];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const { pathname, searchParams } = request.nextUrl;
  const isPublic = pathname === '/' || pathname === '/auth';
  const isLogout = pathname === '/auth' && searchParams.get('logout') === '1';

  if (isLogout) {
    const response = NextResponse.redirect(new URL('/auth', request.url));
    SESSION_COOKIES.forEach((name) => {
      response.cookies.set(name, '', { maxAge: 0, path: '/' });
    });
    return response;
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL('/workspace', request.url));
  }

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/auth', '/dashboard/:path*', '/workspace', '/onboarding'],
};
