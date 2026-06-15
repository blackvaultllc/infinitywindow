
-- Conversations
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'open',
  owner_joined boolean NOT NULL DEFAULT false,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own conversation visible"
  ON public.chat_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Members create own conversation"
  ON public.chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update conversations"
  ON public.chat_conversations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- Messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','ai','owner')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 4000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_convo_created_idx ON public.chat_messages (conversation_id, created_at);

GRANT SELECT, INSERT ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own conversation messages visible"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.chat_conversations c
    WHERE c.id = conversation_id
      AND (c.user_id = auth.uid()
           OR public.has_role(auth.uid(), 'admin')
           OR public.has_role(auth.uid(), 'moderator'))
  ));

CREATE POLICY "Members write own user messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender = 'user'
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins write owner messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender = 'owner'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  );

-- Realtime
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;

-- Trigger to bump last_message_at and mark owner_joined when owner posts
CREATE OR REPLACE FUNCTION public.chat_messages_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.chat_conversations
    SET last_message_at = NEW.created_at,
        owner_joined = owner_joined OR (NEW.sender = 'owner')
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER chat_messages_bump
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_messages_after_insert();
