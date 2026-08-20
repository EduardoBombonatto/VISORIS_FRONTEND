import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/session-cookie';

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;
  const isPublic = pathname === '/' || pathname === '/auth';

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/auth', '/dashboard/:path*'],
};
