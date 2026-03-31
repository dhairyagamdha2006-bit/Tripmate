import { tripService } from '@/server/services/trip.service';
import { mapPackage } from '@/server/mappers/trip.mapper';
import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const trip = await tripService.getTripForUser(user.id, params.id);
    if (!trip) return jsonError('Trip not found.', 404);
    const request = trip.requests[0];
    if (!request) return jsonError('Trip request not found.', 404);
    return jsonOk(request.packages.map(mapPackage));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to load recommendations.', 400);
  }
}
