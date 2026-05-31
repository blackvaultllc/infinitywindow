
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS daily_exod_claimed_at date;

CREATE OR REPLACE FUNCTION public.claim_daily_exod()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_last date;
  v_amount numeric := 25;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  INSERT INTO public.wallets (user_id) VALUES (v_uid)
    ON CONFLICT (user_id) DO NOTHING;

  SELECT daily_exod_claimed_at INTO v_last
    FROM public.wallets WHERE user_id = v_uid FOR UPDATE;

  IF v_last = v_today THEN
    RETURN jsonb_build_object('claimed', false, 'amount', 0, 'reason', 'already_claimed');
  END IF;

  -- reset daily window if needed
  UPDATE public.wallets
    SET daily_earned = CASE WHEN daily_reset_at < v_today THEN 0 ELSE daily_earned END,
        daily_reset_at = CASE WHEN daily_reset_at < v_today THEN v_today ELSE daily_reset_at END
    WHERE user_id = v_uid;

  UPDATE public.wallets
    SET exod_balance = exod_balance + v_amount,
        lifetime_earned = lifetime_earned + v_amount,
        daily_earned = daily_earned + v_amount,
        daily_exod_claimed_at = v_today,
        updated_at = now()
    WHERE user_id = v_uid;

  INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (v_uid, v_amount, 'earn', 'Daily login bonus');

  RETURN jsonb_build_object('claimed', true, 'amount', v_amount);
END $$;

REVOKE EXECUTE ON FUNCTION public.claim_daily_exod() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_daily_exod() TO authenticated;
