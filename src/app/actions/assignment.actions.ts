'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// --- Types ---

export interface Assignment {
  id: string;
  student_email: string;
  student_id: string | null;
  exam_type: 'listening' | 'reading' | 'writing' | 'speaking';
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
  exam_label: string | null;
  due_date: string | null;
  note: string | null;
  assigned_by: string | null;
  assigned_at: string;
  // Joined fields
  assigner_name?: string | null;
  assigner_email?: string | null;
}

export interface CreateAssignmentDTO {
  student_email: string;
  exam_type: 'listening' | 'reading' | 'writing' | 'speaking';
  serie_id?: number | null;
  combinaison_id?: number | null;
  partie_id?: number | null;
  exam_label?: string | null;
  due_date?: string | null;
  note?: string | null;
}

export interface StudentProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

// --- List all assignments (admin) ---

export async function getAssignments(): Promise<Assignment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('exam_assignments')
    .select(`
      *,
      profiles!exam_assignments_assigned_by_fkey (
        full_name,
        email
      )
    `)
    .order('assigned_at', { ascending: false });

  if (error) throw new Error(`Lỗi lấy assignments: ${error.message}`);

  // Flatten joined profile data
  return (data || []).map((row: Record<string, unknown>) => {
    const profile = row.profiles as { full_name: string | null; email: string } | null;
    const { profiles: _p, ...rest } = row;
    void _p;
    return {
      ...rest,
      assigner_name: profile?.full_name ?? null,
      assigner_email: profile?.email ?? null,
    } as unknown as Assignment;
  });
}

// --- Create assignment ---

export async function createAssignment(dto: CreateAssignmentDTO): Promise<void> {
  const supabase = await createClient();

  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { error } = await supabase
    .from('exam_assignments')
    .insert([{
      student_email: dto.student_email,
      exam_type: dto.exam_type,
      serie_id: dto.serie_id ?? null,
      combinaison_id: dto.combinaison_id ?? null,
      partie_id: dto.partie_id ?? null,
      exam_label: dto.exam_label ?? null,
      due_date: dto.due_date || null,
      note: dto.note || null,
      assigned_by: user.id,
    }]);

  if (error) throw new Error(`Lỗi gán bài: ${error.message}`);

  revalidatePath('/admin/assignments');
  revalidatePath('/dashboard');
}

// --- Delete assignment ---

export async function deleteAssignment(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('exam_assignments')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Lỗi xóa assignment: ${error.message}`);

  revalidatePath('/admin/assignments');
  revalidatePath('/dashboard');
}

// --- Get all students (for the dropdown) ---

export async function getStudents(): Promise<StudentProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .order('email');

  if (error) throw new Error(`Lỗi lấy danh sách học viên: ${error.message}`);
  return data || [];
}
