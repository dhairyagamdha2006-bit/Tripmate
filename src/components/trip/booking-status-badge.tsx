import { Badge } from '@/components/ui/badge';

export function BookingStatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();

  if (normalized.includes('CONFIRMED') || normalized.includes('CAPTURED')) {
    return <Badge variant="success">{humanize(status)}</Badge>;
  }

  if (normalized.includes('FAILED') || normalized.includes('CANCELLED') || normalized.includes('REFUNDED')) {
    return <Badge variant="danger">{humanize(status)}</Badge>;
  }

  if (normalized.includes('PENDING') || normalized.includes('REQUESTED') || normalized.includes('AUTHORIZED')) {
    return <Badge variant="warning">{humanize(status)}</Badge>;
  }

  return <Badge variant="info">{humanize(status)}</Badge>;
}

function humanize(value: string) {
  return value.toLowerCase().replaceAll('_', ' ');
}
