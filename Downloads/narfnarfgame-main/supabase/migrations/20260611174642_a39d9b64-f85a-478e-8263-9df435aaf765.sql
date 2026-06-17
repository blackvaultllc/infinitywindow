ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_role text,
  ADD COLUMN IF NOT EXISTS avatar_gender text DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS avatar_skin text DEFAULT '#d8b48a',
  ADD COLUMN IF NOT EXISTS avatar_uniform text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS avatar_flag text DEFAULT 'UN',
  ADD COLUMN IF NOT EXISTS avatar_accent text DEFAULT '#38bdf8';