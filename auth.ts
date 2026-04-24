import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db/prisma';
import { hashPassword, needsPasswordRehash, verifyPassword } from '@/lib/auth/password';
import { loginSchema } from '@/lib/validations/auth';

const providers: any[] = [
  Credentials({
    name: 'Email and password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    authorize: async (credentials) => {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) {
        return null;
      }

      const email = parsed.data.email.toLowerCase();
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user?.passwordHash) {
        return null;
      }

      const valid = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!valid) {
        return null;
      }

      if (needsPasswordRehash(user.passwordHash)) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash: await hashPassword(parsed.data.password)
          }
        });
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        image: user.image
      };
    }
  })
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 30
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login'
  },
  providers,
  callbacks: {
    session: ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.firstName = user.firstName;
        session.user.lastName = user.lastName;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.image = user.image;
      }
      return session;
    },
    signIn: async ({ account, profile, user }) => {
      if (account?.provider === 'google' && profile?.email) {
        const fullName = typeof profile.name === 'string' ? profile.name : user.name;
        const [firstName, ...rest] = (fullName ?? '').split(' ').filter(Boolean);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: user.firstName ?? firstName ?? undefined,
            lastName: user.lastName ?? (rest.length ? rest.join(' ') : undefined),
            name: fullName ?? user.name,
            emailVerified: new Date()
          }
        });
      }
      return true;
    }
  }
});
