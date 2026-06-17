CREATE TABLE public.clans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  owner_id uuid NOT NULL,
  country text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clans_name_len CHECK (char_length(name) BETWEEN 3 AND 32),
  CONSTRAINT clans_slug_format CHECK (slug ~ '^[a-z0-9-]{3,40}$'),
  CONSTRAINT clans_country_len CHECK (country IS NULL OR char_length(country) BETWEEN 2 AND 56),
  CONSTRAINT clans_description_len CHECK (description IS NULL OR char_length(description) <= 240)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clans TO authenticated;
GRANT ALL ON public.clans TO service_role;

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clans readable by signed-in users"
ON public.clans
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "players can create their own clan"
ON public.clans
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "clan owners and staff can update clans"
ON public.clans
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "clan owners and staff can delete clans"
ON public.clans
FOR DELETE
TO authenticated
USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER touch_clans_updated_at
BEFORE UPDATE ON public.clans
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.clan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (clan_id, user_id),
  CONSTRAINT clan_members_role_check CHECK (role IN ('owner', 'officer', 'member'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clan_members TO authenticated;
GRANT ALL ON public.clan_members TO service_role;

ALTER TABLE public.clan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clan members readable by signed-in users"
ON public.clan_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "players can add themselves to clans"
ON public.clan_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "owners and staff can update clan members"
ON public.clan_members
FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.clans c WHERE c.id = clan_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.clans c WHERE c.id = clan_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

CREATE POLICY "members owners and staff can remove clan members"
ON public.clan_members
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.clans c WHERE c.id = clan_id AND c.owner_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  user_id uuid NOT NULL,
  display_name text,
  body text NOT NULL,
  country text,
  friend_id uuid,
  clan_id uuid REFERENCES public.clans(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_channel_check CHECK (channel IN ('general', 'country', 'direct', 'clan')),
  CONSTRAINT chat_messages_body_len CHECK (char_length(body) BETWEEN 1 AND 500),
  CONSTRAINT chat_country_required CHECK (channel <> 'country' OR country IS NOT NULL),
  CONSTRAINT chat_direct_required CHECK (channel <> 'direct' OR friend_id IS NOT NULL),
  CONSTRAINT chat_clan_required CHECK (channel <> 'clan' OR clan_id IS NOT NULL)
);

GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "general and country chat readable by signed-in users"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (channel IN ('general', 'country'));

CREATE POLICY "direct chat readable by accepted friends"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  channel = 'direct'
  AND (
    user_id = auth.uid()
    OR (
      friend_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.friends f
        WHERE f.status = 'accepted'
          AND ((f.requester_id = auth.uid() AND f.addressee_id = chat_messages.user_id)
            OR (f.addressee_id = auth.uid() AND f.requester_id = chat_messages.user_id))
      )
    )
  )
);

CREATE POLICY "clan chat readable by clan members"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (
  channel = 'clan'
  AND EXISTS (
    SELECT 1 FROM public.clan_members cm
    WHERE cm.clan_id = chat_messages.clan_id AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "players can post general and country chat"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND channel IN ('general', 'country'));

CREATE POLICY "players can post direct chat to accepted friends"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND channel = 'direct'
  AND friend_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.friends f
    WHERE f.status = 'accepted'
      AND ((f.requester_id = auth.uid() AND f.addressee_id = friend_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = friend_id))
  )
);

CREATE POLICY "players can post clan chat as members"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND channel = 'clan'
  AND EXISTS (
    SELECT 1 FROM public.clan_members cm
    WHERE cm.clan_id = chat_messages.clan_id AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "players and staff can delete chat messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE INDEX chat_messages_general_idx ON public.chat_messages (channel, created_at DESC);
CREATE INDEX chat_messages_country_idx ON public.chat_messages (country, created_at DESC) WHERE channel = 'country';
CREATE INDEX chat_messages_direct_idx ON public.chat_messages (user_id, friend_id, created_at DESC) WHERE channel = 'direct';
CREATE INDEX chat_messages_clan_idx ON public.chat_messages (clan_id, created_at DESC) WHERE channel = 'clan';
CREATE INDEX clan_members_user_idx ON public.clan_members (user_id);
CREATE INDEX clan_members_clan_idx ON public.clan_members (clan_id);