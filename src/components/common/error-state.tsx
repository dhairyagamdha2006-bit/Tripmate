import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

export function ErrorState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <Card className="border-red-200">
      <CardContent className="px-6 py-12 text-center">
        <div className="mb-4 text-3xl">⚠️</div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </CardContent>
    </Card>
  );
}
