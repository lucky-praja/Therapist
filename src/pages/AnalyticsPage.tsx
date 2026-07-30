import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, IndianRupee, CalendarDays, AlertCircle, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Session, Payment, TierKey } from '@/types';
import { Spinner } from '@/components/Feedback';
import { formatRupees, formatDate } from '@/lib/format';
import { Link } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  completed: '#466b54',
  booked: '#3b82f6',
  cancelled: '#828e97',
  no_show: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  booked: 'Upcoming',
  cancelled: 'Cancelled',
  no_show: 'No-show',
};

export function AnalyticsPage() {
  const { therapist } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const tier: TierKey = therapist?.tier_key ?? 'free';
  const advancedLocked = tier === 'free';

  useEffect(() => {
    if (!therapist) return;
    let cancelled = false;

    async function load() {
      if (!therapist) return;
      const [sessRes, payRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('*')
          .eq('therapist_id', therapist.id)
          .order('starts_at', { ascending: true }),
        supabase
          .from('payments')
          .select('*')
          .eq('therapist_id', therapist.id)
          .eq('status', 'paid')
          .order('created_at', { ascending: true }),
      ]);
      if (cancelled) return;
      setSessions((sessRes.data as Session[]) ?? []);
      setPayments((payRes.data as Payment[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [therapist]);

  const stats = useMemo(() => {
    const completed = sessions.filter((s) => s.status === 'completed').length;
    const noShow = sessions.filter((s) => s.status === 'no_show').length;
    const total = sessions.length;
    const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;
    const revenue = payments.reduce((sum, p) => sum + p.net_cents, 0);
    const activeClients = new Set(sessions.map((s) => s.client_id).filter(Boolean)).size;

    const statusCounts: Record<string, number> = {};
    sessions.forEach((s) => {
      statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
    });
    const statusData = Object.entries(statusCounts).map(([key, value]) => ({
      name: STATUS_LABELS[key] ?? key,
      key,
      value,
    }));

    const now = new Date();
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = d.toISOString();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      const monthTotal = payments
        .filter((p) => p.created_at >= monthStart && p.created_at < monthEnd)
        .reduce((sum, p) => sum + p.net_cents, 0);
      monthlyRevenue.push({
        month: d.toLocaleDateString('en-IN', { month: 'short' }),
        revenue: Math.round(monthTotal / 100),
      });
    }

    return {
      completed,
      noShow,
      noShowRate,
      total,
      revenue,
      activeClients,
      statusData,
      monthlyRevenue,
    };
  }, [sessions, payments]);

  if (loading || !therapist) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-sage-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Analytics</h1>
        <p className="mt-1 text-sm text-ink-500">Practice insights backed by real data aggregation.</p>
      </div>

      {advancedLocked ? (
        <div className="rounded-xl border border-gold-200 bg-gold-50 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-200 text-gold-800">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-gold-900">Advanced analytics locked</p>
              <p className="mt-0.5 text-sm text-gold-800">
                Monthly revenue trends, cohort analysis, and deeper breakdowns are available on Professional and Clinic plans.
              </p>
            </div>
            <Link to="/app/settings" className="btn-gold ml-auto shrink-0">
              View plans
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-500">Loading your practice insights…</p>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Total revenue" value={formatRupees(stats.revenue)} />
        <StatCard icon={CalendarDays} label="Total sessions" value={String(stats.total)} />
        <StatCard icon={TrendingUp} label="Active clients" value={String(stats.activeClients)} />
        <StatCard
          icon={AlertCircle}
          label="No-show rate"
          value={`${stats.noShowRate}%`}
          tone={stats.noShowRate > 15 ? 'warn' : 'normal'}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly revenue */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-ink-900">Monthly revenue (6 months)</h2>
          {advancedLocked ? (
            <LockedChart message="Payments will populate this chart." />
          ) : stats.monthlyRevenue.every((m) => m.revenue === 0) ? (
            <EmptyChart message="No revenue data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats.monthlyRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#466b54" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#466b54" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebedee" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#828e97' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#828e97' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #ebedee', fontSize: 12 }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#466b54"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Session status breakdown */}
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-ink-900">Session status breakdown</h2>
          {stats.statusData.length === 0 ? (
            <EmptyChart message="No sessions yet" />
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {stats.statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#828e97'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #ebedee', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.statusData.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s.key] ?? '#828e97' }}
                    />
                    <span className="text-ink-600">{s.name}</span>
                    <span className="ml-auto font-medium text-ink-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Session durations */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-ink-900">Session durations</h2>
          {advancedLocked ? (
            <LockedChart message="Upgrade to see session duration trends." />
          ) : sessions.length === 0 ? (
            <EmptyChart message="No sessions yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={sessions.slice(-10).map((s) => ({
                  name: formatDate(s.starts_at),
                  minutes: s.duration_minutes,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ebedee" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#828e97' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#828e97' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}m`} />
                <Tooltip
                  formatter={(v) => [`${v} min`, 'Duration']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #ebedee', fontSize: 12 }}
                />
                <Bar dataKey="minutes" fill="#7a9a83" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = 'normal',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: 'normal' | 'warn';
}) {
  return (
    <div className="card p-5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
          tone === 'warn' ? 'bg-gold-100 text-gold-700' : 'bg-sage-100 text-sage-700'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 font-serif text-2xl font-semibold text-ink-900">{value}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

function LockedChart({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-lg bg-ink-50">
      <Lock className="h-6 w-6 text-ink-300" />
      <p className="text-sm text-ink-400">{message}</p>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <p className="text-sm text-ink-400">{message}</p>
    </div>
  );
}
