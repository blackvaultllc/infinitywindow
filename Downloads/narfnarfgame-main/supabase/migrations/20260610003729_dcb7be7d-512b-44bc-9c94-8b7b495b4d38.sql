
-- profiles new columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tour_step smallint NOT NULL DEFAULT 0;

-- username constraints
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_format_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_chk
  CHECK (username IS NULL OR username ~ '^[A-Za-z0-9_]{3,20}$');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_bio_len_chk;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_len_chk CHECK (bio IS NULL OR length(bio) <= 120);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uidx
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

-- Allow any authenticated user to view profiles (public-ish; sensitive economy fields stay protected by triggers)
DROP POLICY IF EXISTS "authenticated view profiles" ON public.profiles;
CREATE POLICY "authenticated view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- friends table (covers requests, accepted, blocks)
CREATE TABLE IF NOT EXISTS public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','accepted','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friends_no_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friends_unique_pair UNIQUE (requester_id, addressee_id)
);
CREATE INDEX IF NOT EXISTS friends_addressee_idx ON public.friends(addressee_id);
CREATE INDEX IF NOT EXISTS friends_requester_idx ON public.friends(requester_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friends TO authenticated;
GRANT ALL ON public.friends TO service_role;

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "friends view own" ON public.friends;
CREATE POLICY "friends view own" ON public.friends
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friends insert own" ON public.friends;
CREATE POLICY "friends insert own" ON public.friends
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "friends update own" ON public.friends;
CREATE POLICY "friends update own" ON public.friends
  FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friends delete own" ON public.friends;
CREATE POLICY "friends delete own" ON public.friends
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP TRIGGER IF EXISTS friends_touch_updated ON public.friends;
CREATE TRIGGER friends_touch_updated
  BEFORE UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
