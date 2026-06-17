CREATE TABLE public.medusa_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  event_type text,
  severity text,
  player_ref text,
  message text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_ip text,
  status text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.medusa_events TO authenticated;
GRANT ALL ON public.medusa_events TO service_role;

ALTER TABLE public.medusa_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view medusa events"
  ON public.medusa_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_medusa_events_created_at ON public.medusa_events (created_at DESC);
CREATE INDEX idx_medusa_events_direction ON public.medusa_events (direction);