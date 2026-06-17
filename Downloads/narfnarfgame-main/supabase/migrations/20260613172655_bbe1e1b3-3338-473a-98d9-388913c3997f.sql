-- Allow co-leaders to also change recruitment
CREATE OR REPLACE FUNCTION public.set_clan_recruitment(_clan_id uuid, _mode text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _role text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _mode NOT IN ('open','closed','invite_only') THEN RAISE EXCEPTION 'Bad mode'; END IF;
  SELECT role INTO _role FROM public.clan_members WHERE clan_id = _clan_id AND user_id = _uid;
  IF _role NOT IN ('owner','co_leader') THEN
    RAISE EXCEPTION 'Only the owner or a co-leader can change recruitment';
  END IF;
  UPDATE public.clans SET recruitment = _mode WHERE id = _clan_id;
END $function$;

-- New: edit clan description / country (owner + co-leader)
CREATE OR REPLACE FUNCTION public.update_clan_meta(_clan_id uuid, _description text, _country text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _role text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT role INTO _role FROM public.clan_members WHERE clan_id = _clan_id AND user_id = _uid;
  IF _role NOT IN ('owner','co_leader') THEN
    RAISE EXCEPTION 'Only the owner or a co-leader can edit the clan';
  END IF;
  IF _description IS NOT NULL AND length(_description) > 240 THEN
    RAISE EXCEPTION 'Description too long (max 240 chars)';
  END IF;
  UPDATE public.clans
    SET description = COALESCE(NULLIF(trim(_description), ''), description),
        country = COALESCE(NULLIF(trim(_country), ''), country)
    WHERE id = _clan_id;
END $function$;

-- New: broadcast a clan announcement (owner + co-leader). Posts a clan-channel chat message tagged as announcement.
CREATE OR REPLACE FUNCTION public.post_clan_announcement(_clan_id uuid, _body text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _role text; _name text; _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF length(trim(_body)) < 1 OR length(_body) > 500 THEN RAISE EXCEPTION 'Bad announcement length'; END IF;
  SELECT role INTO _role FROM public.clan_members WHERE clan_id = _clan_id AND user_id = _uid;
  IF _role NOT IN ('owner','co_leader') THEN
    RAISE EXCEPTION 'Only the owner or a co-leader can post announcements';
  END IF;
  SELECT display_name INTO _name FROM public.profiles WHERE id = _uid;
  INSERT INTO public.chat_messages(user_id, display_name, body, channel, clan_id)
  VALUES (_uid, _name, '📣 ' || _body, 'clan', _clan_id)
  RETURNING id INTO _id;
  RETURN _id;
END $function$;