import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Globe,
  ShieldCheck,
  Clock,
  CalendarDays,
  ArrowRight,
  Check,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Therapist, Availability, Session } from '@/types';
import { DAYS, DAYS_SHORT } from '@/types';
import { Avatar } from '@/components/Avatar';
import { formatRupees, formatDateTime } from '@/lib/format';

const DURATIONS = [45, 60, 90];

export function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      if (!slug) return;
      const tRes = await supabase
        .from('therapists')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      if (cancelled) return;
      const t = tRes.data as Therapist | null;
      if (!t) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTherapist(t);

      const [availRes, sessRes] = await Promise.all([
        supabase.from('availability').select('*').eq('therapist_id', t.id).order('day_of_week').order('start_time'),
        supabase.from('sessions').select('*').eq('therapist_id', t.id),
      ]);
      if (cancelled) return;
      setAvailability((availRes.data as Availability[]) ?? []);
      setSessions((sessRes.data as Session[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-sage-50">
        <Loader2 className="h-6 w-6 animate-spin text-sage-600" />
        <p className="text-sm text-ink-500">Loading booking page</p>
      </div>
    );
  }

  if (notFound || !therapist) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-sage-50 px-6 text-center">
        <Sparkles className="h-8 w-8 text-sage-300" />
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Therapist not found</h1>
        <p className="max-w-sm text-sm text-ink-500">
          This branded link doesn&apos;t match any therapist.
        </p>
        <Link to="/" className="btn-sage">
          <ArrowLeft className="h-4 w-4" /> Back to Unfazed
        </Link>
      </div>
    );
  }

  return (
    <BookingFlow
      therapist={therapist}
      availability={availability}
      sessions={sessions}
      booking={booking}
      onBookingChange={setBooking}
    />
  );
}

function BookingFlow({
  therapist,
  availability,
  sessions,
  booking,
  onBookingChange,
}: {
  therapist: Therapist;
  availability: Availability[];
  sessions: Session[];
  booking: boolean;
  onBookingChange: (v: boolean) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [form, setForm] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(false);
  const [conflict, setConflict] = useState(false);

  const bookedStarts = useMemo(
    () => new Set(sessions.filter((s) => s.status === 'booked').map((s) => s.starts_at)),
    [sessions]
  );

  const next14Days = useMemo(() => {
    const days: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d);
    }
    return days;
  }, []);

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dow = selectedDate.getDay();
    const daySlots = availability.filter((a) => a.day_of_week === dow);
    const result: { time: string; label: string; available: boolean }[] = [];
    daySlots.forEach((slot) => {
      const [startH, startM] = slot.start_time.split(':').map(Number);
      const [endH, endM] = slot.end_time.split(':').map(Number);
      let h = startH;
      let m = startM;
      while (h < endH || (h === endH && m < endM)) {
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const slotDate = new Date(selectedDate);
        slotDate.setHours(h, m, 0, 0);
        const iso = slotDate.toISOString();
        result.push({
          time: timeStr,
          label: slotDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
          available: !bookedStarts.has(iso),
        });
        m += duration + therapist.buffer_minutes;
        while (m >= 60) {
          m -= 60;
          h += 1;
        }
      }
    });
    return result;
  }, [selectedDate, availability, duration, therapist.buffer_minutes, bookedStarts]);

  async function confirmBooking() {
    if (!selectedDate || !selectedSlot || !form.name.trim()) return;
    setSubmitting(true);
    setConflict(false);
    const [h, m] = selectedSlot.split(':').map(Number);
    const startsAt = new Date(selectedDate);
    startsAt.setHours(h, m, 0, 0);

    const { error } = await supabase.from('sessions').insert({
      therapist_id: therapist.id,
      client_name: form.name.trim(),
      client_email: form.email.trim() || null,
      starts_at: startsAt.toISOString(),
      duration_minutes: duration,
      status: 'booked',
      session_type: 'standard',
      price_cents: therapist.default_session_price_cents,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') {
        setConflict(true);
      }
      onBookingChange(false);
      return;
    }
    setBooked(true);
  }

  if (booked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sage-50 px-6 text-center">
        <div className="card max-w-md p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-sage-700">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink-900">Session booked!</h1>
          <p className="mt-2 text-sm text-ink-500">Confirmation sent.</p>
          <div className="mt-5 rounded-lg bg-sage-50 p-4 text-left text-sm">
            <p className="font-medium text-ink-900">{form.name}</p>
            <p className="mt-1 text-ink-600">
              {selectedDate && selectedSlot && formatDateTime(new Date(selectedDate.setHours(Number(selectedSlot.split(':')[0]), Number(selectedSlot.split(':')[1]))).toISOString())}
            </p>
            <p className="text-ink-600">{duration} minutes · {formatRupees(therapist.default_session_price_cents)}</p>
          </div>
          <Link to="/" className="btn-outline mt-6 w-full">
            Back to Unfazed
          </Link>
        </div>
      </div>
    );
  }

  if (booking && selectedDate && selectedSlot) {
    return (
      <div className="min-h-screen bg-sage-50">
        <PublicHeader therapist={therapist} onBack={() => onBookingChange(false)} />
        <div className="mx-auto max-w-lg px-6 py-8">
          <div className="card p-6">
            <h1 className="font-serif text-2xl font-semibold text-ink-900">Your details</h1>
            <p className="mt-1.5 text-sm text-ink-500">
              {formatDateTime(new Date(selectedDate.setHours(Number(selectedSlot.split(':')[0]), Number(selectedSlot.split(':')[1]))).toISOString())} · {duration} min
            </p>

            {conflict && (
              <div className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                That slot was just booked. Please choose another.
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-sage-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-600">Session fee</span>
                <span className="font-medium text-ink-900">{formatRupees(therapist.default_session_price_cents)}</span>
              </div>
              <p className="mt-2 text-xs text-ink-400">Free reschedule up to 24 hours before the session.</p>
            </div>

            <button onClick={confirmBooking} disabled={submitting || !form.name.trim()} className="btn-sage mt-5 w-full">
              {submitting ? 'Booking…' : 'Confirm booking'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50">
      <PublicHeader therapist={therapist} />

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Profile hero */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-sage-700 to-sage-900 px-6 py-8">
            <div className="flex flex-wrap items-center gap-5">
              <div className="rounded-full bg-white p-1.5">
                <Avatar name={therapist.full_name} size="lg" />
              </div>
              <div className="flex-1">
                <h1 className="font-serif text-2xl font-semibold text-white">{therapist.full_name}</h1>
                <p className="mt-0.5 text-sage-200">{therapist.title}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {therapist.specializations.map((s) => (
                    <span key={s} className="badge bg-white/15 text-sage-50">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {therapist.bio && (
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-ink-700">{therapist.bio}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-500">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" /> {therapist.languages.join(', ')}
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> Evidence-based therapy
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {therapist.buffer_minutes}m buffer
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Booking */}
        <div className="mt-6 card p-6">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-ink-900">
            <CalendarDays className="h-5 w-5 text-sage-600" />
            Book a session with {therapist.full_name.split(' ').slice(-1)[0]}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Slots are converted to each client&apos;s local timezone automatically.
          </p>

          {/* Duration selector */}
          <div className="mt-5">
            <label className="label">Duration</label>
            <div className="flex gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDuration(d);
                    setSelectedSlot(null);
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    duration === d
                      ? 'border-sage-600 bg-sage-50 text-sage-800'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300'
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Date picker */}
          <div className="mt-5">
            <label className="label">Choose a date</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {next14Days.map((d) => {
                const dow = d.getDay();
                const hasSlots = availability.some((a) => a.day_of_week === dow);
                const isSelected =
                  selectedDate &&
                  d.getDate() === selectedDate.getDate() &&
                  d.getMonth() === selectedDate.getMonth();
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedSlot(null);
                    }}
                    disabled={!hasSlots}
                    className={`flex shrink-0 flex-col items-center rounded-lg border px-3 py-2.5 text-center transition-colors ${
                      isSelected
                        ? 'border-sage-600 bg-sage-600 text-white'
                        : hasSlots
                        ? 'border-ink-200 text-ink-700 hover:border-sage-400'
                        : 'border-ink-100 text-ink-300'
                    }`}
                  >
                    <span className="text-xs">{DAYS_SHORT[dow]}</span>
                    <span className="text-lg font-semibold">{d.getDate()}</span>
                    <span className="text-[10px] opacity-75">
                      {d.toLocaleDateString('en-IN', { month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slot picker */}
          {selectedDate && (
            <div className="mt-5">
              <label className="label">Available times</label>
              {slotsForDate.length === 0 ? (
                <div className="rounded-lg bg-ink-50 px-4 py-6 text-center text-sm text-ink-500">
                  Try another date — this day is fully booked or unavailable.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {slotsForDate.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedSlot(slot.time)}
                      disabled={!slot.available}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        selectedSlot === slot.time
                          ? 'border-sage-600 bg-sage-600 text-white'
                          : slot.available
                          ? 'border-ink-200 text-ink-700 hover:border-sage-400'
                          : 'border-ink-100 text-ink-300 line-through'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSlot && (
            <button
              onClick={() => onBookingChange(true)}
              className="btn-sage mt-6 w-full sm:w-auto"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {availability.length === 0 && (
            <div className="mt-5 rounded-lg bg-ink-50 px-4 py-6 text-center text-sm text-ink-500">
              No open slots — this therapist hasn&apos;t set availability yet.
            </div>
          )}
        </div>

        {/* What to expect */}
        <div className="mt-6 card p-6">
          <h2 className="font-semibold text-ink-900">What to expect</h2>
          <div className="mt-4 space-y-3 text-sm text-ink-600">
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              <span>A confidential, judgment-free space to talk through what&apos;s on your mind.</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              <span>Evidence-based techniques tailored to your goals and pace.</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              <span>Flexible session lengths and free rescheduling.</span>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-600">
            <Sparkles className="h-4 w-4" /> Powered by Unfazed
          </Link>
        </footer>
      </div>
    </div>
  );
}

function PublicHeader({ therapist, onBack }: { therapist: Therapist; onBack?: () => void }) {
  return (
    <header className="border-b border-sage-200/60 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sage-700" />
            <span className="font-serif text-lg font-semibold text-sage-900">Unfazed</span>
          </Link>
        )}
        <span className="text-sm text-ink-400">{therapist.full_name}</span>
      </div>
    </header>
  );
}
