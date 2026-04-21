create table if not exists public.submission_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.exam_submissions(id) on delete cascade,
  task_key text not null check (task_key in ('t1', 't2', 't3')),
  source text not null default 'gemini',
  suggestion_type text not null check (suggestion_type in ('replace', 'insert', 'delete')),
  original_text text not null default '',
  suggested_text text not null default '',
  reason text not null default '',
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'undone')),
  created_by uuid null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_submission_ai_suggestions_submission_task_status
  on public.submission_ai_suggestions (submission_id, task_key, status);

create index if not exists idx_submission_ai_suggestions_submission_created_at
  on public.submission_ai_suggestions (submission_id, created_at desc);
