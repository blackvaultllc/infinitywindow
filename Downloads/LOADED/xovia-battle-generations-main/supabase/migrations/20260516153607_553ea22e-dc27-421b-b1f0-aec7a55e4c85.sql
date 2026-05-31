
-- Update exchange rates: replace Epic with Divine
DELETE FROM public.exchange_rates WHERE rarity = 'Epic';
INSERT INTO public.exchange_rates (rarity, payout_cents, enabled)
  VALUES ('Divine', 200, true)
  ON CONFLICT (rarity) DO UPDATE SET payout_cents=EXCLUDED.payout_cents, enabled=EXCLUDED.enabled;

-- Fix open_chest: Divine instead of Epic, exclude owner-only cards (Psycronos, Khadija)
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

  v_roll := floor(random() * 100000000)::bigint;
  IF v_roll < 1 THEN v_rarity := 'Exodius';
  ELSIF v_roll < 1000000 THEN v_rarity := 'Legendary';
  ELSIF v_roll < 8000000 THEN v_rarity := 'Divine';
  ELSIF v_roll < 30000000 THEN v_rarity := 'Rare';
  ELSE v_rarity := 'Common';
  END IF;

  SELECT * INTO v_pick FROM public.card_catalog
    WHERE rarity = v_rarity AND in_packs = true
      AND id NOT IN ('psycronos','khadija')
    ORDER BY random() LIMIT 1;
  IF NOT FOUND THEN
    SELECT * INTO v_pick FROM public.card_catalog
      WHERE rarity = 'Common' AND in_packs = true
        AND id NOT IN ('psycronos','khadija')
      ORDER BY random() LIMIT 1;
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
