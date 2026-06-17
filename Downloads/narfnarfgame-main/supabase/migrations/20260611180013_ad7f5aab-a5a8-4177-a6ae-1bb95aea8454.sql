CREATE TABLE IF NOT EXISTS public.forum_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand text NOT NULL CHECK (brand IN ('captain-infinity','rememberfi')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  body text NOT NULL CHECK (length(body) BETWEEN 2 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_threads TO authenticated;
GRANT ALL ON public.forum_threads TO service_role;

ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_threads readable by signed-in users"
  ON public.forum_threads FOR SELECT TO authenticated USING (true);

CREATE POLICY "forum_threads self insert"
  ON public.forum_threads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "forum_threads self update"
  ON public.forum_threads FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "forum_threads self or staff delete"
  ON public.forum_threads FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'moderator')
  );

CREATE INDEX IF NOT EXISTS forum_threads_brand_created_idx
  ON public.forum_threads (brand, created_at DESC);

DROP TRIGGER IF EXISTS forum_threads_touch ON public.forum_threads;
CREATE TRIGGER forum_threads_touch BEFORE UPDATE ON public.forum_threads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();