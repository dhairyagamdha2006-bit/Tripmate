import { ZodError } from 'zod';
import { tripRequestSchema } from '@/lib/validations/trips';
import { tripRequestService } from '@/server/services/trip-request.service';
import { tripService } from '@/server/services/trip.service';
import { mapTripCard } from '@/server/mappers/trip.mapper';
import { fieldErrorsFromZod, jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

export async function GET() {
  try {
    const user = await requireApiUser();
    const trips = await tripService.listTripsForUser(user.id);
    return jsonOk(trips.map(mapTripCard));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unauthorized.', 401);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const parsed = tripRequestSchema.parse(await request.json());
    const trip = await tripRequestService.createTrip(user.id, parsed);
    return jsonOk({ tripId: trip.id, requestId: trip.requests[0]?.id });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError('Validation failed.', 400, fieldErrorsFromZod(error));
    }
    return jsonError(error instanceof Error ? error.message : 'Unable to create trip.', 400);
  }
}
