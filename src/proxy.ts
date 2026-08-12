import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIES = ['accessToken', 'refreshToken', 'baseToken'];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));

  if (hasSession) {
    return NextResponse.redirect(new URL('/workspace', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/auth'],
};
