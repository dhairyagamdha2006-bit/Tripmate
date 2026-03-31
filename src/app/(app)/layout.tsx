import { AppNavbar } from '@/components/layout/app-navbar';
import { requireCurrentUser } from '@/lib/auth/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNavbar userName={`${user.firstName} ${user.lastName}`} />
      <main>{children}</main>
    </div>
  );
}
