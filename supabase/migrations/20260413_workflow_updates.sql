-- Extend workflow state and notification tracking for RBAC + learning activity flows.

DO $$
DECLARE
    status_con_name text;
BEGIN
    SELECT conname INTO status_con_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';

    IF status_con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || status_con_name;
    END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'disabled'::text]));

ALTER TABLE public.exam_assignments
  ADD COLUMN IF NOT EXISTS assignment_email_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS due_soon_email_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS overdue_email_sent_at timestamp with time zone;

ALTER TABLE public.exam_submissions
  ADD COLUMN IF NOT EXISTS graded_email_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS student_feedback_viewed_at timestamp with time zone;

ALTER TABLE public.streaks
  ADD COLUMN IF NOT EXISTS last_warning_sent_date date;

CREATE INDEX IF NOT EXISTS exam_assignments_due_date_idx
  ON public.exam_assignments (due_date)
  WHERE due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS exam_submissions_student_lookup_idx
  ON public.exam_submissions (student_email, exam_type, serie_id, combinaison_id, partie_id);
