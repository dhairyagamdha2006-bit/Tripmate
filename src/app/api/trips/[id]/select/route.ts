import { ZodError } from 'zod';
import { packageSelectionSchema } from '@/lib/validations/trips';
import { tripService } from '@/server/services/trip.service';
import { fieldErrorsFromZod, jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const parsed = packageSelectionSchema.parse(await request.json());
    const pkg = await tripService.selectPackage(user.id, params.id, parsed.packageId);
    return jsonOk({ packageId: pkg.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError('Validation failed.', 400, fieldErrorsFromZod(error));
    }
    return jsonError(error instanceof Error ? error.message : 'Unable to select package.', 400);
  }
}
