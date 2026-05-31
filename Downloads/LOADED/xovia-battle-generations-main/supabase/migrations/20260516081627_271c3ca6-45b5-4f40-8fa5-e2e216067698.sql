
CREATE OR REPLACE FUNCTION public.claim_free_pack(_drop_id uuid, _cards jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_packs integer;
  v_drop_status text;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _cards IS NULL OR jsonb_typeof(_cards) <> 'array' THEN RAISE EXCEPTION 'invalid cards payload'; END IF;

  SELECT status INTO v_drop_status FROM public.pack_drops WHERE id = _drop_id;
  IF v_drop_status IS NULL THEN RAISE EXCEPTION 'drop not found'; END IF;
  IF v_drop_status <> 'active' THEN RAISE EXCEPTION 'drop not active'; END IF;

  UPDATE public.profiles
    SET pending_free_packs = pending_free_packs - 1,
        updated_at = now()
    WHERE id = v_uid AND pending_free_packs > 0
    RETURNING pending_free_packs INTO v_packs;
  IF NOT FOUND THEN RAISE EXCEPTION 'no free pack credits available'; END IF;

  INSERT INTO public.pack_purchases (user_id, drop_id, cards_received)
    VALUES (v_uid, _drop_id, _cards);

  INSERT INTO public.transactions (user_id, amount, type, description, meta)
    VALUES (v_uid, 0, 'reward', 'Free pack opened', jsonb_build_object('drop_id', _drop_id));

  RETURN jsonb_build_object('pending_free_packs', v_packs);
END $$;
