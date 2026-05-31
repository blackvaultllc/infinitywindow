-- ============================================================
-- Migration 3: Anti-cheat suspicion + alerts + mod audit log + reports
-- ============================================================

-- Raw signal stream
CREATE TABLE public.suspicion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  weight integer NOT NULL DEFAULT 1 CHECK (weight BETWEEN 1 AND 100),
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suspicion_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_suspicion_user_time ON public.suspicion_events(user_id, created_at DESC);

-- Rolling 7-day weighted score, capped at 100%
CREATE OR REPLACE VIEW public.v_user_suspicion AS
SELECT
  user_id,
  LEAST(100, SUM(weight))::int AS score,
  COUNT(*) AS event_count,
  MAX(created_at) AS last_event_at,
  jsonb_object_agg(event_type, n) AS by_type
FROM (
  SELECT user_id, event_type, weight, created_at,
         COUNT(*) OVER (PARTITION BY user_id, event_type) AS n
  FROM public.suspicion_events
  WHERE created_at > now() - interval '7 days'
) s
GROUP BY user_id;

-- Alerts inbox
CREATE TABLE public.owner_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  score int NOT NULL,
  reason text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  read_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.owner_alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_alerts_unread ON public.owner_alerts(created_at DESC) WHERE read_at IS NULL;

-- Mod action audit log
CREATE TABLE public.mod_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL,
  target_user_id uuid,
  action text NOT NULL CHECK (action IN (
    'warn','timeout','ban','unban','delete_message','void_battle',
    'resolve_report','grant_role','revoke_role','grant_permission','revoke_permission',
    'grant_card','void_xp','note','shadow_ban','unshadow_ban'
  )),
  reason text NOT NULL,
  resolution_note text,
  duration_minutes int,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mod_actions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_mod_actions_actor ON public.mod_actions(actor_id, created_at DESC);
CREATE INDEX idx_mod_actions_target ON public.mod_actions(target_user_id, created_at DESC);

-- User reports (player-submitted)
CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid NOT NULL,
  category text NOT NULL CHECK (category IN ('cheating','harassment','spam','exploit','other')),
  body text NOT NULL CHECK (length(body) BETWEEN 5 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','resolved','dismissed')),
  resolved_by uuid,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_reports_status ON public.user_reports(status, created_at DESC);

-- RLS
CREATE POLICY "suspicion self insert" ON public.suspicion_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suspicion review read" ON public.suspicion_events
  FOR SELECT USING (public.has_permission(auth.uid(), 'suspicion.review'));

CREATE POLICY "alerts read with perm" ON public.owner_alerts
  FOR SELECT USING (public.has_permission(auth.uid(), 'alerts.view'));
CREATE POLICY "alerts mark read" ON public.owner_alerts
  FOR UPDATE USING (public.has_permission(auth.uid(), 'alerts.view'))
  WITH CHECK (public.has_permission(auth.uid(), 'alerts.view'));

CREATE POLICY "mod_actions audit read" ON public.mod_actions
  FOR SELECT USING (public.has_permission(auth.uid(), 'audit.view'));

CREATE POLICY "reports own read" ON public.user_reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.has_permission(auth.uid(), 'reports.handle'));
CREATE POLICY "reports submit" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Record a suspicion signal (rate-limited)
CREATE OR REPLACE FUNCTION public.record_suspicion(
  _event_type text, _weight int, _meta jsonb DEFAULT '{}'::jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_recent int; v_score int; v_severity text;
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  IF _weight IS NULL OR _weight < 1 THEN _weight := 1; END IF;
  IF _weight > 100 THEN _weight := 100; END IF;

  -- Rate limit: 60/min per user
  SELECT count(*) INTO v_recent FROM public.suspicion_events
    WHERE user_id = v_uid AND created_at > now() - interval '1 minute';
  IF v_recent >= 60 THEN RETURN; END IF;

  INSERT INTO public.suspicion_events (user_id, event_type, weight, meta)
    VALUES (v_uid, _event_type, _weight, COALESCE(_meta, '{}'::jsonb));

  -- Check rolling score and fire alerts at thresholds
  SELECT score INTO v_score FROM public.v_user_suspicion WHERE user_id = v_uid;
  v_score := COALESCE(v_score, 0);

  IF v_score >= 95 THEN v_severity := 'critical';
  ELSIF v_score >= 80 THEN v_severity := 'high';
  ELSIF v_score >= 60 THEN v_severity := 'medium';
  ELSE RETURN;
  END IF;

  -- One alert per severity per user per hour to avoid spam
  IF NOT EXISTS (
    SELECT 1 FROM public.owner_alerts
    WHERE user_id = v_uid AND severity = v_severity AND created_at > now() - interval '1 hour'
  ) THEN
    INSERT INTO public.owner_alerts (user_id, severity, score, reason, meta)
    VALUES (v_uid, v_severity, v_score,
            'Suspicion score crossed '||v_severity||' threshold ('||v_score||'%)',
            jsonb_build_object('last_event_type', _event_type));
  END IF;
END $$;

-- Log a moderator action (reason required; required note for resolve)
CREATE OR REPLACE FUNCTION public.log_mod_action(
  _action text, _target uuid, _reason text,
  _resolution_note text DEFAULT NULL,
  _duration int DEFAULT NULL, _evidence jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT (public.has_permission(v_uid, 'audit.view')
          OR public.has_permission(v_uid, 'reports.handle')
          OR public.is_owner(v_uid)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN RAISE EXCEPTION 'reason required (min 3 chars)'; END IF;
  IF _action = 'resolve_report' AND (_resolution_note IS NULL OR length(trim(_resolution_note)) < 5) THEN
    RAISE EXCEPTION 'resolution_note required when resolving a report';
  END IF;

  INSERT INTO public.mod_actions (actor_id, target_user_id, action, reason, resolution_note, duration_minutes, evidence)
    VALUES (v_uid, _target, _action, _reason, _resolution_note, _duration, COALESCE(_evidence, '{}'::jsonb))
    RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- Resolve a report (forces a resolution note via log_mod_action)
CREATE OR REPLACE FUNCTION public.resolve_user_report(
  _report_id uuid, _outcome text, _resolution_note text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_target uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.has_permission(v_uid, 'reports.handle') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _outcome NOT IN ('resolved','dismissed') THEN RAISE EXCEPTION 'invalid outcome'; END IF;
  IF _resolution_note IS NULL OR length(trim(_resolution_note)) < 5 THEN
    RAISE EXCEPTION 'resolution_note required (min 5 chars)';
  END IF;

  UPDATE public.user_reports
    SET status = _outcome, resolved_by = v_uid, resolution_note = _resolution_note, resolved_at = now()
    WHERE id = _report_id RETURNING reported_user_id INTO v_target;
  IF NOT FOUND THEN RAISE EXCEPTION 'report not found'; END IF;

  PERFORM public.log_mod_action('resolve_report', v_target,
    'Report '||_outcome, _resolution_note, NULL,
    jsonb_build_object('report_id', _report_id));
END $$;

-- Void a battle (mods can roll back XP/EXOD windfalls from cheaters)
CREATE OR REPLACE FUNCTION public.void_user_battle(
  _user_id uuid, _xp int, _exod numeric, _reason text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.has_permission(v_uid, 'battles.void') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN RAISE EXCEPTION 'reason required'; END IF;

  UPDATE public.profiles SET xp = GREATEST(0, xp - COALESCE(_xp,0)), updated_at = now()
    WHERE id = _user_id;
  IF _exod IS NOT NULL AND _exod > 0 THEN
    UPDATE public.wallets SET exod_balance = GREATEST(0, exod_balance - _exod), updated_at = now()
      WHERE user_id = _user_id;
  END IF;

  PERFORM public.log_mod_action('void_battle', _user_id, _reason, NULL, NULL,
    jsonb_build_object('xp', _xp, 'exod', _exod));
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.owner_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mod_actions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_reports;
