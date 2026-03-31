import { userRepository } from '@/server/repositories/user.repository';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSessionForUser } from '@/lib/auth/session';
import type { LoginInput, SignupInput } from '@/lib/validations/auth';

export const authService = {
  async signup(input: SignupInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('An account with that email already exists.');
    }

    const user = await userRepository.createUser({
      email: input.email.toLowerCase(),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      passwordHash: hashPassword(input.password)
    });

    const session = await createSessionForUser(user.id);
    await userRepository.ensureMockPaymentMethod(user.id);

    return { user, session };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      throw new Error('Invalid email or password.');
    }

    const session = await createSessionForUser(user.id);
    return { user, session };
  }
};
