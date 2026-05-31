
-- ============== TABLES ==============

CREATE TABLE public.board_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','active','completed','abandoned')),
  mode text NOT NULL DEFAULT 'async' CHECK (mode IN ('async','live')),
  max_players int NOT NULL DEFAULT 4 CHECK (max_players BETWEEN 2 AND 4),
  turn_number int NOT NULL DEFAULT 0,
  current_seat int,
  turn_deadline timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  winner_user_id uuid,
  name text NOT NULL DEFAULT 'Pharaoh''s Gambit',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.board_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.board_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  seat int NOT NULL CHECK (seat BETWEEN 1 AND 4),
  display_name text,
  position int NOT NULL DEFAULT 0,
  exod_in_game numeric NOT NULL DEFAULT 1500,
  score numeric NOT NULL DEFAULT 0,
  is_eliminated boolean NOT NULL DEFAULT false,
  jail_turns int NOT NULL DEFAULT 0,
  selected_card_id text,
  selected_card_name text,
  selected_card_rarity text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_action_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id),
  UNIQUE (match_id, seat)
);

CREATE TABLE public.board_property_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.board_matches(id) ON DELETE CASCADE,
  position int NOT NULL,
  owner_player_id uuid NOT NULL REFERENCES public.board_players(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  card_name text NOT NULL,
  card_rarity text NOT NULL,
  level int NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 3),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, position)
);

CREATE TABLE public.board_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.board_matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.board_players(id) ON DELETE SET NULL,
  turn_number int NOT NULL,
  action text NOT NULL,
  dice1 int, dice2 int,
  from_pos int, to_pos int,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX board_moves_match_idx ON public.board_moves(match_id, created_at DESC);

CREATE TABLE public.board_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.board_matches(id) ON DELETE CASCADE,
  proposer_id uuid NOT NULL REFERENCES public.board_players(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('end_game','skip_player')),
  target_player_id uuid REFERENCES public.board_players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','passed','failed','expired')),
  yes_count int NOT NULL DEFAULT 0,
  no_count int NOT NULL DEFAULT 0,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE TABLE public.board_vote_responses (
  vote_id uuid NOT NULL REFERENCES public.board_votes(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.board_players(id) ON DELETE CASCADE,
  agree boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (vote_id, player_id)
);

-- ============== RLS ==============

ALTER TABLE public.board_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_property_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_vote_responses ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_board_player(_uid uuid, _match uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.board_players WHERE match_id=_match AND user_id=_uid);
$$;

-- Matches: public lobbies visible; otherwise participants + admin
CREATE POLICY "matches read"
  ON public.board_matches FOR SELECT
  USING (
    status = 'lobby'
    OR is_board_player(auth.uid(), id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_permission(auth.uid(), 'audit.view')
  );

CREATE POLICY "players read"
  ON public.board_players FOR SELECT
  USING (
    is_board_player(auth.uid(), match_id)
    OR EXISTS(SELECT 1 FROM public.board_matches m WHERE m.id = match_id AND m.status='lobby')
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "claims read"
  ON public.board_property_claims FOR SELECT
  USING (is_board_player(auth.uid(), match_id) OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "moves read"
  ON public.board_moves FOR SELECT
  USING (is_board_player(auth.uid(), match_id) OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "votes read"
  ON public.board_votes FOR SELECT
  USING (is_board_player(auth.uid(), match_id) OR has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "vote_responses read"
  ON public.board_vote_responses FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.board_votes v WHERE v.id=vote_id
         AND (is_board_player(auth.uid(), v.match_id) OR has_role(auth.uid(),'admin'::app_role))));

-- All writes go through SECURITY DEFINER RPCs below; no direct DML policies.

-- ============== TILE LAYOUT ==============

CREATE OR REPLACE FUNCTION public.board_tile(_pos int)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
DECLARE
  v_corners jsonb := jsonb_build_object(
    '0', jsonb_build_object('type','start','name','Gates of Heliopolis','reward',200),
    '10', jsonb_build_object('type','jail','name','Sanctuary of Anubis'),
    '20', jsonb_build_object('type','reward','name','Oasis of Ra','reward',300),
    '30', jsonb_build_object('type','arena','name','Arena of Set','penalty',150)
  );
  v_props text[][] := ARRAY[
    ['Nile Banks','60'],['Papyrus Fields','60'],
    ['Karnak Quarter','100'],['Luxor Bazaar','100'],['Memphis Temple','120'],
    ['Giza Plateau','140'],['Saqqara Necropolis','140'],['Abydos Hall','160'],
    ['Thebes Forum','180'],['Edfu Sanctum','180'],['Dendera Vault','200'],
    ['Aswan Quarry','220'],['Philae Isle','220'],['Kom Ombo','240'],
    ['Alexandria Port','260'],['Pharos Lighthouse','260'],['Catacombs','280'],
    ['Valley of Kings','300'],['Valley of Queens','300'],['Hatshepsut Causeway','320'],
    ['Ramesseum','350'],['Abu Simbel','350'],['Temple of Isis','400'],['Pyramid of Khufu','450']
  ];
  v_specials jsonb := jsonb_build_object(
    '5',  jsonb_build_object('type','pack','name','Tomb Cache'),
    '9',  jsonb_build_object('type','chance','name','Whisper of Thoth'),
    '14', jsonb_build_object('type','battle','name','Falcon Duel','stakes',120),
    '18', jsonb_build_object('type','chance','name','Eye of Horus'),
    '24', jsonb_build_object('type','pack','name','Hidden Reliquary'),
    '28', jsonb_build_object('type','chance','name','Sandstorm Omen'),
    '34', jsonb_build_object('type','tax','name','Pharaoh''s Tribute','amount',100),
    '38', jsonb_build_object('type','chance','name','Scarab''s Riddle')
  );
  v_prop_idx int := 0;
  v_p int;
  v_special jsonb;
BEGIN
  IF v_corners ? _pos::text THEN RETURN v_corners->_pos::text; END IF;
  IF v_specials ? _pos::text THEN RETURN v_specials->_pos::text; END IF;
  -- Compute property index: count of property tiles before _pos
  v_prop_idx := 0;
  FOR v_p IN 1.._pos-1 LOOP
    IF NOT (v_corners ? v_p::text) AND NOT (v_specials ? v_p::text) THEN
      v_prop_idx := v_prop_idx + 1;
    END IF;
  END LOOP;
  IF v_prop_idx + 1 > array_length(v_props,1) THEN
    RETURN jsonb_build_object('type','property','name','Ruined Shrine','cost',60,'rent',8);
  END IF;
  RETURN jsonb_build_object(
    'type','property',
    'name', v_props[v_prop_idx+1][1],
    'cost', v_props[v_prop_idx+1][2]::numeric,
    'rent', round(v_props[v_prop_idx+1][2]::numeric * 0.10)
  );
END $$;

-- ============== RPCs ==============

CREATE OR REPLACE FUNCTION public.board_create_match(_mode text, _max_players int, _name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid; v_name text; v_disp text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _mode NOT IN ('async','live') THEN _mode := 'async'; END IF;
  IF _max_players NOT BETWEEN 2 AND 4 THEN _max_players := 4; END IF;
  v_name := COALESCE(NULLIF(trim(_name),''),'Pharaoh''s Gambit');

  INSERT INTO public.board_matches (host_id, mode, max_players, name)
    VALUES (v_uid, _mode, _max_players, v_name) RETURNING id INTO v_id;

  SELECT COALESCE(display_name, username, 'Player') INTO v_disp
    FROM public.profiles WHERE id = v_uid;

  INSERT INTO public.board_players (match_id, user_id, seat, display_name)
    VALUES (v_id, v_uid, 1, v_disp);

  INSERT INTO public.board_moves (match_id, turn_number, action, details)
    VALUES (v_id, 0, 'lobby_created', jsonb_build_object('host', v_uid, 'mode', _mode));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.board_join_match(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid(); v_m public.board_matches; v_seat int; v_count int; v_disp text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_m FROM public.board_matches WHERE id=_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'match not found'; END IF;
  IF v_m.status <> 'lobby' THEN RAISE EXCEPTION 'match already started'; END IF;
  IF EXISTS(SELECT 1 FROM public.board_players WHERE match_id=_match_id AND user_id=v_uid) THEN
    RETURN;
  END IF;
  SELECT count(*) INTO v_count FROM public.board_players WHERE match_id=_match_id;
  IF v_count >= v_m.max_players THEN RAISE EXCEPTION 'match full'; END IF;
  v_seat := v_count + 1;
  SELECT COALESCE(display_name, username,'Player') INTO v_disp FROM public.profiles WHERE id=v_uid;
  INSERT INTO public.board_players (match_id,user_id,seat,display_name)
    VALUES (_match_id, v_uid, v_seat, v_disp);
  INSERT INTO public.board_moves (match_id, turn_number, action, details)
    VALUES (_match_id, 0, 'player_joined', jsonb_build_object('user', v_uid, 'seat', v_seat));
END $$;

CREATE OR REPLACE FUNCTION public.board_start_match(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_m public.board_matches; v_count int;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_m FROM public.board_matches WHERE id=_match_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'match not found'; END IF;
  IF v_m.host_id <> v_uid THEN RAISE EXCEPTION 'only host can start'; END IF;
  IF v_m.status <> 'lobby' THEN RAISE EXCEPTION 'match already started'; END IF;
  SELECT count(*) INTO v_count FROM public.board_players WHERE match_id=_match_id;
  IF v_count < 2 THEN RAISE EXCEPTION 'need at least 2 players'; END IF;

  UPDATE public.board_matches
    SET status='active', current_seat=1, turn_number=1,
        turn_deadline = now() + interval '24 hours',
        last_activity_at = now(), updated_at = now()
    WHERE id=_match_id;
  INSERT INTO public.board_moves (match_id, turn_number, action, details)
    VALUES (_match_id, 1, 'match_started', jsonb_build_object('players', v_count));
END $$;

CREATE OR REPLACE FUNCTION public.board_set_mode(_match_id uuid, _mode text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_m public.board_matches;
BEGIN
  SELECT * INTO v_m FROM public.board_matches WHERE id=_match_id;
  IF v_m.host_id <> v_uid THEN RAISE EXCEPTION 'only host can change mode'; END IF;
  IF _mode NOT IN ('async','live') THEN RAISE EXCEPTION 'invalid mode'; END IF;
  UPDATE public.board_matches SET mode=_mode, updated_at=now() WHERE id=_match_id;
END $$;

CREATE OR REPLACE FUNCTION public.board_select_card(_match_id uuid, _card_id text, _card_name text, _card_rarity text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _card_rarity IN ('Legendary','Exodius') AND NOT public.is_owner(v_uid) THEN
    -- still allowed as a token, but block from being CLAIMED later via board_claim
    NULL;
  END IF;
  UPDATE public.board_players
    SET selected_card_id=_card_id, selected_card_name=_card_name, selected_card_rarity=_card_rarity,
        last_action_at=now()
    WHERE match_id=_match_id AND user_id=v_uid;
END $$;

-- Helper: advance to next non-eliminated seat
CREATE OR REPLACE FUNCTION public._board_advance_turn(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_m public.board_matches; v_seats int[]; v_next int; v_i int; v_jail int;
BEGIN
  SELECT * INTO v_m FROM public.board_matches WHERE id=_match_id FOR UPDATE;
  SELECT array_agg(seat ORDER BY seat) INTO v_seats
    FROM public.board_players WHERE match_id=_match_id AND NOT is_eliminated;
  IF v_seats IS NULL OR array_length(v_seats,1) <= 1 THEN
    -- last player wins by default
    PERFORM public._board_finalize(_match_id);
    RETURN;
  END IF;

  v_next := v_m.current_seat;
  FOR v_i IN 1..array_length(v_seats,1)*2 LOOP
    v_next := v_next + 1;
    IF v_next > 4 THEN v_next := 1; END IF;
    IF v_next = ANY(v_seats) THEN EXIT; END IF;
  END LOOP;

  -- handle jail: decrement and skip if still serving
  SELECT jail_turns INTO v_jail FROM public.board_players
    WHERE match_id=_match_id AND seat=v_next;
  IF v_jail > 0 THEN
    UPDATE public.board_players SET jail_turns = jail_turns - 1
      WHERE match_id=_match_id AND seat=v_next;
    INSERT INTO public.board_moves (match_id, turn_number, action, details)
      VALUES (_match_id, v_m.turn_number+1, 'jail_skip',
              jsonb_build_object('seat', v_next));
    UPDATE public.board_matches
      SET current_seat=v_next, turn_number=v_m.turn_number+1,
          turn_deadline=now()+interval '24 hours', last_activity_at=now(), updated_at=now()
      WHERE id=_match_id;
    PERFORM public._board_advance_turn(_match_id);
    RETURN;
  END IF;

  UPDATE public.board_matches
    SET current_seat=v_next, turn_number=v_m.turn_number+1,
        turn_deadline = now() + interval '24 hours',
        last_activity_at = now(), updated_at = now()
    WHERE id=_match_id;
END $$;

-- Finalize: pick winner by score, award one non-Legendary/Exodius pack credit
CREATE OR REPLACE FUNCTION public._board_finalize(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_winner public.board_players; v_user uuid;
BEGIN
  SELECT * INTO v_winner FROM public.board_players
    WHERE match_id=_match_id AND NOT is_eliminated
    ORDER BY score DESC, exod_in_game DESC LIMIT 1;
  IF NOT FOUND THEN
    SELECT * INTO v_winner FROM public.board_players WHERE match_id=_match_id
      ORDER BY score DESC LIMIT 1;
  END IF;
  v_user := v_winner.user_id;

  UPDATE public.board_matches
    SET status='completed', completed_at=now(), winner_user_id=v_user, updated_at=now()
    WHERE id=_match_id;

  -- Reward: +1 free pack credit + 250 EXOD; pack draw will be capped to non-legendary
  -- by the existing pack_drops you mark in_packs; if a legendary slips in we strip below
  IF v_user IS NOT NULL THEN
    UPDATE public.profiles SET pending_free_packs = LEAST(5, pending_free_packs + 1)
      WHERE id = v_user;
    UPDATE public.wallets SET exod_balance = exod_balance + 250,
      lifetime_earned = lifetime_earned + 250, updated_at = now()
      WHERE user_id = v_user;
    INSERT INTO public.transactions (user_id, amount, type, description, meta)
      VALUES (v_user, 250, 'reward', 'Board game victory — Pharaoh''s Gambit',
              jsonb_build_object('match_id', _match_id, 'pack_credit', 1, 'pack_pool','common_to_divine'));
  END IF;

  INSERT INTO public.board_moves (match_id, turn_number, action, details)
    VALUES (_match_id, 0, 'match_completed',
            jsonb_build_object('winner', v_user, 'score', v_winner.score));
END $$;

-- Main roll: dice, move, apply tile effect, return result
CREATE OR REPLACE FUNCTION public.board_roll(_match_id uuid, _card_id text DEFAULT NULL, _card_name text DEFAULT NULL, _card_rarity text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_m public.board_matches; v_p public.board_players;
  v_d1 int; v_d2 int; v_total int; v_new_pos int; v_passed_go boolean;
  v_tile jsonb; v_type text; v_claim public.board_property_claims;
  v_rent numeric; v_chance int; v_result jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_m FROM public.board_matches WHERE id=_match_id FOR UPDATE;
  IF v_m.status <> 'active' THEN RAISE EXCEPTION 'match not active'; END IF;
  SELECT * INTO v_p FROM public.board_players
    WHERE match_id=_match_id AND user_id=v_uid AND seat=v_m.current_seat FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not your turn'; END IF;

  -- Update token if a new card provided
  IF _card_id IS NOT NULL THEN
    UPDATE public.board_players SET selected_card_id=_card_id,
      selected_card_name=_card_name, selected_card_rarity=_card_rarity
      WHERE id = v_p.id;
    v_p.selected_card_id := _card_id;
    v_p.selected_card_name := _card_name;
    v_p.selected_card_rarity := _card_rarity;
  END IF;
  IF v_p.selected_card_id IS NULL THEN RAISE EXCEPTION 'pick a card to move'; END IF;

  v_d1 := 1 + floor(random()*6)::int;
  v_d2 := 1 + floor(random()*6)::int;
  v_total := v_d1 + v_d2;
  v_new_pos := (v_p.position + v_total) % 40;
  v_passed_go := (v_p.position + v_total) >= 40;

  IF v_passed_go THEN
    UPDATE public.board_players SET exod_in_game = exod_in_game + 200,
      score = score + 50 WHERE id=v_p.id;
  END IF;

  v_tile := public.board_tile(v_new_pos);
  v_type := v_tile->>'type';
  v_result := jsonb_build_object('dice',jsonb_build_array(v_d1,v_d2),
                                 'from',v_p.position,'to',v_new_pos,
                                 'passed_go',v_passed_go,'tile',v_tile);

  UPDATE public.board_players SET position=v_new_pos, last_action_at=now() WHERE id=v_p.id;

  IF v_type = 'property' THEN
    SELECT * INTO v_claim FROM public.board_property_claims
      WHERE match_id=_match_id AND position=v_new_pos;
    IF NOT FOUND THEN
      v_result := v_result || jsonb_build_object('outcome','can_claim','cost',v_tile->'cost');
    ELSIF v_claim.owner_player_id = v_p.id THEN
      v_result := v_result || jsonb_build_object('outcome','own_property','can_upgrade', v_claim.level < 3);
    ELSE
      v_rent := (v_tile->>'rent')::numeric * v_claim.level;
      UPDATE public.board_players SET exod_in_game = exod_in_game - v_rent WHERE id=v_p.id;
      UPDATE public.board_players SET exod_in_game = exod_in_game + v_rent,
        score = score + v_rent * 0.5 WHERE id=v_claim.owner_player_id;
      v_result := v_result || jsonb_build_object('outcome','paid_rent','rent',v_rent,
        'paid_to', v_claim.owner_player_id);
    END IF;

  ELSIF v_type = 'tax' THEN
    UPDATE public.board_players SET exod_in_game = exod_in_game - (v_tile->>'amount')::numeric
      WHERE id=v_p.id;
    v_result := v_result || jsonb_build_object('outcome','tax');

  ELSIF v_type = 'reward' THEN
    UPDATE public.board_players SET exod_in_game = exod_in_game + (v_tile->>'reward')::numeric,
      score = score + 50 WHERE id=v_p.id;
    v_result := v_result || jsonb_build_object('outcome','reward');

  ELSIF v_type = 'pack' THEN
    UPDATE public.board_players SET score = score + 150 WHERE id=v_p.id;
    v_result := v_result || jsonb_build_object('outcome','pack_progress','score_gain',150);

  ELSIF v_type = 'arena' THEN
    UPDATE public.board_players SET exod_in_game = exod_in_game - (v_tile->>'penalty')::numeric,
      score = score + 75 WHERE id=v_p.id;
    v_result := v_result || jsonb_build_object('outcome','arena_battle');

  ELSIF v_type = 'jail' THEN
    UPDATE public.board_players SET jail_turns = 1 WHERE id=v_p.id;
    v_result := v_result || jsonb_build_object('outcome','sent_to_sanctuary');

  ELSIF v_type = 'chance' THEN
    v_chance := 1 + floor(random()*6)::int;
    IF v_chance=1 THEN
      UPDATE public.board_players SET exod_in_game = exod_in_game + 150 WHERE id=v_p.id;
      v_result := v_result || jsonb_build_object('outcome','chance_gain','amount',150);
    ELSIF v_chance=2 THEN
      UPDATE public.board_players SET exod_in_game = exod_in_game - 100 WHERE id=v_p.id;
      v_result := v_result || jsonb_build_object('outcome','chance_loss','amount',100);
    ELSIF v_chance=3 THEN
      UPDATE public.board_players SET position=0 WHERE id=v_p.id;
      v_result := v_result || jsonb_build_object('outcome','chance_back_to_start');
    ELSIF v_chance=4 THEN
      UPDATE public.board_players SET score = score + 100 WHERE id=v_p.id;
      v_result := v_result || jsonb_build_object('outcome','chance_blessing');
    ELSIF v_chance=5 THEN
      UPDATE public.board_players SET jail_turns = 1 WHERE id=v_p.id;
      v_result := v_result || jsonb_build_object('outcome','chance_jailed');
    ELSE
      UPDATE public.board_players SET exod_in_game = exod_in_game + 50,
        score = score + 25 WHERE id=v_p.id;
      v_result := v_result || jsonb_build_object('outcome','chance_minor_gift');
    END IF;
  END IF;

  -- Elimination
  UPDATE public.board_players SET is_eliminated = true
    WHERE id=v_p.id AND exod_in_game <= 0;

  INSERT INTO public.board_moves (match_id, player_id, turn_number, action, dice1, dice2, from_pos, to_pos, details)
    VALUES (_match_id, v_p.id, v_m.turn_number, 'roll', v_d1, v_d2, v_p.position, v_new_pos, v_result);

  -- If can_claim or can_upgrade, don't auto-advance — wait for player decision
  IF v_result->>'outcome' IN ('can_claim','own_property') THEN
    UPDATE public.board_matches SET last_activity_at=now() WHERE id=_match_id;
    RETURN v_result;
  END IF;

  PERFORM public._board_advance_turn(_match_id);
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION public.board_claim(_match_id uuid, _buy boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_m public.board_matches; v_p public.board_players;
  v_tile jsonb; v_cost numeric;
BEGIN
  SELECT * INTO v_m FROM public.board_matches WHERE id=_match_id FOR UPDATE;
  SELECT * INTO v_p FROM public.board_players
    WHERE match_id=_match_id AND user_id=v_uid AND seat=v_m.current_seat FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not your turn'; END IF;
  IF v_p.selected_card_id IS NULL THEN RAISE EXCEPTION 'no card selected'; END IF;
  IF v_p.selected_card_rarity IN ('Legendary','Exodius') AND NOT public.is_owner(v_uid) THEN
    RAISE EXCEPTION 'Legendary and Exodia cards cannot claim properties';
  END IF;

  v_tile := public.board_tile(v_p.position);
  IF v_tile->>'type' <> 'property' THEN RAISE EXCEPTION 'not a property tile'; END IF;
  IF EXISTS(SELECT 1 FROM public.board_property_claims WHERE match_id=_match_id AND position=v_p.position) THEN
    RAISE EXCEPTION 'property already owned';
  END IF;

  IF _buy THEN
    v_cost := (v_tile->>'cost')::numeric;
    IF v_p.exod_in_game < v_cost THEN RAISE EXCEPTION 'insufficient in-game EXOD'; END IF;
    UPDATE public.board_players SET exod_in_game = exod_in_game - v_cost,
      score = score + v_cost * 0.5 WHERE id=v_p.id;
    INSERT INTO public.board_property_claims (match_id, position, owner_player_id, card_id, card_name, card_rarity)
      VALUES (_match_id, v_p.position, v_p.id, v_p.selected_card_id, v_p.selected_card_name, v_p.selected_card_rarity);
    INSERT INTO public.board_moves (match_id, player_id, turn_number, action, from_pos, to_pos, details)
      VALUES (_match_id, v_p.id, v_m.turn_number, 'claim', v_p.position, v_p.position,
              jsonb_build_object('cost',v_cost,'card',v_p.selected_card_name,'tile',v_tile->>'name'));
  END IF;

  PERFORM public._board_advance_turn(_match_id);
  RETURN jsonb_build_object('ok', true, 'bought', _buy);
END $$;

CREATE OR REPLACE FUNCTION public.board_upgrade(_match_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_m public.board_matches; v_p public.board_players;
  v_tile jsonb; v_claim public.board_property_claims; v_cost numeric;
BEGIN
  SELECT * INTO v_m FROM public.board_matches WHERE id=_match_id FOR UPDATE;
  SELECT * INTO v_p FROM public.board_players
    WHERE match_id=_match_id AND user_id=v_uid AND seat=v_m.current_seat FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not your turn'; END IF;
  SELECT * INTO v_claim FROM public.board_property_claims
    WHERE match_id=_match_id AND position=v_p.position FOR UPDATE;
  IF NOT FOUND OR v_claim.owner_player_id <> v_p.id THEN RAISE EXCEPTION 'not your property'; END IF;
  IF v_claim.level >= 3 THEN RAISE EXCEPTION 'already max level'; END IF;
  v_tile := public.board_tile(v_p.position);
  v_cost := (v_tile->>'cost')::numeric * 0.75;
  IF v_p.exod_in_game < v_cost THEN RAISE EXCEPTION 'insufficient in-game EXOD'; END IF;
  UPDATE public.board_players SET exod_in_game = exod_in_game - v_cost,
    score = score + v_cost WHERE id=v_p.id;
  UPDATE public.board_property_claims SET level = level + 1 WHERE id=v_claim.id;
  INSERT INTO public.board_moves (match_id, player_id, turn_number, action, from_pos, to_pos, details)
    VALUES (_match_id, v_p.id, v_m.turn_number, 'upgrade', v_p.position, v_p.position,
            jsonb_build_object('new_level', v_claim.level+1, 'cost', v_cost));
  PERFORM public._board_advance_turn(_match_id);
  RETURN jsonb_build_object('ok',true,'level',v_claim.level+1);
END $$;

CREATE OR REPLACE FUNCTION public.board_skip(_match_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_m public.board_matches; v_p public.board_players;
BEGIN
  SELECT * INTO v_m FROM public.board_matches WHERE id=_match_id FOR UPDATE;
  SELECT * INTO v_p FROM public.board_players
    WHERE match_id=_match_id AND user_id=v_uid AND seat=v_m.current_seat;
  IF NOT FOUND THEN RAISE EXCEPTION 'not your turn'; END IF;
  INSERT INTO public.board_moves (match_id, player_id, turn_number, action, details)
    VALUES (_match_id, v_p.id, v_m.turn_number, 'pass', '{}'::jsonb);
  PERFORM public._board_advance_turn(_match_id);
END $$;

-- Voting
CREATE OR REPLACE FUNCTION public.board_propose_vote(_match_id uuid, _kind text, _target uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_p public.board_players; v_id uuid; v_existing int;
BEGIN
  SELECT * INTO v_p FROM public.board_players WHERE match_id=_match_id AND user_id=v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'not in match'; END IF;
  IF _kind NOT IN ('end_game','skip_player') THEN RAISE EXCEPTION 'invalid vote kind'; END IF;
  SELECT count(*) INTO v_existing FROM public.board_votes
    WHERE match_id=_match_id AND status='open' AND kind=_kind
      AND (target_player_id IS NOT DISTINCT FROM _target);
  IF v_existing > 0 THEN RAISE EXCEPTION 'an open vote of this kind already exists'; END IF;
  INSERT INTO public.board_votes (match_id, proposer_id, kind, target_player_id)
    VALUES (_match_id, v_p.id, _kind, _target) RETURNING id INTO v_id;
  INSERT INTO public.board_vote_responses (vote_id, player_id, agree)
    VALUES (v_id, v_p.id, true);
  UPDATE public.board_votes SET yes_count=1 WHERE id=v_id;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.board_cast_vote(_vote_id uuid, _agree boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid:=auth.uid(); v_v public.board_votes; v_p public.board_players;
  v_active int; v_threshold int; v_yes int; v_no int;
BEGIN
  SELECT * INTO v_v FROM public.board_votes WHERE id=_vote_id FOR UPDATE;
  IF v_v.status <> 'open' THEN RAISE EXCEPTION 'vote closed'; END IF;
  SELECT * INTO v_p FROM public.board_players WHERE match_id=v_v.match_id AND user_id=v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'not in match'; END IF;
  INSERT INTO public.board_vote_responses (vote_id, player_id, agree)
    VALUES (_vote_id, v_p.id, _agree)
    ON CONFLICT (vote_id, player_id) DO UPDATE SET agree=EXCLUDED.agree;
  SELECT count(*) FILTER (WHERE agree), count(*) FILTER (WHERE NOT agree)
    INTO v_yes, v_no FROM public.board_vote_responses WHERE vote_id=_vote_id;
  UPDATE public.board_votes SET yes_count=v_yes, no_count=v_no WHERE id=_vote_id;

  SELECT count(*) INTO v_active FROM public.board_players
    WHERE match_id=v_v.match_id AND NOT is_eliminated;
  v_threshold := (v_active / 2) + 1;
  IF v_yes >= v_threshold THEN
    UPDATE public.board_votes SET status='passed', resolved_at=now() WHERE id=_vote_id;
    IF v_v.kind='end_game' THEN
      PERFORM public._board_finalize(v_v.match_id);
    ELSIF v_v.kind='skip_player' THEN
      INSERT INTO public.board_moves (match_id, turn_number, action, details)
        SELECT v_v.match_id, m.turn_number, 'vote_skip',
               jsonb_build_object('target', v_v.target_player_id)
        FROM public.board_matches m WHERE m.id = v_v.match_id;
      PERFORM public._board_advance_turn(v_v.match_id);
    END IF;
    RETURN jsonb_build_object('status','passed');
  ELSIF v_no > (v_active - v_threshold) THEN
    UPDATE public.board_votes SET status='failed', resolved_at=now() WHERE id=_vote_id;
    RETURN jsonb_build_object('status','failed');
  END IF;
  RETURN jsonb_build_object('status','open','yes',v_yes,'no',v_no,'threshold',v_threshold);
END $$;

-- Auto-skip expired turns (called by pg_cron or public endpoint)
CREATE OR REPLACE FUNCTION public.board_auto_skip_expired()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_m public.board_matches; v_count int := 0;
BEGIN
  FOR v_m IN SELECT * FROM public.board_matches
              WHERE status='active' AND mode='async'
                AND turn_deadline < now()
  LOOP
    INSERT INTO public.board_moves (match_id, turn_number, action, details)
      VALUES (v_m.id, v_m.turn_number, 'auto_skip',
              jsonb_build_object('seat', v_m.current_seat, 'reason','deadline_expired'));
    PERFORM public._board_advance_turn(v_m.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_moves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_property_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.board_vote_responses;
