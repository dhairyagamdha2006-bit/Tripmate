import { bookingService } from '@/server/services/booking.service';
import { jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireApiUser();
    const result = await bookingService.cancelBooking(user.id, params.id);
    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : 'Unable to cancel booking.',
      400
    );
  }
}
