
-- Switch view to security_invoker so it inherits caller's RLS + grants (no DEFINER warning)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
  id, full_name, avatar_url, city, state, bio,
  is_sitter, sitter_headline, sitter_rate, sitter_years_experience,
  sitter_services, sitter_gallery, sitter_test_passed_at,
  accepts_dogs, accepts_cats, max_pet_weight_lbs,
  inactive, hide_past_pets, created_at, updated_at
FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Re-restrict direct profile column access; owner reads full row via get_my_profile()
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, full_name, avatar_url, city, state, bio,
  is_sitter, sitter_headline, sitter_rate, sitter_years_experience,
  sitter_services, sitter_gallery, sitter_test_passed_at,
  accepts_dogs, accepts_cats, max_pet_weight_lbs,
  inactive, hide_past_pets, created_at, updated_at
) ON public.profiles TO anon, authenticated;

-- Allow row read for any authenticated/anon (column grants enforce field privacy);
-- owner-policy already exists for owner-only contexts.
DROP POLICY IF EXISTS "Public safe profile read" ON public.profiles;
CREATE POLICY "Public safe profile read"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);
