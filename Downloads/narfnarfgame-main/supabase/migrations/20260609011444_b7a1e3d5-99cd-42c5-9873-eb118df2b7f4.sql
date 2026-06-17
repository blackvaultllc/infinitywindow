
-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN prologue_choice text CHECK (prologue_choice IN ('planet','humans','watcher')),
  ADD COLUMN alignment_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN tutorial_seen boolean NOT NULL DEFAULT false;

-- Allow the economy trigger to permit the prologue choice (set once)
CREATE OR REPLACE FUNCTION public.guard_profile_economy()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(),'admin') THEN RETURN NEW; END IF;
  IF NEW.coins IS DISTINCT FROM OLD.coins
     OR NEW.bonus_multiplier IS DISTINCT FROM OLD.bonus_multiplier
     OR NEW.banned IS DISTINCT FROM OLD.banned THEN
    RAISE EXCEPTION 'Only admins can modify economy fields';
  END IF;
  IF OLD.alignment_locked AND NEW.prologue_choice IS DISTINCT FROM OLD.prologue_choice THEN
    RAISE EXCEPTION 'Alignment is locked';
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_profile_economy() FROM PUBLIC, anon, authenticated;

-- Starter grant: 1000 coins on signup, recorded in ledger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, coins)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
          1000)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.coin_ledger (user_id, delta, reason)
  VALUES (NEW.id, 1000, 'starter_grant');

  IF lower(NEW.email) = 'blackhatterxvi@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'player') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- QUESTS
CREATE TABLE public.quests (
  slug text PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  reward_coins int NOT NULL DEFAULT 0,
  reward_codex text,
  is_starter boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.quests TO authenticated, anon;
GRANT ALL ON public.quests TO service_role;
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads quests" ON public.quests FOR SELECT USING (true);
CREATE POLICY "admins write quests" ON public.quests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.player_quests (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_slug text NOT NULL REFERENCES public.quests(slug) ON DELETE CASCADE,
  step int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','complete','abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (user_id, quest_slug)
);
GRANT SELECT, INSERT, UPDATE ON public.player_quests TO authenticated;
GRANT ALL ON public.player_quests TO service_role;
ALTER TABLE public.player_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own quest progress" ON public.player_quests FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "staff read quest progress" ON public.player_quests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator') OR public.has_role(auth.uid(),'support'));

-- CODEX
CREATE TABLE public.codex_entries (
  slug text PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'lore',
  sort int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.codex_entries TO authenticated, anon;
GRANT ALL ON public.codex_entries TO service_role;
ALTER TABLE public.codex_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone reads codex" ON public.codex_entries FOR SELECT USING (true);
CREATE POLICY "admins write codex" ON public.codex_entries FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.player_codex (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_slug text NOT NULL REFERENCES public.codex_entries(slug) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entry_slug)
);
GRANT SELECT, INSERT ON public.player_codex TO authenticated;
GRANT ALL ON public.player_codex TO service_role;
ALTER TABLE public.player_codex ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own codex" ON public.player_codex FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Server-side helper to complete a quest atomically and pay out
CREATE OR REPLACE FUNCTION public.complete_quest(_slug text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _q public.quests%ROWTYPE;
  _already boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO _q FROM public.quests WHERE slug = _slug;
  IF NOT FOUND THEN RAISE EXCEPTION 'Quest not found'; END IF;

  SELECT (status = 'complete') INTO _already FROM public.player_quests
    WHERE user_id = _uid AND quest_slug = _slug;
  IF _already THEN RETURN jsonb_build_object('ok',true,'already',true); END IF;

  INSERT INTO public.player_quests (user_id, quest_slug, status, completed_at)
  VALUES (_uid, _slug, 'complete', now())
  ON CONFLICT (user_id, quest_slug) DO UPDATE SET status='complete', completed_at=now();

  IF _q.reward_coins > 0 THEN
    UPDATE public.profiles SET coins = coins + _q.reward_coins WHERE id = _uid;
    INSERT INTO public.coin_ledger (user_id, delta, reason)
      VALUES (_uid, _q.reward_coins, 'quest:'||_slug);
  END IF;

  IF _q.reward_codex IS NOT NULL THEN
    INSERT INTO public.player_codex (user_id, entry_slug)
      VALUES (_uid, _q.reward_codex) ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('ok',true,'reward_coins',_q.reward_coins,'codex',_q.reward_codex);
END $$;
REVOKE EXECUTE ON FUNCTION public.complete_quest(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_quest(text) TO authenticated;

-- Server-side helper to unlock a codex entry
CREATE OR REPLACE FUNCTION public.unlock_codex(_slug text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  INSERT INTO public.player_codex (user_id, entry_slug) VALUES (auth.uid(), _slug)
    ON CONFLICT DO NOTHING;
END $$;
REVOKE EXECUTE ON FUNCTION public.unlock_codex(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.unlock_codex(text) TO authenticated;

-- SEED CONTENT
INSERT INTO public.codex_entries (slug, title, body, category, sort) VALUES
  ('codex-the-waking','The Waking','The planet has been quiet for a long time. It stopped being quiet on a Tuesday.','prologue',1),
  ('codex-cells','A Cell Among Cells','Every living thing protects itself from its own cells. We are not exempt.','prologue',2),
  ('codex-frequencies','The Open Frequencies','When the sirens started, the encrypted bands went silent. The open ones went loud.','prologue',3),
  ('codex-first-siren','First Siren','The first alert lit up on the Pacific Rim at 03:14 UTC. Nobody slept after that.','quest',10)
ON CONFLICT DO NOTHING;

INSERT INTO public.quests (slug, title, body, steps, reward_coins, reward_codex, is_starter) VALUES
  ('first-siren','First Siren',
   'Answer your first global alert. Pick a side, open the comms, and survive the opening minute.',
   '["Choose your prologue stance","Open the command theater","Resolve one alert"]'::jsonb,
   1000, 'codex-first-siren', true)
ON CONFLICT DO NOTHING;

-- Auto-assign the starter quest to every existing player and on new signup
INSERT INTO public.player_quests (user_id, quest_slug)
  SELECT id, 'first-siren' FROM auth.users
  ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, coins)
  VALUES (NEW.id, NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
          1000)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.coin_ledger (user_id, delta, reason)
  VALUES (NEW.id, 1000, 'starter_grant');

  IF lower(NEW.email) = 'blackhatterxvi@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id,'player') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.player_quests (user_id, quest_slug) VALUES (NEW.id,'first-siren')
    ON CONFLICT DO NOTHING;

  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
