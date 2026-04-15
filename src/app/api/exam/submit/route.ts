import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { touchLearningActivity } from '@/app/actions/streak.actions';
import { logAuditEventSafely } from '@/lib/audit';
import { sendSubmissionEmails, buildExamRef } from '@/lib/notifications/email';
import { requireActiveStudentAndDb } from '@/lib/supabase/adminAuth';

type ExamType = 'listening' | 'reading' | 'writing' | 'speaking';

interface SubmitPayload {
  exam_type: ExamType;
  serie_id?: number;
  combinaison_id?: number;
  partie_id?: number;
  answers?: Record<string, string>;
  score?: number;
  writing_task1?: string;
  writing_task2?: string;
  writing_task3?: string;
  word_counts?: { t1: number; t2: number; t3: number };
  task_times?: { t1: number; t2: number; t3: number };
  speaking_task1_video_url?: string;
  speaking_task2_video_url?: string;
  time_spent_seconds?: number;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SubmitPayload;
    const ctx = await requireActiveStudentAndDb();

    let assignmentQuery = ctx.db
      .from('exam_assignments')
      .select('id')
      .eq('student_email', ctx.user.email ?? '')
      .eq('exam_type', payload.exam_type)
      .limit(1);

    if (payload.exam_type === 'writing') {
      assignmentQuery = assignmentQuery.eq('combinaison_id', payload.combinaison_id ?? -1);
    } else if (payload.exam_type === 'speaking') {
      assignmentQuery = assignmentQuery.eq('partie_id', payload.partie_id ?? -1);
    } else {
      assignmentQuery = assignmentQuery.eq('serie_id', payload.serie_id ?? -1);
    }
    const { data: assignment, error: assignmentError } = await assignmentQuery;
    if (assignmentError || !assignment || assignment.length === 0) {
      return NextResponse.json({ error: 'ASSIGNMENT_REQUIRED' }, { status: 403 });
    }

    const insertPayload = {
      ...payload,
      student_email: ctx.user.email,
      student_id: ctx.user.id,
    };

    const { data: insertedRows, error } = await ctx.db
      .from('exam_submissions')
      .insert([insertPayload])
      .select('id')
      .limit(1);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const insertedSubmissionId = insertedRows?.[0]?.id ?? null;

    const examRef = buildExamRef({
      examType: payload.exam_type,
      serieId: payload.serie_id,
      combinaisonId: payload.combinaison_id,
      partieId: payload.partie_id,
    });

    await logAuditEventSafely(ctx.db, {
      actorId: ctx.user.id,
      actorEmail: ctx.profile.email,
      actorName: ctx.profile.full_name,
      actorRole: ctx.profile.role,
      action: 'submission.create',
      targetType: 'exam_submission',
      targetId: insertedSubmissionId,
      targetLabel: `${ctx.user.email ?? 'student'} · ${examRef}`,
      metadata: {
        student_email: ctx.user.email ?? null,
        exam_type: payload.exam_type,
        exam_ref: examRef,
        serie_id: payload.serie_id ?? null,
        combinaison_id: payload.combinaison_id ?? null,
        partie_id: payload.partie_id ?? null,
        score: payload.score ?? null,
        time_spent_seconds: payload.time_spent_seconds ?? null,
        word_counts: payload.word_counts ?? null,
      },
    });

    try {
      await touchLearningActivity(ctx.user.id, 'submission');
    } catch (streakError) {
      console.error('[api/exam/submit] streak update failed:', streakError);
    }

    try {
      const { data: teacherMapping } = await ctx.db
        .from('teacher_students')
        .select('teacher_id')
        .eq('student_id', ctx.user.id)
        .limit(1)
        .maybeSingle();

      let teacherEmail: string | null = null;
      if (teacherMapping?.teacher_id) {
        const { data: teacherProfile } = await ctx.db
          .from('profiles')
          .select('email')
          .eq('id', teacherMapping.teacher_id)
          .maybeSingle();
        teacherEmail = teacherProfile?.email ?? null;
      }

      await sendSubmissionEmails({
        studentEmail: ctx.user.email ?? '',
        examType: payload.exam_type,
        examRef,
        timeSpentSeconds: payload.time_spent_seconds,
        wordCounts: payload.word_counts,
        teacherEmail,
      });
    } catch (notifyError) {
      console.error('[api/exam/submit] submission notification failed:', notifyError);
    }

    revalidatePath('/dashboard');
    revalidatePath(`/exam/${payload.exam_type}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/exam/submit] error:', error);
    if (error instanceof Error && (error.message === 'FORBIDDEN' || error.message === 'DISABLED')) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
