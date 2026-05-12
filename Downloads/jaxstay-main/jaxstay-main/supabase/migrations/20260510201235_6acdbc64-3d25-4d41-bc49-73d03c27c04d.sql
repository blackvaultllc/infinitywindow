
-- 1) Storage SELECT policies so upsert + own-file management works
CREATE POLICY "Users read own avatar" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own pet photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own gallery" ON storage.objects FOR SELECT
  USING (bucket_id = 'sitter-gallery' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2) Verification fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS verification_doc_path text,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_notes text;

-- 3) Private background-checks storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('background-checks', 'background-checks', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Sitters upload own bg check" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'background-checks' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Sitters read own bg check" ON storage.objects FOR SELECT
  USING (bucket_id = 'background-checks' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Sitters update own bg check" ON storage.objects FOR UPDATE
  USING (bucket_id = 'background-checks' AND (auth.uid())::text = (storage.foldername(name))[1]);
CREATE POLICY "Sitters delete own bg check" ON storage.objects FOR DELETE
  USING (bucket_id = 'background-checks' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));

-- 4) Sitter availability calendar
CREATE TABLE public.sitter_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sitter_id uuid NOT NULL,
  date date NOT NULL,
  status text NOT NULL DEFAULT 'blocked',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sitter_id, date)
);
CREATE INDEX idx_sitter_availability_sitter ON public.sitter_availability(sitter_id, date);

ALTER TABLE public.sitter_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read availability" ON public.sitter_availability FOR SELECT
  USING (true);
CREATE POLICY "Sitter inserts own availability" ON public.sitter_availability FOR INSERT
  WITH CHECK (auth.uid() = sitter_id);
CREATE POLICY "Sitter updates own availability" ON public.sitter_availability FOR UPDATE
  USING (auth.uid() = sitter_id) WITH CHECK (auth.uid() = sitter_id);
CREATE POLICY "Sitter deletes own availability" ON public.sitter_availability FOR DELETE
  USING (auth.uid() = sitter_id);

-- 5) Allow admins to update verification on profiles via a SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.admin_set_verification(
  _user_id uuid,
  _status text,
  _notes text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF _status NOT IN ('not_started', 'uploaded', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  UPDATE public.profiles
    SET verification_status = _status,
        verification_notes = _notes,
        verified_at = CASE WHEN _status = 'approved' THEN now() ELSE NULL END
  WHERE id = _user_id;
END; $$;
