import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users, Mail, Phone, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/Toast';
import type { Client } from '@/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, Spinner } from '@/components/Feedback';
import { formatDate } from '@/lib/format';

export function ClientsPage() {
  const { therapist } = useAuth();
  const { toasts, dismiss, success, error } = useToast();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!therapist) return;
    let cancelled = false;

    async function load() {
      if (!therapist) return;
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('therapist_id', therapist.id)
        .order('created_at', { ascending: false });
      if (cancelled) return;
      setClients((data as Client[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [therapist]);

  async function addClient() {
    if (!therapist) return;
    if (!form.full_name.trim()) {
      error('Full name is required');
      return;
    }
    setAdding(true);
    const { data, error: err } = await supabase
      .from('clients')
      .insert({
        therapist_id: therapist.id,
        full_name: form.full_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      })
      .select('*')
      .single();
    setAdding(false);
    if (err) {
      error(err.message);
      return;
    }
    setClients((prev) => [data as Client, ...prev]);
    setForm({ full_name: '', email: '', phone: '' });
    setShowAdd(false);
    success('Client added');
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.toLowerCase().includes(q) ?? false)
    );
  });

  if (loading || !therapist) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-sage-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink-900">Clients</h1>
          <p className="mt-1 text-sm text-ink-500">Manage your client roster, intake, and history.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-sage">
          <Plus className="h-4 w-4" />
          Add client
        </button>
      </div>

      {clients.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {clients.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No clients yet"
            description="Add your first client to start tracking sessions, notes, and payments."
            action={
              <button onClick={() => setShowAdd(true)} className="btn-sage">
                <Plus className="h-4 w-4" />
                Add your first client
              </button>
            }
          />
        </div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/app/clients/${c.id}`}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-sage-50"
            >
              <Avatar name={c.full_name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">{c.full_name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                  {c.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email}
                    </span>
                  )}
                  {c.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </span>
                  )}
                  <span>Added {formatDate(c.created_at)}</span>
                </div>
              </div>
              {c.consent_given ? (
                <span className="badge bg-sage-100 text-sage-700">Intake done</span>
              ) : (
                <span className="badge bg-gold-100 text-gold-800">Intake pending</span>
              )}
              <ChevronRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-ink-500">No clients match your search.</p>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-xl bg-white p-6 shadow-float">
            <h2 className="text-lg font-semibold text-ink-900">Add a new client</h2>
            <p className="mt-1 text-sm text-ink-500">You can fill in intake details later.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Full name</label>
                <input
                  className="input"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="label">Email (optional)</label>
                <input
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="label">Phone (optional)</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 ..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
              <button onClick={addClient} disabled={adding} className="btn-sage">
                {adding ? 'Adding…' : 'Add client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
