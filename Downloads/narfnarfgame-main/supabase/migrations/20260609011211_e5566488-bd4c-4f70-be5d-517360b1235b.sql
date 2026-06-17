
-- Lock down SECURITY DEFINER functions: only the database (and service_role) may call directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_profile_economy() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_infinity_thread() FROM PUBLIC, anon, authenticated;
-- has_role MUST stay callable by authenticated users (it's used inside RLS policies and app code)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Tighten ticket update policy (replace USING true check)
DROP POLICY IF EXISTS "staff update tickets" ON public.support_tickets;
CREATE POLICY "staff update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'moderator')
    OR public.has_role(auth.uid(),'support')
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'moderator')
    OR public.has_role(auth.uid(),'support')
  );
