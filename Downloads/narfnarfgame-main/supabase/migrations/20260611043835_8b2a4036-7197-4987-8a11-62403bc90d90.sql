
-- 1) Fix SECURITY DEFINER view by switching to security_invoker
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- 2) Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_economy() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_quest(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unlock_codex(text) FROM PUBLIC, anon;
-- keep authenticated EXECUTE for the two RPCs that the app legitimately calls
GRANT EXECUTE ON FUNCTION public.complete_quest(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_codex(text) TO authenticated;

-- 3) Tighten friends UPDATE policy so a requester cannot revive a declined/blocked row
DROP POLICY IF EXISTS "friends update own" ON public.friends;
CREATE POLICY "friends update own" ON public.friends
FOR UPDATE
USING (
  (auth.uid() = addressee_id)
  OR (auth.uid() = requester_id AND status IN ('pending','cancelled'))
)
WITH CHECK (
  (auth.uid() = addressee_id AND status = ANY (ARRAY['accepted','declined','blocked','pending']))
  OR (auth.uid() = requester_id AND status = ANY (ARRAY['pending','cancelled']))
);
