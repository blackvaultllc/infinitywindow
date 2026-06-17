CREATE OR REPLACE FUNCTION public.guard_profile_economy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.is_protected IS DISTINCT FROM OLD.is_protected THEN
    RAISE EXCEPTION 'Only admins can change protected status';
  END IF;
  IF OLD.is_protected AND (
       NEW.banned IS DISTINCT FROM OLD.banned
       OR NEW.display_name IS DISTINCT FROM OLD.display_name
       OR NEW.username IS DISTINCT FROM OLD.username
  ) THEN
    RAISE EXCEPTION 'This account is protected';
  END IF;
  IF NEW.coins IS DISTINCT FROM OLD.coins
     OR NEW.bonus_multiplier IS DISTINCT FROM OLD.bonus_multiplier
     OR NEW.banned IS DISTINCT FROM OLD.banned THEN
    RAISE EXCEPTION 'Only admins can modify economy fields';
  END IF;
  -- Players may change their own oath at any time; alignment_locked is informational only.
  RETURN NEW;
END $function$;