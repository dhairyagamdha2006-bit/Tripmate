import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/common/logo';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/trips');
  }

  return (
    <main className="flex min-h-screen flex-col px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Logo />
      </div>
      <div className="mx-auto flex flex-1 items-center justify-center">
        <LoginForm googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} />
      </div>
    </main>
  );
}
