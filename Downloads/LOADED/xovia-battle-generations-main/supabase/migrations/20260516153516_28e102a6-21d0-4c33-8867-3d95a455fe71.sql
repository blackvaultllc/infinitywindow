
-- ============ WALLET: add Ankh + daily claim tracking ============
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS ankh_balance numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ankh_lifetime_earned numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_coins_claimed_at date;

-- ============ STORE CREDIT (USD cents) ============
CREATE TABLE IF NOT EXISTS public.store_credit (
  user_id uuid PRIMARY KEY,
  credit_cents integer NOT NULL DEFAULT 0,
  lifetime_earned_cents integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_credit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own credit read" ON public.store_credit FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

-- ============ USER CARDS INVENTORY ============
CREATE TABLE IF NOT EXISTS public.user_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id text NOT NULL,
  card_name text NOT NULL,
  card_rarity text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'chest',
  UNIQUE (user_id, card_id)
);
CREATE INDEX IF NOT EXISTS idx_user_cards_user ON public.user_cards(user_id);
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards read" ON public.user_cards FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

-- ============ CHESTS ============
CREATE TABLE IF NOT EXISTS public.user_chests (
  user_id uuid PRIMARY KEY,
  unopened integer NOT NULL DEFAULT 0,
  lifetime_opened integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_chests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chests read" ON public.user_chests FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.chest_open_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id text NOT NULL,
  card_name text NOT NULL,
  card_rarity text NOT NULL,
  opened_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chest_log_user ON public.chest_open_log(user_id, opened_at DESC);
ALTER TABLE public.chest_open_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own log read" ON public.chest_open_log FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));

-- ============ EXCHANGE RATES (rarity -> USD cents per card) ============
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  rarity text PRIMARY KEY,
  payout_cents integer NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rates public read" ON public.exchange_rates FOR SELECT USING (true);
CREATE POLICY "rates admin write" ON public.exchange_rates FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.exchange_rates (rarity, payout_cents, enabled) VALUES
  ('Common', 10, true),
  ('Rare', 50, true),
  ('Epic', 200, true),
  ('Legendary', 100, true),
  ('Exodius', 0, false)
ON CONFLICT (rarity) DO NOTHING;

-- ============ MARKETPLACE: support Ankh currency ============
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'exod',
  ADD COLUMN IF NOT EXISTS price_ankh numeric;

-- ============ DAILY COINS ============
CREATE OR REPLACE FUNCTION public.claim_daily_coins()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid(); v_today date := current_date; v_amount int; v_last date;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT daily_coins_claimed_at INTO v_last FROM public.wallets WHERE user_id=v_uid FOR UPDATE;
  IF v_last = v_today THEN RAISE EXCEPTION 'already claimed today'; END IF;
  v_amount := 1 + floor(random()*5)::int; -- 1..5
  UPDATE public.wallets
    SET ankh_balance = ankh_balance + v_amount,
        ankh_lifetime_earned = ankh_lifetime_earned + v_amount,
        daily_coins_claimed_at = v_today,
        updated_at = now()
    WHERE user_id = v_uid;
  INSERT INTO public.transactions (user_id, amount, type, description, meta)
    VALUES (v_uid, v_amount, 'reward', 'Daily ankh coins +'||v_amount, jsonb_build_object('currency','ankh'));
  RETURN jsonb_build_object('amount', v_amount);
END $$;

-- ============ CREDIT / DEBIT ANKH (admin only) ============
CREATE OR REPLACE FUNCTION public.credit_ankh(_user_id uuid, _amount numeric, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT (public.is_owner(auth.uid()) OR has_role(auth.uid(),'admin') OR auth.role()='service_role') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _amount <= 0 THEN RETURN; END IF;
  UPDATE public.wallets
    SET ankh_balance = ankh_balance + _amount,
        ankh_lifetime_earned = ankh_lifetime_earned + _amount,
        updated_at = now()
    WHERE user_id = _user_id;
  INSERT INTO public.transactions (user_id, amount, type, description, meta)
    VALUES (_user_id, _amount, 'reward', COALESCE(_reason,'Ankh credit'), jsonb_build_object('currency','ankh'));
END $$;

-- ============ BUY CHESTS (60 ankh each, volume discount) ============
CREATE OR REPLACE FUNCTION public.buy_chests(_quantity integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid(); v_unit int := 60; v_total numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _quantity < 1 OR _quantity > 100 THEN RAISE EXCEPTION 'quantity must be 1-100'; END IF;
  -- volume discount
  IF _quantity >= 100 THEN v_unit := 45;
  ELSIF _quantity >= 50 THEN v_unit := 50;
  ELSIF _quantity >= 25 THEN v_unit := 54;
  ELSIF _quantity >= 10 THEN v_unit := 57;
  END IF;
  v_total := v_unit * _quantity;
  UPDATE public.wallets SET ankh_balance = ankh_balance - v_total, updated_at = now()
    WHERE user_id = v_uid AND ankh_balance >= v_total;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient ankh coins'; END IF;
  INSERT INTO public.user_chests (user_id, unopened) VALUES (v_uid, _quantity)
    ON CONFLICT (user_id) DO UPDATE SET unopened = user_chests.unopened + EXCLUDED.unopened, updated_at = now();
  INSERT INTO public.transactions (user_id, amount, type, description, meta)
    VALUES (v_uid, -v_total, 'spend', 'Bought '||_quantity||' chests', jsonb_build_object('currency','ankh','chests',_quantity,'unit',v_unit));
  RETURN jsonb_build_object('quantity', _quantity, 'spent', v_total);
END $$;

-- ============ OPEN A CHEST (server-rolled) ============
-- Weights (parts per 1e8): Common 70M, Rare 22M, Epic 7M, Legendary 999_999, Exodius 1
CREATE OR REPLACE FUNCTION public.open_chest()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_chests int;
  v_roll bigint;
  v_rarity text;
  v_pick public.card_catalog;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.user_chests
    SET unopened = unopened - 1, lifetime_opened = lifetime_opened + 1, updated_at = now()
    WHERE user_id = v_uid AND unopened > 0
    RETURNING unopened INTO v_chests;
  IF NOT FOUND THEN RAISE EXCEPTION 'no chests to open'; END IF;

  v_roll := floor(random() * 100000000)::bigint;  -- 0..99,999,999
  IF v_roll < 1 THEN
    v_rarity := 'Exodius';
  ELSIF v_roll < 1000000 THEN  -- next 999,999
    v_rarity := 'Legendary';
  ELSIF v_roll < 8000000 THEN  -- next 7,000,000
    v_rarity := 'Epic';
  ELSIF v_roll < 30000000 THEN -- next 22,000,000
    v_rarity := 'Rare';
  ELSE
    v_rarity := 'Common';
  END IF;

  SELECT * INTO v_pick FROM public.card_catalog
    WHERE rarity = v_rarity AND in_packs = true
    ORDER BY random() LIMIT 1;
  IF NOT FOUND THEN
    -- fallback to common
    SELECT * INTO v_pick FROM public.card_catalog
      WHERE rarity = 'Common' AND in_packs = true ORDER BY random() LIMIT 1;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'no card available'; END IF;

  INSERT INTO public.user_cards (user_id, card_id, card_name, card_rarity, quantity, source)
    VALUES (v_uid, v_pick.id, v_pick.name, v_pick.rarity, 1, 'chest')
    ON CONFLICT (user_id, card_id) DO UPDATE
      SET quantity = user_cards.quantity + 1, acquired_at = now();
  INSERT INTO public.chest_open_log (user_id, card_id, card_name, card_rarity)
    VALUES (v_uid, v_pick.id, v_pick.name, v_pick.rarity);

  RETURN jsonb_build_object(
    'card_id', v_pick.id,
    'card_name', v_pick.name,
    'card_rarity', v_pick.rarity,
    'chests_remaining', v_chests
  );
END $$;

-- ============ EXCHANGE CARDS -> STORE CREDIT ============
CREATE OR REPLACE FUNCTION public.exchange_cards_for_credit(_items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item jsonb; v_card_id text; v_qty int;
  v_owned public.user_cards; v_rate public.exchange_rates;
  v_total int := 0;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF jsonb_typeof(_items) <> 'array' THEN RAISE EXCEPTION 'items must be array'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    v_card_id := v_item->>'card_id';
    v_qty := COALESCE((v_item->>'quantity')::int, 1);
    IF v_qty < 1 THEN CONTINUE; END IF;

    SELECT * INTO v_owned FROM public.user_cards
      WHERE user_id = v_uid AND card_id = v_card_id FOR UPDATE;
    IF NOT FOUND OR v_owned.quantity < v_qty THEN
      RAISE EXCEPTION 'do not own enough of %', v_card_id;
    END IF;

    SELECT * INTO v_rate FROM public.exchange_rates WHERE rarity = v_owned.card_rarity;
    IF NOT FOUND OR NOT v_rate.enabled THEN
      RAISE EXCEPTION 'cannot exchange % cards', v_owned.card_rarity;
    END IF;

    v_total := v_total + (v_rate.payout_cents * v_qty);

    IF v_owned.quantity = v_qty THEN
      DELETE FROM public.user_cards WHERE id = v_owned.id;
    ELSE
      UPDATE public.user_cards SET quantity = quantity - v_qty WHERE id = v_owned.id;
    END IF;
  END LOOP;

  IF v_total <= 0 THEN RAISE EXCEPTION 'nothing to exchange'; END IF;

  INSERT INTO public.store_credit (user_id, credit_cents, lifetime_earned_cents)
    VALUES (v_uid, v_total, v_total)
    ON CONFLICT (user_id) DO UPDATE
      SET credit_cents = store_credit.credit_cents + EXCLUDED.credit_cents,
          lifetime_earned_cents = store_credit.lifetime_earned_cents + EXCLUDED.lifetime_earned_cents,
          updated_at = now();
  INSERT INTO public.transactions (user_id, amount, type, description, meta)
    VALUES (v_uid, v_total, 'reward', 'Exchanged cards for store credit', jsonb_build_object('currency','usd_cents','items',_items));
  RETURN jsonb_build_object('credit_cents', v_total);
END $$;

-- ============ MARKETPLACE: list a card from inventory in Ankh ============
CREATE OR REPLACE FUNCTION public.list_card_for_ankh(_card_id text, _price_ankh numeric)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid(); v_owned public.user_cards; v_listing_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _price_ankh < 1 OR _price_ankh > 1000000 THEN RAISE EXCEPTION 'price out of range'; END IF;
  SELECT * INTO v_owned FROM public.user_cards WHERE user_id=v_uid AND card_id=_card_id FOR UPDATE;
  IF NOT FOUND OR v_owned.quantity < 1 THEN RAISE EXCEPTION 'card not owned'; END IF;
  IF v_owned.card_rarity = 'Exodius' THEN RAISE EXCEPTION 'Exodius cards cannot be traded'; END IF;

  -- Reserve the card: remove one from inventory
  IF v_owned.quantity = 1 THEN
    DELETE FROM public.user_cards WHERE id = v_owned.id;
  ELSE
    UPDATE public.user_cards SET quantity = quantity - 1 WHERE id = v_owned.id;
  END IF;

  INSERT INTO public.marketplace_listings (seller_id, card_id, card_name, card_rarity, price_exod, price_ankh, currency, status)
    VALUES (v_uid, v_owned.card_id, v_owned.card_name, v_owned.card_rarity, 0, _price_ankh, 'ankh', 'active')
    RETURNING id INTO v_listing_id;
  RETURN v_listing_id;
END $$;

-- ============ MARKETPLACE: buy listing in Ankh and transfer card ============
CREATE OR REPLACE FUNCTION public.purchase_listing_ankh(_listing_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_buyer uuid := auth.uid(); v_listing public.marketplace_listings;
        v_fee numeric; v_seller_receives numeric;
BEGIN
  IF v_buyer IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_listing FROM public.marketplace_listings WHERE id=_listing_id FOR UPDATE;
  IF NOT FOUND OR v_listing.status<>'active' THEN RAISE EXCEPTION 'listing unavailable'; END IF;
  IF v_listing.currency <> 'ankh' THEN RAISE EXCEPTION 'use purchase_listing for EXOD listings'; END IF;
  IF v_listing.seller_id = v_buyer THEN RAISE EXCEPTION 'cannot buy own listing'; END IF;

  UPDATE public.wallets
    SET ankh_balance = ankh_balance - v_listing.price_ankh, updated_at = now()
    WHERE user_id = v_buyer AND ankh_balance >= v_listing.price_ankh;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient ankh'; END IF;

  v_fee := round(v_listing.price_ankh * 0.025, 2);
  v_seller_receives := v_listing.price_ankh - v_fee;

  UPDATE public.wallets
    SET ankh_balance = ankh_balance + v_seller_receives,
        ankh_lifetime_earned = ankh_lifetime_earned + v_seller_receives,
        updated_at = now()
    WHERE user_id = v_listing.seller_id;

  -- Transfer card to buyer
  INSERT INTO public.user_cards (user_id, card_id, card_name, card_rarity, quantity, source)
    VALUES (v_buyer, v_listing.card_id, v_listing.card_name, v_listing.card_rarity, 1, 'trade')
    ON CONFLICT (user_id, card_id) DO UPDATE
      SET quantity = user_cards.quantity + 1, acquired_at = now();

  UPDATE public.marketplace_listings SET status='sold', buyer_id=v_buyer, sold_at=now()
    WHERE id=_listing_id;

  INSERT INTO public.transactions (user_id, amount, type, description, meta) VALUES
    (v_buyer, -v_listing.price_ankh, 'spend', 'Bought '||v_listing.card_name||' (Ankh)', jsonb_build_object('currency','ankh','listing_id',_listing_id)),
    (v_listing.seller_id, v_seller_receives, 'earn', 'Sold '||v_listing.card_name||' (Ankh, after 2.5% fee)', jsonb_build_object('currency','ankh','listing_id',_listing_id,'fee',v_fee));
END $$;

-- ============ CANCEL LISTING: return card to seller ============
CREATE OR REPLACE FUNCTION public.cancel_listing(_listing_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid := auth.uid(); v_l public.marketplace_listings;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_l FROM public.marketplace_listings WHERE id=_listing_id FOR UPDATE;
  IF NOT FOUND OR v_l.seller_id <> v_uid OR v_l.status <> 'active' THEN
    RAISE EXCEPTION 'cannot cancel';
  END IF;
  UPDATE public.marketplace_listings SET status='cancelled' WHERE id=_listing_id;
  -- Return reserved card to inventory
  INSERT INTO public.user_cards (user_id, card_id, card_name, card_rarity, quantity, source)
    VALUES (v_uid, v_l.card_id, v_l.card_name, v_l.card_rarity, 1, 'listing_cancel')
    ON CONFLICT (user_id, card_id) DO UPDATE
      SET quantity = user_cards.quantity + 1, acquired_at = now();
END $$;
