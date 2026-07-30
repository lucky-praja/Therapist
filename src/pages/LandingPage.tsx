import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CreditCard,
  FileText,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Check,
  IndianRupee,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { PLANS } from '@/types';
import { formatRupees } from '@/lib/format';

const features = [
  {
    icon: CalendarDays,
    title: 'Smart scheduling',
    description: 'Set weekly availability and let clients self-book. Slots auto-convert to each client\u2019s timezone.',
  },
  {
    icon: CreditCard,
    title: 'Payments & invoices',
    description: 'Razorpay checkout, session bundles, and GST invoices with webhook-confirmed payments.',
  },
  {
    icon: FileText,
    title: 'Clinical notes',
    description: 'Write session notes and share a client-visible summary. Intake and consent capture built in.',
  },
  {
    icon: MessageSquare,
    title: 'Real-time chat',
    description: 'Message clients securely between sessions. Reschedule, share resources, and follow up.',
  },
];

const stats = [
  { label: 'Average time saved', value: '6 hrs', sub: 'per week' },
  { label: 'No-show reduction', value: '38%', sub: 'with reminders' },
  { label: 'Therapists onboarded', value: '2,400+', sub: 'across India' },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-sage-50">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-sage-200/60 bg-sage-50/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-700">
              <Sparkles className="h-5 w-5 text-sage-100" />
            </div>
            <span className="font-serif text-xl font-semibold text-sage-900">Unfazed</span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900">Features</a>
            <a href="#pricing" className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900">Pricing</a>
            <a href="/t/ananya" className="text-sm font-medium text-ink-600 transition-colors hover:text-ink-900">Demo page</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
            <Link to="/register" className="btn-sage text-sm">Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sage-100/60 to-sage-50" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="animate-fade-in">
            <div className="badge mb-5 bg-sage-200/70 text-sage-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              For therapists in India
            </div>
            <h1 className="font-serif text-4xl font-semibold leading-[1.15] text-sage-950 md:text-5xl">
              Run your entire therapy practice from one branded link.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-600">
              Booking, payments, notes, scheduling, and client messaging — unified in a calm, professional platform built for Indian therapists.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register" className="btn-sage px-6 py-3 text-base">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="/t/ananya" className="btn-outline px-6 py-3 text-base">
                See a live demo
              </a>
            </div>
            <p className="mt-4 text-sm text-ink-500">No credit card required. Start managing your practice in minutes.</p>
          </div>
          <div className="animate-scale-in relative">
            <div className="overflow-hidden rounded-2xl shadow-float ring-1 ring-sage-200">
              <img
                src="https://images.pexels.com/photos/36764974/pexels-photo-36764974.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                alt="Calm meditation space"
                className="h-[400px] w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-ink-200 bg-white p-4 shadow-card sm:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-100 text-sage-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Session booked</p>
                  <p className="text-xs text-ink-500">Confirmation sent automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-sage-200/60 bg-white/60">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-4 px-6 py-10">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-serif text-3xl font-semibold text-sage-800 md:text-4xl">{s.value}</p>
              <p className="mt-1 text-sm text-ink-600">{s.label}</p>
              <p className="text-xs text-ink-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-sage-950 md:text-4xl">
            Everything your practice needs
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            Unfazed replaced four tools. Your clients book, pay, and message you in one place.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="card-hover p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-sage-100 text-sage-700">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="bg-sage-700">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <p className="font-serif text-2xl font-medium leading-relaxed text-sage-50 md:text-3xl">
            &ldquo;Unfazed replaced four tools. My clients book, pay, and message me in one place.&rdquo;
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sage-600 font-semibold text-sage-100">
              AS
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-sage-50">Dr. Ananya Sharma</p>
              <p className="text-xs text-sage-300">Licensed Therapist, Bengaluru</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold text-sage-950 md:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            Start free. Upgrade when your practice grows. Prices in INR.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`relative rounded-2xl border p-7 ${
                plan.highlight
                  ? 'border-sage-600 bg-white shadow-float ring-1 ring-sage-600'
                  : 'border-ink-200 bg-white shadow-soft'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-3 py-1 text-xs font-semibold text-gold-950">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-ink-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink-500">{plan.tagline}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-semibold text-sage-900">
                  {plan.price_cents === 0 ? 'Free' : formatRupees(plan.price_cents)}
                </span>
                {plan.price_cents > 0 && (
                  <span className="text-sm font-normal text-ink-400">/{plan.period}</span>
                )}
              </div>
              <ul className="mt-6 space-y-3 text-sm text-ink-700">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`mt-7 w-full ${plan.highlight ? 'btn-sage' : 'btn-outline'}`}
              >
                {plan.price_cents === 0 ? 'Start free' : 'Choose plan'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="overflow-hidden rounded-2xl bg-sage-900 px-8 py-14 text-center">
          <h2 className="font-serif text-3xl font-semibold text-sage-50">
            Ready to simplify your practice?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sage-300">
            Join 2,400+ therapists across India who run their practice on Unfazed.
          </p>
          <Link to="/register" className="btn-gold mx-auto mt-7 px-6 py-3 text-base">
            Get started — it\u2019s free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sage-200/60 bg-sage-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sage-700" />
            <span className="font-serif text-lg font-semibold text-sage-900">Unfazed</span>
          </div>
          <p className="text-sm text-ink-500">
            <IndianRupee className="inline h-3.5 w-3.5" /> Practice Management Pvt. Ltd. — Trusted by therapists across India
          </p>
        </div>
      </footer>
    </div>
  );
}
