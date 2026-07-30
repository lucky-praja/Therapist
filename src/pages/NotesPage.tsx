import { useEffect, useState } from 'react';
import { FileText, Save, Plus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/Toast';
import type { Note, Client, Session } from '@/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, Spinner } from '@/components/Feedback';
import { formatDate, relativeTime } from '@/lib/format';

export function NotesPage() {
  const { therapist } = useAuth();
  const { toasts, dismiss, success, error } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [writing, setWriting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: '', session_id: '', content: '', shared_summary: '' });

  useEffect(() => {
    if (!therapist) return;
    let cancelled = false;

    async function load() {
      if (!therapist) return;
      const [notesRes, clientsRes, sessRes] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('therapist_id', therapist.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('*')
          .eq('therapist_id', therapist.id)
          .order('full_name'),
        supabase
          .from('sessions')
          .select('*')
          .eq('therapist_id', therapist.id)
          .order('starts_at', { ascending: false }),
      ]);
      if (cancelled) return;
      setNotes((notesRes.data as Note[]) ?? []);
      setClients((clientsRes.data as Client[]) ?? []);
      setSessions((sessRes.data as Session[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [therapist]);

  async function saveNote() {
    if (!therapist) return;
    if (!form.client_id) {
      error('Select a client first');
      return;
    }
    if (!form.content.trim()) {
      error('Write something before saving');
      return;
    }
    setSaving(true);
    const { data, error: err } = await supabase
      .from('notes')
      .insert({
        therapist_id: therapist.id,
        client_id: form.client_id,
        session_id: form.session_id || null,
        content: form.content.trim(),
        shared_summary: form.shared_summary.trim() || null,
      })
      .select('*')
      .single();
    setSaving(false);
    if (err) {
      error(err.message);
      return;
    }
    setNotes((prev) => [data as Note, ...prev]);
    setForm({ client_id: '', session_id: '', content: '', shared_summary: '' });
    setWriting(false);
    success('Note saved');
  }

  const clientName = (id: string) => clients.find((c) => c.id === id)?.full_name ?? 'Unknown';
  const clientSessions = sessions.filter((s) => s.client_id === form.client_id);

  const filtered = notes.filter((n) => {
    if (!search) return true;
    const name = clientName(n.client_id).toLowerCase();
    return (
      name.includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
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
          <h1 className="font-serif text-2xl font-semibold text-ink-900">Clinical notes</h1>
          <p className="mt-1 text-sm text-ink-500">Write session notes and share a summary with clients.</p>
        </div>
        {clients.length > 0 && (
          <button onClick={() => setWriting(true)} className="btn-sage">
            <Plus className="h-4 w-4" />
            Write a clinical note
          </button>
        )}
      </div>

      {notes.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search notes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {notes.length === 0 && !writing ? (
        <div className="card">
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No notes yet"
            description="Write your first clinical note after a session."
            action={
              clients.length > 0 ? (
                <button onClick={() => setWriting(true)} className="btn-sage">
                  <Plus className="h-4 w-4" />
                  Write your first note
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <div key={n.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={clientName(n.client_id)} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{clientName(n.client_id)}</p>
                  <p className="text-xs text-ink-400">{formatDate(n.created_at)} · {relativeTime(n.created_at)}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-700">{n.content}</p>
              {n.shared_summary && (
                <div className="mt-3 rounded-lg bg-sage-50 px-3.5 py-2.5">
                  <p className="text-xs font-semibold text-sage-700">Shared summary (visible to client)</p>
                  <p className="mt-0.5 text-sm text-sage-800">{n.shared_summary}</p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-ink-500">No notes match your search.</p>
          )}
        </div>
      )}

      {writing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
          <div className="animate-scale-in flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-float">
            <div className="border-b border-ink-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-ink-900">Write a clinical note</h2>
            </div>
            <div className="space-y-4 overflow-y-auto px-6 py-5 scrollbar-thin">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Select a client</label>
                  <select
                    className="input"
                    value={form.client_id}
                    onChange={(e) => setForm({ ...form, client_id: e.target.value, session_id: '' })}
                  >
                    <option value="">Select…</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Link to session (optional)</label>
                  <select
                    className="input"
                    value={form.session_id}
                    onChange={(e) => setForm({ ...form, session_id: e.target.value })}
                    disabled={!form.client_id}
                  >
                    <option value="">No specific session</option>
                    {clientSessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · {s.status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Clinical note (private)</label>
                <textarea
                  className="input min-h-[120px]"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write freely…"
                />
              </div>
              <div>
                <label className="label">Shared summary (visible to client)</label>
                <textarea
                  className="input min-h-[70px]"
                  value={form.shared_summary}
                  onChange={(e) => setForm({ ...form, shared_summary: e.target.value })}
                  placeholder="A short summary the client can see…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-ink-100 px-6 py-4">
              <button onClick={() => setWriting(false)} className="btn-ghost">Cancel</button>
              <button onClick={saveNote} disabled={saving} className="btn-sage">
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
