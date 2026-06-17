CREATE TABLE public.infinity_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New transmission',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.infinity_threads TO authenticated;
GRANT ALL ON public.infinity_threads TO service_role;
ALTER TABLE public.infinity_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage threads" ON public.infinity_threads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX infinity_threads_user_idx ON public.infinity_threads(user_id, updated_at DESC);

CREATE TABLE public.infinity_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.infinity_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  parts jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.infinity_messages TO authenticated;
GRANT ALL ON public.infinity_messages TO service_role;
ALTER TABLE public.infinity_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners manage messages" ON public.infinity_messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX infinity_messages_thread_idx ON public.infinity_messages(thread_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_infinity_thread() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.infinity_threads SET updated_at = now() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER infinity_messages_touch_thread AFTER INSERT ON public.infinity_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_infinity_thread();