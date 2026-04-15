-- Allow students to update own flashcards

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'flashcards' AND policyname = 'flashcards_update_own'
  ) THEN
    CREATE POLICY flashcards_update_own
      ON public.flashcards
      FOR UPDATE
      TO authenticated
      USING (student_id = auth.uid())
      WITH CHECK (student_id = auth.uid());
  END IF;
END $$;

