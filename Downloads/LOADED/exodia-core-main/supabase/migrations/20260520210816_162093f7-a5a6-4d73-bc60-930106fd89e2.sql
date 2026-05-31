
-- Terminal messages
CREATE TABLE public.terminal_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  command TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.terminal_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own messages read" ON public.terminal_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own messages insert" ON public.terminal_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own messages delete" ON public.terminal_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX terminal_messages_user_created ON public.terminal_messages(user_id, created_at);

-- Knowledge entries
CREATE TABLE public.knowledge_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL,
  topic TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.knowledge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own knowledge read" ON public.knowledge_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own knowledge insert" ON public.knowledge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own knowledge delete" ON public.knowledge_entries FOR DELETE USING (auth.uid() = user_id);

-- Notes
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  body TEXT NOT NULL DEFAULT '',
  x INTEGER NOT NULL DEFAULT 80,
  y INTEGER NOT NULL DEFAULT 80,
  w INTEGER NOT NULL DEFAULT 320,
  h INTEGER NOT NULL DEFAULT 240,
  z INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes all" ON public.notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Whiteboards (one per user)
CREATE TABLE public.whiteboards (
  user_id UUID NOT NULL PRIMARY KEY,
  strokes JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.whiteboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own whiteboard all" ON public.whiteboards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
