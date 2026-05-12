-- Extend booking_status enum with new states
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'awaiting_payment';
ALTER TYPE public.booking_status ADD VALUE IF NOT EXISTS 'confirmed';

-- Bookings: payment + payout tracking
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS stripe_refund_id text,
  ADD COLUMN IF NOT EXISTS payout_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS amount_cents integer,
  ADD COLUMN IF NOT EXISTS platform_fee_cents integer;

CREATE INDEX IF NOT EXISTS idx_bookings_payout_pending
  ON public.bookings (end_date)
  WHERE payment_status = 'paid' AND payout_released = false;

CREATE INDEX IF NOT EXISTS idx_bookings_checkout_session
  ON public.bookings (stripe_checkout_session_id);

-- Profiles: Stripe Connect account
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;
