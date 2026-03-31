import { cn } from '@/lib/utils/cn';

export function StepProgress({
  steps,
  current
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="overflow-x-auto rounded-full border border-slate-200 bg-white px-4 py-3 shadow-card">
      <div className="flex min-w-max items-center gap-3">
        {steps.map((step, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
          return (
            <div key={step} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                    state === 'done' && 'bg-blue-600 text-white',
                    state === 'current' && 'bg-slate-900 text-white',
                    state === 'upcoming' && 'bg-slate-100 text-slate-500'
                  )}
                >
                  {state === 'done' ? '✓' : index + 1}
                </div>
                <span className={cn('text-sm font-medium', state === 'upcoming' ? 'text-slate-400' : 'text-slate-700')}>{step}</span>
              </div>
              {index < steps.length - 1 ? <div className="h-px w-8 bg-slate-200" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
