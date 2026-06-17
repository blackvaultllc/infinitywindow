-- Store items catalog
CREATE TABLE IF NOT EXISTS public.store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  price_coins integer NOT NULL DEFAULT 0 CHECK (price_coins >= 0),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_items TO anon, authenticated;
GRANT ALL ON public.store_items TO service_role;
ALTER TABLE public.store_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store_items readable by everyone"
  ON public.store_items FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "store_items admin write"
  ON public.store_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Player inventory
CREATE TABLE IF NOT EXISTS public.player_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_slug text NOT NULL REFERENCES public.store_items(slug) ON DELETE CASCADE,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_slug)
);
GRANT SELECT, INSERT, DELETE ON public.player_inventory TO authenticated;
GRANT ALL ON public.player_inventory TO service_role;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory self read"
  ON public.player_inventory FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Player equipped loadout (one item per category slot)
CREATE TABLE IF NOT EXISTS public.player_equipped (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  item_slug text NOT NULL REFERENCES public.store_items(slug) ON DELETE CASCADE,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_equipped TO authenticated;
GRANT ALL ON public.player_equipped TO service_role;
ALTER TABLE public.player_equipped ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipped self all"
  ON public.player_equipped FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atomic purchase function
CREATE OR REPLACE FUNCTION public.purchase_store_item(_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _item public.store_items%ROWTYPE;
  _balance integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO _item FROM public.store_items WHERE slug = _slug AND active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item not available'; END IF;

  IF EXISTS (SELECT 1 FROM public.player_inventory WHERE user_id = _uid AND item_slug = _slug) THEN
    RETURN jsonb_build_object('ok', true, 'already_owned', true);
  END IF;

  SELECT coins INTO _balance FROM public.profiles WHERE id = _uid FOR UPDATE;
  IF _balance < _item.price_coins THEN
    RAISE EXCEPTION 'Not enough coins (need %, have %)', _item.price_coins, _balance;
  END IF;

  UPDATE public.profiles SET coins = coins - _item.price_coins WHERE id = _uid;
  INSERT INTO public.coin_ledger (user_id, delta, reason)
    VALUES (_uid, -_item.price_coins, 'store:'||_slug);
  INSERT INTO public.player_inventory (user_id, item_slug) VALUES (_uid, _slug);

  RETURN jsonb_build_object('ok', true, 'price', _item.price_coins);
END $$;

REVOKE EXECUTE ON FUNCTION public.purchase_store_item(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_store_item(text) TO authenticated;

-- Touch updated_at on store_items
DROP TRIGGER IF EXISTS store_items_touch ON public.store_items;
CREATE TRIGGER store_items_touch BEFORE UPDATE ON public.store_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed a few starter items
INSERT INTO public.store_items (slug, name, description, category, price_coins, payload) VALUES
  ('accent-crimson', 'Crimson Accent', 'Blood-red HUD accent color', 'accent', 150, '{"accent":"#ef4444"}'),
  ('accent-emerald', 'Emerald Accent', 'Verdant HUD accent color', 'accent', 150, '{"accent":"#22c55e"}'),
  ('accent-violet',  'Violet Accent',  'Royal violet HUD accent', 'accent', 150, '{"accent":"#a855f7"}'),
  ('uniform-tactical', 'Tactical Uniform', 'Field-ops black tactical kit', 'uniform', 500, '{"uniform":"tactical"}'),
  ('uniform-dress', 'Dress Uniform', 'Formal council dress uniform', 'uniform', 500, '{"uniform":"dress"}'),
  ('uniform-lab', 'Lab Coat', 'White research lab coat', 'uniform', 500, '{"uniform":"lab"}'),
  ('flag-un', 'UN Flag', 'United Nations flag', 'flag', 100, '{"flag":"UN"}'),
  ('map-theme-noir', 'Noir Map Theme', 'High-contrast monochrome map', 'map_theme', 800, '{"theme":"noir"}'),
  ('card-style-holo', 'Holographic Cards', 'Iridescent power card frames', 'card_style', 600, '{"style":"holo"}')
ON CONFLICT (slug) DO NOTHING;