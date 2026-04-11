'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// --- Types ---

export interface StudentWithStats {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  assignments_count: number;
  submissions_count: number;
}

// --- List all students with stats ---

export async function getStudentsList(): Promise<StudentWithStats[]> {
  const supabase = await createClient();

  // Get all profiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Lỗi lấy danh sách: ${error.message}`);

  // Get assignment counts per student
  const { data: assignmentCounts } = await supabase
    .from('exam_assignments')
    .select('student_email');

  // Get submission counts per student
  const { data: submissionCounts } = await supabase
    .from('exam_submissions')
    .select('student_email');

  // Build count maps
  const assignMap = new Map<string, number>();
  (assignmentCounts || []).forEach((a) => {
    const email = a.student_email as string;
    assignMap.set(email, (assignMap.get(email) || 0) + 1);
  });

  const submitMap = new Map<string, number>();
  (submissionCounts || []).forEach((s) => {
    const email = s.student_email as string;
    submitMap.set(email, (submitMap.get(email) || 0) + 1);
  });

  return (profiles || []).map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
    assignments_count: assignMap.get(p.email) || 0,
    submissions_count: submitMap.get(p.email) || 0,
  }));
}

// --- Update student role ---

export async function updateStudentRole(
  id: string,
  role: 'admin' | 'student',
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id);

  if (error) throw new Error(`Lỗi cập nhật role: ${error.message}`);

  revalidatePath('/admin/students');
}
