DROP POLICY IF EXISTS "staff can write ticket messages" ON public.ticket_messages;
DROP POLICY IF EXISTS "write message if ticket visible" ON public.ticket_messages;

CREATE POLICY "users can write own ticket messages"
ON public.ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND is_staff = false
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets t
    WHERE t.id = ticket_messages.ticket_id
      AND t.user_id = auth.uid()
  )
);

CREATE POLICY "staff can write own staff ticket messages"
ON public.ticket_messages
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND is_staff = true
  AND (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
    OR public.has_role(auth.uid(), 'support')
  )
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets t
    WHERE t.id = ticket_messages.ticket_id
  )
);