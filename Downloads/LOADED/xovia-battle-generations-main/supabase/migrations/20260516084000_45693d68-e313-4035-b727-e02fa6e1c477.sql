
-- 1. Username uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- 2. Achievements catalog
CREATE TABLE IF NOT EXISTS public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  category text NOT NULL DEFAULT 'general',
  sort_order int NOT NULL DEFAULT 0
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements public read" ON public.achievements FOR SELECT USING (true);

INSERT INTO public.achievements (id, name, description, icon, category, sort_order) VALUES
  ('first_blood', 'First Blood', 'Win your first duel.', '⚔️', 'combat', 10),
  ('veteran', 'Veteran', 'Win 10 duels.', '🛡️', 'combat', 20),
  ('demigod', 'Demi-God', 'Win 50 duels.', '👑', 'combat', 30),
  ('level_5', 'Ascendant', 'Reach level 5.', '🌟', 'progress', 40),
  ('level_10', 'Pharaoh', 'Reach level 10.', '🔆', 'progress', 50),
  ('pack_opener', 'Pack Opener', 'Open your first card pack.', '📦', 'collection', 60),
  ('relic_holder', 'Relic Holder', 'Own a relic-tier card.', '💎', 'collection', 70)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, icon=EXCLUDED.icon;

-- 3. User unlocks
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ach read" ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS user_ach_user_idx ON public.user_achievements(user_id);

-- 4. Username claim
CREATE OR REPLACE FUNCTION public.set_username(_username text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _username !~ '^[a-z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'username must be 3-20 chars, lowercase letters/numbers/underscore';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(_username) AND id <> v_uid) THEN
    RAISE EXCEPTION 'username already taken';
  END IF;
  UPDATE public.profiles SET username = _username, updated_at = now() WHERE id = v_uid;
END $$;
REVOKE EXECUTE ON FUNCTION public.set_username(text) FROM anon;

-- 5. Public profile reader
CREATE OR REPLACE FUNCTION public.get_public_profile(_username text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_p public.profiles; v_ach jsonb;
BEGIN
  SELECT * INTO v_p FROM public.profiles WHERE lower(username) = lower(_username) AND is_public = true LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', a.id, 'name', a.name, 'description', a.description, 'icon', a.icon,
    'category', a.category, 'unlocked_at', ua.unlocked_at) ORDER BY ua.unlocked_at DESC), '[]'::jsonb)
    INTO v_ach FROM public.user_achievements ua
    JOIN public.achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = v_p.id;
  RETURN jsonb_build_object(
    'username', v_p.username,
    'display_name', v_p.display_name,
    'avatar_url', v_p.avatar_url,
    'bio', v_p.bio,
    'rank', v_p.rank,
    'level', v_p.level,
    'xp', v_p.xp,
    'duels_played', v_p.duels_played,
    'duels_won', v_p.duels_won,
    'created_at', v_p.created_at,
    'achievements', v_ach
  );
END $$;
GRANT EXECUTE ON FUNCTION public.get_public_profile(text) TO anon, authenticated;

-- 6. Achievement unlock helper + hook into award_battle_xp
CREATE OR REPLACE FUNCTION public.unlock_achievement(_user uuid, _ach text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_id) VALUES (_user, _ach)
    ON CONFLICT DO NOTHING;
  RETURN FOUND;
END $$;
REVOKE EXECUTE ON FUNCTION public.unlock_achievement(uuid, text) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.award_battle_xp(_won boolean)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_old_xp integer; v_new_xp integer;
  v_old_level integer; v_new_level integer;
  v_xp_gain integer; v_levels_gained integer; v_packs integer;
  v_last timestamptz; v_today date := current_date;
  v_already numeric; v_remaining_cap numeric;
  v_levelup_grant numeric; v_levelup_exod numeric;
  v_wins integer; v_unlocked jsonb := '[]'::jsonb;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
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

  UPDATE public.profiles
    SET levelup_exod_today = CASE WHEN levelup_reset_at < v_today THEN 0 ELSE levelup_exod_today END,
        levelup_reset_at = CASE WHEN levelup_reset_at < v_today THEN v_today ELSE levelup_reset_at END
    WHERE id = v_uid;

  SELECT levelup_exod_today INTO v_already FROM public.profiles WHERE id = v_uid;
  v_remaining_cap := GREATEST(0, 1000 - COALESCE(v_already, 0));
  v_levelup_exod := 250 * v_levels_gained;
  v_levelup_grant := LEAST(v_levelup_exod, v_remaining_cap);

  UPDATE public.profiles
    SET xp = v_new_xp, level = v_new_level,
        duels_played = duels_played + 1,
        duels_won = duels_won + CASE WHEN _won THEN 1 ELSE 0 END,
        pending_free_packs = LEAST(5, pending_free_packs + v_levels_gained),
        levelup_exod_today = levelup_exod_today + v_levelup_grant,
        last_battle_at = now(), updated_at = now()
    WHERE id = v_uid
    RETURNING pending_free_packs, duels_won INTO v_packs, v_wins;

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

  -- Achievement checks
  IF _won AND v_wins = 1 AND public.unlock_achievement(v_uid, 'first_blood') THEN
    v_unlocked := v_unlocked || jsonb_build_array('first_blood'); END IF;
  IF v_wins >= 10 AND public.unlock_achievement(v_uid, 'veteran') THEN
    v_unlocked := v_unlocked || jsonb_build_array('veteran'); END IF;
  IF v_wins >= 50 AND public.unlock_achievement(v_uid, 'demigod') THEN
    v_unlocked := v_unlocked || jsonb_build_array('demigod'); END IF;
  IF v_new_level >= 5 AND public.unlock_achievement(v_uid, 'level_5') THEN
    v_unlocked := v_unlocked || jsonb_build_array('level_5'); END IF;
  IF v_new_level >= 10 AND public.unlock_achievement(v_uid, 'level_10') THEN
    v_unlocked := v_unlocked || jsonb_build_array('level_10'); END IF;

  RETURN jsonb_build_object(
    'xp', v_new_xp, 'level', v_new_level,
    'leveled_up', v_levels_gained > 0, 'levels_gained', v_levels_gained,
    'pending_free_packs', v_packs, 'unlocked', v_unlocked
  );
END $function$;
REVOKE EXECUTE ON FUNCTION public.award_battle_xp(boolean) FROM anon;
