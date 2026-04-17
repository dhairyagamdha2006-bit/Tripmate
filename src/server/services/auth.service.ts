import { userRepository } from '@/server/repositories/user.repository';
import { hashPassword } from '@/lib/auth/password';
import { createNotificationProvider } from '@/server/integrations/provider-factory';
import type { SignupInput } from '@/lib/validations/auth';

/**
 * Signup service.
 *
 * Login is handled by Auth.js — see `src/auth.ts`. This service exists
 * only to create the underlying user record, hash the password with
 * bcrypt, and fire the welcome email. The caller is expected to
 * subsequently call `signIn('credentials', ...)` from the client so
 * Auth.js can issue its session cookie.
 */
export const authService = {
  async signup(input: SignupInput) {
    const email = input.email.trim().toLowerCase();
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      // Generic message — never reveal whether the email is taken.
      throw new Error('Unable to create account. Please try again.');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await userRepository.createUser({
      email,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      name: `${input.firstName.trim()} ${input.lastName.trim()}`,
      passwordHash
    });

    // Fire-and-forget welcome email — never blocks account creation.
    const notificationProvider = createNotificationProvider();
    notificationProvider
      .send({
        toEmail: user.email,
        toName: `${user.firstName} ${user.lastName}`,
        subject: 'Welcome to Tripmate',
        templateData: {
          message: `Hi ${user.firstName}, welcome to Tripmate. You're all set to start planning your next trip.`,
          ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? ''}/trips/new`,
          ctaLabel: 'Plan your first trip'
        }
      })
      .catch((err) => console.error('[auth] Welcome email failed:', err));

    return { user };
  }
};
