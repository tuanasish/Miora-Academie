'use server'

import { createClient } from '@/lib/supabase/server';

export interface StudentStreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

export interface MyTeacherInfo {
  id: string;
  email: string;
  full_name: string | null;
}

export async function getMyStreak(): Promise<StudentStreakData> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { current_streak: 0, longest_streak: 0, last_activity_date: null };

  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak, highest_streak, last_activity_date')
    .eq('student_id', user.id)
    .maybeSingle();

  if (error || !data) return { current_streak: 0, longest_streak: 0, last_activity_date: null };

  return {
    current_streak: data.current_streak ?? 0,
    longest_streak: data.highest_streak ?? 0,
    last_activity_date: data.last_activity_date ?? null,
  };
}

export async function getMyTeacher(): Promise<MyTeacherInfo | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Tìm teacher_id từ bảng teacher_students
  const { data: mapping } = await supabase
    .from('teacher_students')
    .select('teacher_id')
    .eq('student_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!mapping) return null;

  // Lấy thông tin teacher
  const { data: teacher } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', mapping.teacher_id)
    .maybeSingle();

  return teacher ?? null;
}
