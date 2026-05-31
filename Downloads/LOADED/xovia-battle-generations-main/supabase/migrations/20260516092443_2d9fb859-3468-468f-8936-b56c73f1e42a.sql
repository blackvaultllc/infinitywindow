-- ============================================================
-- Migration 1: Discord-style permissions + has_permission gate
-- ============================================================

-- Permissions catalog
CREATE TABLE public.permissions (
  key text PRIMARY KEY,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permissions public read" ON public.permissions FOR SELECT USING (true);

-- Role -> permission mapping (role values are existing app_role enum)
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role, permission_key)
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Per-user override (grant or deny a specific permission regardless of role)
CREATE TABLE public.user_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_key text NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  granted boolean NOT NULL,
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key)
);
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

-- Soft sub-role label (since app_role enum is fixed, we add a finer label here)
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS sub_role text NOT NULL DEFAULT 'user';
-- sub_role values: 'owner' | 'admin' | 'moderator' | 'support' | 'user'

-- Owner-by-email helper (kept simple; we resolve owner via email)
CREATE OR REPLACE FUNCTION public.is_owner(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _uid AND lower(email) = 'blackhatterxvi@gmail.com'
  );
$$;

-- Effective permission check: override wins, else role grant, else owner=all
CREATE OR REPLACE FUNCTION public.has_permission(_uid uuid, _key text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_override boolean; v_role boolean;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  IF public.is_owner(_uid) THEN RETURN true; END IF;

  SELECT granted INTO v_override FROM public.user_permission_overrides
    WHERE user_id = _uid AND permission_key = _key LIMIT 1;
  IF v_override IS NOT NULL THEN RETURN v_override; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _uid AND rp.permission_key = _key
  ) INTO v_role;
  RETURN COALESCE(v_role, false);
END $$;

-- RLS using has_permission
CREATE POLICY "role_perms read with audit perm" ON public.role_permissions
  FOR SELECT USING (public.has_permission(auth.uid(), 'audit.view') OR public.is_owner(auth.uid()));
CREATE POLICY "role_perms manage owner" ON public.role_permissions
  FOR ALL USING (public.has_permission(auth.uid(), 'roles.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'roles.manage'));

CREATE POLICY "user_overrides read self or audit" ON public.user_permission_overrides
  FOR SELECT USING (auth.uid() = user_id OR public.has_permission(auth.uid(), 'audit.view'));
CREATE POLICY "user_overrides manage" ON public.user_permission_overrides
  FOR ALL USING (public.has_permission(auth.uid(), 'roles.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'roles.manage'));

-- Seed permission catalog
INSERT INTO public.permissions (key, label, category, description) VALUES
  ('chat.read',              'Read chat',                 'chat',    'View public chat channels'),
  ('chat.write',             'Send chat messages',        'chat',    'Send messages in public chat'),
  ('chat.delete_any',        'Delete any message',        'chat',    'Remove messages from any user'),
  ('chat.timeout',           'Timeout users in chat',     'chat',    'Temporarily mute a user'),
  ('chat.ban',               'Ban users from chat',       'chat',    'Permanently block a user from chat'),
  ('messages.dm_anyone',     'DM any user',               'messages','Initiate a DM with any user'),
  ('messages.dm_owner',      'DM the President',          'messages','Reserved; owner-only by default'),
  ('users.view',             'View user profiles',        'users',   'See full user profiles + email'),
  ('users.ban',              'Ban user accounts',         'users',   'Disable user accounts'),
  ('users.impersonate_read', 'Impersonate (read-only)',   'users',   'View the app as another user'),
  ('cards.view_owner_only',  'View owner-only cards',     'cards',   'See Psycronos / Khadija / EXOD-tier'),
  ('cards.grant',            'Grant cards to users',      'cards',   'Drop cards into a user vault'),
  ('battles.void',           'Void battle results',       'battles', 'Roll back XP/EXOD from a battle'),
  ('revenue.view',           'View platform revenue',     'revenue', 'See revenue dashboards'),
  ('roles.manage',           'Manage roles & permissions','admin',   'Owner-tier; edit this matrix'),
  ('alerts.view',            'View suspicion alerts',     'admin',   'See anti-cheat alert inbox'),
  ('audit.view',             'View moderator audit log',  'admin',   'See full mod action history'),
  ('reports.handle',         'Handle user reports',       'mod',     'Resolve reports with required note'),
  ('suspicion.review',       'Review suspicion events',   'mod',     'See suspicion scores')
ON CONFLICT (key) DO NOTHING;

-- Default role -> permission grants
-- admin gets everything except the owner-only roles.manage
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin'::app_role, key FROM public.permissions
WHERE key NOT IN ('roles.manage')
ON CONFLICT DO NOTHING;

-- Baseline for users
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('user'::app_role, 'chat.read'),
  ('user'::app_role, 'chat.write')
ON CONFLICT DO NOTHING;

-- Mark the two known admins (idempotent) and stamp sub_role
UPDATE public.user_roles ur
SET sub_role = 'owner'
FROM auth.users u
WHERE ur.user_id = u.id AND lower(u.email) = 'blackhatterxvi@gmail.com';

UPDATE public.user_roles ur
SET sub_role = 'admin'
FROM auth.users u
WHERE ur.user_id = u.id AND lower(u.email) = 'antoniyahpetite@gmail.com';
