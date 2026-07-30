import { useEffect, useState } from 'react';
import {
  CreditCard,
  IndianRupee,
  Plus,
  Download,
  Package,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/Toast';
import type { Payment, Client, Session, Package as PackageType, TierKey } from '@/types';
import { Avatar } from '@/components/Avatar';
import { EmptyState, Spinner } from '@/components/Feedback';
import {
  formatRupees,
  formatRupeesDecimal,
  formatDate,
  generateInvoiceNumber,
} from '@/lib/format';

const PLATFORM_FEE_RATE = 0.02;
const GST_RATE = 0.18;

export function PaymentsPage() {
  const { therapist } = useAuth();
  const { toasts, dismiss, success, error } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [invoice, setInvoice] = useState<Payment | null>(null);
  const [creatingPkg, setCreatingPkg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ client_id: '', session_id: '', amount: '', method: 'razorpay' });
  const [pkgForm, setPkgForm] = useState({ name: '', session_count: '6', price: '', expires: '90' });

  const tier: TierKey = therapist?.tier_key ?? 'free';
  const canUsePackages = tier === 'pro' || tier === 'clinic';

  useEffect(() => {
    if (!therapist) return;
    let cancelled = false;

    async function load() {
      if (!therapist) return;
      const [payRes, cliRes, sessRes, pkgRes] = await Promise.all([
        supabase
          .from('payments')
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
        supabase
          .from('packages')
          .select('*')
          .eq('therapist_id', therapist.id)
          .order('created_at', { ascending: false }),
      ]);
      if (cancelled) return;
      setPayments((payRes.data as Payment[]) ?? []);
      setClients((cliRes.data as Client[]) ?? []);
      setSessions((sessRes.data as Session[]) ?? []);
      setPackages((pkgRes.data as PackageType[]) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [therapist]);

  async function recordPayment() {
    if (!therapist) return;
    if (!form.client_id) {
      error('Select a client');
      return;
    }
    const amountCents = Math.round(Number(form.amount) * 100);
    if (!amountCents || amountCents <= 0) {
      error('Enter a valid amount');
      return;
    }
    setSaving(true);
    const platformFee = Math.round(amountCents * PLATFORM_FEE_RATE);
    const gst = Math.round(platformFee * GST_RATE);
    const net = amountCents - platformFee - gst;
    const invoiceNumber = generateInvoiceNumber();

    const { data, error: err } = await supabase
      .from('payments')
      .insert({
        therapist_id: therapist.id,
        client_id: form.client_id,
        session_id: form.session_id || null,
        amount_cents: amountCents,
        platform_fee_cents: platformFee,
        gst_cents: gst,
        net_cents: net,
        status: 'paid',
        method: form.method,
        invoice_number: invoiceNumber,
      })
      .select('*')
      .single();
    setSaving(false);
    if (err) {
      error(err.message);
      return;
    }
    const newPayment = data as Payment;
    setPayments((prev) => [newPayment, ...prev]);
    setForm({ client_id: '', session_id: '', amount: '', method: 'razorpay' });
    setRecording(false);
    success('Payment captured & invoice generated');
    setInvoice(newPayment);
  }

  async function createPackage() {
    if (!therapist) return;
    if (!pkgForm.name.trim()) {
      error('Package name is required');
      return;
    }
    const count = Number(pkgForm.session_count);
    const priceCents = Math.round(Number(pkgForm.price) * 100);
    if (!count || count < 1) {
      error('Enter a valid session count');
      return;
    }
    if (!priceCents || priceCents <= 0) {
      error('Enter a valid price');
      return;
    }
    setSaving(true);
    const { data, error: err } = await supabase
      .from('packages')
      .insert({
        therapist_id: therapist.id,
        name: pkgForm.name.trim(),
        session_count: count,
        price_cents: priceCents,
        price_per_session_cents: Math.round(priceCents / count),
        expires_after_days: Number(pkgForm.expires) || null,
      })
      .select('*')
      .single();
    setSaving(false);
    if (err) {
      error(err.message);
      return;
    }
    setPackages((prev) => [data as PackageType, ...prev]);
    setPkgForm({ name: '', session_count: '6', price: '', expires: '90' });
    setCreatingPkg(false);
    success('Package created');
  }

  const clientName = (id: string | null) =>
    clients.find((c) => c.id === id)?.full_name ?? '—';
  const clientSessions = sessions.filter((s) => s.client_id === form.client_id);
  const totalRevenue = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.net_cents, 0);

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
          <h1 className="font-serif text-2xl font-semibold text-ink-900">Payments</h1>
          <p className="mt-1 text-sm text-ink-500">Track payments, create packages, and generate invoices.</p>
        </div>
        {clients.length > 0 && (
          <button onClick={() => setRecording(true)} className="btn-sage">
            <Plus className="h-4 w-4" />
            Record a payment
          </button>
        )}
      </div>

      {/* Revenue summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-ink-500">
            <IndianRupee className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Net revenue</span>
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold text-ink-900">{formatRupees(totalRevenue)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-ink-500">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Payments recorded</span>
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold text-ink-900">{payments.length}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-ink-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Avg. per session</span>
          </div>
          <p className="mt-2 font-serif text-2xl font-semibold text-ink-900">
            {payments.length > 0
              ? formatRupees(Math.round(payments.reduce((s, p) => s + p.amount_cents, 0) / payments.length))
              : '—'}
          </p>
        </div>
      </div>

      {/* Payments list */}
      <div className="card">
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 className="font-semibold text-ink-900">All paid sessions</h2>
        </div>
        {payments.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="No payments recorded"
            description="Record a payment to generate an invoice."
            action={
              clients.length > 0 ? (
                <button onClick={() => setRecording(true)} className="btn-sage">
                  <Plus className="h-4 w-4" />
                  Record a payment
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y divide-ink-100">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                <Avatar name={clientName(p.client_id)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{clientName(p.client_id)}</p>
                  <p className="text-xs text-ink-500">
                    {formatDate(p.created_at)} · {p.method.toUpperCase()} · {formatRupees(p.amount_cents)}
                  </p>
                </div>
                <span className="badge bg-sage-100 text-sage-700">Net {formatRupees(p.net_cents)}</span>
                {p.invoice_number && (
                  <button
                    onClick={() => setInvoice(p)}
                    className="btn-ghost px-2.5 py-1.5 text-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    GST Invoice
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Packages */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-ink-900">
            <Package className="h-4.5 w-4.5 text-sage-600" />
            Session packages
          </h2>
          {canUsePackages ? (
            <button onClick={() => setCreatingPkg(true)} className="btn-outline px-3 py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Create package
            </button>
          ) : (
            <span className="badge bg-gold-100 text-gold-800">
              <Lock className="h-3 w-3" /> Pro required
            </span>
          )}
        </div>

        {!canUsePackages ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-ink-600">Packages require a higher plan.</p>
            <p className="mt-1 text-xs text-ink-400">Create bundles of 3, 6, or 12 sessions on Professional and Clinic plans.</p>
          </div>
        ) : packages.length === 0 ? (
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No packages"
            description="Bundle sessions at a per-session rate with expiry."
            action={
              <button onClick={() => setCreatingPkg(true)} className="btn-sage">
                <Plus className="h-4 w-4" />
                Create package
              </button>
            }
          />
        ) : (
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            {packages.map((pkg) => (
              <div key={pkg.id} className="rounded-lg border border-ink-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink-900">{pkg.name}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {pkg.session_count} sessions · expires in {pkg.expires_after_days ?? '—'} days
                    </p>
                  </div>
                  <span className="badge bg-sage-100 text-sage-700">{formatRupees(pkg.price_cents)}</span>
                </div>
                <p className="mt-3 text-sm text-ink-600">
                  {formatRupees(pkg.price_per_session_cents)} per session
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record payment modal */}
      {recording && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-xl bg-white p-6 shadow-float">
            <h2 className="text-lg font-semibold text-ink-900">Record a payment</h2>
            <div className="mt-5 space-y-4">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount (₹)</label>
                  <input
                    type="number"
                    className="input"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="1500"
                  />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select
                    className="input"
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                  >
                    <option value="razorpay">Razorpay</option>
                    <option value="upi">UPI</option>
                    <option value="bank">Bank transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setRecording(false)} className="btn-ghost">Cancel</button>
              <button onClick={recordPayment} disabled={saving} className="btn-sage">
                {saving ? 'Processing…' : 'Capture payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create package modal */}
      {creatingPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
          <div className="animate-scale-in w-full max-w-md rounded-xl bg-white p-6 shadow-float">
            <h2 className="text-lg font-semibold text-ink-900">Create a session package</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Package name</label>
                <input className="input" value={pkgForm.name} onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })} placeholder="6-Session CBT Package" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Sessions</label>
                  <input type="number" className="input" value={pkgForm.session_count} onChange={(e) => setPkgForm({ ...pkgForm, session_count: e.target.value })} />
                </div>
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" className="input" value={pkgForm.price} onChange={(e) => setPkgForm({ ...pkgForm, price: e.target.value })} placeholder="8100" />
                </div>
                <div>
                  <label className="label">Expires (days)</label>
                  <input type="number" className="input" value={pkgForm.expires} onChange={(e) => setPkgForm({ ...pkgForm, expires: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setCreatingPkg(false)} className="btn-ghost">Cancel</button>
              <button onClick={createPackage} disabled={saving} className="btn-sage">
                {saving ? 'Creating…' : 'Create package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {invoice && (
        <InvoiceModal payment={invoice} clientName={clientName(invoice.client_id)} onClose={() => setInvoice(null)} />
      )}
    </div>
  );
}

function InvoiceModal({
  payment,
  clientName,
  onClose,
}: {
  payment: Payment;
  clientName: string;
  onClose: () => void;
}) {
  const subtotal = payment.amount_cents;
  const platformFee = payment.platform_fee_cents;
  const gst = payment.gst_cents;
  const net = payment.net_cents;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 p-4 backdrop-blur-sm">
      <div className="animate-scale-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-float">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-ink-900">GST Invoice</h2>
          <button onClick={onClose} className="btn-ghost px-2.5 py-1.5 text-xs">
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-serif text-xl font-semibold text-sage-800">Unfazed</p>
              <p className="text-xs text-ink-400">Practice Management Pvt. Ltd.</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-ink-900">{payment.invoice_number}</p>
              <p className="text-xs text-ink-400">{formatDate(payment.created_at)}</p>
            </div>
          </div>

          <div className="my-5 border-t border-dashed border-ink-200" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Billed to</p>
              <p className="mt-1 font-medium text-ink-900">{clientName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Payment method</p>
              <p className="mt-1 font-medium text-ink-900">{payment.method.toUpperCase()}</p>
            </div>
          </div>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-ink-100">
                <td className="py-3 text-ink-800">Therapy session</td>
                <td className="py-3 text-right text-ink-800">{formatRupeesDecimal(subtotal)}</td>
              </tr>
              <tr>
                <td className="py-2 text-ink-500">Platform fee (2%)</td>
                <td className="py-2 text-right text-ink-500">−{formatRupeesDecimal(platformFee)}</td>
              </tr>
              <tr>
                <td className="py-2 text-ink-500">GST (18%)</td>
                <td className="py-2 text-right text-ink-500">−{formatRupeesDecimal(gst)}</td>
              </tr>
              <tr className="border-t-2 border-sage-600">
                <td className="pt-3 font-semibold text-ink-900">Net payable</td>
                <td className="pt-3 text-right font-serif text-lg font-semibold text-sage-800">
                  {formatRupeesDecimal(net)}
                </td>
              </tr>
            </tbody>
          </table>

          <p className="mt-6 text-center text-xs text-ink-400">
            This is a computer-generated invoice and does not require a signature.
          </p>
        </div>
        <div className="border-t border-ink-100 px-6 py-4">
          <button
            onClick={() => window.print()}
            className="btn-outline w-full"
          >
            <Download className="h-4 w-4" />
            Download / Print
          </button>
        </div>
      </div>
    </div>
  );
}
