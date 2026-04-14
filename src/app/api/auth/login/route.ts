import { ZodError } from 'zod';
import { loginSchema } from '@/lib/validations/auth';
import { SESSION_COOKIE, getSessionCookieOptions } from '@/lib/auth/session';
import { authService } from '@/server/services/auth.service';
import { fieldErrorsFromZod, jsonError, jsonOk } from '@/server/http/route-helpers';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  // Rate limit: 10 login attempts per IP per 15 minutes
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const limited = await checkRateLimit(`login:${ip}`, 10, 900);
  if (limited) {
    return jsonError('Too many login attempts. Please wait 15 minutes.', 429);
  }

  try {
    const parsed = loginSchema.parse(await request.json());
    const result = await authService.login(parsed);
    const response = jsonOk({ userId: result.user.id });
    response.cookies.set(
      SESSION_COOKIE,
      result.session.token,
      getSessionCookieOptions(result.session.expiresAt)
    );
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError('Validation failed.', 400, fieldErrorsFromZod(error));
    }
    // Always the same message — never reveal which field was wrong
    return jsonError('Invalid email or password.', 401);
  }
}
