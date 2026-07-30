import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  FileText,
  CalendarDays,
  IndianRupee,
  Save,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/Toast';
import type { Client, Session, Note, Payment } from '@/types';
import { Avatar } from '@/components/Avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Spinner, EmptyState } from '@/components/Feedback';
import { formatDate, formatDateTime, formatRupees } from '@/lib/format';

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { therapist } = useAuth();
  const { toasts, dismiss, success, error } = useToast();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    gender: '',
    occupation: '',
    presenting_concern: '',
    relevant_history: '',
    consent_given: false,
  });

  useEffect(() => {
    if (!therapist || !id) return;
    let cancelled = false;

    async function load() {
      if (!therapist || !id) return;
      const [clientRes, sessRes, notesRes, payRes] = await Promise.all([
        supabase.from('clients').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('sessions')
          .select('*')
          .eq('client_id', id)
          .order('starts_at', { ascending: false }),
        supabase
          .from('notes')
          .select('*')
          .eq('client_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('client_id', id)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      const c = clientRes.data as Client | null;
      setClient(c);
      if (c) {
        setForm({
          full_name: c.full_name,
          email: c.email ?? '',
          phone: c.phone ?? '',
          gender: c.gender ?? '',
          occupation: c.occupation ?? '',
          presenting_concern: c.presenting_concern ?? '',
          relevant_history: c.relevant_history ?? '',
          consent_given: c.consent_given,
        });
      }
      setSessions((sessRes.data as Session[]) ?? []);
      setNotes((notesRes.data as Note[]) ?? []);
      setPayments((payRes.data as Payment[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [therapist, id]);

  async function saveIntake() {
    if (!client) return;
    if (!form.consent_given) {
      error('Consent is required before saving intake');
      return;
    }
    setSaving(true);
    const { data, error: err } = await supabase
      .from('clients')
      .update({
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        gender: form.gender.trim() || null,
        occupation: form.occupation.trim() || null,
        presenting_concern: form.presenting_concern.trim() || null,
        relevant_history: form.relevant_history.trim() || null,
        consent_given: form.consent_given,
      })
      .eq('id', client.id)
      .select('*')
      .single();
    setSaving(false);
    if (err) {
      error(err.message);
      return;
    }
    setClient(data as Client);
    setEditing(false);
    success('Intake & consent saved');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-sage-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-4">
        <ToastContainer toasts={toasts} onDismiss={dismiss} />
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="Unknown client"
          description="This client could not be found."
          action={
            <button onClick={() => navigate('/app/clients')} className="btn-sage">
              Back to clients
            </button>
          }
        />
      </div>
    );
  }

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount_cents, 0);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <Link to="/app/clients" className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700">
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={client.full_name} size="lg" />
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold text-ink-900">{client.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
            {client.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-4 w-4" /> {client.phone}
              </span>
            )}
          </div>
        </div>
        {client.consent_given ? (
          <span className="badge bg-sage-100 text-sage-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Intake complete
          </span>
        ) : (
          <span className="badge bg-gold-100 text-gold-800">Intake pending</span>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-ink-500">
            <CalendarDays className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Sessions</span>
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold text-ink-900">{sessions.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-ink-500">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Notes</span>
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold text-ink-900">{notes.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-ink-500">
            <IndianRupee className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total paid</span>
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold text-ink-900">{formatRupees(totalPaid)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Intake & consent */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="flex items-center gap-2 font-semibold text-ink-900">
              <ShieldCheck className="h-4.5 w-4.5 text-sage-600" />
              Client intake &amp; consent
            </h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-ghost px-3 py-1.5 text-xs">
                Edit intake form
              </button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Full name</label>
                  <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <input className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="label">Occupation</label>
                <input className="input" value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <label className="label">Presenting concern</label>
                <textarea className="input min-h-[70px]" value={form.presenting_concern} onChange={(e) => setForm({ ...form, presenting_concern: e.target.value })} placeholder="What brings them to therapy?" />
              </div>
              <div>
                <label className="label">Relevant history</label>
                <textarea className="input min-h-[70px]" value={form.relevant_history} onChange={(e) => setForm({ ...form, relevant_history: e.target.value })} placeholder="Background context" />
              </div>
              <label className="flex items-start gap-3 rounded-lg bg-sage-50 p-3.5">
                <input
                  type="checkbox"
                  checked={form.consent_given}
                  onChange={(e) => setForm({ ...form, consent_given: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-ink-300 text-sage-600 focus:ring-sage-500"
                />
                <span className="text-sm text-ink-700">
                  Client has given informed consent for treatment and data storage.
                </span>
              </label>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
                <button onClick={saveIntake} disabled={saving} className="btn-sage">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving…' : 'Save intake'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 px-5 py-4 text-sm">
              <IntakeRow label="Gender" value={client.gender} />
              <IntakeRow label="Occupation" value={client.occupation} />
              <IntakeRow label="Presenting concern" value={client.presenting_concern} />
              <IntakeRow label="Relevant history" value={client.relevant_history} />
              {!client.consent_given && !client.presenting_concern && (
                <p className="pt-2 text-sm text-ink-500">
                  No intake details yet. Click &ldquo;Edit intake form&rdquo; to complete intake.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Session history */}
        <div className="card">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="font-semibold text-ink-900">Session history</h2>
          </div>
          {sessions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">No sessions yet.</p>
          ) : (
            <div className="divide-y divide-ink-100">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{formatDateTime(s.starts_at)}</p>
                    <p className="text-xs text-ink-500">{s.duration_minutes} min · {formatRupees(s.price_cents)}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="font-semibold text-ink-900">Clinical notes</h2>
        </div>
        {notes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-500">
            No notes yet. Write notes from the Notes tab.
          </p>
        ) : (
          <div className="divide-y divide-ink-100">
            {notes.map((n) => (
              <div key={n.id} className="px-5 py-4">
                <p className="text-xs text-ink-400">{formatDate(n.created_at)}</p>
                <p className="mt-1.5 text-sm text-ink-700">{n.content}</p>
                {n.shared_summary && (
                  <div className="mt-2 rounded-lg bg-sage-50 px-3 py-2">
                    <p className="text-xs font-medium text-sage-700">Shared with client</p>
                    <p className="mt-0.5 text-sm text-sage-800">{n.shared_summary}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IntakeRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-3">
      <span className="w-32 shrink-0 text-ink-400">{label}</span>
      <span className="text-ink-800">{value || '—'}</span>
    </div>
  );
}
