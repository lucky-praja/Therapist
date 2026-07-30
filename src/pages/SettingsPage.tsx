import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  ExternalLink,
  Check,
  Lock,
  Sparkles,
  Copy,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/useToast';
import { ToastContainer } from '@/components/Toast';
import { PLANS, type TierKey } from '@/types';
import { PlanBadge } from '@/components/StatusBadge';
import { formatRupees } from '@/lib/format';

export function SettingsPage() {
  const { therapist, refreshTherapist } = useAuth();
  const { toasts, dismiss, success, error } = useToast();
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [form, setForm] = useState({
    full_name: therapist?.full_name ?? '',
    title: therapist?.title ?? '',
    bio: therapist?.bio ?? '',
    specializations: (therapist?.specializations ?? []).join(', '),
    languages: (therapist?.languages ?? []).join(', '),
    buffer_minutes: String(therapist?.buffer_minutes ?? 15),
  });

  if (!therapist) return null;

  const publicUrl = `${window.location.origin}/t/${therapist.slug}`;

  async function saveProfile() {
    if (!therapist) return;
    setSaving(true);
    const { error: err } = await supabase
      .from('therapists')
      .update({
        full_name: form.full_name.trim(),
        title: form.title.trim(),
        bio: form.bio.trim(),
        specializations: form.specializations
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        languages: form.languages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        buffer_minutes: Number(form.buffer_minutes) || 15,
      })
      .eq('id', therapist.id);
    setSaving(false);
    if (err) {
      error(err.message);
      return;
    }
    await refreshTherapist();
    success('Profile updated');
  }

  async function upgradePlan(tierKey: TierKey) {
    if (!therapist || tierKey === therapist.tier_key) return;
    setUpgrading(true);
    const { error: err } = await supabase
      .from('therapists')
      .update({ tier_key: tierKey })
      .eq('id', therapist.id);
    setUpgrading(false);
    if (err) {
      error(err.message);
      return;
    }
    await refreshTherapist();
    success(`Switched to ${tierKey === 'free' ? 'Free' : tierKey === 'pro' ? 'Professional' : 'Clinic'} plan`);
  }

  function copyLink() {
    navigator.clipboard.writeText(publicUrl);
    success('Link copied to clipboard');
  }

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div>
        <h1 className="font-serif text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Manage your profile, branded link, and subscription.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="card lg:col-span-2">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="font-semibold text-ink-900">Profile</h2>
          </div>
          <div className="space-y-4 px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Professional title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Licensed Therapist" />
              </div>
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea className="input min-h-[90px]" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell clients about your approach…" />
            </div>
            <div>
              <label className="label">Specializations (comma-separated)</label>
              <input className="input" value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} placeholder="Anxiety, CBT, Couples" />
            </div>
            <div>
              <label className="label">Languages (comma-separated)</label>
              <input className="input" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} placeholder="English, Hindi" />
            </div>
            <div className="max-w-xs">
              <label className="label">Buffer between sessions (minutes)</label>
              <input type="number" className="input" value={form.buffer_minutes} onChange={(e) => setForm({ ...form, buffer_minutes: e.target.value })} />
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={saveProfile} disabled={saving} className="btn-sage">
                <Save className="h-4 w-4" />
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Branded link */}
        <div className="card">
          <div className="border-b border-ink-100 px-5 py-4">
            <h2 className="font-semibold text-ink-900">Your branded link</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-ink-500">
              Share this link with clients for intake, booking, and payment.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2.5">
              <span className="flex-1 truncate text-sm text-ink-700">{publicUrl}</span>
              <button onClick={copyLink} className="text-ink-400 transition-colors hover:text-sage-700">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Link to={`/t/${therapist.slug}`} className="btn-outline mt-3 w-full">
              <ExternalLink className="h-4 w-4" />
              Preview your public page
            </Link>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="card">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-ink-900">Subscription</h2>
            <p className="mt-0.5 text-sm text-ink-500">Your current plan and available upgrades.</p>
          </div>
          <PlanBadge tier={therapist.tier_key} />
        </div>
        <div className="grid gap-5 px-5 py-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === therapist.tier_key;
            const isDowngrade = plan.key === 'free' && therapist.tier_key !== 'free';
            return (
              <div
                key={plan.key}
                className={`relative rounded-xl border p-5 ${
                  plan.highlight
                    ? 'border-sage-600 ring-1 ring-sage-600'
                    : 'border-ink-200'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gold-400 px-2.5 py-0.5 text-xs font-semibold text-gold-950">
                    Popular
                  </span>
                )}
                <h3 className="text-base font-semibold text-ink-900">{plan.name}</h3>
                <p className="mt-1 font-serif text-2xl font-semibold text-sage-900">
                  {plan.price_cents === 0 ? 'Free' : formatRupees(plan.price_cents)}
                  {plan.price_cents > 0 && <span className="text-sm font-normal text-ink-400">/{plan.period}</span>}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-ink-600">
                  {plan.features.slice(0, 4).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => upgradePlan(plan.key)}
                  disabled={isCurrent || upgrading}
                  className={`mt-5 w-full ${isCurrent ? 'btn-ghost cursor-default' : plan.highlight ? 'btn-sage' : 'btn-outline'}`}
                >
                  {isCurrent ? (
                    'Current plan'
                  ) : plan.key === 'clinic' && therapist.tier_key === 'free' ? (
                    <>
                      <Lock className="h-4 w-4" /> Upgrade
                    </>
                  ) : isDowngrade ? (
                    'Switch to Free'
                  ) : (
                    'Switch plan'
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
