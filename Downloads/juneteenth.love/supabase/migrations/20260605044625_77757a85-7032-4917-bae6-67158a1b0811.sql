
-- 1) Grant admin role to site owner
INSERT INTO public.user_roles (user_id, role)
VALUES ('d6dfc1c1-c19f-4273-a2fa-aaff38df477d', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Slur detection trigger — auto-hold + auto-report
CREATE OR REPLACE FUNCTION public.stories_slur_check()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  combined text;
  pattern text;
BEGIN
  combined := lower(coalesce(NEW.title, '') || ' ' || coalesce(NEW.content, ''));
  -- Common hate-speech slurs (word-boundary matched). Intentionally narrow.
  pattern := '\m(nigger|nigga|n1gger|n!gger|chink|spic|kike|faggot|fag|tranny|retard|coon|wetback|gook|towelhead|sandnigger)\M';
  IF combined ~* pattern THEN
    NEW.status := 'pending';
    INSERT INTO public.story_reports (story_id, reporter_id, reason, details, status)
    VALUES (NEW.id, NULL, 'Automatic: hate speech detected', 'Auto-flagged by slur filter. Review required.', 'open');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stories_slur_check_trigger ON public.stories;
CREATE TRIGGER stories_slur_check_trigger
  BEFORE INSERT OR UPDATE OF title, content ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.stories_slur_check();
