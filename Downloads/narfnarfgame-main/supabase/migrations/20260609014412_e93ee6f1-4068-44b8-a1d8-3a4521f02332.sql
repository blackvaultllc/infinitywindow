
DROP POLICY IF EXISTS "view own or staff views all" ON public.profiles;
CREATE POLICY "view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "admins view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "update own profile (non-economy)" ON public.profiles;
CREATE POLICY "update own profile (non-economy)" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND email IS NOT DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    AND coins IS NOT DISTINCT FROM (SELECT p.coins FROM public.profiles p WHERE p.id = auth.uid())
    AND bonus_multiplier IS NOT DISTINCT FROM (SELECT p.bonus_multiplier FROM public.profiles p WHERE p.id = auth.uid())
    AND banned IS NOT DISTINCT FROM (SELECT p.banned FROM public.profiles p WHERE p.id = auth.uid())
  );

DROP POLICY IF EXISTS "write message if ticket visible" ON public.ticket_messages;
CREATE POLICY "write message if ticket visible" ON public.ticket_messages
  FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid()
    AND (
      NOT is_staff
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'support')
      OR public.has_role(auth.uid(),'moderator')
    )
    AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (
      t.user_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'moderator')
      OR public.has_role(auth.uid(),'support')
    ))
  );

DELETE FROM public.infinity_messages WHERE role = 'system';
ALTER TABLE public.infinity_messages
  DROP CONSTRAINT IF EXISTS infinity_messages_role_check;
ALTER TABLE public.infinity_messages
  ADD CONSTRAINT infinity_messages_role_check CHECK (role IN ('user','assistant'));

REVOKE EXECUTE ON FUNCTION public.complete_quest(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.unlock_codex(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_quest(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_codex(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
