import Link from 'next/link';
import { ArrowRight, CheckCircle2, Plane, ShieldCheck, Sparkles } from 'lucide-react';
import { LinkButton } from '@/components/ui/link-button';
import { ResponsiveShell } from '@/components/common/responsive-shell';

const steps = [
  {
    title: 'Tell Tripmate where you want to go',
    description: 'Share origin, dates, budget, and preferences once. Tripmate fills in the planning details from there.'
  },
  {
    title: 'Search flights and hotels',
    description: 'Tripmate runs a structured search, scores bundles, and explains trade-offs in plain language.'
  },
  {
    title: 'Review trusted recommendations',
    description: 'Compare clear pricing, refundability, location, and convenience before you commit.'
  },
  {
    title: 'Approve before any booking',
    description: 'Tripmate never books or charges without your explicit confirmation.'
  }
];

export default function MarketingPage() {
  return (
    <div className="bg-white">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <ResponsiveShell className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Plane className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-xl text-slate-900">Tripmate</p>
              <p className="text-xs text-slate-500">Plan smarter. Book with confidence.</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <LinkButton href="/login" variant="secondary">Sign in</LinkButton>
            <LinkButton href="/signup">Create account</LinkButton>
          </div>
        </ResponsiveShell>
      </header>

      <section className="bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 py-20">
        <ResponsiveShell>
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                <Sparkles className="h-4 w-4" /> AI travel concierge
              </div>
              <h1 className="max-w-3xl font-serif text-5xl leading-tight text-slate-900 sm:text-6xl">
                Plan smarter. <span className="text-blue-600">Book with confidence.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-600">
                Tripmate gathers trip details, searches flight and hotel options, bundles the best plans, and only books after you approve every detail.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/signup" size="lg">Start planning <ArrowRight className="h-4 w-4" /></LinkButton>
                <LinkButton href="/login" size="lg" variant="secondary">Explore the demo</LinkButton>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-500">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Approval-first booking</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Transparent pricing</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Refundability surfaced clearly</div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-card-lg">
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">Example request</p>
                <p className="mt-3 text-lg font-semibold text-slate-900">2 travelers · SFO → Tokyo · 10 nights · Business class</p>
                <p className="mt-2 text-sm text-slate-600">Budget $8,000 · Shibuya or Shinjuku · direct flights preferred · 4-star hotel minimum</p>
              </div>
              <div className="mt-4 grid gap-4">
                {['Best Value', 'Cheapest', 'Most Flexible'].map((label, index) => (
                  <div key={label} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                        <p className="text-sm text-slate-500">Direct flight + central hotel bundle</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900">${[7600, 5580, 9000][index].toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <ShieldCheck className="h-4 w-4" /> Tripmate never books without your approval.
              </div>
            </div>
          </div>
        </ResponsiveShell>
      </section>

      <section className="py-20">
        <ResponsiveShell>
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">How it works</p>
            <h2 className="mt-3 font-serif text-4xl text-slate-900">From idea to itinerary in minutes</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">Tripmate is built to feel calm, transparent, and reliable — more concierge than chatbot.</p>
          </div>
          <div className="grid gap-5 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 font-semibold text-blue-700">{index + 1}</div>
                <h3 className="mt-5 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">{step.description}</p>
              </div>
            ))}
          </div>
        </ResponsiveShell>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-20">
        <ResponsiveShell className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Trust-first product design</p>
          <h2 className="mt-3 font-serif text-4xl text-slate-900">Clear options. Trusted decisions.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-500">Pricing, cancellation rules, and booking states are surfaced before payment so the user always knows what is happening.</p>
        </ResponsiveShell>
      </section>
    </div>
  );
}
