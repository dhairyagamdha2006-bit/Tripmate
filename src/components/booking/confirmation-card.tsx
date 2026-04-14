import { Card, CardContent } from '@/components/ui/card';

export function ConfirmationCard({
  label,
  value,
  highlight = false
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-teal-200 bg-teal-50' : ''}>
      <CardContent className="p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
        <p className={`mt-2 text-lg font-bold ${highlight ? 'text-teal-800' : 'text-slate-900'}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
