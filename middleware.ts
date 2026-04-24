import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export default auth((request) => {
  const isLoggedIn = !!request.auth?.user;
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith('/trips') || pathname.startsWith('/profile');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (!isLoggedIn && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/trips', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/trips/:path*', '/profile/:path*', '/login', '/signup']
};
