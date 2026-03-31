import Link, { type LinkProps } from 'next/link';
import type { ReactNode } from 'react';
import { buttonVariants, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export function LinkButton({
  href,
  children,
  className,
  variant,
  size,
  ...props
}: LinkProps & Pick<ButtonProps, 'variant' | 'size'> & { children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}
