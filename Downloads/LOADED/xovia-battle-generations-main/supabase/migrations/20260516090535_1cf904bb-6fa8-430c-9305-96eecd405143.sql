-- Duel Pass premium expiry on profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS duel_pass_premium_until timestamptz;

-- Subscriptions table (standard Stripe shape)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Idempotent fulfillment log
CREATE TABLE IF NOT EXISTS public.payment_fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id text NOT NULL UNIQUE,
  price_id text NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  environment text NOT NULL DEFAULT 'sandbox',
  status text NOT NULL DEFAULT 'fulfilled',
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fulfillments_user ON public.payment_fulfillments(user_id);
ALTER TABLE public.payment_fulfillments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own fulfillments" ON public.payment_fulfillments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages fulfillments" ON public.payment_fulfillments FOR ALL USING (auth.role() = 'service_role');

-- Pack credit helper used by the webhook after a sealed-pack purchase
CREATE OR REPLACE FUNCTION public.grant_free_pack_credit(_user_id uuid, _packs integer DEFAULT 1)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET pending_free_packs = pending_free_packs + _packs, updated_at = now()
    WHERE id = _user_id;
END $$;