import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run middleware on everything except Next internals, static files,
  // and the Auth.js route itself.
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|share|.*\\..*).*)']
};

export default middleware;
