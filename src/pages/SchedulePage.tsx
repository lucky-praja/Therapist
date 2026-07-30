import { useEffect, useState } from 'react';
import { Plus, Trash2, CalendarDays, Clock, CalendarOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/Toast';
import type { Availability, Session } from '@/types';
import { DAYS, DAYS_SHORT } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { EmptyState, Spinner } from '@/components/Feedback';
import { formatDateTime } from '@/lib/format';

export function SchedulePage() {
  const { therapist } = useAuth();
  const { toasts, dismiss, success, error } = useToast();
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ day: 1, start: '10:00', end: '13:00' });

  useEffect(() => {
    if (!therapist) return;
    let cancelled = false;

    async function load() {
      if (!therapist) return;
      const [availRes, sessRes] = await Promise.all([
        supabase
          .from('availability')
          .select('*')
          .eq('therapist_id', therapist.id)
          .order('day_of_week')
          .order('start_time'),
        supabase
          .from('sessions')
          .select('*')
          .eq('therapist_id', therapist.id)
          .order('starts_at', { ascending: true }),
      ]);
      if (cancelled) return;
      setAvailability(availRes.data as Availability[] ?? []);
      setSessions(sessRes.data as Session[] ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [therapist]);

  async function addSlot() {
    if (!therapist) return;
    if (form.start >= form.end) {
      error('End time must be after start time');
      return;
    }
    setAdding(true);
    const { data, error: err } = await supabase
      .from('availability')
      .insert({
        therapist_id: therapist.id,
        day_of_week: form.day,
        start_time: form.start,
        end_time: form.end,
      })
      .select('*')
      .single();
    setAdding(false);
    if (err) {
      error(err.message);
      return;
    }
    setAvailability((prev) =>
      [...prev, data as Availability].sort(
        (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)
      )
    );
    success('Availability added');
  }

  async function removeSlot(id: string) {
    const { error: err } = await supabase.from('availability').delete().eq('id', id);
    if (err) {
      error(err.message);
      return;
    }
    setAvailability((prev) => prev.filter((a) => a.id !== id));
    success('Slot removed');
  }

  async function cancelSession(id: string) {
    const { error: err } = await supabase
      .from('sessions')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (err) {
      error(err.message);
      return;
    }
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s))
    );
    success('Session cancelled');
  }

  if (loading || !therapist) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-sage-600" />
      </div>
    );
  }

  const upcoming = sessions.filter((s) => s.starts_at >= new Date().toISOString());
  const past = sessions.filter((s) => s.starts_at < new Date().toISOString()).reverse();

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Schedule</h1>
        <p className="mt-1 text-sm text-ink-500">
          Set your weekly availability and manage booked sessions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Availability */}
        <div className="card lg:col-span-2">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-ink-900">
              <CalendarDays className="h-4.5 w-4.5 text-sage-600" />
              Weekly availability
            </h2>
          </div>

          <div className="space-y-4 px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label text-xs">Day of week</label>
                <select
                  className="input text-sm"
                  value={form.day}
                  onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs">Start</label>
                <input
                  type="time"
                  className="input text-sm"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </div>
              <div>
                <label className="label text-xs">End</label>
                <input
                  type="time"
                  className="input text-sm"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </div>
            </div>
            <button onClick={addSlot} disabled={adding} className="btn-sage w-full">
              <Plus className="h-4 w-4" />
              {adding ? 'Adding…' : 'Add availability'}
            </button>
          </div>

          <div className="border-t border-ink-100 px-5 py-4">
            {availability.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-500">No availability set</p>
            ) : (
              <div className="space-y-1.5">
                {availability.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-lg bg-sage-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sage-200 text-xs font-semibold text-sage-800">
                        {DAYS_SHORT[slot.day_of_week]}
                      </span>
                      <span className="text-sm text-ink-700">
                        {slot.start_time} — {slot.end_time}
                      </span>
                    </div>
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className="text-ink-400 transition-colors hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Booked sessions */}
        <div className="card lg:col-span-3">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="font-semibold text-ink-900">Booked sessions</h2>
          </div>

          {upcoming.length === 0 && past.length === 0 ? (
            <EmptyState
              icon={<CalendarOff className="h-6 w-6" />}
              title="No bookings yet"
              description="Once clients book, their sessions will appear here."
            />
          ) : (
            <div className="px-5 py-4">
              {upcoming.length > 0 && (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Upcoming</p>
                  <div className="mb-5 space-y-2">
                    {upcoming.map((s) => (
                      <SessionRow key={s.id} session={s} onCancel={cancelSession} />
                    ))}
                  </div>
                </>
              )}
              {past.length > 0 && (
                <>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Past</p>
                  <div className="space-y-2">
                    {past.slice(0, 10).map((s) => (
                      <SessionRow key={s.id} session={s} onCancel={cancelSession} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionRow({
  session,
  onCancel,
}: {
  session: Session;
  onCancel: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-ink-100 px-3.5 py-3">
      <Avatar name={session.client_name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">{session.client_name}</p>
        <p className="flex items-center gap-1.5 text-xs text-ink-500">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTime(session.starts_at)} · {session.duration_minutes} min
        </p>
      </div>
      <StatusBadge status={session.status} />
      {session.status === 'booked' && (
        <button
          onClick={() => onCancel(session.id)}
          className="btn-ghost px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
