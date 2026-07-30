import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  IndianRupee,
  TrendingUp,
  ArrowRight,
  Clock,
  CalendarOff,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Session, Client, Payment } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { EmptyState, Spinner } from '@/components/Feedback';
import { formatDateTime, formatRupees, relativeTime } from '@/lib/format';

interface DashboardData {
  upcoming: Session[];
  recentPayments: Payment[];
  totalClients: number;
  totalSessions: number;
  totalRevenue: number;
}

export function DashboardHome() {
  const { therapist } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!therapist) return;
    let cancelled = false;

    async function load() {
      if (!therapist) return;
      const [sessions, clients, payments] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('therapist_id', therapist.id)
          .order('starts_at', { ascending: true }),
        supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('therapist_id', therapist.id),
        supabase
          .from('payments')
          .select('amount_cents, created_at')
          .eq('therapist_id', therapist.id)
          .eq('status', 'paid'),
      ]);

      if (cancelled) return;

      const now = new Date().toISOString();
      const upcoming = (sessions.data as Session[] | null)?.filter(
        (s) => s.starts_at >= now && s.status === 'booked'
      ).slice(0, 5) ?? [];

      const recentPayments = (await supabase
        .from('payments')
        .select('*')
        .eq('therapist_id', therapist.id)
        .eq('status', 'paid')
        .order('created_at', { ascending: false })
        .limit(5)
      ).data as Payment[] | null;

      const totalRevenue = (payments.data as { amount_cents: number }[] | null)?.reduce(
        (sum, p) => sum + p.amount_cents,
        0
      ) ?? 0;

      setData({
        upcoming,
        recentPayments: recentPayments ?? [],
        totalClients: clients.count ?? 0,
        totalSessions: sessions.data?.length ?? 0,
        totalRevenue,
      });
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [therapist]);

  if (loading || !data || !therapist) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-sage-600" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Active clients',
      value: String(data.totalClients),
      icon: Users,
      to: '/app/clients',
    },
    {
      label: 'Total sessions',
      value: String(data.totalSessions),
      icon: CalendarDays,
      to: '/app/schedule',
    },
    {
      label: 'Total revenue',
      value: formatRupees(data.totalRevenue),
      icon: IndianRupee,
      to: '/app/payments',
    },
    {
      label: 'Upcoming',
      value: String(data.upcoming.length),
      icon: TrendingUp,
      to: '/app/analytics',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">
          Welcome back, {therapist.full_name.split(' ').slice(-1)[0]}
        </h1>
        <p className="mt-1 text-sm text-ink-500">Here&apos;s what&apos;s happening in your practice today.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card-hover group p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-100 text-sage-700">
                <s.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-500" />
            </div>
            <p className="mt-4 font-serif text-2xl font-semibold text-ink-900">{s.value}</p>
            <p className="text-sm text-ink-500">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming sessions */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="font-semibold text-ink-900">Upcoming sessions</h2>
            <Link to="/app/schedule" className="text-sm font-medium text-sage-700 hover:text-sage-800">
              View all
            </Link>
          </div>
          {data.upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarOff className="h-6 w-6" />}
              title="No upcoming sessions"
              description="When clients book through your branded link, sessions appear here."
              action={
                <Link to="/app/schedule" className="btn-sage">
                  Set availability
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-ink-100">
              {data.upcoming.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <Avatar name={s.client_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{s.client_name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-ink-500">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(s.starts_at)} · {s.duration_minutes} min
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent payments */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
            <h2 className="font-semibold text-ink-900">Recent payments</h2>
            <Link to="/app/payments" className="text-sm font-medium text-sage-700 hover:text-sage-800">
              View all
            </Link>
          </div>
          {data.recentPayments.length === 0 ? (
            <EmptyState
              icon={<IndianRupee className="h-6 w-6" />}
              title="No payments yet"
              description="Record a payment to generate an invoice."
            />
          ) : (
            <div className="divide-y divide-ink-100">
              {data.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-ink-900">{formatRupees(p.amount_cents)}</p>
                    <p className="text-xs text-ink-500">{relativeTime(p.created_at)}</p>
                  </div>
                  {p.invoice_number && (
                    <span className="badge bg-sage-100 text-sage-700">{p.invoice_number}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
