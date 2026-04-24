import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', {
  variants: {
    variant: {
      default: 'bg-slate-800 text-slate-100',
      success: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
      warning: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
      danger: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
      info: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30'
    }
  },
  defaultVariants: {
    variant: 'default'
  }
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
