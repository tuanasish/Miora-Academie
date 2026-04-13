CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  bucket text PRIMARY KEY,
  attempts integer NOT NULL DEFAULT 0,
  window_started_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  blocked_until timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS auth_rate_limits_updated_at_idx
  ON public.auth_rate_limits (updated_at);

CREATE OR REPLACE FUNCTION public.consume_auth_rate_limit(
  p_bucket text,
  p_max_attempts integer,
  p_window_seconds integer
)
RETURNS TABLE (
  allowed boolean,
  retry_after_seconds integer,
  attempts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_row public.auth_rate_limits%ROWTYPE;
  current_ts timestamp with time zone := timezone('utc', now());
  window_ends_at timestamp with time zone;
  next_attempts integer;
BEGIN
  LOOP
    SELECT *
      INTO current_row
      FROM public.auth_rate_limits
     WHERE bucket = p_bucket
     FOR UPDATE;

    IF NOT FOUND THEN
      BEGIN
        INSERT INTO public.auth_rate_limits (
          bucket,
          attempts,
          window_started_at,
          blocked_until,
          created_at,
          updated_at
        )
        VALUES (
          p_bucket,
          1,
          current_ts,
          NULL,
          current_ts,
          current_ts
        );

        RETURN QUERY SELECT true, 0, 1;
        RETURN;
      EXCEPTION
        WHEN unique_violation THEN
          NULL;
      END;
    ELSE
      window_ends_at := current_row.window_started_at + make_interval(secs => p_window_seconds);

      IF current_row.blocked_until IS NOT NULL AND current_row.blocked_until > current_ts THEN
        RETURN QUERY
          SELECT
            false,
            GREATEST(1, CEIL(EXTRACT(EPOCH FROM (current_row.blocked_until - current_ts)))::integer),
            current_row.attempts;
        RETURN;
      END IF;

      IF window_ends_at <= current_ts THEN
        UPDATE public.auth_rate_limits
           SET attempts = 1,
               window_started_at = current_ts,
               blocked_until = NULL,
               updated_at = current_ts
         WHERE bucket = p_bucket;

        RETURN QUERY SELECT true, 0, 1;
        RETURN;
      END IF;

      next_attempts := current_row.attempts + 1;

      IF next_attempts > p_max_attempts THEN
        UPDATE public.auth_rate_limits
           SET blocked_until = window_ends_at,
               updated_at = current_ts
         WHERE bucket = p_bucket;

        RETURN QUERY
          SELECT
            false,
            GREATEST(1, CEIL(EXTRACT(EPOCH FROM (window_ends_at - current_ts)))::integer),
            current_row.attempts;
        RETURN;
      END IF;

      UPDATE public.auth_rate_limits
         SET attempts = next_attempts,
             updated_at = current_ts
       WHERE bucket = p_bucket;

      RETURN QUERY SELECT true, 0, next_attempts;
      RETURN;
    END IF;
  END LOOP;
END;
$$;
