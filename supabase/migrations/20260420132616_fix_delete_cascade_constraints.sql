-- Fix foreign key constraints to allow hard deleting users and teachers

-- Alter exam_submissions
ALTER TABLE "public"."exam_submissions" DROP CONSTRAINT IF EXISTS "exam_submissions_student_id_fkey";
ALTER TABLE "public"."exam_submissions"
  ADD CONSTRAINT "exam_submissions_student_id_fkey"
  FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Alter exam_assignments (student_id)
ALTER TABLE "public"."exam_assignments" DROP CONSTRAINT IF EXISTS "exam_assignments_student_id_fkey";
ALTER TABLE "public"."exam_assignments"
  ADD CONSTRAINT "exam_assignments_student_id_fkey"
  FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Alter exam_assignments (assigned_by) -> ON DELETE SET NULL to allow teacher deletion
ALTER TABLE "public"."exam_assignments" DROP CONSTRAINT IF EXISTS "exam_assignments_assigned_by_fkey";
ALTER TABLE "public"."exam_assignments"
  ADD CONSTRAINT "exam_assignments_assigned_by_fkey"
  FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
