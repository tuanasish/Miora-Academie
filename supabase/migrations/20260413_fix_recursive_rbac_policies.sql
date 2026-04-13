-- Fix recursive RLS checks on RBAC tables by moving role lookups into
-- SECURITY DEFINER helpers and recreating policies without self-references.

CREATE OR REPLACE FUNCTION public.current_profile_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.role
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(public.current_profile_role() = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_of_student(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_students
    WHERE teacher_id = auth.uid()
      AND student_id = target_student_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_student_of_teacher(target_teacher_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_students
    WHERE teacher_id = target_teacher_id
      AND student_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.current_profile_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_teacher_of_student(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_student_of_teacher(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_profile_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher_of_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_student_of_teacher(uuid) TO authenticated;

DO $$
DECLARE
  policy_row record;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_row.policyname);
  END LOOP;

  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'teacher_students'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.teacher_students', policy_row.policyname);
  END LOOP;

  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'streaks'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.streaks', policy_row.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_access
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR public.is_teacher_of_student(id)
    OR public.is_student_of_teacher(id)
  );

CREATE POLICY teacher_students_select_access
  ON public.teacher_students
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR teacher_id = auth.uid()
    OR student_id = auth.uid()
  );

CREATE POLICY teacher_students_admin_insert
  ON public.teacher_students
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY teacher_students_admin_update
  ON public.teacher_students
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY teacher_students_admin_delete
  ON public.teacher_students
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY streaks_select_access
  ON public.streaks
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR student_id = auth.uid()
    OR public.is_teacher_of_student(student_id)
  );

CREATE POLICY streaks_insert_access
  ON public.streaks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR student_id = auth.uid()
  );

CREATE POLICY streaks_update_access
  ON public.streaks
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR student_id = auth.uid()
  )
  WITH CHECK (
    public.is_admin()
    OR student_id = auth.uid()
  );

CREATE POLICY streaks_delete_access
  ON public.streaks
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
