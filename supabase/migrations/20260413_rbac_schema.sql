-- 1. Update profiles table
DO $$
DECLARE
    con_name text;
BEGIN
    SELECT conname INTO con_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%role%';
    
    IF con_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || con_name;
    END IF;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role = ANY (ARRAY['admin'::text, 'teacher'::text, 'student'::text]));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text]));

-- 2. Create teacher_students table
CREATE TABLE IF NOT EXISTS public.teacher_students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(teacher_id, student_id)
);
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

-- 3. Create streaks table
CREATE TABLE IF NOT EXISTS public.streaks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  current_streak integer NOT NULL DEFAULT 0,
  highest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- 4. Update the handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student'),
    CASE 
      WHEN (new.raw_user_meta_data->>'role') = 'teacher' THEN 'pending'
      ELSE 'active'
    END
  );
  
  -- Create streak if student
  IF COALESCE(new.raw_user_meta_data->>'role', 'student') = 'student' THEN
    INSERT INTO public.streaks (student_id) VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
