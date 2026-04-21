'use server';

import { revalidatePath } from 'next/cache';

import { logAuditEventSafely } from '@/lib/audit';
import {
  requireAdminAndDb,
  requireActiveStudentAndDb,
  requireActiveTeacherOrAdminAndDb,
  requireOwnedStudentResource,
} from '@/lib/supabase/adminAuth';
import { sendFeedbackEmail, buildExamRef } from '@/lib/notifications/email';
import { vietnamDayEndIso, vietnamDayStartIso } from '@/lib/exam/deadline';
import { ADMIN_GRADE_MAX } from '@/lib/exam/adminGrading';
import { touchLearningActivity } from '@/app/actions/streak.actions';
import {
  parseWritingReviewMarkup,
  serializeWritingReviewMarkupV2,
  type Suggestion,
  type WritingTaskKey,
  type WritingTasksSuggestions,
} from '@/lib/exam/writingReview';
import {
  respondToSuggestion,
  respondToAllSuggestions as respondToAll,
} from '@/lib/exam/suggestions';
import { generateGeminiWritingSuggestions } from '@/lib/ai/geminiWriting';

export interface SubmissionRow {
  id: string;
  student_email: string;
  student_id?: string | null;
  exam_type: 'listening' | 'reading' | 'writing' | 'speaking';
  submitted_at: string;
  score: number | null;
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
  time_spent_seconds: number | null;
  word_counts: { t1: number; t2: number; t3: number } | null;
  answers?: Record<string, string> | null;
  writing_task1?: string | null;
  writing_task2?: string | null;
  writing_task3?: string | null;
  speaking_task1_video_url?: string | null;
  speaking_task2_video_url?: string | null;
  task_times?: { t1: number; t2: number; t3: number } | null;
  notes?: string | null;
  admin_score?: number | null;
  admin_feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
  graded_email_sent_at?: string | null;
  student_feedback_viewed_at?: string | null;
  teacher_viewed_at?: string | null;
}

async function fetchSubmissionById(
  db: Awaited<ReturnType<typeof requireAdminAndDb>>['db'],
  id: string,
): Promise<SubmissionRow | null> {
  const { data, error } = await db
    .from('exam_submissions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Lỗi lấy chi tiết bài nộp: ${error.message}`);
  }

  return data as SubmissionRow | null;
}

function submissionBulkFilterAllowed(params: {
  student_email?: string | null;
  submitted_from?: string | null;
  submitted_to?: string | null;
}): boolean {
  if (params.student_email?.trim()) return true;
  if (params.submitted_from?.trim() || params.submitted_to?.trim()) return true;
  return false;
}

function revalidateSubmissionViews(id?: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/audit-logs');
  revalidatePath('/dashboard');
  revalidatePath('/admin/submissions');
  revalidatePath('/teacher/submissions');
  if (id) {
    revalidatePath(`/admin/submissions/${id}`);
    revalidatePath(`/teacher/submissions/${id}`);
    revalidatePath(`/dashboard/submissions/${id}`);
  }
}

export async function getSubmissions(filters?: {
  exam_type?: string;
  student_email?: string;
  submitted_from?: string | null;
  submitted_to?: string | null;
}): Promise<SubmissionRow[]> {
  const { db } = await requireAdminAndDb();

  const hasFilters =
    Boolean(filters?.exam_type && filters.exam_type !== 'all') ||
    Boolean(filters?.student_email?.trim()) ||
    Boolean(filters?.submitted_from?.trim()) ||
    Boolean(filters?.submitted_to?.trim());

  let query = db
    .from('exam_submissions')
    .select('id, student_email, student_id, exam_type, submitted_at, score, serie_id, combinaison_id, partie_id, time_spent_seconds, word_counts, admin_score, admin_feedback, graded_at, graded_by, graded_email_sent_at, student_feedback_viewed_at, teacher_viewed_at')
    .order('submitted_at', { ascending: false })
    .limit(hasFilters ? 500 : 200);

  if (filters?.exam_type && filters.exam_type !== 'all') {
    query = query.eq('exam_type', filters.exam_type);
  }
  if (filters?.student_email?.trim()) {
    query = query.eq('student_email', filters.student_email.trim().toLowerCase());
  }
  const fromIso = vietnamDayStartIso(filters?.submitted_from ?? undefined);
  if (fromIso) query = query.gte('submitted_at', fromIso);
  const toIso = vietnamDayEndIso(filters?.submitted_to ?? undefined);
  if (toIso) query = query.lte('submitted_at', toIso);

  const { data, error } = await query;
  if (error) throw new Error(`Lỗi lấy bài nộp: ${error.message}`);
  return (data ?? []) as SubmissionRow[];
}

export async function getSubmission(id: string): Promise<SubmissionRow | null> {
  const { db } = await requireAdminAndDb();
  return fetchSubmissionById(db, id);
}

export async function getTeacherAccessibleSubmission(id: string): Promise<SubmissionRow | null> {
  const ctx = await requireActiveTeacherOrAdminAndDb();
  const sub = await fetchSubmissionById(ctx.db, id);
  if (!sub) return null;
  if (ctx.profile.role === 'teacher') {
    try {
      await requireOwnedStudentResource({ studentEmail: sub.student_email });
    } catch {
      return null;
    }
  }
  return sub;
}

export async function getSubmissionIfOwner(id: string): Promise<SubmissionRow | null> {
  const { db, user } = await requireActiveStudentAndDb();
  const sub = await fetchSubmissionById(db, id);
  if (!sub) return null;

  const matchesStudentId = sub.student_id && sub.student_id === user.id;
  const matchesEmail = sub.student_email === user.email;
  if (!matchesStudentId && !matchesEmail) {
    return null;
  }

  return sub;
}

export async function deleteSubmission(id: string): Promise<void> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;
  const existing = await fetchSubmissionById(db, id);
  const { error } = await db.from('exam_submissions').delete().eq('id', id);
  if (error) throw new Error(`Lỗi xóa bài nộp: ${error.message}`);

  await logAuditEventSafely(db, {
    actorId: ctx.user.id,
    actorEmail: ctx.profile.email,
    actorName: ctx.profile.full_name,
    actorRole: ctx.profile.role,
    action: 'submission.delete',
    targetType: 'exam_submission',
    targetId: id,
    targetLabel: existing?.student_email ?? id,
    metadata: existing
      ? {
          student_email: existing.student_email,
          exam_type: existing.exam_type,
          serie_id: existing.serie_id,
          combinaison_id: existing.combinaison_id,
          partie_id: existing.partie_id,
          submitted_at: existing.submitted_at,
        }
      : {},
  });

  revalidateSubmissionViews(id);
}

export async function deleteSubmissionsMatching(params: {
  student_email?: string | null;
  submitted_from?: string | null;
  submitted_to?: string | null;
  exam_type?: string | null;
}): Promise<{ deleted: number }> {
  const ctx = await requireAdminAndDb();
  const { db } = ctx;
  if (!submissionBulkFilterAllowed(params)) {
    throw new Error('FILTER_REQUIRED');
  }

  let countQ = db.from('exam_submissions').select('id', { count: 'exact', head: true });
  if (params.student_email?.trim()) {
    countQ = countQ.eq('student_email', params.student_email.trim().toLowerCase());
  }
  if (params.exam_type && params.exam_type !== 'all') {
    countQ = countQ.eq('exam_type', params.exam_type);
  }
  const fromIso = vietnamDayStartIso(params.submitted_from ?? undefined);
  if (fromIso) countQ = countQ.gte('submitted_at', fromIso);
  const toIso = vietnamDayEndIso(params.submitted_to ?? undefined);
  if (toIso) countQ = countQ.lte('submitted_at', toIso);

  const { count, error: countErr } = await countQ;
  if (countErr) throw new Error(`Lỗi đếm bài nộp: ${countErr.message}`);
  const total = count ?? 0;
  if (total === 0) return { deleted: 0 };

  let deleteQ = db.from('exam_submissions').delete();
  if (params.student_email?.trim()) {
    deleteQ = deleteQ.eq('student_email', params.student_email.trim().toLowerCase());
  }
  if (params.exam_type && params.exam_type !== 'all') {
    deleteQ = deleteQ.eq('exam_type', params.exam_type);
  }
  if (fromIso) deleteQ = deleteQ.gte('submitted_at', fromIso);
  if (toIso) deleteQ = deleteQ.lte('submitted_at', toIso);

  const { error: deleteError } = await deleteQ;
  if (deleteError) throw new Error(`Lỗi xóa bài nộp: ${deleteError.message}`);

  await logAuditEventSafely(db, {
    actorId: ctx.user.id,
    actorEmail: ctx.profile.email,
    actorName: ctx.profile.full_name,
    actorRole: ctx.profile.role,
    action: 'submission.bulk_delete',
    targetType: 'exam_submission',
    targetLabel: `${total} submissions`,
    metadata: {
      deleted: total,
      filters: {
        student_email: params.student_email?.trim().toLowerCase() || null,
        submitted_from: params.submitted_from ?? null,
        submitted_to: params.submitted_to ?? null,
        exam_type: params.exam_type ?? null,
      },
    },
  });

  revalidateSubmissionViews();
  return { deleted: total };
}

export async function gradeSubmission(
  id: string,
  adminScore: number,
  adminFeedback: string,
  notes?: string | null,
): Promise<void> {
  if (!Number.isFinite(adminScore) || adminScore < 0 || adminScore > ADMIN_GRADE_MAX) {
    throw new Error(`Điểm admin phải nằm trong khoảng 0-${ADMIN_GRADE_MAX}.`);
  }

  const ctx = await requireActiveTeacherOrAdminAndDb();
  const sub = await fetchSubmissionById(ctx.db, id);
  if (!sub) throw new Error('SAVE_FAILED');

  if (ctx.profile.role === 'teacher') {
    await requireOwnedStudentResource({ studentEmail: sub.student_email });
  }

  const gradingUpdates: {
    admin_score: number;
    admin_feedback: string;
    graded_at: string;
    graded_by: string;
    notes?: string | null;
  } = {
    admin_score: adminScore,
    admin_feedback: adminFeedback,
    graded_at: new Date().toISOString(),
    graded_by: ctx.profile.full_name || ctx.user.email || ctx.profile.role,
  };

  if (notes !== undefined) {
    gradingUpdates.notes = notes;
  }

  const { data: updatedRow, error } = await ctx.db
    .from('exam_submissions')
    .update(gradingUpdates)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error || !updatedRow) {
    throw new Error('SAVE_FAILED');
  }

  await logAuditEventSafely(ctx.db, {
    actorId: ctx.user.id,
    actorEmail: ctx.profile.email,
    actorName: ctx.profile.full_name,
    actorRole: ctx.profile.role,
    action: 'submission.grade',
    targetType: 'exam_submission',
    targetId: id,
    targetLabel: sub.student_email,
    metadata: {
      student_email: sub.student_email,
      exam_type: sub.exam_type,
      previous_admin_score: sub.admin_score ?? null,
      new_admin_score: adminScore,
      previous_feedback_present: Boolean(sub.admin_feedback),
      new_feedback_present: Boolean(adminFeedback.trim()),
      notes_updated: notes !== undefined,
    },
  });

  if (!sub.graded_email_sent_at) {
    try {
      await sendFeedbackEmail({
        studentEmail: sub.student_email,
        examType: sub.exam_type,
        examRef: buildExamRef({
          examType: sub.exam_type,
          serieId: sub.serie_id,
          combinaisonId: sub.combinaison_id,
          partieId: sub.partie_id,
        }),
        feedback: adminFeedback,
      });

      await ctx.db
        .from('exam_submissions')
        .update({ graded_email_sent_at: new Date().toISOString() })
        .eq('id', id);
    } catch (notifyError) {
      console.error('[submission.actions] feedback email failed:', notifyError);
    }
  }

  revalidateSubmissionViews(id);
}

export async function markSubmissionFeedbackViewed(id: string): Promise<boolean> {
  const { db, user } = await requireActiveStudentAndDb();
  const sub = await fetchSubmissionById(db, id);
  if (!sub) return false;

  const matchesStudentId = sub.student_id && sub.student_id === user.id;
  const matchesEmail = sub.student_email === user.email;
  if (!matchesStudentId && !matchesEmail) return false;
  if (!sub.graded_at && !sub.admin_feedback) return false;
  if (sub.student_feedback_viewed_at) return false;

  const now = new Date().toISOString();
  const { error } = await db
    .from('exam_submissions')
    .update({ student_feedback_viewed_at: now })
    .eq('id', id);

  if (error) {
    throw new Error(`Không thể đánh dấu feedback đã xem: ${error.message}`);
  }

  await touchLearningActivity(user.id, 'feedback_view');
  return true;
}

export async function markSubmissionTeacherViewed(id: string): Promise<boolean> {
  const ctx = await requireActiveTeacherOrAdminAndDb();
  const sub = await fetchSubmissionById(ctx.db as Awaited<ReturnType<typeof requireAdminAndDb>>['db'], id);
  if (!sub) return false;

  if (ctx.profile.role === 'teacher') {
    try {
      await requireOwnedStudentResource({ studentEmail: sub.student_email });
    } catch {
      return false;
    }
  }

  if (sub.teacher_viewed_at) return false;

  const now = new Date().toISOString();
  const { error } = await ctx.db
    .from('exam_submissions')
    .update({ teacher_viewed_at: now })
    .eq('id', id);
  if (error) throw new Error(`Lỗi cập nhật teacher_viewed_at: ${error.message}`);
  return true;
}

export async function handleSuggestionResponse(
  id: string,
  taskKey: 't1' | 't2' | 't3',
  suggestionId: string,
  action: 'accept' | 'reject',
): Promise<{ success: true; newHtml: string } | { error: string }> {
  try {
    const { db, user } = await requireActiveStudentAndDb();
    const sub = await fetchSubmissionById(db, id);
    
    if (!sub) return { error: 'Không tìm thấy bài nộp' };
    if (sub.student_id !== user.id && sub.student_email !== user.email) {
      return { error: 'Không có quyền truy cập' };
    }
    if (!sub.notes) return { error: 'Không có đề xuất nào để xử lý' };

    const markup = parseWritingReviewMarkup(sub.notes);
    if (!markup || markup.version !== 2) return { error: 'Format chấm điểm không hỗ trợ đề xuất' };

    const updatedMarkup = respondToSuggestion(markup, taskKey, suggestionId, action);
    const newHtml = updatedMarkup.tasks[taskKey];

    const { error: dbError } = await db
      .from('exam_submissions')
      .update({
        notes: serializeWritingReviewMarkupV2(
          updatedMarkup.mode,
          updatedMarkup.tasks,
          updatedMarkup.suggestions,
        ),
      })
      .eq('id', id);

    if (dbError) throw dbError;

    revalidateSubmissionViews(id);
    return { success: true, newHtml };
  } catch (err: any) {
    return { error: err.message || 'Lỗi xử lý đề xuất' };
  }
}

export async function handleBulkSuggestionResponse(
  id: string,
  taskKey: 't1' | 't2' | 't3',
  action: 'accept' | 'reject',
): Promise<{ success: true; newHtml: string } | { error: string }> {
  try {
    const { db, user } = await requireActiveStudentAndDb();
    const sub = await fetchSubmissionById(db, id);
    
    if (!sub) return { error: 'Không tìm thấy bài nộp' };
    if (sub.student_id !== user.id && sub.student_email !== user.email) {
      return { error: 'Không có quyền truy cập' };
    }
    if (!sub.notes) return { error: 'Không có đề xuất nào để xử lý' };

    const markup = parseWritingReviewMarkup(sub.notes);
    if (!markup || markup.version !== 2) return { error: 'Format chấm điểm không hỗ trợ đề xuất' };

    const updatedMarkup = respondToAll(markup, taskKey, action);
    const newHtml = updatedMarkup.tasks[taskKey];

    const { error: dbError } = await db
      .from('exam_submissions')
      .update({
        notes: serializeWritingReviewMarkupV2(
          updatedMarkup.mode,
          updatedMarkup.tasks,
          updatedMarkup.suggestions,
        ),
      })
      .eq('id', id);

    if (dbError) throw dbError;

    revalidateSubmissionViews(id);
    return { success: true, newHtml };
  } catch (err: any) {
    return { error: err.message || 'Lỗi xử lý đề xuất hàng loạt' };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function emptySuggestions(): WritingTasksSuggestions {
  return { t1: [], t2: [], t3: [] };
}

function normalizeSuggestion(raw: {
  id: string;
  type: 'replace' | 'insert' | 'delete' | 'replace-all';
  originalText: string;
  suggestedText: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
}): Suggestion {
  return {
    id: raw.id,
    type: raw.type,
    originalText: raw.originalText,
    suggestedText: raw.suggestedText,
    status: 'pending',
    createdAt: raw.createdAt,
  };
}

export async function generateWritingAiSuggestions(input: {
  submissionId: string;
  taskKey: WritingTaskKey;
  taskHtml: string;
  topic?: string;
}): Promise<{ suggestions: Suggestion[]; message?: string }> {
  const ctx = await requireActiveTeacherOrAdminAndDb();
  const sub = await fetchSubmissionById(ctx.db, input.submissionId);
  if (!sub) throw new Error('SUBMISSION_NOT_FOUND');
  if (sub.exam_type !== 'writing') throw new Error('NOT_WRITING_SUBMISSION');

  if (ctx.profile.role === 'teacher') {
    await requireOwnedStudentResource({ studentEmail: sub.student_email });
  }

  const plainText = stripHtml(input.taskHtml);
  if (!plainText) return { suggestions: [], message: 'Bài viết trống, không thể tạo đề xuất.' };

  const generated = await generateGeminiWritingSuggestions(input.taskKey, input.topic || '', plainText);
  if (generated.length === 0) return { suggestions: [], message: 'AI không tìm thấy đề xuất phù hợp.' };

  const now = new Date().toISOString();
  const payload = generated.map((item) => ({
    submission_id: input.submissionId,
    task_key: input.taskKey,
    source: 'gemini',
    suggestion_type: item.type,
    original_text: item.originalText,
    suggested_text: item.suggestedText,
    reason: item.reason,
    severity: item.severity,
    status: 'pending',
    created_by: ctx.user.id,
  }));

  const { data, error } = await ctx.db
    .from('submission_ai_suggestions')
    .insert(payload)
    .select('id, suggestion_type, original_text, suggested_text');

  if (error) {
    throw new Error(`Không thể lưu AI suggestions: ${error.message}`);
  }

  const suggestions = (data ?? []).map((row) =>
    normalizeSuggestion({
      id: row.id,
      type: row.suggestion_type,
      originalText: row.original_text,
      suggestedText: row.suggested_text,
      reason: '',
      severity: 'medium',
      createdAt: now,
    }),
  );

  return { suggestions };
}

export async function acceptAllWritingAiSuggestions(input: {
  submissionId: string;
  taskKey: WritingTaskKey;
  suggestionIds: string[];
}): Promise<void> {
  if (input.suggestionIds.length === 0) return;
  const ctx = await requireActiveTeacherOrAdminAndDb();
  const sub = await fetchSubmissionById(ctx.db, input.submissionId);
  if (!sub) throw new Error('SUBMISSION_NOT_FOUND');
  if (ctx.profile.role === 'teacher') {
    await requireOwnedStudentResource({ studentEmail: sub.student_email });
  }

  const { error } = await ctx.db
    .from('submission_ai_suggestions')
    .update({
      status: 'accepted',
      updated_at: new Date().toISOString(),
    })
    .eq('submission_id', input.submissionId)
    .eq('task_key', input.taskKey)
    .in('id', input.suggestionIds);

  if (error) throw new Error(`Không thể cập nhật trạng thái suggestion: ${error.message}`);
}

export async function undoWritingAiSuggestion(input: {
  submissionId: string;
  suggestionId: string;
}): Promise<void> {
  const ctx = await requireActiveTeacherOrAdminAndDb();
  const sub = await fetchSubmissionById(ctx.db, input.submissionId);
  if (!sub) throw new Error('SUBMISSION_NOT_FOUND');
  if (ctx.profile.role === 'teacher') {
    await requireOwnedStudentResource({ studentEmail: sub.student_email });
  }

  const { error } = await ctx.db
    .from('submission_ai_suggestions')
    .update({
      status: 'undone',
      updated_at: new Date().toISOString(),
    })
    .eq('submission_id', input.submissionId)
    .eq('id', input.suggestionId);

  if (error) throw new Error(`Không thể undo AI suggestion: ${error.message}`);
}

