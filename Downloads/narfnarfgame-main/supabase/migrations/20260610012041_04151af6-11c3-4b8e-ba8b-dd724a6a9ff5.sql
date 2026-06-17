ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ui_mode text NOT NULL DEFAULT 'regular'
    CHECK (ui_mode IN ('regular','advanced'));