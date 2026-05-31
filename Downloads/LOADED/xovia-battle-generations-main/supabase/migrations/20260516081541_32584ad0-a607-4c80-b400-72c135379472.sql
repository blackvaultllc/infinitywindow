
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_free_packs integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.award_battle_xp(_won boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_old_xp integer;
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
  v_xp_gain integer;
  v_levels_gained integer;
  v_packs integer;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  v_xp_gain := CASE WHEN _won THEN 50 ELSE 15 END;

  SELECT xp, level INTO v_old_xp, v_old_level FROM public.profiles WHERE id = v_uid;
  IF v_old_xp IS NULL THEN RAISE EXCEPTION 'profile missing'; END IF;

  v_new_xp := v_old_xp + v_xp_gain;
  -- level curve: level N requires 100*N^2 cumulative XP
  v_new_level := GREATEST(1, floor(sqrt(v_new_xp::numeric / 100))::int + 1);
  IF v_new_level <= v_old_level THEN v_new_level := v_old_level; END IF;
  v_levels_gained := GREATEST(0, v_new_level - v_old_level);

  UPDATE public.profiles
    SET xp = v_new_xp,
        level = v_new_level,
        duels_played = duels_played + 1,
        duels_won = duels_won + CASE WHEN _won THEN 1 ELSE 0 END,
        pending_free_packs = pending_free_packs + v_levels_gained,
        updated_at = now()
    WHERE id = v_uid
    RETURNING pending_free_packs INTO v_packs;

  IF v_levels_gained > 0 THEN
    UPDATE public.wallets
      SET exod_balance = exod_balance + (250 * v_levels_gained),
          lifetime_earned = lifetime_earned + (250 * v_levels_gained),
          updated_at = now()
      WHERE user_id = v_uid;
    INSERT INTO public.transactions (user_id, amount, type, description, meta)
      VALUES (v_uid, 250 * v_levels_gained, 'reward',
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
END $$;
