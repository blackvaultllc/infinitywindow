
CREATE TABLE public.splash_videos (
  slot TEXT PRIMARY KEY,
  video_path TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
GRANT SELECT ON public.splash_videos TO anon, authenticated;
GRANT ALL ON public.splash_videos TO service_role;
ALTER TABLE public.splash_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read splash videos" ON public.splash_videos FOR SELECT USING (true);
CREATE POLICY "Admins manage splash videos" ON public.splash_videos FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.splash_videos (slot, video_path, enabled) VALUES ('intro', NULL, true) ON CONFLICT DO NOTHING;

CREATE POLICY "Admins write splash bucket" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'splash' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update splash bucket" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'splash' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete splash bucket" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'splash' AND public.has_role(auth.uid(),'admin'));
