import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Send, MessageSquare, Sparkles, Search, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/Toast';
import type { Message, Client } from '@/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, Spinner } from '@/components/Feedback';
import { relativeTime, formatTime } from '@/lib/format';

export function ChatPage() {
  const { therapist } = useAuth();
  const { toasts, dismiss, success } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!therapist) return;
    let cancelled = false;

    async function load() {
      if (!therapist) return;
      const cliRes = await supabase
        .from('clients')
        .select('*')
        .eq('therapist_id', therapist.id)
        .order('full_name');
      if (cancelled) return;
      const allClients = (cliRes.data as Client[]) ?? [];
      setClients(allClients);

      const msgRes = await supabase
        .from('messages')
        .select('*')
        .eq('therapist_id', therapist.id)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      const allMsgs = (msgRes.data as Message[]) ?? [];
      const grouped: Record<string, Message[]> = {};
      allMsgs.forEach((m) => {
        if (!grouped[m.client_id]) grouped[m.client_id] = [];
        grouped[m.client_id].push(m);
      });
      setMessages(grouped);
      setLoading(false);
    }

    load();

    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `therapist_id=eq.${therapist.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => ({
            ...prev,
            [msg.client_id]: [...(prev[msg.client_id] ?? []), msg],
          }));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [therapist]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeId]);

  async function sendMessage() {
    if (!therapist || !activeId || !draft.trim()) return;
    setSending(true);
    const { data, error } = await supabase
      .from('messages')
      .insert({
        therapist_id: therapist.id,
        client_id: activeId,
        sender: 'therapist',
        content: draft.trim(),
      })
      .select('*')
      .single();
    setSending(false);
    if (error) return;
    setMessages((prev) => ({
      ...prev,
      [activeId]: [...(prev[activeId] ?? []), data as Message],
    }));
    setDraft('');
  }

  async function simulateReply() {
    if (!therapist || !activeId) return;
    const replies = [
      'Thanks, that helps.',
      'Yes, I did the exercise.',
      'Can we move our session?',
      'That makes sense. See you then.',
    ];
    const content = replies[Math.floor(Math.random() * replies.length)];
    const { data } = await supabase
      .from('messages')
      .insert({
        therapist_id: therapist.id,
        client_id: activeId,
        sender: 'client',
        content,
      })
      .select('*')
      .single();
    if (data) {
      setMessages((prev) => ({
        ...prev,
        [activeId]: [...(prev[activeId] ?? []), data as Message],
      }));
      success('Client replied (demo)');
    }
  }

  const filteredClients = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const activeClient = clients.find((c) => c.id === activeId);
  const activeMessages = activeId ? messages[activeId] ?? [] : [];

  if (loading || !therapist) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-sage-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Messages</h1>
        <p className="mt-1 text-sm text-ink-500">Real-time chat with your clients.</p>
      </div>

      {clients.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<MessageSquare className="h-6 w-6" />}
            title="No clients to message"
            description="Add clients first to start a conversation."
            action={
              <Link to="/app/clients" className="btn-sage">Go to clients</Link>
            }
          />
        </div>
      ) : (
        <div className="card flex h-[600px] overflow-hidden">
          {/* Conversation list */}
          <div className={`flex w-72 shrink-0 flex-col border-r border-ink-100 ${activeId ? 'hidden md:flex' : 'flex'}`}>
            <div className="border-b border-ink-100 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  className="input pl-9 text-sm"
                  placeholder="Search clients"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {filteredClients.map((c) => {
                const msgList = messages[c.id] ?? [];
                const lastMsg = msgList.length > 0 ? msgList[msgList.length - 1] : null;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveId(c.id)}
                    className={`flex w-full items-center gap-3 border-b border-ink-50 px-3 py-3 text-left transition-colors ${
                      activeId === c.id ? 'bg-sage-50' : 'hover:bg-ink-50'
                    }`}
                  >
                    <Avatar name={c.full_name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{c.full_name}</p>
                      <p className="truncate text-xs text-ink-400">
                        {lastMsg ? lastMsg.content : 'No messages yet'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat panel */}
          {activeId && activeClient ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
                <button
                  onClick={() => setActiveId(null)}
                  className="text-ink-400 hover:text-ink-600 md:hidden"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <Avatar name={activeClient.full_name} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-900">{activeClient.full_name}</p>
                  {activeClient.email && <p className="text-xs text-ink-400">{activeClient.email}</p>}
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-sage-50/50 px-4 py-4 scrollbar-thin">
                {activeMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === 'therapist' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                        m.sender === 'therapist'
                          ? 'rounded-br-md bg-sage-700 text-white'
                          : 'rounded-bl-md bg-white text-ink-800 shadow-soft'
                      }`}
                    >
                      <p>{m.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          m.sender === 'therapist' ? 'text-sage-200' : 'text-ink-400'
                        }`}
                      >
                        {formatTime(m.created_at)} · {relativeTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {activeMessages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-ink-400">No messages yet. Say hello.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-ink-100 p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    className="input min-h-[42px] flex-1 resize-none"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                  />
                  <button onClick={sendMessage} disabled={sending || !draft.trim()} className="btn-sage shrink-0 px-3">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={simulateReply}
                  className="mt-2 flex items-center gap-1.5 text-xs text-ink-400 transition-colors hover:text-sage-700"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Simulate a client reply for demo
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden flex-1 items-center justify-center md:flex">
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" />}
                title="Choose a conversation"
                description="Choose a conversation from the list to start chatting."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
