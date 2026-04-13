CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email text,
  actor_name text,
  actor_role text,
  action text NOT NULL,
  target_type text,
  target_id text,
  target_label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx
  ON public.audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_action_idx
  ON public.audit_logs (action);

CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx
  ON public.audit_logs (actor_id);
