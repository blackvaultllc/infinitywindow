-- ============ PROFILES: restrict PII via column GRANTs + owner RPC ============
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Owner reads own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Authenticated reads public profile columns"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Anonymous reads public profile columns"
  ON public.profiles FOR SELECT TO anon
  USING (true);

REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

GRANT SELECT (
  id, full_name, city, state, bio, avatar_url, is_sitter,
  sitter_headline, sitter_rate, sitter_services, sitter_years_experience,
  sitter_gallery, sitter_test_passed_at, accepts_dogs, accepts_cats,
  max_pet_weight_lbs, inactive, hide_past_pets, created_at, updated_at
) ON public.profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- ============ PETS: owner-only + sitters on accepted booking ============
DROP POLICY IF EXISTS "Pets viewable by everyone" ON public.pets;

CREATE POLICY "Sitters view pets for accepted bookings"
  ON public.pets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.pet_id = pets.id
        AND b.sitter_id = auth.uid()
        AND b.status IN ('accepted','completed')
    )
  );

-- ============ BOOKINGS: trigger blocks tampering with financial fields ============
CREATE OR REPLACE FUNCTION public.prevent_booking_financial_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service role / non-authenticated context (admin client, webhooks)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  -- Allow admins
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;
  -- Block changes to financial / identity fields
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id
     OR NEW.sitter_id IS DISTINCT FROM OLD.sitter_id
     OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
     OR NEW.payout_released IS DISTINCT FROM OLD.payout_released
     OR NEW.payout_released_at IS DISTINCT FROM OLD.payout_released_at
     OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id
     OR NEW.stripe_transfer_id IS DISTINCT FROM OLD.stripe_transfer_id
     OR NEW.stripe_refund_id IS DISTINCT FROM OLD.stripe_refund_id
     OR NEW.amount_cents IS DISTINCT FROM OLD.amount_cents
     OR NEW.platform_fee_cents IS DISTINCT FROM OLD.platform_fee_cents
  THEN
    RAISE EXCEPTION 'Cannot modify protected booking fields from client. Use a server endpoint.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_booking_financial_tampering_trigger ON public.bookings;
CREATE TRIGGER prevent_booking_financial_tampering_trigger
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_booking_financial_tampering();

-- ============ REVIEWS: require completed booking + unique per booking ============
DROP POLICY IF EXISTS "Authors create reviews" ON public.reviews;
CREATE POLICY "Authors create reviews after completed booking"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND b.owner_id = auth.uid()
        AND b.sitter_id = reviews.sitter_id
        AND b.status = 'completed'
    )
  );

-- Drop dupes (keep earliest per author+booking) before unique constraint
DELETE FROM public.reviews r1
USING public.reviews r2
WHERE r1.booking_id IS NOT NULL
  AND r1.booking_id = r2.booking_id
  AND r1.author_id = r2.author_id
  AND r1.created_at > r2.created_at;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_unique_per_booking UNIQUE (author_id, booking_id);

-- ============ has_role: revoke direct EXECUTE from clients ============
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;