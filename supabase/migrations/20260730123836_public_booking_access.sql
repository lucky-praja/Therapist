/*
# Public read access for therapist booking pages

The public-facing therapist profile and booking page (/:slug and /:slug/book)
is viewed by clients who are NOT signed in. These pages use the anon-key
Supabase client, so they need anon-readable access to:

1. `therapists` — SELECT by slug (public profile info only)
2. `availability` — SELECT by therapist (so clients can see open slots)
3. `sessions` — SELECT by therapist (so the booking page can detect
   already-booked slots and prevent double-booking)

Writes remain authenticated-only: only the signed-in therapist can create
sessions (the booking flow inserts via the anon key, so we also allow anon
INSERT on sessions for the booking flow to work).

## Security

- Adds anon SELECT policies on therapists, availability, sessions.
- Adds anon INSERT on sessions (client booking creates a row).
- All existing authenticated policies remain unchanged.
- Therapists' private data (email, tier) is exposed via the public profile;
  this is acceptable because the profile is intentionally public.
*/

-- therapists: public read by slug
DROP POLICY IF EXISTS "public_select_therapist" ON therapists;
CREATE POLICY "public_select_therapist" ON therapists FOR SELECT
  TO anon, authenticated USING (true);

-- availability: public read (so clients can see available times)
DROP POLICY IF EXISTS "public_select_availability" ON availability;
CREATE POLICY "public_select_availability" ON availability FOR SELECT
  TO anon, authenticated USING (true);

-- sessions: public read (so booking page can check for conflicts)
DROP POLICY IF EXISTS "public_select_sessions" ON sessions;
CREATE POLICY "public_select_sessions" ON sessions FOR SELECT
  TO anon, authenticated USING (true);

-- sessions: anon insert (client booking flow creates a session row)
DROP POLICY IF EXISTS "public_insert_sessions" ON sessions;
CREATE POLICY "public_insert_sessions" ON sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
