-- Restore full SELECT to authenticated to avoid breaking signed-in app code.
-- Anon stays restricted to safe public columns only.
GRANT SELECT ON public.profiles TO authenticated;