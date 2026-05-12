-- Sitter consent per booking
CREATE TABLE public.tracking_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  sitter_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  consented boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking parties view consent"
  ON public.tracking_consents FOR SELECT
  USING (auth.uid() = sitter_id OR auth.uid() = owner_id);

CREATE POLICY "Sitter inserts own consent"
  ON public.tracking_consents FOR INSERT
  WITH CHECK (auth.uid() = sitter_id);

CREATE POLICY "Sitter updates own consent"
  ON public.tracking_consents FOR UPDATE
  USING (auth.uid() = sitter_id)
  WITH CHECK (auth.uid() = sitter_id);

CREATE TRIGGER tg_tracking_consents_touch
BEFORE UPDATE ON public.tracking_consents
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Per-request location pings
CREATE TABLE public.location_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  sitter_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  captured_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes')
);

ALTER TABLE public.location_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking parties view requests"
  ON public.location_requests FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = sitter_id);

CREATE POLICY "Owner creates requests"
  ON public.location_requests FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Sitter responds to own requests"
  ON public.location_requests FOR UPDATE
  USING (auth.uid() = sitter_id)
  WITH CHECK (auth.uid() = sitter_id);

CREATE INDEX idx_location_requests_booking ON public.location_requests(booking_id, created_at DESC);

-- Premium flag (free until billing is wired up)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tracking_premium boolean NOT NULL DEFAULT false;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracking_consents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_requests;