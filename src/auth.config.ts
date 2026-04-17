import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

/**
 * Edge-safe Auth.js config.
 *
 * This file is imported by `middleware.ts` and therefore must not depend on
 * Node-only APIs (Prisma, bcrypt, the database, etc.). The Credentials
 * provider and the Prisma adapter live in `src/auth.ts`, which is only
 * loaded from Node runtimes.
 */
export const authConfig = {
  pages: {
    signIn: '/login'
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const authenticatedOnly =
        pathname.startsWith('/trips') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/api/trips') ||
        pathname.startsWith('/api/profile') ||
        pathname.startsWith('/api/stripe/setup-intent') ||
        pathname.startsWith('/api/payment-methods');

      if (authenticatedOnly) {
        return isLoggedIn;
      }

      // Public pages plus /login and /signup – if user is already
      // signed in, bounce them away from the auth pages.
      if (
        isLoggedIn &&
        (pathname === '/login' || pathname === '/signup')
      ) {
        return Response.redirect(new URL('/trips', request.nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  trustHost: true
} satisfies NextAuthConfig;
