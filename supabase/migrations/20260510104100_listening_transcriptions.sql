-- Create listening_transcriptions table
CREATE TABLE IF NOT EXISTS public.listening_transcriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serie_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  transcription TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(serie_id, question_id)
);

-- Index for faster lookups by serie
CREATE INDEX IF NOT EXISTS idx_listening_transcriptions_serie ON public.listening_transcriptions(serie_id);

-- Enable Row Level Security
ALTER TABLE public.listening_transcriptions ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- 1. Admin: full access
-- We check role from the profiles table as per existing conventions in the project
CREATE POLICY "Admin full access on listening_transcriptions"
  ON public.listening_transcriptions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Teacher: read only
CREATE POLICY "Teacher read listening_transcriptions"
  ON public.listening_transcriptions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- 3. Student: read only
CREATE POLICY "Student read listening_transcriptions"
  ON public.listening_transcriptions
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'student')
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.listening_transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
