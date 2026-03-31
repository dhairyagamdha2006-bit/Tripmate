import { ZodError } from 'zod';
import { signupSchema } from '@/lib/validations/auth';
import { SESSION_COOKIE, getSessionCookieOptions } from '@/lib/auth/session';
import { authService } from '@/server/services/auth.service';
import { fieldErrorsFromZod, jsonError, jsonOk } from '@/server/http/route-helpers';

export async function POST(request: Request) {
  try {
    const parsed = signupSchema.parse(await request.json());
    const result = await authService.signup(parsed);
    const response = jsonOk({ userId: result.user.id });
    response.cookies.set(SESSION_COOKIE, result.session.token, getSessionCookieOptions(result.session.expiresAt));
    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError('Validation failed.', 400, fieldErrorsFromZod(error));
    }
    return jsonError(error instanceof Error ? error.message : 'Unable to create account.', 400);
  }
}
