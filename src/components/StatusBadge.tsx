import type { SessionStatus } from '@/types';

const statusConfig: Record<SessionStatus, { label: string; className: string; dot: string }> = {
  booked: { label: 'Upcoming', className: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  completed: { label: 'Completed', className: 'bg-sage-100 text-sage-700', dot: 'bg-sage-600' },
  cancelled: { label: 'Cancelled', className: 'bg-ink-100 text-ink-600', dot: 'bg-ink-400' },
  no_show: { label: 'No-show', className: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const cfg = statusConfig[status] ?? statusConfig.booked;
  return (
    <span className={`badge ${cfg.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export function PlanBadge({ tier }: { tier: string }) {
  const cfg: Record<string, string> = {
    free: 'bg-ink-100 text-ink-600',
    pro: 'bg-gold-100 text-gold-800',
    clinic: 'bg-sage-200 text-sage-800',
  };
  const labels: Record<string, string> = { free: 'Free', pro: 'Professional', clinic: 'Clinic' };
  return <span className={`badge ${cfg[tier] ?? cfg.free}`}>{labels[tier] ?? tier}</span>;
}
