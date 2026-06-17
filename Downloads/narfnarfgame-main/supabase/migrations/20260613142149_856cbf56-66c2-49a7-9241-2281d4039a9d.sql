
-- Phase 1: Clan hierarchy + recruitment

ALTER TABLE public.clan_members DROP CONSTRAINT IF EXISTS clan_members_role_check;
ALTER TABLE public.clan_members
  ADD CONSTRAINT clan_members_role_check
  CHECK (role = ANY (ARRAY['owner','co_leader','elder','member']));

-- migrate legacy 'officer' to 'co_leader'
UPDATE public.clan_members SET role = 'co_leader' WHERE role = 'officer';

ALTER TABLE public.clans
  ADD COLUMN IF NOT EXISTS recruitment text NOT NULL DEFAULT 'closed'
    CHECK (recruitment IN ('open','closed','invite_only'));

-- Join requests for invite_only mode
CREATE TABLE IF NOT EXISTS public.clan_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clan_id uuid NOT NULL REFERENCES public.clans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid,
  UNIQUE (clan_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clan_join_requests TO authenticated;
GRANT ALL ON public.clan_join_requests TO service_role;

ALTER TABLE public.clan_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own join requests or officers see clan requests"
  ON public.clan_join_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.clan_members cm
      WHERE cm.clan_id = clan_join_requests.clan_id
        AND cm.user_id = auth.uid()
        AND cm.role IN ('owner','co_leader','elder')
    )
  );

-- writes happen only through SECURITY DEFINER functions; no INSERT/UPDATE/DELETE policies

-- Rank ordering helper
CREATE OR REPLACE FUNCTION public.clan_rank_value(_role text)
RETURNS integer LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _role
    WHEN 'owner' THEN 4
    WHEN 'co_leader' THEN 3
    WHEN 'elder' THEN 2
    WHEN 'member' THEN 1
    ELSE 0
  END;
$$;

-- Set recruitment (owner only)
CREATE OR REPLACE FUNCTION public.set_clan_recruitment(_clan_id uuid, _mode text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _mode NOT IN ('open','closed','invite_only') THEN RAISE EXCEPTION 'Bad mode'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clans WHERE id = _clan_id AND owner_id = _uid) THEN
    RAISE EXCEPTION 'Only the clan owner can change recruitment';
  END IF;
  UPDATE public.clans SET recruitment = _mode WHERE id = _clan_id;
END $$;

-- Promote/demote a member
CREATE OR REPLACE FUNCTION public.set_clan_member_role(_clan_id uuid, _target_user uuid, _new_role text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _actor_role text;
  _target_role text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _new_role NOT IN ('co_leader','elder','member') THEN
    RAISE EXCEPTION 'Cannot assign that role';
  END IF;

  SELECT role INTO _actor_role FROM public.clan_members WHERE clan_id=_clan_id AND user_id=_uid;
  SELECT role INTO _target_role FROM public.clan_members WHERE clan_id=_clan_id AND user_id=_target_user;
  IF _actor_role IS NULL OR _target_role IS NULL THEN RAISE EXCEPTION 'Not in this clan'; END IF;

  -- Actor must outrank target AND outrank the new role
  IF clan_rank_value(_actor_role) <= clan_rank_value(_target_role)
     OR clan_rank_value(_actor_role) <= clan_rank_value(_new_role) THEN
    RAISE EXCEPTION 'Insufficient rank';
  END IF;

  UPDATE public.clan_members SET role = _new_role WHERE clan_id=_clan_id AND user_id=_target_user;
END $$;

-- Kick a member
CREATE OR REPLACE FUNCTION public.kick_clan_member(_clan_id uuid, _target_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _actor_role text;
  _target_role text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF _uid = _target_user THEN RAISE EXCEPTION 'Use leave_clan instead'; END IF;

  SELECT role INTO _actor_role FROM public.clan_members WHERE clan_id=_clan_id AND user_id=_uid;
  SELECT role INTO _target_role FROM public.clan_members WHERE clan_id=_clan_id AND user_id=_target_user;
  IF _actor_role IS NULL OR _target_role IS NULL THEN RAISE EXCEPTION 'Not in this clan'; END IF;
  IF _actor_role NOT IN ('owner','co_leader') THEN RAISE EXCEPTION 'Insufficient rank'; END IF;
  IF clan_rank_value(_actor_role) <= clan_rank_value(_target_role) THEN
    RAISE EXCEPTION 'Cannot kick someone of equal or higher rank';
  END IF;

  DELETE FROM public.clan_members WHERE clan_id=_clan_id AND user_id=_target_user;
END $$;

-- Transfer ownership
CREATE OR REPLACE FUNCTION public.transfer_clan_ownership(_clan_id uuid, _new_owner uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clans WHERE id=_clan_id AND owner_id=_uid) THEN
    RAISE EXCEPTION 'Only the current owner can transfer ownership';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.clan_members WHERE clan_id=_clan_id AND user_id=_new_owner) THEN
    RAISE EXCEPTION 'New owner must be a clan member';
  END IF;
  UPDATE public.clans SET owner_id = _new_owner WHERE id = _clan_id;
  UPDATE public.clan_members SET role = 'co_leader' WHERE clan_id=_clan_id AND user_id=_uid;
  UPDATE public.clan_members SET role = 'owner' WHERE clan_id=_clan_id AND user_id=_new_owner;
END $$;

-- Join (open recruitment only)
CREATE OR REPLACE FUNCTION public.join_clan(_clan_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _mode text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id=_uid) THEN
    RAISE EXCEPTION 'You are already in a clan';
  END IF;
  SELECT recruitment INTO _mode FROM public.clans WHERE id=_clan_id;
  IF _mode IS NULL THEN RAISE EXCEPTION 'Clan not found'; END IF;
  IF _mode = 'closed' THEN RAISE EXCEPTION 'This clan is closed'; END IF;
  IF _mode = 'invite_only' THEN RAISE EXCEPTION 'Use request_join_clan'; END IF;

  INSERT INTO public.clan_members(clan_id, user_id, role) VALUES (_clan_id, _uid, 'member');
END $$;

CREATE OR REPLACE FUNCTION public.leave_clan(_clan_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.clans WHERE id=_clan_id AND owner_id=_uid) THEN
    RAISE EXCEPTION 'Owner must transfer ownership before leaving';
  END IF;
  DELETE FROM public.clan_members WHERE clan_id=_clan_id AND user_id=_uid;
END $$;

CREATE OR REPLACE FUNCTION public.request_join_clan(_clan_id uuid, _message text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _mode text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF EXISTS (SELECT 1 FROM public.clan_members WHERE user_id=_uid) THEN
    RAISE EXCEPTION 'You are already in a clan';
  END IF;
  SELECT recruitment INTO _mode FROM public.clans WHERE id=_clan_id;
  IF _mode IS NULL THEN RAISE EXCEPTION 'Clan not found'; END IF;
  IF _mode = 'closed' THEN RAISE EXCEPTION 'This clan is closed'; END IF;
  IF _mode = 'open' THEN
    INSERT INTO public.clan_members(clan_id, user_id, role) VALUES (_clan_id, _uid, 'member');
    RETURN;
  END IF;
  INSERT INTO public.clan_join_requests(clan_id, user_id, message)
  VALUES (_clan_id, _uid, _message)
  ON CONFLICT (clan_id, user_id) DO UPDATE SET status='pending', message=EXCLUDED.message, created_at=now(), decided_at=NULL, decided_by=NULL;
END $$;

CREATE OR REPLACE FUNCTION public.decide_join_request(_request_id uuid, _accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _req public.clan_join_requests%ROWTYPE;
  _actor_role text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO _req FROM public.clan_join_requests WHERE id=_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF _req.status <> 'pending' THEN RAISE EXCEPTION 'Already decided'; END IF;

  SELECT role INTO _actor_role FROM public.clan_members WHERE clan_id=_req.clan_id AND user_id=_uid;
  IF _actor_role NOT IN ('owner','co_leader','elder') THEN RAISE EXCEPTION 'Insufficient rank'; END IF;

  IF _accept THEN
    IF NOT EXISTS (SELECT 1 FROM public.clan_members WHERE user_id=_req.user_id) THEN
      INSERT INTO public.clan_members(clan_id, user_id, role) VALUES (_req.clan_id, _req.user_id, 'member');
    END IF;
    UPDATE public.clan_join_requests SET status='accepted', decided_at=now(), decided_by=_uid WHERE id=_request_id;
  ELSE
    UPDATE public.clan_join_requests SET status='rejected', decided_at=now(), decided_by=_uid WHERE id=_request_id;
  END IF;
END $$;
