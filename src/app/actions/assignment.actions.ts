'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

import { logAuditEventSafely } from '@/lib/audit';
import {
  getTeacherManagedStudentIds,
  requireAdminAndDb,
  requireActiveTeacherOrAdminAndDb,
} from '@/lib/supabase/adminAuth';
import { sendAssignmentEmail, buildExamRef } from '@/lib/notifications/email';
import { vietnamDayEndIso, vietnamDayStartIso } from '@/lib/exam/deadline';

type ExamType = 'listening' | 'reading' | 'writing' | 'speaking';

export interface Assignment {
  id: string;
  student_email: string;
  student_id: string | null;
  exam_type: ExamType;
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
  exam_label: string | null;
  due_date: string | null;
  note: string | null;
  assigned_by: string | null;
  assigned_at: string;
  assignment_email_sent_at?: string | null;
  due_soon_email_sent_at?: string | null;
  overdue_email_sent_at?: string | null;
  assigner_name?: string | null;
  assigner_email?: string | null;
}

export interface CreateAssignmentDTO {
  student_email: string;
  exam_type: ExamType;
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
  status?: string | null;
}

function revalidateAssignmentViews() {
  revalidatePath('/admin');
  revalidatePath('/admin/audit-logs');
  revalidatePath('/admin/assignments');
  revalidatePath('/admin/assignments/new');
  revalidatePath('/dashboard');
  revalidatePath('/teacher');
  revalidatePath('/teacher/assignments');
  revalidatePath('/teacher/assignments/new');
  revalidatePath('/teacher/students');
}

function assignmentBulkFilterAllowed(params: {
  student_email?: string | null;
  assigned_from?: string | null;
  assigned_to?: string | null;
}): boolean {
  if (params.student_email?.trim()) return true;
  if (params.assigned_from?.trim() || params.assigned_to?.trim()) return true;
  return false;
}

async function getStudentProfilesByEmails(db: SupabaseClient, emails: string[]) {
  const uniqueEmails = Array.from(new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean)));
  if (uniqueEmails.length === 0) return [];

  const { data, error } = await db
    .from('profiles')
    .select('id, email, full_name, role, status')
    .in('email', uniqueEmails);

  if (error) {
    throw new Error(`Lỗi lấy học viên: ${error.message}`);
  }

  return (data ?? []) as StudentProfile[];
}

function flattenAssignments(rows: Record<string, unknown>[]): Assignment[] {
  return rows.map((row) => {
    const profile = row.profiles as { full_name: string | null; email: string } | null;
    const { profiles: _profile, ...rest } = row;
    void _profile;
    return {
      ...(rest as unknown as Assignment),
      assigner_name: profile?.full_name ?? null,
      assigner_email: profile?.email ?? null,
    };
  });
}

async function sendAssignmentEmailsForRows(
  db: SupabaseClient,
  rows: Assignment[],
  assignerName: string | null,
) {
  for (const row of rows) {
    try {
      await sendAssignmentEmail({
        studentEmail: row.student_email,
        examType: row.exam_type,
        examRef: buildExamRef({
          examType: row.exam_type,
          serieId: row.serie_id,
          combinaisonId: row.combinaison_id,
          partieId: row.partie_id,
          examLabel: row.exam_label,
        }),
        dueDate: row.due_date,
        note: row.note,
        assignerName,
      });

      await db
        .from('exam_assignments')
        .update({ assignment_email_sent_at: new Date().toISOString() })
        .eq('id', row.id);
    } catch (error) {
      console.error('[assignment.actions] assignment email failed:', error);
    }
  }
}

async function createAssignmentsInternal(params: {
  studentEmails: string[];
  examConfig: Omit<CreateAssignmentDTO, 'student_email'>;
  actorId: string;
  actorName: string | null;
  teacherManagedStudentIds?: string[] | null;
}) {
  const ctx = await requireActiveTeacherOrAdminAndDb();
  const { db } = ctx;

  const students = await getStudentProfilesByEmails(db, params.studentEmails);
  const studentMap = new Map(students.map((student) => [student.email.toLowerCase(), student]));

  const rows = params.studentEmails.map((email) => {
    const normalizedEmail = email.trim().toLowerCase();
    const student = studentMap.get(normalizedEmail);
    if (!student || student.role !== 'student') {
      throw new Error(`Không tìm thấy học viên hợp lệ: ${normalizedEmail}`);
    }
    if (params.teacherManagedStudentIds && !params.teacherManagedStudentIds.includes(student.id)) {
      throw new Error(`Bạn không thể giao bài cho học viên ngoài lớp của mình: ${normalizedEmail}`);
    }

    return {
      student_email: normalizedEmail,
      student_id: student.id,
      exam_type: params.examConfig.exam_type,
      serie_id: params.examConfig.serie_id ?? null,
      combinaison_id: params.examConfig.combinaison_id ?? null,
      partie_id: params.examConfig.partie_id ?? null,
      exam_label: params.examConfig.exam_label ?? null,
      due_date: params.examConfig.due_date || null,
      note: params.examConfig.note || null,
      assigned_by: params.actorId,
    };
  });

  const { data, error } = await db
    .from('exam_assignments')
    .insert(rows)
    .select('id, student_email, student_id, exam_type, serie_id, combinaison_id, partie_id, exam_label, due_date, note, assigned_by, assigned_at');

  if (error) {
    throw new Error(`Lỗi gán bài: ${error.message}`);
  }

  const insertedRows = (data ?? []) as Assignment[];

  await logAuditEventSafely(db, {
    actorId: ctx.user.id,
    actorEmail: ctx.profile.email,
    actorName: ctx.profile.full_name,
    actorRole: ctx.profile.role,
    action: insertedRows.length > 1 ? 'assignment.bulk_create' : 'assignment.create',
    targetType: 'exam_assignment',
    targetId: insertedRows.length === 1 ? insertedRows[0].id : null,
    targetLabel:
      insertedRows.length === 1
        ? insertedRows[0].student_email
        : `${insertedRows.length} assignments`,
    metadata: {
      count: insertedRows.length,
      exam_type: params.examConfig.exam_type,
      serie_id: params.examConfig.serie_id ?? null,
      combinaison_id: params.examConfig.combinaison_id ?? null,
      partie_id: params.examConfig.partie_id ?? null,
      exam_label: params.examConfig.exam_label ?? null,
      due_date: params.examConfig.due_date ?? null,
      student_emails: insertedRows.map((row) => row.student_email),
    },
  });

  await sendAssignmentEmailsForRows(db, insertedRows, params.actorName);
  revalidateAssignmentViews();
  return insertedRows;
}

export async function getAssignments(filters?: {
  student_email?: string | null;
  assigned_from?: string | null;
  assigned_to?: string | null;
}): Promise<Assignment[]> {
  const { db } = await requireAdminAndDb();
  let query = db
    .from('exam_assignments')
    .select(`
      *,
      profiles!exam_assignments_assigned_by_fkey (
        full_name,
        email
      )
    `)
    .order('assigned_at', { ascending: false });

  if (filters?.student_email?.trim()) {
    query = query.eq('student_email', filters.student_email.trim().toLowerCase());
  }
  const fromIso = vietnamDayStartIso(filters?.assigned_from ?? undefined);
  if (fromIso) {
    query = query.gte('assigned_at', fromIso);
  }
  const toIso = vietnamDayEndIso(filters?.assigned_to ?? undefined);
  if (toIso) {
    query = query.lte('assigned_at', toIso);
  }

  const hasFilters =
    Boolean(filters?.student_email?.trim()) ||
    Boolean(filters?.assigned_from?.trim()) ||
    Boolean(filters?.assigned_to?.trim());
  if (hasFilters) {
    query = query.limit(500);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi lấy assignments: ${error.message}`);
  return flattenAssignments((data ?? []) as Record<string, unknown>[]);
}

export async function getTeacherAssignments(filters?: {
  student_email?: string | null;
  assigned_from?: string | null;
  assigned_to?: string | null;
}): Promise<Assignment[]> {
  const { db, user } = await requireActiveTeacherOrAdminAndDb();

  const managedIds = await getTeacherManagedStudentIds(db, user.id);
  if (managedIds.length === 0) return [];

  const { data: students, error: studentError } = await db
    .from('profiles')
    .select('email')
    .in('id', managedIds);

  if (studentError) {
    throw new Error(`Lỗi lấy danh sách lớp: ${studentError.message}`);
  }

  const emails = (students ?? []).map((student: { email: string }) => student.email);
  if (emails.length === 0) return [];

  let query = db
    .from('exam_assignments')
    .select(`
      *,
      profiles!exam_assignments_assigned_by_fkey (
        full_name,
        email
      )
    `)
    .in('student_email', emails)
    .order('assigned_at', { ascending: false })
    .limit(500);

  if (filters?.student_email?.trim()) {
    query = query.eq('student_email', filters.student_email.trim().toLowerCase());
  }
  const fromIso = vietnamDayStartIso(filters?.assigned_from ?? undefined);
  if (fromIso) query = query.gte('assigned_at', fromIso);
  const toIso = vietnamDayEndIso(filters?.assigned_to ?? undefined);
  if (toIso) query = query.lte('assigned_at', toIso);

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi lấy assignments của giáo viên: ${error.message}`);

  return flattenAssignments((data ?? []) as Record<string, unknown>[]);
}

export async function createAssignment(dto: CreateAssignmentDTO): Promise<void> {
  const ctx = await requireAdminAndDb();
  await createAssignmentsInternal({
    studentEmails: [dto.student_email],
    examConfig: dto,
    actorId: ctx.user.id,
    actorName: ctx.profile.full_name,
  });
}

export async function bulkCreateAssignments(
  student_emails: string[],
  exam_config: Omit<CreateAssignmentDTO, 'student_email'>,
): Promise<{ success: number; failed: string[] }> {
  const ctx = await requireAdminAndDb();
  const rows = await createAssignmentsInternal({
    studentEmails: student_emails,
    examConfig: exam_config,
    actorId: ctx.user.id,
    actorName: ctx.profile.full_name,
  });
  return { success: rows.length, failed: [] };
}

export async function createTeacherAssignment(dto: CreateAssignmentDTO): Promise<void> {
  const ctx = await requireActiveTeacherOrAdminAndDb();
  const managedIds =
    ctx.profile.role === 'teacher' ? await getTeacherManagedStudentIds(ctx.db, ctx.user.id) : null;
  await createAssignmentsInternal({
    studentEmails: [dto.student_email],
    examConfig: dto,
    actorId: ctx.user.id,
    actorName: ctx.profile.full_name,
    teacherManagedStudentIds: managedIds,
  });
}

export async function bulkCreateTeacherAssignments(
  student_emails: string[],
  exam_config: Omit<CreateAssignmentDTO, 'student_email'>,
): Promise<{ success: number; failed: string[] }> {
  const ctx = await requireActiveTeacherOrAdminAndDb();
  const managedIds =
    ctx.profile.role === 'teacher' ? await getTeacherManagedStudentIds(ctx.db, ctx.user.id) : null;
  const rows = await createAssignmentsInternal({
    studentEmails: student_emails,
    examConfig: exam_config,
    actorId: ctx.user.id,
    actorName: ctx.profile.full_name,
    teacherManagedStudentIds: managedIds,
  });
  return { success: rows.length, failed: [] };
}

export async function deleteAssignment(id: string): Promise<void> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;
  const { data: existing, error: fetchError } = await db
    .from('exam_assignments')
    .select('id, student_email, exam_type, serie_id, combinaison_id, partie_id, exam_label')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) throw new Error(`Lỗi lấy assignment cần xóa: ${fetchError.message}`);

  const { error } = await db.from('exam_assignments').delete().eq('id', id);
  if (error) throw new Error(`Lỗi xóa assignment: ${error.message}`);

  await logAuditEventSafely(db, {
    actorId: ctx.user.id,
    actorEmail: ctx.profile.email,
    actorName: ctx.profile.full_name,
    actorRole: ctx.profile.role,
    action: 'assignment.delete',
    targetType: 'exam_assignment',
    targetId: id,
    targetLabel: existing?.student_email ?? id,
    metadata: {
      student_email: existing?.student_email ?? null,
      exam_type: existing?.exam_type ?? null,
      serie_id: existing?.serie_id ?? null,
      combinaison_id: existing?.combinaison_id ?? null,
      partie_id: existing?.partie_id ?? null,
      exam_label: existing?.exam_label ?? null,
    },
  });

  revalidateAssignmentViews();
}

export async function deleteAssignmentsMatching(params: {
  student_email?: string | null;
  assigned_from?: string | null;
  assigned_to?: string | null;
}): Promise<{ deleted: number }> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;
  if (!assignmentBulkFilterAllowed(params)) {
    throw new Error('FILTER_REQUIRED');
  }

  let countQ = db.from('exam_assignments').select('id', { count: 'exact', head: true });
  if (params.student_email?.trim()) {
    countQ = countQ.eq('student_email', params.student_email.trim().toLowerCase());
  }
  const fromIso = vietnamDayStartIso(params.assigned_from ?? undefined);
  if (fromIso) countQ = countQ.gte('assigned_at', fromIso);
  const toIso = vietnamDayEndIso(params.assigned_to ?? undefined);
  if (toIso) countQ = countQ.lte('assigned_at', toIso);

  const { count, error: countErr } = await countQ;
  if (countErr) throw new Error(`Lỗi đếm bài gán: ${countErr.message}`);
  const total = count ?? 0;
  if (total === 0) return { deleted: 0 };

  let deleteQ = db.from('exam_assignments').delete();
  if (params.student_email?.trim()) {
    deleteQ = deleteQ.eq('student_email', params.student_email.trim().toLowerCase());
  }
  if (fromIso) deleteQ = deleteQ.gte('assigned_at', fromIso);
  if (toIso) deleteQ = deleteQ.lte('assigned_at', toIso);

  const { error: deleteError } = await deleteQ;
  if (deleteError) throw new Error(`Lỗi xóa bài gán: ${deleteError.message}`);

  await logAuditEventSafely(db, {
    actorId: ctx.user.id,
    actorEmail: ctx.profile.email,
    actorName: ctx.profile.full_name,
    actorRole: ctx.profile.role,
    action: 'assignment.bulk_delete',
    targetType: 'exam_assignment',
    targetLabel: `${total} assignments`,
    metadata: {
      deleted: total,
      filters: {
        student_email: params.student_email?.trim().toLowerCase() || null,
        assigned_from: params.assigned_from ?? null,
        assigned_to: params.assigned_to ?? null,
      },
    },
  });

  revalidateAssignmentViews();
  return { deleted: total };
}

export async function getStudents(): Promise<StudentProfile[]> {
  const { db } = await requireAdminAndDb();
  const { data, error } = await db
    .from('profiles')
    .select('id, email, full_name, role, status')
    .eq('role', 'student')
    .order('email');

  if (error) throw new Error(`Lỗi lấy danh sách học viên: ${error.message}`);
  return (data ?? []) as StudentProfile[];
}

export async function getTeacherAssignableStudents(): Promise<StudentProfile[]> {
  const { db, user, profile } = await requireActiveTeacherOrAdminAndDb();
  if (profile.role === 'admin') {
    return getStudents();
  }

  const studentIds = await getTeacherManagedStudentIds(db, user.id);
  if (studentIds.length === 0) return [];

  const { data, error } = await db
    .from('profiles')
    .select('id, email, full_name, role, status')
    .in('id', studentIds)
    .eq('role', 'student')
    .order('email');

  if (error) throw new Error(`Lỗi lấy danh sách học viên của giáo viên: ${error.message}`);
  return (data ?? []) as StudentProfile[];
}
