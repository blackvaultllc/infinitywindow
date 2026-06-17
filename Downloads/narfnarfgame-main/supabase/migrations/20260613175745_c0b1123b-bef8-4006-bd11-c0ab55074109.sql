
DROP POLICY IF EXISTS "players can join or own valid clans" ON public.clan_members;

CREATE POLICY "players can join open clans or own newly created clan"
ON public.clan_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    (role = 'owner' AND EXISTS (
      SELECT 1 FROM public.clans c
      WHERE c.id = clan_members.clan_id AND c.owner_id = auth.uid()
    ))
    OR (role = 'member' AND EXISTS (
      SELECT 1 FROM public.clans c
      WHERE c.id = clan_members.clan_id AND c.recruitment = 'open'
    ))
  )
);
