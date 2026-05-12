
-- 1) Fix Security Definer View by switching to security_invoker
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- 2) Restrict sensitive columns on profiles from public roles.
--    Owners still read these via the SECURITY DEFINER function get_my_profile().
REVOKE SELECT (
  email,
  phone,
  address_line,
  zip,
  stripe_account_id,
  stripe_charges_enabled,
  stripe_payouts_enabled,
  stripe_onboarding_complete,
  verification_doc_path,
  verification_notes
) ON public.profiles FROM anon, authenticated;

-- 3) Restrict UPDATE on financial/identity columns of bookings from clients.
--    Server-side admin client (service role) keeps full access.
REVOKE UPDATE (
  owner_id,
  sitter_id,
  payment_status,
  payout_released,
  payout_released_at,
  completed_at,
  stripe_payment_intent_id,
  stripe_checkout_session_id,
  stripe_transfer_id,
  stripe_refund_id,
  amount_cents,
  platform_fee_cents
) ON public.bookings FROM anon, authenticated;
