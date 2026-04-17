import { ZodError } from 'zod';
import { signupSchema } from '@/lib/validations/auth';
import { authService } from '@/server/services/auth.service';
import { fieldErrorsFromZod, jsonError, jsonOk } from '@/server/http/route-helpers';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export async function POST(request: Request) {
  // Rate limit: 5 signup attempts per IP per 10 minutes.
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const limited = await checkRateLimit(`signup:${ip}`, 5, 600);
  if (limited) {
    return jsonError('Too many requests. Please try again later.', 429);
  }

  try {
    const parsed = signupSchema.parse(await request.json());
    const result = await authService.signup(parsed);
    // Important: we do not return a session here. The client calls
    // `signIn('credentials', ...)` immediately after signup to obtain
    // the Auth.js JWT cookie.
    return jsonOk({ userId: result.user.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError('Validation failed.', 400, fieldErrorsFromZod(error));
    }
    return jsonError('Unable to create account. Please try again.', 400);
  }
}
