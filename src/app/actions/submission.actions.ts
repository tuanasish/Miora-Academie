'use server'

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// --- Types ---

export interface SubmissionRow {
  id: string;
  student_email: string;
  exam_type: 'listening' | 'reading' | 'writing' | 'speaking';
  submitted_at: string;
  score: number | null;
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
  time_spent_seconds: number | null;
  word_counts: { t1: number; t2: number; t3: number } | null;
  // Detail fields (only in getSubmission)
  answers?: Record<string, string> | null;
  writing_task1?: string | null;
  writing_task2?: string | null;
  writing_task3?: string | null;
  speaking_task1_video_url?: string | null;
  speaking_task2_video_url?: string | null;
  task_times?: { t1: number; t2: number; t3: number } | null;
  notes?: string | null;
  // Grading fields
  admin_score?: number | null;
  admin_feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
}

// --- List submissions with optional filters ---

export async function getSubmissions(filters?: {
  exam_type?: string;
  student_email?: string;
}): Promise<SubmissionRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from('exam_submissions')
    .select('id, student_email, exam_type, submitted_at, score, serie_id, combinaison_id, partie_id, time_spent_seconds, word_counts, admin_score, graded_at')
    .order('submitted_at', { ascending: false })
    .limit(200);

  if (filters?.exam_type && filters.exam_type !== 'all') {
    query = query.eq('exam_type', filters.exam_type);
  }

  if (filters?.student_email) {
    query = query.eq('student_email', filters.student_email);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi lấy bài nộp: ${error.message}`);

  return (data || []) as SubmissionRow[];
}

// --- Get single submission detail ---

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exam_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Lỗi lấy chi tiết bài nộp: ${error.message}`);

  return data as SubmissionRow | null;
}

// --- Admin: Grade a submission ---

export async function gradeSubmission(
  id: string,
  adminScore: number,
  adminFeedback: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('exam_submissions')
    .update({
      admin_score: adminScore,
      admin_feedback: adminFeedback,
      graded_at: new Date().toISOString(),
      graded_by: user?.email ?? 'admin',
    })
    .eq('id', id);

  if (error) throw new Error(`Lỗi chấm điểm: ${error.message}`);

  revalidatePath(`/admin/submissions/${id}`);
  revalidatePath('/admin/submissions');
}
