
-- 1. card_catalog table (server-side card pool for pack rolls)
CREATE TABLE IF NOT EXISTS public.card_catalog (
  id text PRIMARY KEY,
  name text NOT NULL,
  rarity text NOT NULL,
  in_packs boolean NOT NULL DEFAULT true
);
ALTER TABLE public.card_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog public read" ON public.card_catalog FOR SELECT USING (true);

INSERT INTO public.card_catalog (id, name, rarity, in_packs) VALUES
  ('ex-head','Head of Exodius Prime','Exodius',false),
  ('ex-rarm','Right Arm of Exodius Prime','Exodius',false),
  ('ex-larm','Left Arm of Exodius Prime','Exodius',false),
  ('ex-rleg','Right Leg of Exodius Prime','Exodius',false),
  ('ex-lleg','Left Leg of Exodius Prime','Exodius',false),
  ('ra','Ra Reborn','Legendary',true),
  ('osiris','Osiris Eternal','Legendary',true),
  ('horus','Horus Ascendant','Legendary',true),
  ('anubis','Anubis, Judge of Souls','Divine',true),
  ('set','Set, Lord of Storms','Divine',true),
  ('thoth','Thoth, Scribe of Eternity','Divine',true),
  ('bastet','Bastet, Twin Daggers','Divine',true),
  ('nefari','Nefari, Pharaoh of Whispers','Divine',true),
  ('sphinx','Sphinx Guardian','Rare',true),
  ('sobek','Sobek, Crocodile King','Rare',true),
  ('ammit','Ammit, Devourer of Hearts','Rare',true),
  ('scarab','Scarab Champion','Rare',true),
  ('eagle','Suten, Eagle of the Pass','Rare',true),
  ('mummy','Mummy Sentinel','Common',true),
  ('serpent','Serpent of the Nile','Common',true),
  ('jackal','Jackal Scout','Common',true),
  ('priest','Priest of Karnak','Common',true),
  ('shadow','Khepri Shade','Common',true),
  ('colossus','Sandstone Colossus','Divine',true),
  ('field-sandscape','Endless Sandscape','Rare',true),
  ('field-blood-moon','Blood-Moon Eclipse','Divine',true),
  ('field-hall-two-truths','Hall of Two Truths','Divine',true),
  ('field-nile-flood','Flooding of the Nile','Rare',true),
  ('seal-mirror','Mirror of the Pharaoh','Divine',true),
  ('seal-ankh-ward','Ankh of the Living','Rare',true),
  ('seal-locust','Plague of Locusts','Rare',true),
  ('seal-binding','Binding of Osiris','Divine',true),
  ('ptah','Ptah, Architect of Worlds','Legendary',true),
  ('isis','Isis, Mother of Magic','Divine',true),
  ('khonsu','Khonsu, the Wandering Moon','Divine',true),
  ('wadjet','Wadjet, Cobra of the Crown','Rare',true),
  ('khepri','Khepri, Scarab of Dawn','Divine',true),
  ('neith','Neith, Weaver of Fate','Divine',true),
  ('ma-at','Ma''at, Feather of Truth','Rare',true),
  ('khaba','Khaba, Sand Rider','Common',true),
  ('tahu','Tahu, Tomb Guardian','Common',true),
  ('kemet-priest','Priestess of Kemet','Common',true),
  ('ammit-2','Ammit, Shadow Twin','Rare',true),
  ('ra-variant','Ra, Burning Disc','Legendary',true),
  ('psycronos','Psycronos, Lord of Time & Forbidden Traps','Exodius',false),
  ('khadija','Khadija, Princess of the Dawn','Legendary',false)
ON CONFLICT (id) DO NOTHING;

-- 2. Duel Pass subscriptions: remove the blanket "own sub upsert" ALL policy.
DROP POLICY IF EXISTS "own sub upsert" ON public.duel_pass_subscriptions;

-- Only allow owner to mark themselves inactive (cancel). Activation must go through the function.
CREATE POLICY "own sub cancel" ON public.duel_pass_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'inactive' AND tier = 'free');

CREATE OR REPLACE FUNCTION public.activate_premium_pass(_payment_ref text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  -- Payment verification placeholder. Until the Stripe webhook writes a verified
  -- payment record, this function refuses to activate premium. Once Stripe is
  -- wired up, validate _payment_ref against a server-side payments table here.
  RAISE EXCEPTION 'premium activation unavailable: payment verification not yet wired';
END $$;
REVOKE EXECUTE ON FUNCTION public.activate_premium_pass(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_premium_pass(text) TO authenticated;

-- 3. award_battle_xp: rate limit + caps
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_battle_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS levelup_exod_today numeric NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS levelup_reset_at date NOT NULL DEFAULT CURRENT_DATE;

CREATE OR REPLACE FUNCTION public.award_battle_xp(_won boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_old_xp integer;
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
  v_xp_gain integer;
  v_levels_gained integer;
  v_packs integer;
  v_last timestamptz;
  v_today date := current_date;
  v_already numeric;
  v_remaining_cap numeric;
  v_levelup_grant numeric;
  v_levelup_exod numeric;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  -- 30s cooldown between battles
  SELECT last_battle_at INTO v_last FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF v_last IS NOT NULL AND v_last > now() - interval '30 seconds' THEN
    RAISE EXCEPTION 'battle cooldown active, try again in a few seconds';
  END IF;

  v_xp_gain := CASE WHEN _won THEN 50 ELSE 15 END;

  SELECT xp, level INTO v_old_xp, v_old_level FROM public.profiles WHERE id = v_uid;
  IF v_old_xp IS NULL THEN RAISE EXCEPTION 'profile missing'; END IF;

  v_new_xp := v_old_xp + v_xp_gain;
  v_new_level := GREATEST(1, floor(sqrt(v_new_xp::numeric / 100))::int + 1);
  IF v_new_level <= v_old_level THEN v_new_level := v_old_level; END IF;
  v_levels_gained := GREATEST(0, v_new_level - v_old_level);

  -- Reset daily level-up EXOD budget if a new day
  UPDATE public.profiles
    SET levelup_exod_today = CASE WHEN levelup_reset_at < v_today THEN 0 ELSE levelup_exod_today END,
        levelup_reset_at = CASE WHEN levelup_reset_at < v_today THEN v_today ELSE levelup_reset_at END
    WHERE id = v_uid;

  SELECT levelup_exod_today INTO v_already FROM public.profiles WHERE id = v_uid;
  v_remaining_cap := GREATEST(0, 1000 - COALESCE(v_already, 0));
  v_levelup_exod := 250 * v_levels_gained;
  v_levelup_grant := LEAST(v_levelup_exod, v_remaining_cap);

  UPDATE public.profiles
    SET xp = v_new_xp,
        level = v_new_level,
        duels_played = duels_played + 1,
        duels_won = duels_won + CASE WHEN _won THEN 1 ELSE 0 END,
        -- cap pending_free_packs at 5
        pending_free_packs = LEAST(5, pending_free_packs + v_levels_gained),
        levelup_exod_today = levelup_exod_today + v_levelup_grant,
        last_battle_at = now(),
        updated_at = now()
    WHERE id = v_uid
    RETURNING pending_free_packs INTO v_packs;

  IF v_levelup_grant > 0 THEN
    UPDATE public.wallets
      SET exod_balance = exod_balance + v_levelup_grant,
          lifetime_earned = lifetime_earned + v_levelup_grant,
          updated_at = now()
      WHERE user_id = v_uid;
    INSERT INTO public.transactions (user_id, amount, type, description, meta)
      VALUES (v_uid, v_levelup_grant, 'reward',
              'Level up reward (Lv ' || v_new_level || ') +' || v_levels_gained || ' free pack',
              jsonb_build_object('level', v_new_level, 'levels_gained', v_levels_gained));
  END IF;

  INSERT INTO public.transactions (user_id, amount, type, description, meta)
    VALUES (v_uid, 0, 'xp', 'Battle XP +' || v_xp_gain || ' (' || CASE WHEN _won THEN 'win' ELSE 'loss' END || ')',
            jsonb_build_object('xp_gain', v_xp_gain, 'won', _won));

  RETURN jsonb_build_object(
    'xp', v_new_xp,
    'level', v_new_level,
    'leveled_up', v_levels_gained > 0,
    'levels_gained', v_levels_gained,
    'pending_free_packs', v_packs
  );
END $function$;

-- 4. claim_free_pack: server-side roll using card_catalog + drop weights
DROP FUNCTION IF EXISTS public.claim_free_pack(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.claim_free_pack(_drop_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_packs integer;
  v_drop public.pack_drops;
  v_cards jsonb := '[]'::jsonb;
  v_weights jsonb;
  v_entries text[];
  v_total numeric := 0;
  v_i integer;
  v_r numeric;
  v_acc numeric;
  v_chosen_rarity text;
  v_key text;
  v_pick public.card_catalog;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT * INTO v_drop FROM public.pack_drops WHERE id = _drop_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'drop not found'; END IF;
  IF v_drop.status <> 'active' THEN RAISE EXCEPTION 'drop not active'; END IF;

  UPDATE public.profiles
    SET pending_free_packs = pending_free_packs - 1,
        updated_at = now()
    WHERE id = v_uid AND pending_free_packs > 0
    RETURNING pending_free_packs INTO v_packs;
  IF NOT FOUND THEN RAISE EXCEPTION 'no free pack credits available'; END IF;

  v_weights := v_drop.rarity_weights;
  SELECT array_agg(k), sum((v_weights->>k)::numeric)
    INTO v_entries, v_total
    FROM jsonb_object_keys(v_weights) k;

  IF v_total IS NULL OR v_total <= 0 THEN RAISE EXCEPTION 'drop misconfigured'; END IF;

  FOR v_i IN 1..v_drop.cards_per_pack LOOP
    v_r := random() * v_total;
    v_acc := 0;
    v_chosen_rarity := v_entries[1];
    FOREACH v_key IN ARRAY v_entries LOOP
      v_acc := v_acc + (v_weights->>v_key)::numeric;
      IF v_r < v_acc THEN v_chosen_rarity := v_key; EXIT; END IF;
    END LOOP;

    SELECT * INTO v_pick FROM public.card_catalog
      WHERE rarity = v_chosen_rarity AND in_packs = true
      ORDER BY random() LIMIT 1;
    IF FOUND THEN
      v_cards := v_cards || jsonb_build_array(jsonb_build_object('id', v_pick.id, 'name', v_pick.name, 'rarity', v_pick.rarity));
    END IF;
  END LOOP;

  INSERT INTO public.pack_purchases (user_id, drop_id, cards_received)
    VALUES (v_uid, _drop_id, v_cards);

  INSERT INTO public.transactions (user_id, amount, type, description, meta)
    VALUES (v_uid, 0, 'reward', 'Free pack opened', jsonb_build_object('drop_id', _drop_id));

  RETURN jsonb_build_object('pending_free_packs', v_packs, 'cards', v_cards);
END $$;

-- 5. Profiles: restrict full-table read to owner + admin; create safe view for public profile pages
DROP POLICY IF EXISTS "public profiles read" ON public.profiles;
CREATE POLICY "profiles owner admin read" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, username, display_name, avatar_url, bio, rank, level, duels_played, duels_won, created_at
FROM public.profiles
WHERE is_public = true;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 6. Tournament registrations: only the registered user + admins
DROP POLICY IF EXISTS "registrations public read" ON public.tournament_registrations;
CREATE POLICY "registrations owner admin read" ON public.tournament_registrations
  FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 7. Marketplace listings: public can only see active listings; buyer/sold details only for parties + admins
DROP POLICY IF EXISTS "listings public read" ON public.marketplace_listings;
CREATE POLICY "listings public active" ON public.marketplace_listings
  FOR SELECT
  USING (status = 'active');
CREATE POLICY "listings parties read" ON public.marketplace_listings
  FOR SELECT
  USING (auth.uid() = seller_id OR auth.uid() = buyer_id OR has_role(auth.uid(), 'admin'::app_role));

-- 8. Lock down SECURITY DEFINER function execution: revoke from anon, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.award_battle_xp(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_battle_xp(boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_free_pack(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_free_pack(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.earn_exod(numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.earn_exod(numeric, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.purchase_listing(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_listing(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.register_tournament(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_tournament(uuid) TO authenticated;
