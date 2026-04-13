import { NextRequest, NextResponse } from 'next/server';

import { verifyCronRequest } from '@/lib/security/cron';
import { sendStreakWarningEmail } from '@/lib/notifications/email';
import { formatDateVN } from '@/lib/streak/date';
import { createPrivilegedSupabase } from '@/lib/supabase/adminAuth';

export async function GET(request: NextRequest) {
  const authError = verifyCronRequest(request);
  if (authError) {
    return authError;
  }

  const db = createPrivilegedSupabase();
  if (!db) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 500 });
  }

  try {
    const today = formatDateVN(new Date());
    const { data: streaks, error } = await db
      .from('streaks')
      .select('student_id, current_streak, last_activity_date, last_warning_sent_date')
      .gt('current_streak', 0)
      .limit(500);

    if (error) throw error;

    const rowsToWarn = (streaks ?? []).filter(
      (row) => row.last_activity_date !== today && row.last_warning_sent_date !== today,
    );

    if (rowsToWarn.length === 0) {
      return NextResponse.json({ ok: true, warned: 0, timestamp: new Date().toISOString() });
    }

    const studentIds = rowsToWarn.map((row) => row.student_id);
    const { data: profiles, error: profileError } = await db
      .from('profiles')
      .select('id, email, status')
      .in('id', studentIds);

    if (profileError) throw profileError;

    const emailMap = new Map(
      (profiles ?? [])
        .filter((profile) => profile.status === 'active' && profile.email)
        .map((profile) => [profile.id, profile.email]),
    );

    let warned = 0;
    for (const row of rowsToWarn) {
      const studentEmail = emailMap.get(row.student_id);
      if (!studentEmail) continue;

      await sendStreakWarningEmail({
        studentEmail,
        currentStreak: row.current_streak ?? 0,
      });

      await db
        .from('streaks')
        .update({ last_warning_sent_date: today })
        .eq('student_id', row.student_id);

      warned += 1;
    }

    return NextResponse.json({ ok: true, warned, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[streak-warning] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
