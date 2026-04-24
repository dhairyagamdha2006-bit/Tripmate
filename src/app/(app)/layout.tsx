import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Logo } from '@/components/common/logo';
import { SignOutButton } from '@/components/common/sign-out-button';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Logo href="/trips" />
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              <Link href="/trips" className="hover:text-white">Trips</Link>
              <Link href="/trips/new" className="hover:text-white">New trip</Link>
              <Link href="/profile" className="hover:text-white">Profile</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm text-slate-400">
              <div className="font-medium text-slate-200">{session.user.name ?? session.user.email}</div>
              <div>{session.user.email}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
