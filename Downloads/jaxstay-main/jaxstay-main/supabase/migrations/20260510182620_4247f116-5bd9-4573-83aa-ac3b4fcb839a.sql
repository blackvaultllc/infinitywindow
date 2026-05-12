-- Profiles: sitter transport fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sitter_transport_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sitter_transport_has_vehicle boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sitter_transport_multi_pet boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sitter_transport_has_crate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sitter_transport_prices_by_tier jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS sitter_extra_stop_fee_cents integer,
  ADD COLUMN IF NOT EXISTS sitter_waiting_fee_per_hour_cents integer;

-- Bookings: transport fields
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS trip_type text,
  ADD COLUMN IF NOT EXISTS distance_tier text,
  ADD COLUMN IF NOT EXISTS pickup_address text,
  ADD COLUMN IF NOT EXISTS dropoff_address text,
  ADD COLUMN IF NOT EXISTS return_datetime timestamptz,
  ADD COLUMN IF NOT EXISTS transport_notes text;

-- Recreate public_profiles view to include new safe transport columns
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT
  id, full_name, city, state, bio, avatar_url, is_sitter,
  sitter_headline, sitter_rate, sitter_services, sitter_years_experience,
  sitter_gallery, sitter_test_passed_at, accepts_dogs, accepts_cats,
  max_pet_weight_lbs, inactive, hide_past_pets, created_at, updated_at,
  sitter_transport_enabled, sitter_transport_has_vehicle,
  sitter_transport_multi_pet, sitter_transport_has_crate,
  sitter_transport_prices_by_tier, sitter_extra_stop_fee_cents,
  sitter_waiting_fee_per_hour_cents
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Allow these new columns to be selected on profiles too (needed by direct
-- profiles queries that filter is_sitter, etc.)
GRANT SELECT (
  sitter_transport_enabled, sitter_transport_has_vehicle,
  sitter_transport_multi_pet, sitter_transport_has_crate,
  sitter_transport_prices_by_tier, sitter_extra_stop_fee_cents,
  sitter_waiting_fee_per_hour_cents
) ON public.profiles TO anon, authenticated;