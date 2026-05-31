CREATE TABLE public.audit_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  action text NOT NULL,
  target text,
  status text NOT NULL DEFAULT 'ok',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own audit read" ON public.audit_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "own audit insert" ON public.audit_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_audit_events_user_created ON public.audit_events(user_id, created_at DESC);