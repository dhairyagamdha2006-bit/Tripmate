import Link from 'next/link';
import { ArrowRight, CreditCard, PlaneTakeoff, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from '@/components/common/logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: PlaneTakeoff,
    title: 'Real provider-backed search',
    copy: 'Amadeus flight offers and hotel quote workflows wired through server-side provider abstractions.'
  },
  {
    icon: CreditCard,
    title: 'Stripe-powered checkout',
    copy: 'Save payment methods with Setup Intents, pay with Payment Intents, and track honest booking states.'
  },
  {
    icon: Sparkles,
    title: 'LLM planning assistant',
    copy: 'Ask tradeoff questions, refine plans, and keep trip-specific conversation history in the database.'
  },
  {
    icon: ShieldCheck,
    title: 'Production-minded auth',
    copy: 'Auth.js with Prisma sessions, Google OAuth, bcrypt passwords, and scoped itinerary sharing.'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-300 hover:text-white">
              Sign in
            </Link>
            <Link href="/signup">
              <Button size="sm">Create account</Button>
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-16 py-16 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
                Production-ready travel planning for Vercel deployment
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                Plan, compare, pay, share, and manage travel from one trustworthy itinerary workspace.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Tripmate turns a starter demo into a real product surface: provider-backed search, robust authentication,
                real payment rails, AI recommendations, email workflows, reminder automation, and shareable itineraries.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start planning <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-sky-500/20 bg-slate-900/80">
            <CardHeader>
              <CardTitle>Built for honest travel workflows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{feature.copy}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
