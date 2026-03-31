import { Card, CardContent } from '@/components/ui/card';

export function ConfirmationCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
