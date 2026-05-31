CREATE OR REPLACE FUNCTION public.forge_cards(_card_id TEXT)
RETURNS TABLE (forged_id TEXT, forged_name TEXT, forged_rarity TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID := auth.uid();
  _source_rarity TEXT;
  _target_rarity TEXT;
  _owned_qty INT;
  _row RECORD;
  _remaining INT := 4;
  _picked RECORD;
  _era_prefix TEXT;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT COALESCE(SUM(quantity),0) INTO _owned_qty
  FROM public.user_cards WHERE user_id=_uid AND card_id=_card_id;
  IF _owned_qty < 4 THEN
    RAISE EXCEPTION 'Need 4 copies to forge (have %)', _owned_qty;
  END IF;

  SELECT rarity INTO _source_rarity FROM public.card_catalog WHERE id=_card_id;
  IF _source_rarity IS NULL THEN RAISE EXCEPTION 'Card not in catalog'; END IF;

  _target_rarity := CASE _source_rarity
    WHEN 'Common' THEN 'Rare'
    WHEN 'Rare' THEN 'Divine'
    WHEN 'Divine' THEN 'Legendary'
    WHEN 'Legendary' THEN 'Legendary'
    ELSE NULL END;
  IF _target_rarity IS NULL THEN
    RAISE EXCEPTION 'Cannot forge rarity %', _source_rarity;
  END IF;

  -- Burn 4 copies
  FOR _row IN
    SELECT id, quantity FROM public.user_cards
    WHERE user_id=_uid AND card_id=_card_id
    ORDER BY acquired_at
  LOOP
    EXIT WHEN _remaining <= 0;
    IF _row.quantity <= _remaining THEN
      _remaining := _remaining - _row.quantity;
      DELETE FROM public.user_cards WHERE id=_row.id;
    ELSE
      UPDATE public.user_cards SET quantity=quantity-_remaining WHERE id=_row.id;
      _remaining := 0;
    END IF;
  END LOOP;

  -- Era-preferred pick
  IF _card_id LIKE 'era-%' THEN
    _era_prefix := split_part(_card_id, '-', 1) || '-' || split_part(_card_id, '-', 2) || '-%';
    SELECT id, name, rarity INTO _picked
    FROM public.card_catalog
    WHERE rarity=_target_rarity AND in_packs=true AND id LIKE _era_prefix
    ORDER BY random() LIMIT 1;
  END IF;

  IF _picked IS NULL THEN
    SELECT id, name, rarity INTO _picked
    FROM public.card_catalog
    WHERE rarity=_target_rarity AND in_packs=true
    ORDER BY random() LIMIT 1;
  END IF;

  INSERT INTO public.user_cards (user_id, card_id, card_name, card_rarity, source, quantity)
  VALUES (_uid, _picked.id, _picked.name, _picked.rarity, 'forge', 1);

  forged_id := _picked.id;
  forged_name := _picked.name;
  forged_rarity := _picked.rarity;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.forge_cards(TEXT) TO authenticated;

INSERT INTO public.pack_drops (id, name, description, price_exod, total_supply, remaining_supply, cards_per_pack, status, drop_at, rarity_weights) VALUES
  (gen_random_uuid(), '1920s Speakeasy Pack', 'Five cards drawn from the smoke-filled ballrooms of the Roaring Twenties.', 500, 5000, 5000, 5, 'active', now(), '{"Common":0.65,"Rare":0.25,"Divine":0.08,"Legendary":0.02}'::jsonb),
  (gen_random_uuid(), '1970s Cosmic Funk Pack', 'Disco grooves and afrofuturist warriors.', 500, 5000, 5000, 5, 'active', now(), '{"Common":0.65,"Rare":0.25,"Divine":0.08,"Legendary":0.02}'::jsonb),
  (gen_random_uuid(), '1990s Boom-Bap Pack', 'Cipher mages and turntable titans.', 500, 5000, 5000, 5, 'active', now(), '{"Common":0.65,"Rare":0.25,"Divine":0.08,"Legendary":0.02}'::jsonb),
  (gen_random_uuid(), '2020s Neon Pack', 'Neon streets, crypto crowns, drip wraiths.', 500, 5000, 5000, 5, 'active', now(), '{"Common":0.65,"Rare":0.25,"Divine":0.08,"Legendary":0.02}'::jsonb);