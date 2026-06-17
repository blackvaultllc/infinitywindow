-- Revoke public execute on sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.complete_quest(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_quest(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.unlock_codex(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.unlock_codex(text) TO authenticated;

-- Trigger-only functions: no caller should invoke them directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_economy() FROM PUBLIC, anon, authenticated;

-- Allow staff to reply on any support ticket
DROP POLICY IF EXISTS "staff can write ticket messages" ON public.ticket_messages;
CREATE POLICY "staff can write ticket messages"
  ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'moderator')
    OR public.has_role(auth.uid(),'support')
  );