
-- Support tickets / messages
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'open',
  initial_message text NOT NULL,
  assigned_to uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets owner read" ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin') OR has_permission(auth.uid(),'reports.handle'));
CREATE POLICY "tickets owner insert" ON public.support_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets admin update" ON public.support_tickets FOR UPDATE
  USING (has_role(auth.uid(),'admin') OR has_permission(auth.uid(),'reports.handle'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_permission(auth.uid(),'reports.handle'));

CREATE TABLE public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid,
  sender_role text NOT NULL DEFAULT 'user',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tmsgs read" ON public.support_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_permission(auth.uid(),'reports.handle'))));
CREATE POLICY "tmsgs insert participants" ON public.support_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR has_role(auth.uid(),'admin') OR has_permission(auth.uid(),'reports.handle')))
  );

-- Support chat rate limit log
CREATE TABLE public.support_chat_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_chat_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chatlog own" ON public.support_chat_log FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE INDEX idx_chatlog_user_time ON public.support_chat_log(user_id, created_at DESC);

-- Admin dispute resolution
CREATE OR REPLACE FUNCTION public.admin_resolve_arena_dispute(
  _match_id uuid,
  _winner_id uuid,
  _note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m record;
  loser_id uuid;
  pot numeric;
  fee numeric;
  payout numeric;
  loser_card record;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  SELECT * INTO m FROM arena_matches WHERE id = _match_id FOR UPDATE;
  IF m IS NULL THEN RAISE EXCEPTION 'match not found'; END IF;
  IF m.status = 'settled' THEN RAISE EXCEPTION 'already settled'; END IF;
  IF _winner_id NOT IN (m.host_id, m.opponent_id) THEN
    RAISE EXCEPTION 'winner must be a participant';
  END IF;
  loser_id := CASE WHEN _winner_id = m.host_id THEN m.opponent_id ELSE m.host_id END;

  IF m.mode = 'coin' THEN
    pot := m.stake_ankh * 2;
    fee := round(pot * 0.025, 2);
    payout := pot - fee;
    UPDATE wallets SET ankh_balance = ankh_balance + payout, updated_at = now()
      WHERE user_id = _winner_id;
    INSERT INTO transactions(user_id, type, amount, description, meta)
      VALUES (_winner_id, 'arena_win', payout, 'Arena coin wager (admin-resolved)', jsonb_build_object('match_id', _match_id, 'admin', auth.uid()));
    INSERT INTO platform_revenue(source, amount, currency, ref_id)
      VALUES ('arena_house_fee', fee, 'ANKH', _match_id);
  ELSIF m.mode = 'card' THEN
    SELECT * INTO loser_card FROM arena_stakes
      WHERE match_id = _match_id AND user_id = loser_id AND kind = 'card' LIMIT 1;
    IF loser_card IS NOT NULL THEN
      -- Transfer card to winner
      INSERT INTO user_cards(user_id, card_id, card_name, card_rarity, quantity, source)
        VALUES (_winner_id, loser_card.card_id, loser_card.card_name, loser_card.card_rarity, 1, 'arena_win')
        ON CONFLICT DO NOTHING;
      -- Remove one from loser
      UPDATE user_cards SET quantity = greatest(quantity - 1, 0)
        WHERE user_id = loser_id AND card_id = loser_card.card_id;
    END IF;
  END IF;

  UPDATE arena_matches SET status='settled', winner_id=_winner_id, settled_at=now() WHERE id=_match_id;
  UPDATE arena_stakes SET released = true WHERE match_id = _match_id;

  INSERT INTO mod_actions(actor_id, target_user_id, action, reason, evidence)
    VALUES (auth.uid(), loser_id, 'arena_dispute_resolved', COALESCE(_note, 'Admin resolved dispute'),
            jsonb_build_object('match_id', _match_id, 'winner_id', _winner_id, 'mode', m.mode));

  RETURN jsonb_build_object('status','settled','winner_id',_winner_id);
END $$;

-- Auto-flag dispute alerts
CREATE OR REPLACE FUNCTION public.flag_arena_dispute() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'disputed' AND (OLD.status IS DISTINCT FROM 'disputed') THEN
    INSERT INTO owner_alerts(user_id, severity, reason, score, meta)
    VALUES (NEW.host_id, 'medium', 'arena_dispute',
            CASE WHEN NEW.stake_ankh >= 1000 THEN 80 ELSE 40 END,
            jsonb_build_object('match_id', NEW.id, 'mode', NEW.mode,
              'stake_ankh', NEW.stake_ankh, 'stake_rarity', NEW.stake_rarity,
              'opponent_id', NEW.opponent_id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_arena_dispute_alert ON public.arena_matches;
CREATE TRIGGER trg_arena_dispute_alert
  AFTER UPDATE ON public.arena_matches
  FOR EACH ROW EXECUTE FUNCTION public.flag_arena_dispute();
