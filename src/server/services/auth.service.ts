import { userRepository } from '@/server/repositories/user.repository';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSessionForUser } from '@/lib/auth/session';
import { createNotificationProvider } from '@/server/integrations/provider-factory';
import type { LoginInput, SignupInput } from '@/lib/validations/auth';

export const authService = {
  async signup(input: SignupInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      // Don't reveal that the email exists — just silently succeed
      // We create a fake session-like delay to prevent timing attacks
      await new Promise((r) => setTimeout(r, 200));
      throw new Error('Unable to create account. Please try again.');
    }

    const user = await userRepository.createUser({
      email: input.email.toLowerCase(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      passwordHash: hashPassword(input.password)
    });

    const session = await createSessionForUser(user.id);

    // Send welcome email (non-blocking — failure doesn't break signup)
    const notificationProvider = createNotificationProvider();
    notificationProvider.send({
      toEmail: user.email,
      toName: `${user.firstName} ${user.lastName}`,
      subject: 'Welcome to Tripmate ✈️',
      templateData: {
        message: `Hi ${user.firstName}, welcome to Tripmate! You're all set to start planning your next trip.`,
        ctaUrl: `${process.env.APP_URL}/trips/new`,
        ctaLabel: 'Plan your first trip'
      }
    }).catch((err) => console.error('[auth] Welcome email failed:', err));

    return { user, session };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);

    // Always run verifyPassword even if user not found — prevents timing attacks
    const dummyHash = 'a:b';
    const valid = user?.passwordHash
      ? verifyPassword(input.password, user.passwordHash)
      : verifyPassword(input.password, dummyHash);

    if (!user || !valid) {
      throw new Error('Invalid email or password.');
    }

    const session = await createSessionForUser(user.id);
    return { user, session };
  }
};
