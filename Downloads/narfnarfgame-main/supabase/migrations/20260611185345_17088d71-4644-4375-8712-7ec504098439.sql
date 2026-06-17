DROP POLICY IF EXISTS "players can add themselves to clans" ON public.clan_members;

ALTER TABLE public.clan_members
ADD CONSTRAINT clan_members_one_clan_per_player UNIQUE (user_id);

CREATE POLICY "players can join or own valid clans"
ON public.clan_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    (role = 'owner' AND EXISTS (SELECT 1 FROM public.clans c WHERE c.id = clan_id AND c.owner_id = auth.uid()))
    OR role = 'member'
  )
);