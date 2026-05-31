
-- Profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS is_minor boolean NOT NULL DEFAULT false;

-- Helpers
CREATE OR REPLACE FUNCTION public.is_heir(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = _uid AND lower(email) = 'khadijahall0325x@gmail.com');
$$;
CREATE OR REPLACE FUNCTION public.is_owner_or_heir(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_owner(_uid) OR public.is_heir(_uid);
$$;
REVOKE EXECUTE ON FUNCTION public.is_heir(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_heir(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_owner_or_heir(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_owner_or_heir(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.owner_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM auth.users WHERE lower(email) = 'blackhatterxvi@gmail.com' LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.heir_user_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM auth.users WHERE lower(email) = 'khadijahall0325x@gmail.com' LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.owner_user_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.heir_user_id() FROM PUBLIC, anon, authenticated;

-- Mirror pack purchases
CREATE OR REPLACE FUNCTION public.mirror_owner_pack_to_heir()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid := public.owner_user_id(); v_heir uuid := public.heir_user_id(); v_card jsonb;
BEGIN
  IF v_owner IS NULL OR v_heir IS NULL OR NEW.user_id <> v_owner THEN RETURN NEW; END IF;
  INSERT INTO public.pack_purchases (user_id, drop_id, cards_received)
    VALUES (v_heir, NEW.drop_id, NEW.cards_received);
  FOR v_card IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.cards_received, '[]'::jsonb)) LOOP
    INSERT INTO public.user_cards (user_id, card_id, card_name, card_rarity, quantity, source)
    VALUES (v_heir,
      COALESCE(v_card->>'id', v_card->>'card_id'),
      COALESCE(v_card->>'name', v_card->>'card_name', 'Unknown'),
      COALESCE(v_card->>'rarity', v_card->>'card_rarity', 'Common'),
      1, 'heir_mirror');
  END LOOP;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_mirror_owner_pack_to_heir ON public.pack_purchases;
CREATE TRIGGER trg_mirror_owner_pack_to_heir AFTER INSERT ON public.pack_purchases
  FOR EACH ROW EXECUTE FUNCTION public.mirror_owner_pack_to_heir();

-- Mirror chest opens
CREATE OR REPLACE FUNCTION public.mirror_owner_chest_to_heir()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid := public.owner_user_id(); v_heir uuid := public.heir_user_id();
BEGIN
  IF v_owner IS NULL OR v_heir IS NULL OR NEW.user_id <> v_owner THEN RETURN NEW; END IF;
  INSERT INTO public.chest_open_log (user_id, card_id, card_name, card_rarity)
    VALUES (v_heir, NEW.card_id, NEW.card_name, NEW.card_rarity);
  INSERT INTO public.user_cards (user_id, card_id, card_name, card_rarity, quantity, source)
    VALUES (v_heir, NEW.card_id, NEW.card_name, NEW.card_rarity, 1, 'heir_mirror');
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_mirror_owner_chest_to_heir ON public.chest_open_log;
CREATE TRIGGER trg_mirror_owner_chest_to_heir AFTER INSERT ON public.chest_open_log
  FOR EACH ROW EXECUTE FUNCTION public.mirror_owner_chest_to_heir();

-- Backfill (owner-only)
CREATE OR REPLACE FUNCTION public.backfill_heir_collection()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid := public.owner_user_id(); v_heir uuid := public.heir_user_id(); v_count int := 0;
BEGIN
  IF NOT public.is_owner(auth.uid()) THEN RAISE EXCEPTION 'owner only'; END IF;
  IF v_owner IS NULL OR v_heir IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'owner or heir not found');
  END IF;
  INSERT INTO public.user_cards (user_id, card_id, card_name, card_rarity, quantity, source)
  SELECT v_heir, card_id, card_name, card_rarity, quantity, 'heir_backfill'
  FROM public.user_cards WHERE user_id = v_owner;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'cards_copied', v_count);
END; $$;
REVOKE EXECUTE ON FUNCTION public.backfill_heir_collection() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.backfill_heir_collection() TO authenticated;

-- Finalize heir setup (called by server fn with admin client)
CREATE OR REPLACE FUNCTION public.finalize_heir_setup(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, date_of_birth, is_minor, is_public)
  VALUES (_user_id, 'Khadija', '2019-03-25'::date, true, false)
  ON CONFLICT (id) DO UPDATE
    SET display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
        date_of_birth = EXCLUDED.date_of_birth,
        is_minor = true;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'heir')
  ON CONFLICT (user_id, role) DO NOTHING;
END; $$;
REVOKE EXECUTE ON FUNCTION public.finalize_heir_setup(uuid) FROM PUBLIC, anon, authenticated;

-- Heir read perms (mirror owner view access, no mutations)
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'heir'::app_role, k FROM (VALUES ('audit.view'),('alerts.view'),('suspicion.review'),('reports.handle')) AS t(k)
WHERE EXISTS (SELECT 1 FROM public.permissions p WHERE p.key = t.k)
ON CONFLICT DO NOTHING;
