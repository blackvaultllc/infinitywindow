
-- Lock down direct INSERT — only the SECURITY DEFINER function can create clans
DROP POLICY IF EXISTS "players can create their own clan" ON public.clans;

CREATE OR REPLACE FUNCTION public.create_clan(
  _name text,
  _slug text,
  _country text DEFAULT NULL,
  _description text DEFAULT NULL
) RETURNS public.clans
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _cost integer := 5000;
  _balance integer;
  _clan public.clans%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id = _uid) THEN
    RAISE EXCEPTION 'You can only belong to one clan. Leave your current clan first.';
  END IF;

  SELECT coins INTO _balance FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF _balance < _cost THEN
    RAISE EXCEPTION 'Not enough coins (need %, have %)', _cost, _balance;
  END IF;

  UPDATE public.profiles SET coins = coins - _cost WHERE id = _uid;
  INSERT INTO public.coin_ledger (user_id, delta, reason)
    VALUES (_uid, -_cost, 'clan:create');

  INSERT INTO public.clans (name, slug, owner_id, country, description)
    VALUES (_name, _slug, _uid, _country, _description)
    RETURNING * INTO _clan;

  INSERT INTO public.clan_members (clan_id, user_id, role)
    VALUES (_clan.id, _uid, 'owner');

  RETURN _clan;
END $$;

GRANT EXECUTE ON FUNCTION public.create_clan(text, text, text, text) TO authenticated;
