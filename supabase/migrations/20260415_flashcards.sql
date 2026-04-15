-- Flashcards: student vocab cards (FR -> VI)

CREATE TABLE IF NOT EXISTS public.flashcards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  term_fr text NOT NULL,
  meaning_vi text NOT NULL,
  exam_type text CHECK (exam_type = ANY (ARRAY['listening','reading','writing','speaking'])),
  serie_id integer,
  question_id integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS flashcards_student_created_at_idx
  ON public.flashcards (student_id, created_at DESC);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

-- Student can read own flashcards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'flashcards' AND policyname = 'flashcards_select_own'
  ) THEN
    CREATE POLICY flashcards_select_own
      ON public.flashcards
      FOR SELECT
      TO authenticated
      USING (student_id = auth.uid());
  END IF;
END $$;

-- Student can insert own flashcards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'flashcards' AND policyname = 'flashcards_insert_own'
  ) THEN
    CREATE POLICY flashcards_insert_own
      ON public.flashcards
      FOR INSERT
      TO authenticated
      WITH CHECK (student_id = auth.uid());
  END IF;
END $$;

-- Student can delete own flashcards
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'flashcards' AND policyname = 'flashcards_delete_own'
  ) THEN
    CREATE POLICY flashcards_delete_own
      ON public.flashcards
      FOR DELETE
      TO authenticated
      USING (student_id = auth.uid());
  END IF;
END $$;

