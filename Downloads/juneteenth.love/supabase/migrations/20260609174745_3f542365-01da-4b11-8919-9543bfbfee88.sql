CREATE TABLE public.medusa_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  event_type text,
  severity text,
  player_ref text,
  message text,
  ai_name text,
  message_type text,
  priority text,
  assigned_to text,
  source_site text,
  event_timestamp timestamptz,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  delivery_status text,
  delivery_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.medusa_events TO authenticated;
GRANT ALL ON public.medusa_events TO service_role;

ALTER TABLE public.medusa_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and moderators can view medusa events"
  ON public.medusa_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE INDEX medusa_events_created_at_idx ON public.medusa_events (created_at DESC);
CREATE INDEX medusa_events_direction_idx ON public.medusa_events (direction);