/*
# Unfazed — Therapist Practice Management Schema

Creates the complete data model for a therapist practice-management platform.
Therapists sign in (email/password) and each owns their own clients, sessions,
availability, payments, notes, packages, and messages.

## Tables

1. `therapists` — public profile + account settings for each therapist.
   Linked 1:1 to `auth.users`. Holds display name, title, bio, specializations,
   languages, branded slug, buffer between sessions, and subscription tier.
2. `clients` — a therapist's client roster with intake & consent data.
3. `availability` — recurring weekly availability slots (day-of-week + start/end).
4. `sessions` — booked sessions: date/time, duration, type, price, status.
5. `payments` — recorded payments with platform fee, GST, and invoice number.
6. `notes` — clinical notes attached to a client (optionally to a session).
7. `packages` — session bundles (N sessions at a per-session rate with expiry).
8. `messages` — real-time chat between therapist and client.

## Security

- RLS enabled on every table.
- `therapists.id = auth.uid()` is the ownership root; child tables reference
  `therapist_id` and policies check ownership through that foreign key.
- 4 policies per table (select/insert/update/delete), scoped to `authenticated`.
- `therapist_id` columns default to `auth.uid()` so client inserts omitting the
  owner still succeed.

## Notes

- All timestamp columns are `timestamptz`, default `now()`.
- `price_cents` / `amount_cents` use integers (paise) to avoid float errors.
*/

-- ============ therapists ============
CREATE TABLE IF NOT EXISTS therapists (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT 'Licensed Therapist',
  bio text NOT NULL DEFAULT '',
  specializations text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{English}',
  slug text UNIQUE NOT NULL,
  buffer_minutes int NOT NULL DEFAULT 15,
  default_session_price_cents int NOT NULL DEFAULT 150000,
  tier_key text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_therapist" ON therapists;
CREATE POLICY "select_own_therapist" ON therapists FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_therapist" ON therapists;
CREATE POLICY "insert_own_therapist" ON therapists FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_therapist" ON therapists;
CREATE POLICY "update_own_therapist" ON therapists FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_therapist" ON therapists;
CREATE POLICY "delete_own_therapist" ON therapists FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- ============ clients ============
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL DEFAULT auth.uid() REFERENCES therapists(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  gender text,
  occupation text,
  presenting_concern text,
  relevant_history text,
  consent_given boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_clients" ON clients;
CREATE POLICY "select_own_clients" ON clients FOR SELECT
  TO authenticated USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "insert_own_clients" ON clients;
CREATE POLICY "insert_own_clients" ON clients FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "update_own_clients" ON clients;
CREATE POLICY "update_own_clients" ON clients FOR UPDATE
  TO authenticated USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "delete_own_clients" ON clients;
CREATE POLICY "delete_own_clients" ON clients FOR DELETE
  TO authenticated USING (auth.uid() = therapist_id);

-- ============ availability ============
CREATE TABLE IF NOT EXISTS availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL DEFAULT auth.uid() REFERENCES therapists(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time text NOT NULL,
  end_time text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_availability" ON availability;
CREATE POLICY "select_own_availability" ON availability FOR SELECT
  TO authenticated USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "insert_own_availability" ON availability;
CREATE POLICY "insert_own_availability" ON availability FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "update_own_availability" ON availability;
CREATE POLICY "update_own_availability" ON availability FOR UPDATE
  TO authenticated USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "delete_own_availability" ON availability;
CREATE POLICY "delete_own_availability" ON availability FOR DELETE
  TO authenticated USING (auth.uid() = therapist_id);

-- ============ sessions ============
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL DEFAULT auth.uid() REFERENCES therapists(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  client_name text NOT NULL DEFAULT '',
  client_email text,
  starts_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  session_type text NOT NULL DEFAULT 'standard',
  status text NOT NULL DEFAULT 'booked',
  price_cents int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions" ON sessions;
CREATE POLICY "select_own_sessions" ON sessions FOR SELECT
  TO authenticated USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "insert_own_sessions" ON sessions;
CREATE POLICY "insert_own_sessions" ON sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "update_own_sessions" ON sessions;
CREATE POLICY "update_own_sessions" ON sessions FOR UPDATE
  TO authenticated USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "delete_own_sessions" ON sessions;
CREATE POLICY "delete_own_sessions" ON sessions FOR DELETE
  TO authenticated USING (auth.uid() = therapist_id);

-- ============ payments ============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL DEFAULT auth.uid() REFERENCES therapists(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  amount_cents int NOT NULL DEFAULT 0,
  platform_fee_cents int NOT NULL DEFAULT 0,
  gst_cents int NOT NULL DEFAULT 0,
  net_cents int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid',
  method text NOT NULL DEFAULT 'razorpay',
  invoice_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "insert_own_payments" ON payments;
CREATE POLICY "insert_own_payments" ON payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "update_own_payments" ON payments;
CREATE POLICY "update_own_payments" ON payments FOR UPDATE
  TO authenticated USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "delete_own_payments" ON payments;
CREATE POLICY "delete_own_payments" ON payments FOR DELETE
  TO authenticated USING (auth.uid() = therapist_id);

-- ============ notes ============
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL DEFAULT auth.uid() REFERENCES therapists(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  shared_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
  TO authenticated USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
  TO authenticated USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
  TO authenticated USING (auth.uid() = therapist_id);

-- ============ packages ============
CREATE TABLE IF NOT EXISTS packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL DEFAULT auth.uid() REFERENCES therapists(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  session_count int NOT NULL DEFAULT 1,
  price_cents int NOT NULL DEFAULT 0,
  price_per_session_cents int NOT NULL DEFAULT 0,
  expires_after_days int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_packages" ON packages;
CREATE POLICY "select_own_packages" ON packages FOR SELECT
  TO authenticated USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "insert_own_packages" ON packages;
CREATE POLICY "insert_own_packages" ON packages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "update_own_packages" ON packages;
CREATE POLICY "update_own_packages" ON packages FOR UPDATE
  TO authenticated USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "delete_own_packages" ON packages;
CREATE POLICY "delete_own_packages" ON packages FOR DELETE
  TO authenticated USING (auth.uid() = therapist_id);

-- ============ messages ============
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid NOT NULL DEFAULT auth.uid() REFERENCES therapists(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  sender text NOT NULL DEFAULT 'therapist',
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_messages" ON messages;
CREATE POLICY "select_own_messages" ON messages FOR SELECT
  TO authenticated USING (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "insert_own_messages" ON messages;
CREATE POLICY "insert_own_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "update_own_messages" ON messages;
CREATE POLICY "update_own_messages" ON messages FOR UPDATE
  TO authenticated USING (auth.uid() = therapist_id) WITH CHECK (auth.uid() = therapist_id);

DROP POLICY IF EXISTS "delete_own_messages" ON messages;
CREATE POLICY "delete_own_messages" ON messages FOR DELETE
  TO authenticated USING (auth.uid() = therapist_id);

-- ============ indexes ============
CREATE INDEX IF NOT EXISTS idx_clients_therapist ON clients(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_therapist ON sessions(therapist_id);
CREATE INDEX IF NOT EXISTS idx_sessions_starts_at ON sessions(starts_at);
CREATE INDEX IF NOT EXISTS idx_payments_therapist ON payments(therapist_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_availability_therapist ON availability(therapist_id);
CREATE INDEX IF NOT EXISTS idx_notes_client ON notes(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_client ON messages(client_id, created_at);
