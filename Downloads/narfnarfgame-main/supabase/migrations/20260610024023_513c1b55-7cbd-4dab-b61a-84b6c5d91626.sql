CREATE OR REPLACE FUNCTION public.guard_profile_economy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.coins IS DISTINCT FROM OLD.coins
     OR NEW.bonus_multiplier IS DISTINCT FROM OLD.bonus_multiplier
     OR NEW.banned IS DISTINCT FROM OLD.banned THEN
    RAISE EXCEPTION 'Only admins can modify economy fields';
  END IF;

  RETURN NEW;
END
$$;

REVOKE EXECUTE ON FUNCTION public.guard_profile_economy() FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS "update own profile (non-economy)" ON public.profiles;
CREATE POLICY "update own profile (non-economy)"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND NOT (email IS DISTINCT FROM (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (coins IS DISTINCT FROM (SELECT p.coins FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (bonus_multiplier IS DISTINCT FROM (SELECT p.bonus_multiplier FROM public.profiles p WHERE p.id = auth.uid()))
    AND NOT (banned IS DISTINCT FROM (SELECT p.banned FROM public.profiles p WHERE p.id = auth.uid()))
  );