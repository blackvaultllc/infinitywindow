
-- Add roles to app_role enum (if not present)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'moderator' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'moderator';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'support' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'support';
  END IF;
END $$;

-- Chat message moderation fields
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_by uuid,
  ADD COLUMN IF NOT EXISTS hidden_reason text,
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;

-- Filter terms
CREATE TABLE IF NOT EXISTS public.chat_filter_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text UNIQUE NOT NULL,
  severity int NOT NULL CHECK (severity BETWEEN 1 AND 3),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.chat_filter_terms TO authenticated;
GRANT ALL ON public.chat_filter_terms TO service_role;
ALTER TABLE public.chat_filter_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "filter terms readable by staff" ON public.chat_filter_terms FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

-- Reports
CREATE TABLE IF NOT EXISTS public.chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, message_id)
);
GRANT SELECT, INSERT ON public.chat_reports TO authenticated;
GRANT ALL ON public.chat_reports TO service_role;
ALTER TABLE public.chat_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reporters and staff can view reports" ON public.chat_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));
-- inserts via server fn only

-- Mutes
CREATE TABLE IF NOT EXISTS public.user_mutes (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_until timestamptz NOT NULL,
  reason text,
  muted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_mutes TO authenticated;
GRANT ALL ON public.user_mutes TO service_role;
ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own mute, staff see all" ON public.user_mutes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator'));

-- Audit log
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  target_message_id uuid,
  reason text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff see audit log" ON public.moderation_actions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'moderator') OR has_role(auth.uid(),'support'));

CREATE INDEX IF NOT EXISTS moderation_actions_actor_idx ON public.moderation_actions(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS moderation_actions_target_idx ON public.moderation_actions(target_user_id, created_at DESC);

-- Seed initial wordlist (severity 3 = grooming/predatory phrases auto-mute)
INSERT INTO public.chat_filter_terms (term, severity) VALUES
  ('fuck', 1), ('shit', 1), ('bitch', 1), ('asshole', 1),
  ('cunt', 2), ('faggot', 2), ('retard', 2), ('nigger', 2),
  ('send nudes', 3), ('how old are you', 3), ('our little secret', 3),
  ('don''t tell your parents', 3), ('dont tell your parents', 3),
  ('meet me alone', 3), ('add me on snap', 3)
ON CONFLICT (term) DO NOTHING;

-- Helper: check if a user is currently muted
CREATE OR REPLACE FUNCTION public.is_user_muted(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_mutes WHERE user_id = _user_id AND muted_until > now());
$$;

-- Filter scan
CREATE OR REPLACE FUNCTION public.scan_chat_filter(_text text)
RETURNS int LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _max int := 0; _row record; _lower text := lower(_text);
BEGIN
  FOR _row IN SELECT term, severity FROM public.chat_filter_terms LOOP
    IF position(_row.term IN _lower) > 0 AND _row.severity > _max THEN
      _max := _row.severity;
    END IF;
  END LOOP;
  RETURN _max;
END $$;

-- Server-side send (replaces direct INSERT for chat clients that opt in)
CREATE OR REPLACE FUNCTION public.send_chat_message(
  _channel text, _body text, _clan_id uuid DEFAULT NULL, _recipient_id uuid DEFAULT NULL, _country text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _profile record;
  _severity int;
  _id uuid;
  _hidden boolean := false;
  _flag boolean := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF length(trim(_body)) = 0 THEN RAISE EXCEPTION 'Empty message'; END IF;
  IF length(_body) > 500 THEN RAISE EXCEPTION 'Message too long'; END IF;
  IF public.is_user_muted(_uid) THEN RAISE EXCEPTION 'You are muted'; END IF;

  SELECT display_name, banned INTO _profile FROM public.profiles WHERE id = _uid;
  IF _profile.banned THEN RAISE EXCEPTION 'Account suspended'; END IF;

  _severity := public.scan_chat_filter(_body);
  IF _severity >= 3 THEN
    _hidden := true; _flag := true;
    INSERT INTO public.user_mutes(user_id, muted_until, reason, muted_by)
      VALUES (_uid, now() + interval '24 hours', 'auto: severity-3 phrase', _uid)
      ON CONFLICT (user_id) DO UPDATE SET muted_until = GREATEST(user_mutes.muted_until, EXCLUDED.muted_until), reason = EXCLUDED.reason;
    INSERT INTO public.moderation_actions(actor_id, action, target_user_id, reason, metadata)
      VALUES (_uid, 'auto_mute', _uid, 'Severity 3 chat filter hit', jsonb_build_object('text', _body));
  ELSIF _severity = 2 THEN
    _flag := true;
  END IF;

  INSERT INTO public.chat_messages(user_id, display_name, body, channel, clan_id, recipient_id, country, is_hidden, flagged)
  VALUES (_uid, _profile.display_name, _body, _channel, _clan_id, _recipient_id, _country, _hidden, _flag)
  RETURNING id INTO _id;

  RETURN _id;
END $$;

-- Report
CREATE OR REPLACE FUNCTION public.report_chat_message(_message_id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  INSERT INTO public.chat_reports(reporter_id, message_id, reason)
  VALUES (_uid, _message_id, _reason)
  ON CONFLICT (reporter_id, message_id) DO NOTHING;
  UPDATE public.chat_messages SET flagged = true WHERE id = _message_id;
END $$;

-- Mod actions
CREATE OR REPLACE FUNCTION public.mod_hide_message(_message_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _author uuid;
BEGIN
  IF NOT (has_role(_uid,'admin') OR has_role(_uid,'moderator')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT user_id INTO _author FROM public.chat_messages WHERE id = _message_id;
  UPDATE public.chat_messages SET is_hidden = true, hidden_by = _uid, hidden_reason = _reason WHERE id = _message_id;
  INSERT INTO public.moderation_actions(actor_id, action, target_user_id, target_message_id, reason)
    VALUES (_uid, 'hide_message', _author, _message_id, _reason);
END $$;

CREATE OR REPLACE FUNCTION public.mod_mute_user(_target uuid, _minutes int, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NOT (has_role(_uid,'admin') OR has_role(_uid,'moderator')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _minutes < 1 OR _minutes > 60*24*30 THEN RAISE EXCEPTION 'Bad duration'; END IF;
  INSERT INTO public.user_mutes(user_id, muted_until, reason, muted_by)
    VALUES (_target, now() + make_interval(mins => _minutes), _reason, _uid)
    ON CONFLICT (user_id) DO UPDATE SET muted_until = EXCLUDED.muted_until, reason = EXCLUDED.reason, muted_by = EXCLUDED.muted_by;
  INSERT INTO public.moderation_actions(actor_id, action, target_user_id, reason, metadata)
    VALUES (_uid, 'mute_user', _target, _reason, jsonb_build_object('minutes', _minutes));
END $$;

CREATE OR REPLACE FUNCTION public.mod_unmute_user(_target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NOT (has_role(_uid,'admin') OR has_role(_uid,'moderator')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  DELETE FROM public.user_mutes WHERE user_id = _target;
  INSERT INTO public.moderation_actions(actor_id, action, target_user_id) VALUES (_uid, 'unmute_user', _target);
END $$;

CREATE OR REPLACE FUNCTION public.mod_ban_user(_target uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NOT has_role(_uid,'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.profiles SET banned = true WHERE id = _target;
  INSERT INTO public.moderation_actions(actor_id, action, target_user_id, reason) VALUES (_uid, 'ban_user', _target, _reason);
END $$;

CREATE OR REPLACE FUNCTION public.mod_unban_user(_target uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NOT has_role(_uid,'admin') THEN RAISE EXCEPTION 'Admins only'; END IF;
  UPDATE public.profiles SET banned = false WHERE id = _target;
  INSERT INTO public.moderation_actions(actor_id, action, target_user_id) VALUES (_uid, 'unban_user', _target);
END $$;

CREATE OR REPLACE FUNCTION public.mod_review_report(_report_id uuid, _dismiss boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF NOT (has_role(_uid,'admin') OR has_role(_uid,'moderator')) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  UPDATE public.chat_reports SET status = CASE WHEN _dismiss THEN 'dismissed' ELSE 'reviewed' END,
    reviewed_by = _uid, reviewed_at = now() WHERE id = _report_id;
END $$;
