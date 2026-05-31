
-- ============ POSTS (news / blog / events) ============
DO $$ BEGIN
  CREATE TYPE public.post_category AS ENUM ('news','blog','event');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  body_md text NOT NULL,
  cover_url text,
  category public.post_category NOT NULL DEFAULT 'news',
  event_date timestamptz,
  event_location text,
  is_published boolean NOT NULL DEFAULT false,
  author_id uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts (is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts (category, published_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts public read" ON public.posts;
CREATE POLICY "posts public read" ON public.posts FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "posts manage" ON public.posts;
CREATE POLICY "posts manage" ON public.posts FOR ALL
  USING (public.has_permission(auth.uid(), 'posts.manage'))
  WITH CHECK (public.has_permission(auth.uid(), 'posts.manage'));

-- Permission + admin grant
INSERT INTO public.permissions (key, label, description, category) VALUES
  ('posts.manage', 'Manage News & Blog Posts',
   'Create, edit, publish, and delete news, blog, and event posts.', 'content')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('admin', 'posts.manage')
ON CONFLICT DO NOTHING;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public._touch_posts_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_posts_updated ON public.posts;
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public._touch_posts_updated();

-- ============ DEVICE PAIR TOKENS (QR sign-in) ============
CREATE TABLE IF NOT EXISTS public.device_pair_tokens (
  token text PRIMARY KEY,
  user_agent text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 minutes'),
  approved_user_id uuid,
  approved_at timestamptz,
  auth_token_hash text,
  auth_email text,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_pair_expires ON public.device_pair_tokens (expires_at);

ALTER TABLE public.device_pair_tokens ENABLE ROW LEVEL SECURITY;
-- No direct policies — only SECURITY DEFINER RPCs touch this table.

-- ============ PROFILES: consent + recovery key ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery_key_hash text,
  ADD COLUMN IF NOT EXISTS recovery_key_set_at timestamptz;

-- ============ RPCs ============
CREATE OR REPLACE FUNCTION public.accept_consent(_version int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _version < 1 OR _version > 1000 THEN RAISE EXCEPTION 'invalid version'; END IF;
  UPDATE public.profiles
    SET consent_accepted_at = now(), consent_version = _version, updated_at = now()
    WHERE id = v_uid;
END $$;

CREATE OR REPLACE FUNCTION public.set_recovery_key(_hash text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _hash IS NULL OR length(_hash) < 32 OR length(_hash) > 256 THEN
    RAISE EXCEPTION 'invalid hash';
  END IF;
  UPDATE public.profiles
    SET recovery_key_hash = _hash, recovery_key_set_at = now(), updated_at = now()
    WHERE id = v_uid;
END $$;

-- Desktop: ask for a new pair token (no auth required)
CREATE OR REPLACE FUNCTION public.device_pair_request(_user_agent text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_token text;
BEGIN
  -- Periodic cleanup of long-expired tokens
  DELETE FROM public.device_pair_tokens WHERE expires_at < now() - interval '5 minutes';
  v_token := encode(gen_random_bytes(24), 'hex');
  INSERT INTO public.device_pair_tokens (token, user_agent)
    VALUES (v_token, COALESCE(left(_user_agent, 200), 'unknown'));
  RETURN v_token;
END $$;

-- Phone: look up what a token represents before approving
CREATE OR REPLACE FUNCTION public.device_pair_lookup(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.device_pair_tokens;
BEGIN
  SELECT * INTO v FROM public.device_pair_tokens WHERE token = _token;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF v.expires_at < now() THEN RETURN jsonb_build_object('status','expired'); END IF;
  IF v.approved_at IS NOT NULL THEN RETURN jsonb_build_object('status','already_approved'); END IF;
  RETURN jsonb_build_object(
    'status','pending',
    'user_agent', v.user_agent,
    'expires_at', v.expires_at
  );
END $$;

-- Phone: record that the signed-in user approved this token (server fn supplies the magic-link hash)
CREATE OR REPLACE FUNCTION public.device_pair_mark_approved(_token text, _token_hash text, _email text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _token_hash IS NULL OR length(_token_hash) < 8 THEN RAISE EXCEPTION 'invalid hash'; END IF;
  UPDATE public.device_pair_tokens
    SET approved_user_id = v_uid, approved_at = now(),
        auth_token_hash = _token_hash, auth_email = _email
    WHERE token = _token AND expires_at > now() AND approved_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'token invalid or expired'; END IF;
END $$;

-- Desktop: poll for approval; returns the magic-link hash once and marks consumed
CREATE OR REPLACE FUNCTION public.device_pair_poll(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.device_pair_tokens;
BEGIN
  SELECT * INTO v FROM public.device_pair_tokens WHERE token = _token FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','not_found'); END IF;
  IF v.expires_at < now() THEN RETURN jsonb_build_object('status','expired'); END IF;
  IF v.approved_at IS NULL THEN RETURN jsonb_build_object('status','pending'); END IF;
  IF v.consumed_at IS NOT NULL THEN RETURN jsonb_build_object('status','consumed'); END IF;
  UPDATE public.device_pair_tokens SET consumed_at = now() WHERE token = _token;
  RETURN jsonb_build_object(
    'status','approved',
    'token_hash', v.auth_token_hash,
    'email', v.auth_email
  );
END $$;

-- ============ SEED CONTENT (3 starter posts) ============
INSERT INTO public.posts (slug, title, excerpt, body_md, category, is_published, published_at, cover_url) VALUES
(
  'exodia-launch',
  'Exodia Awakens — The Dynasty Goes Live',
  'The sands have shifted. The arena is open, the relics are forged, and the duel begins.',
  '# The Dynasty Has Risen

After months of forging in the kilns, Exodia NFT Battle is live.

## What you can do today
- **Duel** in the Arena with cards drawn from the dynasty
- **Open packs** in the Drops bay — Common to Divine, with rare Exodia relics seeded in
- **Trade** on the Marketplace at a 2.5% creator fee
- **Climb** the Pass to unlock weekly rewards
- **Play Pharaoh''s Gambit** — our async board game

## What is coming
- Live PvP matchmaking
- Spectator mode
- Tournament brackets with EXOD prize pools
- Creator-minted character drops (see our Events tab)

The pyramid stands. The pass is open. Walk in.',
  'news', true, now(), null
),
(
  'creator-meet-and-greet',
  'Meet the Creator — Live Voice Session',
  'Hop on a live voice room with the founder. Ask anything about the dynasty, the roadmap, or the lore.',
  '# Meet the Creator

Once a month we open a live voice room where you can talk directly with the creator behind Exodia.

## What to expect
- Roadmap walk-through
- Lore deep-dive on the dynasty
- Open Q&A — nothing off the table
- Sneak peeks of unreleased cards (sometimes)

## How to join
- Be a verified Exodia account holder
- The room link drops in-app 15 minutes before start
- First 50 seats are open mic, rest are listen-only

> No promises about price, returns, or investment performance will be made. This is a community session about the project, not financial advice.',
  'event', true, now(),
  null
),
(
  'mint-your-own-character',
  'Coming Soon — Mint Your Own Character',
  'Selected community members will get the chance to design and mint their own card into the dynasty.',
  '# Mint Your Own Character

We are opening a limited program where a small group of players can design and mint their own custom card directly into Exodia.

## How it works
1. **Apply** with concept art, stat ideas, and lore for your character.
2. **Review** — our art council picks ~10 candidates per season.
3. **Collaborate** with our illustrator to finish the visuals.
4. **Mint** — your card gets minted as a 1/1 and listed in your vault. You hold the original.
5. **Optional re-issue** — if your card resonates, we may produce a small Rare/Epic re-issue with you receiving a 5% royalty on each secondary sale.

## What value it creates
A 1/1 minted into a live game is held forever. Whether its value grows depends on:
- How well your character plays in the meta
- Community demand
- The dynasty''s overall growth
- Real engagement — not speculation

> Important: minting a card does **not** guarantee any future market value. This program is about creative ownership and contribution, not financial return.

Apply through the in-app form once it opens later this quarter.',
  'event', true, now(),
  null
)
ON CONFLICT (slug) DO NOTHING;
