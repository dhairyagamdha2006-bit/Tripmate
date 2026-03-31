import { ZodError } from 'zod';
import { travelerProfileSchema } from '@/lib/validations/profile';
import { profileService } from '@/server/services/profile.service';
import { fieldErrorsFromZod, jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

export async function GET() {
  try {
    const user = await requireApiUser();
    const profile = await profileService.getProfile(user.id);
    return jsonOk(profile);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unauthorized.', 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const parsed = travelerProfileSchema.parse(await request.json());
    const profile = await profileService.saveProfile(user.id, parsed);
    return jsonOk(profile);
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError('Validation failed.', 400, fieldErrorsFromZod(error));
    }
    return jsonError(error instanceof Error ? error.message : 'Unable to save profile.', 400);
  }
}
