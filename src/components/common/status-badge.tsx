import type { BookingStatus, TripRequestStatus } from '@prisma/client';
import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: TripRequestStatus | BookingStatus }) {
  const tone =
    status === 'CONFIRMED' || status === 'COMPLETED'
      ? 'emerald'
      : status === 'FAILED' || status === 'CANCELLED'
      ? 'red'
      : status === 'RECOMMENDATIONS_READY' || status === 'PENDING_APPROVAL'
      ? 'blue'
      : status === 'BOOKING_PENDING' || status === 'PENDING_PROVIDER_CONFIRMATION'
      ? 'amber'
      : 'slate';

  return <Badge tone={tone}>{status.replaceAll('_', ' ')}</Badge>;
}
