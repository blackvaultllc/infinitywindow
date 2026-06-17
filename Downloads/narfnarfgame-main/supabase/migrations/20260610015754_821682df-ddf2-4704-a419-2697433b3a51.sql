
-- 1) Remove broad profiles SELECT; expose safe view instead
DROP POLICY IF EXISTS "authenticated view profiles" ON public.profiles;

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id, username, display_name, avatar_url, bio, region,
  prologue_choice, alignment_locked, created_at
FROM public.profiles;

ALTER VIEW public.public_profiles OWNER TO postgres;
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 2) Bind the alignment/economy guard trigger (function already exists)
DROP TRIGGER IF EXISTS guard_profile_economy_trg ON public.profiles;
CREATE TRIGGER guard_profile_economy_trg
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_economy();

-- 3) Defense-in-depth at the policy layer: lock prologue_choice when alignment_locked
DROP POLICY IF EXISTS "update own profile (non-economy)" ON public.profiles;
CREATE POLICY "update own profile (non-economy)"
  ON public.profiles
  FOR UPDATE
  TO authenticated
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

-- 4) Friends: prevent requester self-accept by constraining status transitions
DROP POLICY IF EXISTS "friends update own" ON public.friends;
CREATE POLICY "friends update own"
  ON public.friends
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id)
  WITH CHECK (
    (auth.uid() = addressee_id AND status IN ('accepted','declined','blocked','pending'))
    OR
    (auth.uid() = requester_id AND status IN ('pending','cancelled'))
  );
