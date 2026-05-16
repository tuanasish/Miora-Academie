ALTER TABLE public.exam_submissions
  ADD COLUMN IF NOT EXISTS speaking_task1_storage_path text,
  ADD COLUMN IF NOT EXISTS speaking_task2_storage_path text,
  ADD COLUMN IF NOT EXISTS speaking_task1_mime_type text,
  ADD COLUMN IF NOT EXISTS speaking_task2_mime_type text,
  ADD COLUMN IF NOT EXISTS speaking_task1_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS speaking_task2_size_bytes bigint,
  ADD COLUMN IF NOT EXISTS speaking_task1_duration_sec integer,
  ADD COLUMN IF NOT EXISTS speaking_task2_duration_sec integer;

CREATE INDEX IF NOT EXISTS exam_submissions_speaking_task1_storage_path_idx
  ON public.exam_submissions (speaking_task1_storage_path)
  WHERE speaking_task1_storage_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS exam_submissions_speaking_task2_storage_path_idx
  ON public.exam_submissions (speaking_task2_storage_path)
  WHERE speaking_task2_storage_path IS NOT NULL;
