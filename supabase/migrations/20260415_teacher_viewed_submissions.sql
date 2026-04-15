-- Track teacher "opened" state for submissions (Gmail-like unread styling)

ALTER TABLE public.exam_submissions
  ADD COLUMN IF NOT EXISTS teacher_viewed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS exam_submissions_teacher_viewed_at_idx
  ON public.exam_submissions (teacher_viewed_at);

