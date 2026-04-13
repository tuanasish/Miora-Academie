import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

import { verifyCronRequest } from '@/lib/security/cron';
import { buildExamRef, sendDueSoonEmail, sendOverdueEmail } from '@/lib/notifications/email';
import { createPrivilegedSupabase } from '@/lib/supabase/adminAuth';

async function hasMatchingSubmission(
  db: SupabaseClient,
  assignment: {
    exam_type: string;
    serie_id: number | null;
    combinaison_id: number | null;
    partie_id: number | null;
    student_email: string;
  },
): Promise<boolean> {
  let query = db
    .from('exam_submissions')
    .select('id')
    .eq('student_email', assignment.student_email)
    .eq('exam_type', assignment.exam_type);

  if (assignment.exam_type === 'writing') {
    query = query.eq('combinaison_id', assignment.combinaison_id ?? -1);
  } else if (assignment.exam_type === 'speaking') {
    query = query.eq('partie_id', assignment.partie_id ?? -1);
  } else {
    query = query.eq('serie_id', assignment.serie_id ?? -1);
  }

  const { data } = await query.limit(1);
  return Boolean(data && data.length > 0);
}

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) {
    return authError;
  }

  const db = createPrivilegedSupabase();
  if (!db) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  const now = new Date();
  const soonCutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const nowIso = now.toISOString();

  try {
    const [dueSoonRes, overdueRes] = await Promise.all([
      db
        .from('exam_assignments')
        .select('id, student_email, exam_type, serie_id, combinaison_id, partie_id, exam_label, due_date')
        .not('due_date', 'is', null)
        .is('due_soon_email_sent_at', null)
        .gt('due_date', nowIso)
        .lte('due_date', soonCutoff)
        .limit(500),
      db
        .from('exam_assignments')
        .select('id, student_email, exam_type, serie_id, combinaison_id, partie_id, exam_label, due_date')
        .not('due_date', 'is', null)
        .is('overdue_email_sent_at', null)
        .lt('due_date', nowIso)
        .limit(500),
    ]);

    if (dueSoonRes.error) throw dueSoonRes.error;
    if (overdueRes.error) throw overdueRes.error;

    let dueSoonSent = 0;
    for (const assignment of dueSoonRes.data ?? []) {
      if (await hasMatchingSubmission(db, assignment)) continue;

      await sendDueSoonEmail({
        studentEmail: assignment.student_email,
        examType: assignment.exam_type as 'listening' | 'reading' | 'writing' | 'speaking',
        examRef: buildExamRef({
          examType: assignment.exam_type as 'listening' | 'reading' | 'writing' | 'speaking',
          serieId: assignment.serie_id,
          combinaisonId: assignment.combinaison_id,
          partieId: assignment.partie_id,
          examLabel: assignment.exam_label,
        }),
        dueDate: assignment.due_date,
      });

      await db
        .from('exam_assignments')
        .update({ due_soon_email_sent_at: new Date().toISOString() })
        .eq('id', assignment.id);
      dueSoonSent += 1;
    }

    let overdueSent = 0;
    for (const assignment of overdueRes.data ?? []) {
      if (await hasMatchingSubmission(db, assignment)) continue;

      await sendOverdueEmail({
        studentEmail: assignment.student_email,
        examType: assignment.exam_type as 'listening' | 'reading' | 'writing' | 'speaking',
        examRef: buildExamRef({
          examType: assignment.exam_type as 'listening' | 'reading' | 'writing' | 'speaking',
          serieId: assignment.serie_id,
          combinaisonId: assignment.combinaison_id,
          partieId: assignment.partie_id,
          examLabel: assignment.exam_label,
        }),
        dueDate: assignment.due_date,
      });

      await db
        .from('exam_assignments')
        .update({ overdue_email_sent_at: new Date().toISOString() })
        .eq('id', assignment.id);
      overdueSent += 1;
    }

    return NextResponse.json({
      ok: true,
      dueSoonSent,
      overdueSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[assignment-reminders] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
