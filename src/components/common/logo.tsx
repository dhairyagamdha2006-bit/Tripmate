import Link from 'next/link';
import { Compass } from 'lucide-react';

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-semibold tracking-tight text-white">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-400/30">
        <Compass className="h-5 w-5 text-sky-300" />
      </span>
      <span>Tripmate</span>
    </Link>
  );
}
