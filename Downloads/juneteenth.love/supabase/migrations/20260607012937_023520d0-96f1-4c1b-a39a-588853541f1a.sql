
-- 1) Subscribers: stronger WITH CHECK
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.juneteenth_subscribers;
CREATE POLICY "Anyone can subscribe (validated)" ON public.juneteenth_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    AND (name IS NULL OR char_length(name) BETWEEN 1 AND 120)
    AND (user_id IS NULL OR auth.uid() = user_id)
  );

-- 2) Story likes: hide per-user rows; expose aggregates via functions
DROP POLICY IF EXISTS "Likes are public" ON public.story_likes;
REVOKE SELECT ON public.story_likes FROM anon;
CREATE POLICY "Users see their own likes" ON public.story_likes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.story_like_counts(_story_ids uuid[])
RETURNS TABLE(story_id uuid, like_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT s.story_id, count(*)::bigint
  FROM public.story_likes s
  WHERE s.story_id = ANY(_story_ids)
  GROUP BY s.story_id
$$;
REVOKE ALL ON FUNCTION public.story_like_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.story_like_counts(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.did_i_like(_story_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.story_likes WHERE story_id = _story_id AND user_id = auth.uid())
$$;
REVOKE ALL ON FUNCTION public.did_i_like(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.did_i_like(uuid) TO authenticated;

-- 3) Stories: tighten mod update WITH CHECK
DROP POLICY IF EXISTS "Mods can update any story" ON public.stories;
CREATE POLICY "Mods can update any story" ON public.stories
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
  WITH CHECK (
    (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role))
    AND status IN ('pending','approved','removed')
    AND char_length(title) BETWEEN 1 AND 200
    AND char_length(content) BETWEEN 1 AND 20000
  );

-- 4) Email queue helpers: pin search_path and revoke public execute
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- has_role and stories_slur_check already have search_path set. Restrict has_role exec to authenticated only (it's used by RLS — RLS calls don't require EXECUTE).
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
