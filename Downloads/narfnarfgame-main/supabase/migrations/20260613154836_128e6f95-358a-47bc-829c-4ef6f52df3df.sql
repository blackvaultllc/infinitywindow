CREATE OR REPLACE FUNCTION public.arena_start_ai()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _country text;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT region INTO _country FROM public.profiles WHERE id=_uid;
  INSERT INTO public.arena_matches(mode, status, started_at, turn, current_team)
  VALUES ('ai','active', now(), 1, 'humans')
  RETURNING id INTO _id;
  INSERT INTO public.arena_match_players(match_id, user_id, team, country, slot, is_ready)
    VALUES (_id, _uid, 'humans', _country, 1, true);
  RETURN _id;
END $$;

CREATE OR REPLACE FUNCTION public.arena_ai_planet_turn(_match_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _match public.arena_matches%ROWTYPE;
  _damage int;
  _ability text;
  _new_planet int;
  _winner text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT * INTO _match FROM public.arena_matches WHERE id=_match_id FOR UPDATE;
  IF NOT FOUND OR _match.status <> 'active' OR _match.mode <> 'ai' THEN
    RAISE EXCEPTION 'Solo AI match not active';
  END IF;
  IF _match.current_team <> 'planet' THEN
    RETURN jsonb_build_object('ok', true, 'skipped', true, 'reason', 'not_planet_turn');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.arena_match_players
    WHERE match_id=_match_id AND user_id=_uid AND team='humans'
  ) THEN
    RAISE EXCEPTION 'Not in this solo match';
  END IF;

  SELECT ability_slug, damage INTO _ability, _damage
  FROM (VALUES
    ('solar_flare', 18),
    ('quake', 14),
    ('tsunami', 20),
    ('wildfire', 12)
  ) AS v(ability_slug, damage)
  ORDER BY random()
  LIMIT 1;

  INSERT INTO public.arena_actions(match_id, user_id, turn, team, ability_slug, damage)
  VALUES (_match_id, _uid, _match.turn, 'planet', _ability, _damage);

  _new_planet := _match.planet_score + _damage;
  IF _new_planet >= 100 THEN _winner := 'planet'; ELSE _winner := NULL; END IF;

  IF _winner IS NOT NULL THEN
    UPDATE public.arena_matches
      SET planet_score=_new_planet, winner=_winner, status='complete', ended_at=now()
      WHERE id=_match_id;
    RETURN jsonb_build_object('ok', true, 'winner', _winner, 'planet', _new_planet, 'humans', _match.humans_score);
  END IF;

  UPDATE public.arena_matches
    SET planet_score=_new_planet, current_team='humans', turn=_match.turn+1
    WHERE id=_match_id;

  RETURN jsonb_build_object('ok', true, 'planet', _new_planet, 'humans', _match.humans_score, 'next_team', 'humans');
END $$;

REVOKE EXECUTE ON FUNCTION public.arena_ai_planet_turn(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.arena_ai_planet_turn(uuid) TO authenticated;