
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS victory_points integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.arena_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','active','complete')),
  mode text NOT NULL DEFAULT 'pvp' CHECK (mode IN ('pvp','ai')),
  planet_score integer NOT NULL DEFAULT 0,
  humans_score integer NOT NULL DEFAULT 0,
  winner text CHECK (winner IN ('planet','humans')),
  turn integer NOT NULL DEFAULT 0,
  current_team text NOT NULL DEFAULT 'planet' CHECK (current_team IN ('planet','humans')),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.arena_match_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.arena_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team text NOT NULL CHECK (team IN ('planet','humans')),
  country text,
  slot integer NOT NULL CHECK (slot BETWEEN 1 AND 4),
  is_ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, team, slot),
  UNIQUE (match_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.arena_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.arena_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turn integer NOT NULL,
  team text NOT NULL CHECK (team IN ('planet','humans')),
  ability_slug text NOT NULL,
  damage integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS arena_match_players_match_idx ON public.arena_match_players(match_id);
CREATE INDEX IF NOT EXISTS arena_actions_match_idx ON public.arena_actions(match_id, turn);
CREATE INDEX IF NOT EXISTS arena_matches_lobby_idx ON public.arena_matches(status, mode) WHERE status = 'lobby';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.arena_matches TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arena_match_players TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arena_actions TO authenticated;
GRANT ALL ON public.arena_matches TO service_role;
GRANT ALL ON public.arena_match_players TO service_role;
GRANT ALL ON public.arena_actions TO service_role;

ALTER TABLE public.arena_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arena matches readable" ON public.arena_matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "arena players readable" ON public.arena_match_players FOR SELECT TO authenticated USING (true);
CREATE POLICY "arena actions readable" ON public.arena_actions FOR SELECT TO authenticated USING (true);
-- writes only via SECURITY DEFINER functions

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_match_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.arena_actions;

-- Quickmatch: place player into smallest existing lobby or create a new one
CREATE OR REPLACE FUNCTION public.arena_quickmatch()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _country text;
  _match_id uuid;
  _planet_count int;
  _humans_count int;
  _team text;
  _slot int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT region INTO _country FROM public.profiles WHERE id = _uid;

  -- If already in a non-complete match, return it
  SELECT m.id INTO _match_id
  FROM public.arena_match_players p
  JOIN public.arena_matches m ON m.id = p.match_id
  WHERE p.user_id = _uid AND m.status <> 'complete'
  ORDER BY m.created_at DESC LIMIT 1;
  IF _match_id IS NOT NULL THEN RETURN _match_id; END IF;

  -- Find any lobby with under 8 players
  SELECT m.id INTO _match_id
  FROM public.arena_matches m
  WHERE m.status = 'lobby' AND m.mode = 'pvp'
    AND (SELECT count(*) FROM public.arena_match_players WHERE match_id = m.id) < 8
  ORDER BY m.created_at ASC LIMIT 1;

  IF _match_id IS NULL THEN
    INSERT INTO public.arena_matches(mode) VALUES ('pvp') RETURNING id INTO _match_id;
  END IF;

  SELECT count(*) INTO _planet_count FROM public.arena_match_players WHERE match_id=_match_id AND team='planet';
  SELECT count(*) INTO _humans_count FROM public.arena_match_players WHERE match_id=_match_id AND team='humans';

  IF _planet_count <= _humans_count THEN _team := 'planet'; ELSE _team := 'humans'; END IF;
  SELECT COALESCE(min(s.n), 1) INTO _slot
  FROM generate_series(1,4) s(n)
  WHERE NOT EXISTS (SELECT 1 FROM public.arena_match_players WHERE match_id=_match_id AND team=_team AND slot=s.n);

  INSERT INTO public.arena_match_players(match_id, user_id, team, country, slot)
  VALUES (_match_id, _uid, _team, _country, _slot);

  RETURN _match_id;
END $$;

CREATE OR REPLACE FUNCTION public.arena_set_ready(_match_id uuid, _ready boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  UPDATE public.arena_match_players SET is_ready=_ready WHERE match_id=_match_id AND user_id=_uid;

  -- Auto-start when 8 ready and status is lobby
  IF (SELECT count(*) FROM public.arena_match_players WHERE match_id=_match_id AND is_ready) >= 8 THEN
    UPDATE public.arena_matches SET status='active', started_at=now(), turn=1
    WHERE id=_match_id AND status='lobby';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.arena_leave(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  DELETE FROM public.arena_match_players WHERE match_id=_match_id AND user_id=_uid;
  -- delete empty lobbies
  DELETE FROM public.arena_matches m
  WHERE m.id=_match_id AND m.status='lobby'
    AND NOT EXISTS (SELECT 1 FROM public.arena_match_players WHERE match_id=m.id);
END $$;

-- Play an ability: validates turn ownership, accumulates score, advances turn, finishes match at 100
CREATE OR REPLACE FUNCTION public.arena_play_ability(_match_id uuid, _ability_slug text, _damage int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _match public.arena_matches%ROWTYPE;
  _team text;
  _new_planet int;
  _new_humans int;
  _winner text;
  _next_team text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _damage < 1 OR _damage > 25 THEN RAISE EXCEPTION 'Invalid damage'; END IF;

  SELECT * INTO _match FROM public.arena_matches WHERE id=_match_id FOR UPDATE;
  IF NOT FOUND OR _match.status <> 'active' THEN RAISE EXCEPTION 'Match not active'; END IF;

  SELECT team INTO _team FROM public.arena_match_players WHERE match_id=_match_id AND user_id=_uid;
  IF _team IS NULL THEN RAISE EXCEPTION 'Not in this match'; END IF;
  IF _team <> _match.current_team THEN RAISE EXCEPTION 'Not your team turn'; END IF;

  INSERT INTO public.arena_actions(match_id, user_id, turn, team, ability_slug, damage)
  VALUES (_match_id, _uid, _match.turn, _team, _ability_slug, _damage);

  _new_planet := _match.planet_score + CASE WHEN _team='planet' THEN _damage ELSE 0 END;
  _new_humans := _match.humans_score + CASE WHEN _team='humans' THEN _damage ELSE 0 END;

  IF _new_planet >= 100 THEN _winner := 'planet';
  ELSIF _new_humans >= 100 THEN _winner := 'humans';
  ELSE _winner := NULL; END IF;

  IF _winner IS NOT NULL THEN
    UPDATE public.arena_matches
      SET planet_score=_new_planet, humans_score=_new_humans, winner=_winner, status='complete', ended_at=now()
      WHERE id=_match_id;
    -- Award VP
    UPDATE public.profiles SET victory_points = victory_points + CASE WHEN _match.mode='ai' THEN 10 ELSE 50 END
      WHERE id IN (SELECT user_id FROM public.arena_match_players WHERE match_id=_match_id AND team=_winner);
    RETURN jsonb_build_object('ok', true, 'winner', _winner, 'planet', _new_planet, 'humans', _new_humans);
  END IF;

  _next_team := CASE WHEN _team='planet' THEN 'humans' ELSE 'planet' END;
  UPDATE public.arena_matches
    SET planet_score=_new_planet, humans_score=_new_humans, current_team=_next_team, turn=_match.turn+1
    WHERE id=_match_id;

  RETURN jsonb_build_object('ok', true, 'planet', _new_planet, 'humans', _new_humans, 'next_team', _next_team);
END $$;

-- Start a solo AI match
CREATE OR REPLACE FUNCTION public.arena_start_ai()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _country text;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT region INTO _country FROM public.profiles WHERE id=_uid;
  INSERT INTO public.arena_matches(mode, status, started_at, turn) VALUES ('ai','active', now(), 1) RETURNING id INTO _id;
  INSERT INTO public.arena_match_players(match_id, user_id, team, country, slot, is_ready)
    VALUES (_id, _uid, 'humans', _country, 1, true);
  RETURN _id;
END $$;
