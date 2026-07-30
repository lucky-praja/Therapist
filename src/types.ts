export type TierKey = 'free' | 'pro' | 'clinic';

export interface Therapist {
  id: string;
  email: string;
  full_name: string;
  title: string;
  bio: string;
  specializations: string[];
  languages: string[];
  slug: string;
  buffer_minutes: number;
  default_session_price_cents: number;
  tier_key: TierKey;
  created_at: string;
}

export interface Client {
  id: string;
  therapist_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gender: string | null;
  occupation: string | null;
  presenting_concern: string | null;
  relevant_history: string | null;
  consent_given: boolean;
  created_at: string;
}

export interface Availability {
  id: string;
  therapist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
}

export type SessionStatus = 'booked' | 'completed' | 'cancelled' | 'no_show';

export interface Session {
  id: string;
  therapist_id: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  starts_at: string;
  duration_minutes: number;
  session_type: string;
  status: SessionStatus;
  price_cents: number;
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  therapist_id: string;
  client_id: string | null;
  session_id: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  gst_cents: number;
  net_cents: number;
  status: string;
  method: string;
  invoice_number: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  therapist_id: string;
  client_id: string;
  session_id: string | null;
  content: string;
  shared_summary: string | null;
  created_at: string;
}

export interface Package {
  id: string;
  therapist_id: string;
  name: string;
  session_count: number;
  price_cents: number;
  price_per_session_cents: number;
  expires_after_days: number | null;
  created_at: string;
}

export interface Message {
  id: string;
  therapist_id: string;
  client_id: string;
  sender: 'therapist' | 'client';
  content: string;
  created_at: string;
}

export interface PlanTier {
  key: TierKey;
  name: string;
  price_cents: number;
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: PlanTier[] = [
  {
    key: 'free',
    name: 'Free',
    price_cents: 0,
    period: 'forever',
    tagline: 'Everything you need to get started.',
    features: [
      'Branded booking page',
      'Up to 10 clients',
      'Weekly availability scheduling',
      'Clinical notes',
      'Basic dashboard',
    ],
  },
  {
    key: 'pro',
    name: 'Professional',
    price_cents: 499900,
    period: 'year',
    tagline: 'For growing private practices.',
    features: [
      'Unlimited clients',
      'Advanced analytics & revenue charts',
      'Razorpay checkout & GST invoices',
      'Session bundles & packages',
      'Real-time client messaging',
      'Custom branding',
    ],
    highlight: true,
  },
  {
    key: 'clinic',
    name: 'Clinic',
    price_cents: 1499900,
    period: 'year',
    tagline: 'For multi-therapist clinics.',
    features: [
      'Everything in Professional',
      'Multiple therapist seats',
      'Shared scheduling calendar',
      'Waitlists & cohort analysis',
      'Priority support',
    ],
  },
];

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
