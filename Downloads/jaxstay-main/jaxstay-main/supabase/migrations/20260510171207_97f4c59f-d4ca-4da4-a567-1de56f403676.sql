
-- Undo the overly permissive policy from prior migration
DROP POLICY IF EXISTS "Public profile rows readable" ON public.profiles;

-- Restore full column grants on profiles for authenticated; RLS limits rows to owner only
GRANT SELECT ON public.profiles TO authenticated;

-- Anon has no direct table access at all
REVOKE SELECT ON public.profiles FROM anon;

-- Make the public view bypass RLS by using definer semantics (owned by postgres)
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT
  id, full_name, avatar_url, city, state, bio,
  is_sitter, sitter_headline, sitter_rate, sitter_years_experience,
  sitter_services, sitter_gallery, sitter_test_passed_at,
  accepts_dogs, accepts_cats, max_pet_weight_lbs,
  inactive, hide_past_pets, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;
