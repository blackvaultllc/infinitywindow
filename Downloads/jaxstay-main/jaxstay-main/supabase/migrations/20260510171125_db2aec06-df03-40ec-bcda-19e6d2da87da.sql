
-- 1) PROFILES: drop blanket SELECT policies, expose safe columns via view
DROP POLICY IF EXISTS "Authenticated reads public profile columns" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous reads public profile columns" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id, full_name, avatar_url, city, state, bio,
  is_sitter, sitter_headline, sitter_rate, sitter_years_experience,
  sitter_services, sitter_gallery, sitter_test_passed_at,
  accepts_dogs, accepts_cats, max_pet_weight_lbs,
  inactive, hide_past_pets, created_at, updated_at
FROM public.profiles;

-- The view needs a permissive SELECT policy on profiles for non-owners limited to public-safe scope.
-- Since views with security_invoker run as the caller, add a policy returning public-safe rows.
CREATE POLICY "Public profile rows readable"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);
-- NOTE: Above still allows column access via direct table queries. To truly hide columns,
-- revoke column privileges from anon/authenticated on sensitive columns.
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, full_name, avatar_url, city, state, bio,
  is_sitter, sitter_headline, sitter_rate, sitter_years_experience,
  sitter_services, sitter_gallery, sitter_test_passed_at,
  accepts_dogs, accepts_cats, max_pet_weight_lbs,
  inactive, hide_past_pets, created_at, updated_at
) ON public.profiles TO anon, authenticated;
-- Owner still needs full row access; owners read via SECURITY DEFINER get_my_profile() or via service role.
-- Allow authenticated to also see their own sensitive columns through a separate grant pattern:
-- We will keep get_my_profile() as the canonical owner-self full read.
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow authenticated owner to update/insert all columns still (RLS unchanged); grants for write needed:
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- 2) BOOKINGS: attach the existing tamper-prevention trigger
DROP TRIGGER IF EXISTS prevent_booking_financial_tampering_trg ON public.bookings;
CREATE TRIGGER prevent_booking_financial_tampering_trg
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.prevent_booking_financial_tampering();

-- 3) SITTER TEST: prevent client self-grading
DROP POLICY IF EXISTS "Sitter insert own results" ON public.sitter_test_results;
-- No INSERT policy = only service_role (via edge function) can insert.

-- Block clients from setting verification fields directly on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_sitter_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN NEW; END IF;
  IF public.has_role(auth.uid(), 'admin') THEN RETURN NEW; END IF;
  IF NEW.sitter_test_passed_at IS DISTINCT FROM OLD.sitter_test_passed_at
     OR NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id
     OR NEW.stripe_payouts_enabled IS DISTINCT FROM OLD.stripe_payouts_enabled
     OR NEW.stripe_charges_enabled IS DISTINCT FROM OLD.stripe_charges_enabled
     OR NEW.stripe_onboarding_complete IS DISTINCT FROM OLD.stripe_onboarding_complete
  THEN
    RAISE EXCEPTION 'Cannot modify protected profile fields from client.';
  END IF;
  -- Allow setting is_sitter only if test passed
  IF NEW.is_sitter = true AND (OLD.is_sitter IS DISTINCT FROM true)
     AND NEW.sitter_test_passed_at IS NULL THEN
    RAISE EXCEPTION 'Must pass sitter test before becoming a sitter.';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS prevent_profile_sitter_escalation_trg ON public.profiles;
CREATE TRIGGER prevent_profile_sitter_escalation_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_sitter_escalation();

-- 4) Tighten SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_booking_financial_tampering() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_sitter_escalation() FROM anon, authenticated, public;
-- has_role and get_my_profile are intentionally callable by signed-in users.
