
-- 1. Table
CREATE TABLE public.cutscenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  power_category TEXT NOT NULL UNIQUE,
  video_path TEXT,
  duration_seconds INT NOT NULL DEFAULT 5 CHECK (duration_seconds BETWEEN 1 AND 60),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cutscenes_power_category_valid CHECK (
    power_category IN ('Fire','Biological','Electromagnetic','Atmospheric','Geological','Hydrological','Cosmic','SlowBurn')
  )
);

-- 2. Grants
GRANT SELECT ON public.cutscenes TO authenticated;
GRANT ALL ON public.cutscenes TO service_role;

-- 3. RLS
ALTER TABLE public.cutscenes ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Authenticated can read enabled cutscenes"
  ON public.cutscenes FOR SELECT
  TO authenticated
  USING (enabled = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage cutscenes"
  ON public.cutscenes FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. updated_at trigger
CREATE TRIGGER touch_cutscenes_updated_at
  BEFORE UPDATE ON public.cutscenes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 6. Storage policies for the private 'cutscenes' bucket
-- Admins can do anything; signed URLs for playback are minted server-side.
CREATE POLICY "Admins manage cutscene objects"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'cutscenes' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'cutscenes' AND public.has_role(auth.uid(), 'admin'));
