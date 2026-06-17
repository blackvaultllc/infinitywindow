
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_protected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_redeemed boolean NOT NULL DEFAULT false;

-- Generate referral codes for existing rows
UPDATE public.profiles
SET referral_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

-- Mark owner + daughter as protected
UPDATE public.profiles
SET is_protected = true
WHERE lower(email) IN ('blackhatterxvi@gmail.com','x.xalgorithm@gmail.com');

-- Default referral code on insert via trigger
CREATE OR REPLACE FUNCTION public.set_default_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_default_referral_code();

-- Tighten guard: non-admins cannot change is_protected; protected rows cannot have
-- destructive fields toggled by anyone other than an admin (already covered by
-- coins/banned guard, but we also block display_name wipe to avoid impersonation harassment).
CREATE OR REPLACE FUNCTION public.guard_profile_economy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  IF OLD.alignment_locked AND NEW.prologue_choice IS DISTINCT FROM OLD.prologue_choice THEN
    RAISE EXCEPTION 'Alignment is locked';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_guard_economy ON public.profiles;
CREATE TRIGGER profiles_guard_economy
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_economy();

-- Referral redemption: gives both parties 500 coins, once per redeemer.
CREATE OR REPLACE FUNCTION public.apply_referral(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _inviter uuid;
  _reward int := 500;
  _me public.profiles%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO _me FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _me.referral_redeemed THEN RAISE EXCEPTION 'Referral already redeemed'; END IF;
  SELECT id INTO _inviter FROM public.profiles WHERE upper(referral_code) = upper(_code) LIMIT 1;
  IF _inviter IS NULL THEN RAISE EXCEPTION 'Invalid referral code'; END IF;
  IF _inviter = _uid THEN RAISE EXCEPTION 'You cannot refer yourself'; END IF;

  UPDATE public.profiles SET coins = coins + _reward WHERE id = _uid;
  UPDATE public.profiles SET coins = coins + _reward WHERE id = _inviter;
  UPDATE public.profiles SET referred_by = _inviter, referral_redeemed = true WHERE id = _uid;
  INSERT INTO public.coin_ledger (user_id, delta, reason) VALUES (_uid, _reward, 'referral:redeemed');
  INSERT INTO public.coin_ledger (user_id, delta, reason) VALUES (_inviter, _reward, 'referral:invited');
  RETURN jsonb_build_object('ok', true, 'reward', _reward);
END $$;

REVOKE ALL ON FUNCTION public.apply_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_referral(text) TO authenticated;
