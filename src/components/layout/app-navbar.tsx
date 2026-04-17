'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Plane, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export function AppNavbar({ userName }: { userName: string }) {
  const pathname = usePathname();

  async function handleSignOut() {
    await signOut({ callbackUrl: '/login' });
  }

  const links = [
    { href: '/trips', label: 'My Trips' },
    { href: '/profile', label: 'Profile' },
    { href: '/trips/new', label: 'Plan a Trip' }
  ];

  const linkClasses = (href: string) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
      pathname === href || pathname.startsWith(`${href}/`)
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    );

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/trips" className="flex items-center gap-2.5 text-slate-900">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Plane className="h-4 w-4" />
          </div>
          <div>
            <span className="font-serif text-xl">Tripmate</span>
            <p className="hidden text-xs text-slate-500 sm:block">Plan smarter. Book with confidence.</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 sm:flex">
            <UserCircle2 className="h-4 w-4" />
            {userName}
          </div>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>

      <div className="border-t border-slate-200 md:hidden">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses(link.href)}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
