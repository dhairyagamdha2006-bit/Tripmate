import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import {
  hashPassword,
  isLegacyHash,
  verifyPassword
} from '@/lib/auth/password';
import { authConfig } from '@/auth.config';

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: update
} = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers,
    Credentials({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail }
        });

        // Always run verifyPassword to avoid leaking whether the email
        // exists through response-time side channels.
        const dummyHash = '$2b$12$abcdefghijklmnopqrstuuQXHzW5n9L9zq3x3qxJ8oY0fY0bYq6z4yW';
        const hash = user?.passwordHash ?? dummyHash;
        const ok = await verifyPassword(password, hash);

        if (!user || !ok) return null;

        // Legacy `salt:scrypt` hashes are upgraded to bcrypt on first
        // successful login so users migrate transparently.
        if (user.passwordHash && isLegacyHash(user.passwordHash)) {
          const upgraded = await hashPassword(password);
          await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: upgraded }
          });
        }

        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' '),
          image: user.image ?? null
        };
      }
    })
  ],
  events: {
    async linkAccount({ user }) {
      // Ensure the locally-required `firstName`/`lastName` are populated
      // when a user signs in via Google for the first time. NextAuth only
      // writes `name` by default, so we split it into first/last for the
      // schema. If we ever need to evolve this, we can also persist
      // `image` and `emailVerified` here.
      const existing = await prisma.user.findUnique({
        where: { id: user.id as string }
      });
      if (!existing) return;
      if (existing.firstName && existing.lastName) return;

      const fullName = existing.name ?? user.name ?? '';
      const parts = fullName.split(' ').filter(Boolean);
      const firstName = parts.shift() ?? 'Traveler';
      const lastName = parts.join(' ') || 'Tripmate';

      await prisma.user.update({
        where: { id: user.id as string },
        data: {
          firstName: existing.firstName || firstName,
          lastName: existing.lastName || lastName,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date()
        }
      });
    }
  }
});
