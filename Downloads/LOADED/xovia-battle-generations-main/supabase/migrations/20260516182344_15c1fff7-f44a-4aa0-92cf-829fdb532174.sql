
-- ========== ARENA WAGER SYSTEM ==========

CREATE TABLE public.arena_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('casual','coin','card')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','active','settled','cancelled','disputed')),
  host_id uuid NOT NULL,
  opponent_id uuid,
  stake_ankh numeric NOT NULL DEFAULT 0,
  stake_rarity text,
  winner_id uuid,
  host_reported_winner uuid,
  opponent_reported_winner uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  settled_at timestamptz,
  cancelled_at timestamptz
);

CREATE INDEX arena_matches_status_idx ON public.arena_matches (status, created_at DESC);
CREATE INDEX arena_matches_host_idx ON public.arena_matches (host_id);
CREATE INDEX arena_matches_opp_idx ON public.arena_matches (opponent_id);

ALTER TABLE public.arena_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arena matches public open"
  ON public.arena_matches FOR SELECT
  USING (status = 'open' OR auth.uid() = host_id OR auth.uid() = opponent_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE public.arena_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.arena_matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN ('coin','card')),
  amount_ankh numeric NOT NULL DEFAULT 0,
  card_id text,
  card_name text,
  card_rarity text,
  released boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX arena_stakes_match_idx ON public.arena_stakes (match_id);
CREATE INDEX arena_stakes_user_card_idx ON public.arena_stakes (user_id, card_id) WHERE released = false AND card_id IS NOT NULL;

ALTER TABLE public.arena_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arena stakes participant read"
  ON public.arena_stakes FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.arena_matches m
    WHERE m.id = arena_stakes.match_id AND (auth.uid() = m.host_id OR auth.uid() = m.opponent_id)
  ) OR has_role(auth.uid(), 'admin'::app_role));

-- helper: is card currently locked in any active stake for this user?
CREATE OR REPLACE FUNCTION public.is_card_staked(_user uuid, _card_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.arena_stakes s
    JOIN public.arena_matches m ON m.id = s.match_id
    WHERE s.user_id = _user
      AND s.card_id = _card_id
      AND s.released = false
      AND m.status IN ('open','active','disputed')
  );
$$;

-- ===== RPC: create match =====
CREATE OR REPLACE FUNCTION public.create_arena_match(
  _mode text,
  _stake_ankh numeric DEFAULT 0,
  _card_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_match_id uuid;
  v_card record;
  v_balance numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  IF _mode NOT IN ('casual','coin','card') THEN RAISE EXCEPTION 'invalid mode'; END IF;

  IF _mode = 'coin' THEN
    IF _stake_ankh NOT IN (50, 250, 1000) THEN RAISE EXCEPTION 'stake must be 50, 250, or 1000 Ankh'; END IF;
    SELECT ankh_balance INTO v_balance FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
    IF coalesce(v_balance,0) < _stake_ankh THEN RAISE EXCEPTION 'insufficient Ankh'; END IF;
    UPDATE public.wallets SET ankh_balance = ankh_balance - _stake_ankh, updated_at = now() WHERE user_id = v_uid;
  END IF;

  IF _mode = 'card' THEN
    IF _card_id IS NULL THEN RAISE EXCEPTION 'card required'; END IF;
    SELECT card_id, card_name, card_rarity, quantity INTO v_card
      FROM public.user_cards WHERE user_id = v_uid AND card_id = _card_id LIMIT 1;
    IF v_card IS NULL OR v_card.quantity < 1 THEN RAISE EXCEPTION 'card not in vault'; END IF;
    IF v_card.card_rarity = 'Exodius' THEN RAISE EXCEPTION 'cannot wager Exodius relics'; END IF;
    IF public.is_card_staked(v_uid, _card_id) THEN RAISE EXCEPTION 'card already locked in another wager'; END IF;
  END IF;

  INSERT INTO public.arena_matches (mode, host_id, stake_ankh, stake_rarity)
    VALUES (_mode, v_uid,
            CASE WHEN _mode = 'coin' THEN _stake_ankh ELSE 0 END,
            CASE WHEN _mode = 'card' THEN v_card.card_rarity ELSE NULL END)
    RETURNING id INTO v_match_id;

  IF _mode = 'coin' THEN
    INSERT INTO public.arena_stakes (match_id, user_id, kind, amount_ankh)
      VALUES (v_match_id, v_uid, 'coin', _stake_ankh);
  ELSIF _mode = 'card' THEN
    INSERT INTO public.arena_stakes (match_id, user_id, kind, card_id, card_name, card_rarity)
      VALUES (v_match_id, v_uid, 'card', v_card.card_id, v_card.card_name, v_card.card_rarity);
  END IF;

  RETURN v_match_id;
END;
$$;

-- ===== RPC: accept match =====
CREATE OR REPLACE FUNCTION public.accept_arena_match(
  _match_id uuid,
  _card_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_match record;
  v_card record;
  v_balance numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO v_match FROM public.arena_matches WHERE id = _match_id FOR UPDATE;
  IF v_match IS NULL THEN RAISE EXCEPTION 'match not found'; END IF;
  IF v_match.status <> 'open' THEN RAISE EXCEPTION 'match no longer open'; END IF;
  IF v_match.host_id = v_uid THEN RAISE EXCEPTION 'cannot accept own match'; END IF;

  IF v_match.mode = 'coin' THEN
    SELECT ankh_balance INTO v_balance FROM public.wallets WHERE user_id = v_uid FOR UPDATE;
    IF coalesce(v_balance,0) < v_match.stake_ankh THEN RAISE EXCEPTION 'insufficient Ankh'; END IF;
    UPDATE public.wallets SET ankh_balance = ankh_balance - v_match.stake_ankh, updated_at = now() WHERE user_id = v_uid;
    INSERT INTO public.arena_stakes (match_id, user_id, kind, amount_ankh)
      VALUES (_match_id, v_uid, 'coin', v_match.stake_ankh);
  ELSIF v_match.mode = 'card' THEN
    IF _card_id IS NULL THEN RAISE EXCEPTION 'card required'; END IF;
    SELECT card_id, card_name, card_rarity, quantity INTO v_card
      FROM public.user_cards WHERE user_id = v_uid AND card_id = _card_id LIMIT 1;
    IF v_card IS NULL OR v_card.quantity < 1 THEN RAISE EXCEPTION 'card not in vault'; END IF;
    IF v_card.card_rarity <> v_match.stake_rarity THEN RAISE EXCEPTION 'rarity must match (%)', v_match.stake_rarity; END IF;
    IF public.is_card_staked(v_uid, _card_id) THEN RAISE EXCEPTION 'card already locked in another wager'; END IF;
    INSERT INTO public.arena_stakes (match_id, user_id, kind, card_id, card_name, card_rarity)
      VALUES (_match_id, v_uid, 'card', v_card.card_id, v_card.card_name, v_card.card_rarity);
  END IF;

  UPDATE public.arena_matches
    SET status = 'active', opponent_id = v_uid, accepted_at = now()
    WHERE id = _match_id;
END;
$$;

-- ===== RPC: cancel open match =====
CREATE OR REPLACE FUNCTION public.cancel_arena_match(_match_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_match record;
  v_stake record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO v_match FROM public.arena_matches WHERE id = _match_id FOR UPDATE;
  IF v_match IS NULL THEN RAISE EXCEPTION 'match not found'; END IF;
  IF v_match.host_id <> v_uid AND NOT has_role(v_uid, 'admin'::app_role) THEN RAISE EXCEPTION 'not your match'; END IF;
  IF v_match.status <> 'open' THEN RAISE EXCEPTION 'only open matches can be cancelled'; END IF;

  FOR v_stake IN SELECT * FROM public.arena_stakes WHERE match_id = _match_id AND released = false LOOP
    IF v_stake.kind = 'coin' THEN
      UPDATE public.wallets SET ankh_balance = ankh_balance + v_stake.amount_ankh, updated_at = now()
        WHERE user_id = v_stake.user_id;
    END IF;
    UPDATE public.arena_stakes SET released = true WHERE id = v_stake.id;
  END LOOP;

  UPDATE public.arena_matches SET status = 'cancelled', cancelled_at = now() WHERE id = _match_id;
END;
$$;

-- ===== RPC: report result =====
CREATE OR REPLACE FUNCTION public.report_arena_result(_match_id uuid, _winner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_match record;
  v_pot numeric;
  v_fee numeric;
  v_payout numeric;
  v_loser uuid;
  v_card record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth required'; END IF;
  SELECT * INTO v_match FROM public.arena_matches WHERE id = _match_id FOR UPDATE;
  IF v_match IS NULL THEN RAISE EXCEPTION 'match not found'; END IF;
  IF v_match.status NOT IN ('active','disputed') THEN RAISE EXCEPTION 'match is not in progress'; END IF;
  IF v_uid <> v_match.host_id AND v_uid <> v_match.opponent_id THEN RAISE EXCEPTION 'not a participant'; END IF;
  IF _winner_id NOT IN (v_match.host_id, v_match.opponent_id) THEN RAISE EXCEPTION 'invalid winner'; END IF;

  IF v_uid = v_match.host_id THEN
    UPDATE public.arena_matches SET host_reported_winner = _winner_id WHERE id = _match_id;
    v_match.host_reported_winner := _winner_id;
  ELSE
    UPDATE public.arena_matches SET opponent_reported_winner = _winner_id WHERE id = _match_id;
    v_match.opponent_reported_winner := _winner_id;
  END IF;

  -- if both reported and agree → settle
  IF v_match.host_reported_winner IS NOT NULL
     AND v_match.opponent_reported_winner IS NOT NULL THEN

    IF v_match.host_reported_winner <> v_match.opponent_reported_winner THEN
      UPDATE public.arena_matches SET status = 'disputed' WHERE id = _match_id;
      RETURN jsonb_build_object('status','disputed');
    END IF;

    v_loser := CASE WHEN _winner_id = v_match.host_id THEN v_match.opponent_id ELSE v_match.host_id END;

    IF v_match.mode = 'coin' THEN
      v_pot := v_match.stake_ankh * 2;
      v_fee := round(v_pot * 0.025);
      v_payout := v_pot - v_fee;
      UPDATE public.wallets SET ankh_balance = ankh_balance + v_payout, updated_at = now()
        WHERE user_id = _winner_id;
      INSERT INTO public.transactions (user_id, type, amount, description, meta)
        VALUES (_winner_id, 'arena_win', v_payout, 'Arena coin wager payout',
                jsonb_build_object('match_id', _match_id, 'mode','coin','fee',v_fee));
      INSERT INTO public.platform_revenue (source, amount, currency, ref_id)
        VALUES ('arena_coin_fee', v_fee, 'ANKH', _match_id);
    ELSIF v_match.mode = 'card' THEN
      -- transfer loser's staked card to winner
      SELECT * INTO v_card FROM public.arena_stakes
        WHERE match_id = _match_id AND user_id = v_loser AND kind = 'card' LIMIT 1;
      IF v_card IS NOT NULL THEN
        -- decrement loser
        UPDATE public.user_cards SET quantity = quantity - 1
          WHERE user_id = v_loser AND card_id = v_card.card_id;
        DELETE FROM public.user_cards WHERE user_id = v_loser AND card_id = v_card.card_id AND quantity <= 0;
        -- add to winner
        INSERT INTO public.user_cards (user_id, card_id, card_name, card_rarity, quantity, source)
          VALUES (_winner_id, v_card.card_id, v_card.card_name, v_card.card_rarity, 1, 'arena_wager')
          ON CONFLICT DO NOTHING;
        -- If unique constraint not present, fall back to increment
        UPDATE public.user_cards SET quantity = quantity + 1
          WHERE user_id = _winner_id AND card_id = v_card.card_id
            AND NOT EXISTS (SELECT 1 FROM public.user_cards WHERE user_id = _winner_id AND card_id = v_card.card_id AND quantity = 1 AND source = 'arena_wager');
        INSERT INTO public.transactions (user_id, type, amount, description, meta)
          VALUES (_winner_id, 'arena_card_win', 0,
                  format('Won %s from arena card wager', v_card.card_name),
                  jsonb_build_object('match_id', _match_id, 'card_id', v_card.card_id));
      END IF;
    END IF;

    UPDATE public.arena_stakes SET released = true WHERE match_id = _match_id;
    UPDATE public.arena_matches SET status = 'settled', winner_id = _winner_id, settled_at = now() WHERE id = _match_id;

    RETURN jsonb_build_object('status','settled','winner',_winner_id);
  END IF;

  RETURN jsonb_build_object('status','pending');
END;
$$;

-- prevent listing a card that's locked in an active wager
CREATE OR REPLACE FUNCTION public.block_listing_if_staked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'active' AND public.is_card_staked(NEW.seller_id, NEW.card_id) THEN
    RAISE EXCEPTION 'card is locked in an active arena wager';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_block_listing_if_staked ON public.marketplace_listings;
CREATE TRIGGER trg_block_listing_if_staked
  BEFORE INSERT OR UPDATE ON public.marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION public.block_listing_if_staked();

GRANT EXECUTE ON FUNCTION public.create_arena_match(text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_arena_match(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_arena_match(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.report_arena_result(uuid, uuid) TO authenticated;
