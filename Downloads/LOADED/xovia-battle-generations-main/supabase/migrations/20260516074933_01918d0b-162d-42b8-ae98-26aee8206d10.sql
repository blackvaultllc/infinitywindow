
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  referral_code text UNIQUE NOT NULL DEFAULT upper(substr(md5(random()::text||clock_timestamp()::text),1,8)),
  referred_by uuid REFERENCES public.profiles(id),
  rank text NOT NULL DEFAULT 'Bronze',
  level int NOT NULL DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  duels_won int NOT NULL DEFAULT 0,
  duels_played int NOT NULL DEFAULT 0,
  selected_battlefield_id uuid,
  music_enabled boolean NOT NULL DEFAULT true,
  sfx_enabled boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public profiles read" ON public.profiles FOR SELECT USING (is_public OR auth.uid()=id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid()=id) WITH CHECK (auth.uid()=id);

-- Wallets
CREATE TABLE public.wallets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  exod_balance numeric(18,2) NOT NULL DEFAULT 0,
  lifetime_earned numeric(18,2) NOT NULL DEFAULT 0,
  lifetime_spent numeric(18,2) NOT NULL DEFAULT 0,
  daily_earned numeric(18,2) NOT NULL DEFAULT 0,
  daily_reset_at date NOT NULL DEFAULT current_date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet" ON public.wallets FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

-- Transactions
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(18,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('earn','spend','purchase','withdrawal','referral','reward')),
  description text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx" ON public.transactions FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

-- Platform revenue
CREATE TABLE public.platform_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  amount numeric(18,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EXOD',
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin revenue" ON public.platform_revenue FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- Duel Pass
CREATE TABLE public.duel_pass_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inactive',
  tier text NOT NULL DEFAULT 'free',
  started_at timestamptz,
  renews_at timestamptz
);
ALTER TABLE public.duel_pass_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sub read" ON public.duel_pass_subscriptions FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own sub upsert" ON public.duel_pass_subscriptions FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE public.duel_pass_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number int NOT NULL,
  track text NOT NULL CHECK (track IN ('free','premium')),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_number, track)
);
ALTER TABLE public.duel_pass_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own claims read" ON public.duel_pass_claims FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own claims insert" ON public.duel_pass_claims FOR INSERT WITH CHECK (auth.uid()=user_id);

-- Pack drops
CREATE TABLE public.pack_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  art_url text,
  price_exod numeric(18,2) NOT NULL,
  cards_per_pack int NOT NULL DEFAULT 5,
  total_supply int NOT NULL,
  remaining_supply int NOT NULL,
  rarity_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  drop_at timestamptz NOT NULL DEFAULT now(),
  closes_at timestamptz,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','sold_out','closed'))
);
ALTER TABLE public.pack_drops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drops public" ON public.pack_drops FOR SELECT USING (true);
CREATE POLICY "admin drops" ON public.pack_drops FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.pack_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drop_id uuid NOT NULL REFERENCES public.pack_drops(id) ON DELETE CASCADE,
  cards_received jsonb NOT NULL DEFAULT '[]'::jsonb,
  purchased_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pack_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own purchases" ON public.pack_purchases FOR SELECT USING (auth.uid()=user_id OR public.has_role(auth.uid(),'admin'));

-- Tournaments
CREATE TABLE public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  entry_fee_exod numeric(18,2) NOT NULL,
  prize_pool_exod numeric(18,2) NOT NULL DEFAULT 0,
  max_players int NOT NULL,
  registered_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','active','completed')),
  starts_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tournaments public" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "admin tournaments" ON public.tournaments FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.tournament_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  placement int,
  UNIQUE(tournament_id, user_id)
);
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registrations public read" ON public.tournament_registrations FOR SELECT USING (true);

-- Referrals
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  commission_earned numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals read" ON public.referrals FOR SELECT USING (auth.uid()=referrer_id OR auth.uid()=referred_user_id OR public.has_role(auth.uid(),'admin'));

-- Battlefields
CREATE TABLE public.battlefields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  theme_css_class text NOT NULL,
  unlock_condition text NOT NULL CHECK (unlock_condition IN ('default','rank','duel_count','duel_pass_week','purchase')),
  unlock_value text,
  is_default boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.battlefields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battlefields public" ON public.battlefields FOR SELECT USING (true);

INSERT INTO public.battlefields (name, description, theme_css_class, unlock_condition, unlock_value, is_default, sort_order) VALUES
  ('Sands of Ra','Desert pyramid landscape, hieroglyph runes, golden sand dunes, glowing obelisks at each corner.','field-sands','default',NULL,true,1),
  ('Cyber Pharaoh Grid','Dark holographic grid, neon gold circuit lines, floating data runes, digital scarab particles.','field-cyber','default',NULL,true,2),
  ('Hall of Osiris','Underworld throne room, glowing soul rivers, obsidian pillars, weighing of hearts altar.','field-osiris','rank','Gold',false,3),
  ('Eye of Horus Sanctum','Sky temple above the clouds, floating hieroglyph rings, divine light beams, falcon silhouettes.','field-horus','duel_count','50',false,4),
  ('Tomb of the Forgotten King','Cursed crypt with shifting shadows and torch-lit hieroglyphs.','field-tomb','duel_pass_week','6',false,5),
  ('Void of Ammit','Empty cosmic void where the devourer feasts on souls.','field-void','purchase','5000',false,6);

-- Marketplace listings
CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  card_name text NOT NULL,
  card_rarity text,
  price_exod numeric(18,2) NOT NULL CHECK (price_exod > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sold_at timestamptz,
  buyer_id uuid REFERENCES auth.users(id)
);
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings public read" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "own listings manage" ON public.marketplace_listings FOR ALL USING (auth.uid()=seller_id) WITH CHECK (auth.uid()=seller_id);

-- Waitlist
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist insert" ON public.waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "waitlist admin read" ON public.waitlist FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- Trigger: new user setup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_referrer uuid;
BEGIN
  IF NEW.raw_user_meta_data ? 'referral_code' THEN
    SELECT id INTO v_referrer FROM public.profiles
    WHERE referral_code = upper(NEW.raw_user_meta_data->>'referral_code') LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, display_name, avatar_url, referred_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url',
    v_referrer
  );

  INSERT INTO public.wallets (user_id, exod_balance, lifetime_earned)
  VALUES (NEW.id,
    CASE WHEN v_referrer IS NOT NULL THEN 200 ELSE 0 END,
    CASE WHEN v_referrer IS NOT NULL THEN 200 ELSE 0 END);

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  IF v_referrer IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id) VALUES (v_referrer, NEW.id);
    UPDATE public.wallets SET exod_balance = exod_balance + 500, lifetime_earned = lifetime_earned + 500
      WHERE user_id = v_referrer;
    INSERT INTO public.transactions (user_id, amount, type, description)
      VALUES (v_referrer, 500, 'referral', 'Referral bonus');
    INSERT INTO public.transactions (user_id, amount, type, description)
      VALUES (NEW.id, 200, 'reward', 'Welcome bonus via referral');
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Earn EXOD with daily cap of 500
CREATE OR REPLACE FUNCTION public.earn_exod(_amount numeric, _type text, _description text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid; v_today date := current_date; v_daily numeric; v_remaining numeric; v_grant numeric;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _amount <= 0 THEN RETURN 0; END IF;

  UPDATE public.wallets
    SET daily_earned = CASE WHEN daily_reset_at < v_today THEN 0 ELSE daily_earned END,
        daily_reset_at = CASE WHEN daily_reset_at < v_today THEN v_today ELSE daily_reset_at END
    WHERE user_id = v_uid;

  SELECT daily_earned INTO v_daily FROM public.wallets WHERE user_id = v_uid;
  v_remaining := GREATEST(0, 500 - COALESCE(v_daily,0));
  v_grant := LEAST(_amount, v_remaining);
  IF v_grant <= 0 THEN RETURN 0; END IF;

  UPDATE public.wallets
    SET exod_balance = exod_balance + v_grant,
        lifetime_earned = lifetime_earned + v_grant,
        daily_earned = daily_earned + v_grant,
        updated_at = now()
    WHERE user_id = v_uid;
  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (v_uid, v_grant, _type, _description);
  RETURN v_grant;
END $$;

-- Marketplace purchase with 2.5% fee
CREATE OR REPLACE FUNCTION public.purchase_listing(_listing_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_buyer uuid; v_listing public.marketplace_listings; v_fee numeric; v_seller_receives numeric;
BEGIN
  v_buyer := auth.uid();
  IF v_buyer IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_listing FROM public.marketplace_listings WHERE id = _listing_id FOR UPDATE;
  IF NOT FOUND OR v_listing.status <> 'active' THEN RAISE EXCEPTION 'listing unavailable'; END IF;
  IF v_listing.seller_id = v_buyer THEN RAISE EXCEPTION 'cannot buy own listing'; END IF;

  UPDATE public.wallets
    SET exod_balance = exod_balance - v_listing.price_exod,
        lifetime_spent = lifetime_spent + v_listing.price_exod,
        updated_at = now()
    WHERE user_id = v_buyer AND exod_balance >= v_listing.price_exod;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  v_fee := round(v_listing.price_exod * 0.025, 2);
  v_seller_receives := v_listing.price_exod - v_fee;

  UPDATE public.wallets
    SET exod_balance = exod_balance + v_seller_receives,
        lifetime_earned = lifetime_earned + v_seller_receives,
        updated_at = now()
    WHERE user_id = v_listing.seller_id;
  UPDATE public.marketplace_listings SET status='sold', buyer_id=v_buyer, sold_at=now()
    WHERE id = _listing_id;

  INSERT INTO public.transactions (user_id, amount, type, description, meta) VALUES
    (v_buyer, -v_listing.price_exod, 'spend', 'Bought '||v_listing.card_name, jsonb_build_object('listing_id',_listing_id)),
    (v_listing.seller_id, v_seller_receives, 'earn', 'Sold '||v_listing.card_name||' (after 2.5% fee)', jsonb_build_object('listing_id',_listing_id,'fee',v_fee));
  INSERT INTO public.platform_revenue (source, amount, ref_id)
    VALUES ('marketplace_fee', v_fee, _listing_id);
END $$;

-- Tournament registration with prize pool + 20% platform cut
CREATE OR REPLACE FUNCTION public.register_tournament(_tournament_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid uuid; v_t public.tournaments; v_cut numeric; v_pool numeric;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_t FROM public.tournaments WHERE id = _tournament_id FOR UPDATE;
  IF NOT FOUND OR v_t.status <> 'upcoming' THEN RAISE EXCEPTION 'tournament unavailable'; END IF;
  IF v_t.registered_count >= v_t.max_players THEN RAISE EXCEPTION 'tournament full'; END IF;

  UPDATE public.wallets
    SET exod_balance = exod_balance - v_t.entry_fee_exod,
        lifetime_spent = lifetime_spent + v_t.entry_fee_exod,
        updated_at = now()
    WHERE user_id = v_uid AND exod_balance >= v_t.entry_fee_exod;
  IF NOT FOUND THEN RAISE EXCEPTION 'insufficient balance'; END IF;

  v_cut := round(v_t.entry_fee_exod * 0.20, 2);
  v_pool := v_t.entry_fee_exod - v_cut;

  INSERT INTO public.tournament_registrations (tournament_id, user_id) VALUES (_tournament_id, v_uid);
  UPDATE public.tournaments
    SET registered_count = registered_count + 1,
        prize_pool_exod = prize_pool_exod + v_pool
    WHERE id = _tournament_id;

  INSERT INTO public.transactions (user_id, amount, type, description, meta)
    VALUES (v_uid, -v_t.entry_fee_exod, 'spend', 'Tournament entry: '||v_t.name, jsonb_build_object('tournament_id',_tournament_id));
  INSERT INTO public.platform_revenue (source, amount, ref_id)
    VALUES ('tournament_cut', v_cut, _tournament_id);
END $$;

-- Seed pack drops
INSERT INTO public.pack_drops (name, description, price_exod, cards_per_pack, total_supply, remaining_supply, rarity_weights, status, drop_at, closes_at) VALUES
  ('Pharaoh''s Vault Pack','Standard entry pack from the royal vault.',500,5,1000,1000,'{"Common":60,"Rare":30,"Divine":9,"Legendary":1}'::jsonb,'active',now(),now()+interval '30 days'),
  ('Nile Flood Pack','Surging waters bring forth gods and relics alike.',1200,5,500,500,'{"Common":40,"Rare":35,"Divine":20,"Legendary":4,"Exodius":1}'::jsonb,'active',now(),now()+interval '14 days'),
  ('Relic Hunter Pack','High-tier pack with guaranteed Divine or Legendary pulls.',3000,3,100,100,'{"Divine":50,"Legendary":40,"Exodius":10}'::jsonb,'upcoming',now()+interval '7 days',now()+interval '21 days');

-- Seed tournaments
INSERT INTO public.tournaments (name, description, entry_fee_exod, max_players, status, starts_at) VALUES
  ('Daily Duel','Quick 8-player bracket. Runs every 24 hours.',50,8,'upcoming',now()+interval '6 hours'),
  ('Pharaoh''s Cup','Weekly 16-player crown competition.',500,16,'upcoming',now()+interval '3 days'),
  ('Exodius Grand Invitational','Monthly elite 32-player tournament. Top leaderboard invites only.',2000,32,'upcoming',now()+interval '14 days');
