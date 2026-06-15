
-- 1. Extend stories
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS original_content text;

-- Backfill original_content from current content where missing
UPDATE public.stories SET original_content = content WHERE original_content IS NULL;

-- 2. story_likes
CREATE TABLE IF NOT EXISTS public.story_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, user_id)
);
CREATE INDEX IF NOT EXISTS story_likes_story_idx ON public.story_likes(story_id);

GRANT SELECT ON public.story_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.story_likes TO authenticated;
GRANT ALL ON public.story_likes TO service_role;

ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are public" ON public.story_likes
  FOR SELECT USING (true);
CREATE POLICY "Users can like as themselves" ON public.story_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike themselves" ON public.story_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. story_comments
CREATE TABLE IF NOT EXISTS public.story_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','removed','pending')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS story_comments_story_idx ON public.story_comments(story_id, created_at);

GRANT SELECT ON public.story_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_comments TO authenticated;
GRANT ALL ON public.story_comments TO service_role;

ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved comments are public" ON public.story_comments
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = author_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

-- Insert only when story exists, comments enabled, story approved, and inserter = author_id
CREATE POLICY "Signed-in users can comment when enabled" ON public.story_comments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id
        AND s.comments_enabled = true
        AND s.status = 'approved'
        AND s.published = true
    )
  );

CREATE POLICY "Authors can edit own comment" ON public.story_comments
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Story author OR admin/mod OR the comment author can delete
CREATE POLICY "Story author admin or commenter can delete" ON public.story_comments
  FOR DELETE TO authenticated USING (
    auth.uid() = author_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.id = story_id AND s.author_id = auth.uid()
    )
  );

CREATE TRIGGER story_comments_updated_at
  BEFORE UPDATE ON public.story_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
