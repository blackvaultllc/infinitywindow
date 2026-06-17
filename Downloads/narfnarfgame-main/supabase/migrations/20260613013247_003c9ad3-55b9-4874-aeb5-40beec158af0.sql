DROP POLICY IF EXISTS "own codex" ON public.player_codex;
CREATE POLICY "players can read own codex"
ON public.player_codex
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own quest progress" ON public.player_quests;
CREATE POLICY "players can read own quest progress"
ON public.player_quests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "equipped self all" ON public.player_equipped;
CREATE POLICY "players can read own equipped"
ON public.player_equipped
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "players can equip owned items"
ON public.player_equipped
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.player_inventory pi
    WHERE pi.user_id = auth.uid()
      AND pi.item_slug = player_equipped.item_slug
  )
);
CREATE POLICY "players can update equipped to owned items"
ON public.player_equipped
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.player_inventory pi
    WHERE pi.user_id = auth.uid()
      AND pi.item_slug = player_equipped.item_slug
  )
);
CREATE POLICY "players can clear own equipped"
ON public.player_equipped
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);