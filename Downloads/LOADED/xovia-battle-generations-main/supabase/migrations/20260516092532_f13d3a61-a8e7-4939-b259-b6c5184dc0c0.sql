-- ============================================================
-- Migration 2: Messaging (President-only-incoming gate)
-- ============================================================

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'dm' CHECK (kind IN ('dm','mod','broadcast','support')),
  subject text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  is_closed boolean NOT NULL DEFAULT false
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','moderator','member')),
  can_reply boolean NOT NULL DEFAULT true,
  last_read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_participants_user ON public.conversation_participants(user_id);

-- Helper: is the user a participant?
CREATE OR REPLACE FUNCTION public.is_conv_participant(_uid uuid, _conv uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_participants
                 WHERE conversation_id = _conv AND user_id = _uid);
$$;

-- RLS policies
CREATE POLICY "conv read participants or audit" ON public.conversations
  FOR SELECT USING (
    public.is_conv_participant(auth.uid(), id)
    OR public.has_permission(auth.uid(), 'audit.view')
  );

CREATE POLICY "participants read self or audit" ON public.conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_conv_participant(auth.uid(), conversation_id)
    OR public.has_permission(auth.uid(), 'audit.view')
  );

CREATE POLICY "messages read participants or audit" ON public.messages
  FOR SELECT USING (
    public.is_conv_participant(auth.uid(), conversation_id)
    OR public.has_permission(auth.uid(), 'audit.view')
  );

-- Writes go through send_message() only; no direct INSERT/UPDATE policies on messages

-- The gate: send_message
CREATE OR REPLACE FUNCTION public.send_message(
  _conversation_id uuid,
  _recipient_id uuid,
  _body text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_conv uuid := _conversation_id;
  v_is_admin boolean;
  v_is_owner boolean;
  v_recipient_is_owner boolean;
  v_can_reply boolean;
  v_rate integer;
  v_msg_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _body IS NULL OR length(trim(_body)) = 0 THEN RAISE EXCEPTION 'empty message'; END IF;
  IF length(_body) > 4000 THEN RAISE EXCEPTION 'message too long'; END IF;

  -- Rate limit: 10 messages / minute
  SELECT count(*) INTO v_rate FROM public.messages
    WHERE sender_id = v_uid AND created_at > now() - interval '1 minute';
  IF v_rate >= 10 THEN RAISE EXCEPTION 'rate limit: slow down'; END IF;

  v_is_owner := public.is_owner(v_uid);
  v_is_admin := public.has_permission(v_uid, 'messages.dm_anyone') OR v_is_owner;

  -- Starting a new DM
  IF v_conv IS NULL THEN
    IF _recipient_id IS NULL THEN RAISE EXCEPTION 'recipient required for new conversation'; END IF;
    IF _recipient_id = v_uid THEN RAISE EXCEPTION 'cannot DM yourself'; END IF;

    v_recipient_is_owner := public.is_owner(_recipient_id);

    -- THE GATE: regular users cannot start a DM with the President
    IF v_recipient_is_owner AND NOT v_is_admin THEN
      RAISE EXCEPTION 'The President only accepts incoming messages. Wait for staff to contact you.';
    END IF;

    -- Regular users can only start DMs if they have messages.dm_anyone perm
    IF NOT v_is_admin AND NOT public.has_permission(v_uid, 'messages.dm_anyone') THEN
      RAISE EXCEPTION 'You do not have permission to start direct messages.';
    END IF;

    INSERT INTO public.conversations (kind, created_by) VALUES ('dm', v_uid) RETURNING id INTO v_conv;
    INSERT INTO public.conversation_participants (conversation_id, user_id, role, can_reply)
      VALUES (v_conv, v_uid, CASE WHEN v_is_owner THEN 'owner' WHEN v_is_admin THEN 'admin' ELSE 'member' END, true);
    INSERT INTO public.conversation_participants (conversation_id, user_id, role, can_reply)
      VALUES (v_conv, _recipient_id,
              CASE WHEN v_recipient_is_owner THEN 'owner' ELSE 'member' END,
              true);
  ELSE
    -- Existing conversation: must be participant and able to reply
    SELECT can_reply INTO v_can_reply FROM public.conversation_participants
      WHERE conversation_id = v_conv AND user_id = v_uid;
    IF v_can_reply IS NULL THEN RAISE EXCEPTION 'not a participant'; END IF;
    IF NOT v_can_reply AND NOT v_is_admin THEN RAISE EXCEPTION 'replies disabled in this conversation'; END IF;
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, body)
    VALUES (v_conv, v_uid, _body) RETURNING id INTO v_msg_id;

  UPDATE public.conversations SET last_message_at = now() WHERE id = v_conv;
  RETURN jsonb_build_object('conversation_id', v_conv, 'message_id', v_msg_id);
END $$;

-- Mod/admin can soft-delete any message
CREATE OR REPLACE FUNCTION public.moderate_delete_message(_message_id uuid, _reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT public.has_permission(v_uid, 'chat.delete_any') THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN RAISE EXCEPTION 'reason required'; END IF;
  UPDATE public.messages SET deleted_at = now(), deleted_by = v_uid WHERE id = _message_id;
END $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;
