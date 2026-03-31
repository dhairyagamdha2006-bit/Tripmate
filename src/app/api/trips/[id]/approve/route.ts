import { ZodError } from 'zod';
import { bookingApprovalSchema } from '@/lib/validations/trips';
import { bookingService } from '@/server/services/booking.service';
import { fieldErrorsFromZod, jsonError, jsonOk, requireApiUser } from '@/server/http/route-helpers';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const parsed = bookingApprovalSchema.parse(await request.json());
    const booking = await bookingService.approveBooking(user.id, params.id, parsed.paymentMethodId);
    return jsonOk({ bookingId: booking.id, confirmationNumber: booking.confirmationNumber });
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError('Validation failed.', 400, fieldErrorsFromZod(error));
    }
    return jsonError(error instanceof Error ? error.message : 'Unable to approve booking.', 400);
  }
}
