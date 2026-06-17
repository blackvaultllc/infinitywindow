
DROP FUNCTION IF EXISTS public.send_chat_message(text, text, uuid, uuid, text);

CREATE FUNCTION public.send_chat_message(
  _channel text, _body text, _clan_id uuid DEFAULT NULL, _friend_id uuid DEFAULT NULL, _country text DEFAULT NULL
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
  IF _channel NOT IN ('general','country','direct','clan') THEN RAISE EXCEPTION 'Bad channel'; END IF;
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

  INSERT INTO public.chat_messages(user_id, display_name, body, channel, clan_id, friend_id, country, is_hidden, flagged)
  VALUES (_uid, _profile.display_name, _body, _channel, _clan_id, _friend_id, _country, _hidden, _flag)
  RETURNING id INTO _id;

  RETURN _id;
END $$;
