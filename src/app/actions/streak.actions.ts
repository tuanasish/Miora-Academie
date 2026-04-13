'use server';

import { createPrivilegedSupabase } from '@/lib/supabase/adminAuth';
import { formatDateVN } from '@/lib/streak/date';

export type LearningActivityReason = 'submission' | 'feedback_view';

function getDb() {
  const db = createPrivilegedSupabase();
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for streak actions.');
  }
  return db;
}

export async function touchLearningActivity(
  studentId: string,
  reason: LearningActivityReason,
): Promise<void> {
  const db = getDb();
  void reason;

  const today = new Date();
  const todayStr = formatDateVN(today);

  const { data: streak, error } = await db
    .from('streaks')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    throw new Error(`Không thể lấy streak: ${error.message}`);
  }

  if (!streak) {
    const { error: insertError } = await db.from('streaks').insert({
      student_id: studentId,
      current_streak: 1,
      highest_streak: 1,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString(),
    });
    if (insertError) {
      throw new Error(`Không thể tạo streak: ${insertError.message}`);
    }
    return;
  }

  if (streak.last_activity_date === todayStr) {
    return;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateVN(yesterday);

  const currentStreak =
    streak.last_activity_date === yesterdayStr ? (streak.current_streak ?? 0) + 1 : 1;
  const highestStreak = Math.max(currentStreak, streak.highest_streak ?? 0);

  const { error: updateError } = await db
    .from('streaks')
    .update({
      current_streak: currentStreak,
      highest_streak: highestStreak,
      last_activity_date: todayStr,
      updated_at: new Date().toISOString(),
    })
    .eq('student_id', studentId);

  if (updateError) {
    throw new Error(`Không thể cập nhật streak: ${updateError.message}`);
  }
}

export async function resetInactiveStreaks(): Promise<{ resetCount: number }> {
  const db = getDb();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateVN(yesterday);

  const { data, error } = await db
    .from('streaks')
    .update({
      current_streak: 0,
      updated_at: new Date().toISOString(),
    })
    .lt('last_activity_date', yesterdayStr)
    .gt('current_streak', 0)
    .select('student_id');

  if (error) {
    console.error('[resetInactiveStreaks] error:', error.message);
    return { resetCount: 0 };
  }

  return { resetCount: data?.length ?? 0 };
}
