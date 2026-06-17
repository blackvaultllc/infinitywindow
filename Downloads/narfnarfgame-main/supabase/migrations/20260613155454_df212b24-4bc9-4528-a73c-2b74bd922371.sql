ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_hair_style text DEFAULT 'short',
  ADD COLUMN IF NOT EXISTS avatar_hair_color text DEFAULT '#1a1a1a',
  ADD COLUMN IF NOT EXISTS avatar_shirt_color text,
  ADD COLUMN IF NOT EXISTS avatar_pants_color text,
  ADD COLUMN IF NOT EXISTS avatar_face text DEFAULT 'smile';