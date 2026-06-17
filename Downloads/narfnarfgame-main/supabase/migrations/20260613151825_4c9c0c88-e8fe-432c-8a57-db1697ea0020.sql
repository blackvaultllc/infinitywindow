-- Parent / child relationship + approval requests
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_parent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_minor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_email text,
  ADD COLUMN IF NOT EXISTS music_volume real NOT NULL DEFAULT 0.25,
  ADD COLUMN IF NOT EXISTS music_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.parental_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  parent_email text,
  kind text NOT NULL CHECK (kind IN ('purchase','setting_change','other')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied','expired')),
  decided_at timestamptz,
  decided_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.parental_requests TO authenticated;
GRANT ALL ON public.parental_requests TO service_role;
ALTER TABLE public.parental_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "child sees own requests"
  ON public.parental_requests FOR SELECT TO authenticated
  USING (child_user_id = auth.uid() OR parent_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "child creates own requests"
  ON public.parental_requests FOR INSERT TO authenticated
  WITH CHECK (child_user_id = auth.uid());

CREATE POLICY "parent decides"
  ON public.parental_requests FOR UPDATE TO authenticated
  USING (parent_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (parent_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS parental_requests_parent_idx ON public.parental_requests(parent_user_id, status);
CREATE INDEX IF NOT EXISTS parental_requests_child_idx ON public.parental_requests(child_user_id, status);

-- RPC: child files an approval request
CREATE OR REPLACE FUNCTION public.request_parental_approval(_kind text, _payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _parent_id uuid;
  _parent_email text;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _kind NOT IN ('purchase','setting_change','other') THEN RAISE EXCEPTION 'Bad kind'; END IF;
  SELECT parent_user_id, parent_email INTO _parent_id, _parent_email
    FROM public.profiles WHERE id = _uid;
  INSERT INTO public.parental_requests(child_user_id, parent_user_id, parent_email, kind, payload)
    VALUES (_uid, _parent_id, _parent_email, _kind, COALESCE(_payload,'{}'::jsonb))
    RETURNING id INTO _id;
  RETURN _id;
END $$;

-- RPC: parent decides
CREATE OR REPLACE FUNCTION public.decide_parental_request(_request_id uuid, _approve boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _req public.parental_requests%ROWTYPE;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO _req FROM public.parental_requests WHERE id = _request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not found'; END IF;
  IF _req.status <> 'pending' THEN RAISE EXCEPTION 'Already decided'; END IF;
  IF _req.parent_user_id IS DISTINCT FROM _uid AND NOT public.has_role(_uid,'admin') THEN
    RAISE EXCEPTION 'Only the assigned parent can decide';
  END IF;
  UPDATE public.parental_requests
    SET status = CASE WHEN _approve THEN 'approved' ELSE 'denied' END,
        decided_at = now(), decided_by = _uid
    WHERE id = _request_id;
END $$;