import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-5xl font-semibold text-white">Page not found</h1>
      <p className="mt-4 max-w-xl text-slate-300">The itinerary or page you requested is no longer available, may have been revoked, or may never have existed.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/"><Button>Go home</Button></Link>
        <Link href="/trips"><Button variant="outline">Open trips</Button></Link>
      </div>
    </main>
  );
}
