'use server';

import { isDueDateOverdue } from '@/lib/exam/deadline';
import { requireActiveTeacherOrAdminAndDb, getTeacherManagedStudentIds } from '@/lib/supabase/adminAuth';
import { gradeSubmission, type SubmissionRow } from '@/app/actions/submission.actions';

export interface TeacherStudentWithStats {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  current_streak: number;
  highest_streak: number;
  last_activity: string | null;
  assigned_count: number;
  submitted_count: number;
  graded_count: number;
  overdue_count: number;
}

function assignmentKey(input: {
  exam_type: string;
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
}) {
  if (input.exam_type === 'writing') return `${input.exam_type}:${input.combinaison_id ?? 'na'}`;
  if (input.exam_type === 'speaking') return `${input.exam_type}:${input.partie_id ?? 'na'}`;
  return `${input.exam_type}:${input.serie_id ?? 'na'}`;
}

async function getTeacherScope() {
  const ctx = await requireActiveTeacherOrAdminAndDb();

  if (ctx.profile.role === 'admin') {
    const { data: students, error } = await ctx.db
      .from('profiles')
      .select('id')
      .eq('role', 'student');

    if (error) throw new Error(`Lỗi lấy học viên: ${error.message}`);
    return { ...ctx, studentIds: (students ?? []).map((row: { id: string }) => row.id) };
  }

  const studentIds = await getTeacherManagedStudentIds(ctx.db, ctx.user.id);
  return { ...ctx, studentIds };
}

export async function getTeacherStudents(): Promise<TeacherStudentWithStats[]> {
  const { db, studentIds } = await getTeacherScope();
  if (studentIds.length === 0) return [];

  const [profilesRes, streaksRes, assignmentsRes, submissionsRes] = await Promise.all([
    db.from('profiles').select('id, email, full_name, status, role').in('id', studentIds),
    db.from('streaks').select('student_id, current_streak, highest_streak, last_activity_date').in('student_id', studentIds),
    db.from('exam_assignments').select('student_email, exam_type, serie_id, combinaison_id, partie_id, due_date'),
    db.from('exam_submissions').select('student_email, exam_type, serie_id, combinaison_id, partie_id, graded_at'),
  ]);

  if (profilesRes.error) throw new Error(`Lỗi lấy profiles: ${profilesRes.error.message}`);
  if (streaksRes.error) throw new Error(`Lỗi lấy streaks: ${streaksRes.error.message}`);
  if (assignmentsRes.error) throw new Error(`Lỗi lấy assignments: ${assignmentsRes.error.message}`);
  if (submissionsRes.error) throw new Error(`Lỗi lấy submissions: ${submissionsRes.error.message}`);

  const profiles = (profilesRes.data ?? []).filter((profile) => profile.role === 'student');
  const profileEmails = new Set(profiles.map((profile) => profile.email));

  const streakMap = new Map(
    (streaksRes.data ?? []).map((row: { student_id: string; current_streak: number; highest_streak: number; last_activity_date: string | null }) => [
      row.student_id,
      row,
    ]),
  );

  const submissionsByEmail = new Map<string, Set<string>>();
  const submittedCountMap = new Map<string, number>();
  const gradedCountMap = new Map<string, number>();
  for (const row of submissionsRes.data ?? []) {
    if (!profileEmails.has(row.student_email)) continue;
    const key = assignmentKey(row);
    const set = submissionsByEmail.get(row.student_email) ?? new Set<string>();
    set.add(key);
    submissionsByEmail.set(row.student_email, set);
    submittedCountMap.set(row.student_email, (submittedCountMap.get(row.student_email) ?? 0) + 1);
    if (row.graded_at) {
      gradedCountMap.set(row.student_email, (gradedCountMap.get(row.student_email) ?? 0) + 1);
    }
  }

  const assignedCountMap = new Map<string, number>();
  const overdueCountMap = new Map<string, number>();
  for (const row of assignmentsRes.data ?? []) {
    if (!profileEmails.has(row.student_email)) continue;
    assignedCountMap.set(row.student_email, (assignedCountMap.get(row.student_email) ?? 0) + 1);
    const submitted = submissionsByEmail.get(row.student_email);
    const isSubmitted = submitted?.has(assignmentKey(row)) ?? false;
    if (!isSubmitted && isDueDateOverdue(row.due_date)) {
      overdueCountMap.set(row.student_email, (overdueCountMap.get(row.student_email) ?? 0) + 1);
    }
  }

  return profiles.map((profile) => {
    const streak = streakMap.get(profile.id);
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      status: profile.status ?? 'active',
      current_streak: streak?.current_streak ?? 0,
      highest_streak: streak?.highest_streak ?? 0,
      last_activity: streak?.last_activity_date ?? null,
      assigned_count: assignedCountMap.get(profile.email) ?? 0,
      submitted_count: submittedCountMap.get(profile.email) ?? 0,
      graded_count: gradedCountMap.get(profile.email) ?? 0,
      overdue_count: overdueCountMap.get(profile.email) ?? 0,
    };
  });
}

export async function getTeacherSubmissions(filters?: {
  exam_type?: string;
  student_email?: string;
  submitted_from?: string | null;
  submitted_to?: string | null;
}): Promise<SubmissionRow[]> {
  const { db, studentIds } = await getTeacherScope();
  if (studentIds.length === 0) return [];

  const { data: students, error: studentError } = await db
    .from('profiles')
    .select('email')
    .in('id', studentIds);

  if (studentError) throw new Error(`Lỗi lấy email học viên: ${studentError.message}`);

  const studentEmails = (students ?? []).map((row: { email: string }) => row.email);
  if (studentEmails.length === 0) return [];

  let query = db
    .from('exam_submissions')
    .select('id, student_email, exam_type, submitted_at, score, serie_id, combinaison_id, partie_id, time_spent_seconds, word_counts, admin_score, admin_feedback, graded_at, graded_by, teacher_viewed_at')
    .in('student_email', studentEmails)
    .order('submitted_at', { ascending: false })
    .limit(500);

  if (filters?.exam_type && filters.exam_type !== 'all') {
    query = query.eq('exam_type', filters.exam_type);
  }
  if (filters?.student_email?.trim()) {
    query = query.eq('student_email', filters.student_email.trim().toLowerCase());
  }
  if (filters?.submitted_from?.trim()) {
    query = query.gte('submitted_at', `${filters.submitted_from.trim()}T00:00:00.000+07:00`);
  }
  if (filters?.submitted_to?.trim()) {
    query = query.lte('submitted_at', `${filters.submitted_to.trim()}T23:59:59.999+07:00`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi lấy bài nộp của giáo viên: ${error.message}`);
  return (data ?? []) as SubmissionRow[];
}

export async function gradeTeacherSubmission(
  id: string,
  adminScore: number,
  adminFeedback: string,
  notes?: string | null,
) {
  return gradeSubmission(id, adminScore, adminFeedback, notes);
}

export async function getMyStudents() {
  return getTeacherStudents();
}

export async function getMySubmissions() {
  return getTeacherSubmissions();
}
