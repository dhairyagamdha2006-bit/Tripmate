import { hashPassword } from '@/lib/auth/password';
import { registerSchema } from '@/lib/validations/auth';
import { userRepository } from '@/server/repositories/user.repository';
import { emailService } from '@/server/services/email.service';
import { renderWelcomeEmail } from '@/server/services/email-templates';

export const authService = {
  async register(payload: unknown) {
    const parsed = registerSchema.parse(payload);
    const existing = await userRepository.findByEmail(parsed.email);
    if (existing) {
      throw new Error('ACCOUNT_EXISTS');
    }

    const user = await userRepository.create({
      email: parsed.email,
      passwordHash: await hashPassword(parsed.password),
      firstName: parsed.firstName,
      lastName: parsed.lastName
    });

    if (user.email && process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
      const template = renderWelcomeEmail({ name: user.firstName ?? user.name ?? 'traveler' });
      void emailService.safeSendUserEmail({
        userId: user.id,
        toEmail: user.email,
        kind: 'WELCOME',
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    }

    return user;
  }
};
