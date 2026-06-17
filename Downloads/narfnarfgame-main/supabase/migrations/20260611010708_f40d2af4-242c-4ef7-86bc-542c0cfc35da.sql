-- Cutscenes catalog
CREATE TABLE public.cutscenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  power_category TEXT NOT NULL UNIQUE,
  video_path TEXT,
  duration_seconds INT NOT NULL DEFAULT 5 CHECK (duration_seconds BETWEEN 1 AND 60),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cutscenes_power_category_valid CHECK (
    power_category IN ('Fire','Biological','Electromagnetic','Atmospheric','Geological','Hydrological','Cosmic','SlowBurn')
  )
);
GRANT SELECT ON public.cutscenes TO authenticated;
GRANT ALL ON public.cutscenes TO service_role;
ALTER TABLE public.cutscenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read enabled cutscenes" ON public.cutscenes
  FOR SELECT TO authenticated
  USING (enabled = TRUE OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage cutscenes" ON public.cutscenes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER touch_cutscenes_updated_at
  BEFORE UPDATE ON public.cutscenes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- MEDUSA event log
CREATE TABLE public.medusa_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  event_type text,
  severity text,
  player_ref text,
  message text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_ip text,
  status text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.medusa_events TO authenticated;
GRANT ALL ON public.medusa_events TO service_role;
ALTER TABLE public.medusa_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view medusa events" ON public.medusa_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_medusa_events_created_at ON public.medusa_events (created_at DESC);
CREATE INDEX idx_medusa_events_direction ON public.medusa_events (direction);

-- Social profile fields
ALTER TABLE public.profiles
  ADD COLUMN username text,
  ADD COLUMN bio text,
  ADD COLUMN region text,
  ADD COLUMN onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN tour_step smallint NOT NULL DEFAULT 0,
  ADD COLUMN ui_mode text NOT NULL DEFAULT 'regular' CHECK (ui_mode IN ('regular','advanced'));
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_chk
  CHECK (username IS NULL OR username ~ '^[A-Za-z0-9_]{3,20}$');
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_len_chk CHECK (bio IS NULL OR length(bio) <= 120);
CREATE UNIQUE INDEX profiles_username_lower_uidx
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- Friends graph
CREATE TABLE public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending','accepted','blocked','declined','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT friends_no_self CHECK (requester_id <> addressee_id),
  CONSTRAINT friends_unique_pair UNIQUE (requester_id, addressee_id)
);
CREATE INDEX friends_addressee_idx ON public.friends(addressee_id);
CREATE INDEX friends_requester_idx ON public.friends(requester_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friends TO authenticated;
GRANT ALL ON public.friends TO service_role;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "friends view own" ON public.friends FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "friends insert own" ON public.friends FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "friends update own" ON public.friends FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (
    (auth.uid() = addressee_id AND status IN ('accepted','declined','blocked','pending'))
    OR (auth.uid() = requester_id AND status IN ('pending','cancelled'))
  );
CREATE POLICY "friends delete own" ON public.friends FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE TRIGGER friends_touch_updated
  BEFORE UPDATE ON public.friends
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Public profile view (safe subset)
CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, username, display_name, avatar_url, bio, region,
       prologue_choice, alignment_locked, created_at
FROM public.profiles;
ALTER VIEW public.public_profiles OWNER TO postgres;
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Hardened own-profile update policy
DROP POLICY IF EXISTS "update own profile (non-economy)" ON public.profiles;
CREATE POLICY "update own profile (non-economy)"
  ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND NOT (email IS DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (coins IS DISTINCT FROM (SELECT p.coins FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (bonus_multiplier IS DISTINCT FROM (SELECT p.bonus_multiplier FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (banned IS DISTINCT FROM (SELECT p.banned FROM public.profiles p WHERE p.id = auth.uid()))
    AND (
      NOT COALESCE((SELECT p.alignment_locked FROM public.profiles p WHERE p.id = auth.uid()), false)
      OR (
        NOT (prologue_choice IS DISTINCT FROM (SELECT p.prologue_choice FROM public.profiles p WHERE p.id = auth.uid()))
        AND alignment_locked = true
      )
    )
  );