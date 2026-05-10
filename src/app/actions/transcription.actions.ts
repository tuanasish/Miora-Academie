'use server';

import { revalidatePath } from 'next/cache';
import { requireAdminAndDb, requireActiveTeacherOrAdminAndDb } from '@/lib/supabase/adminAuth';
import { createClient } from '@/lib/supabase/server';

/**
 * Upsert (Create or Update) a transcription for a listening question.
 * Only Admins can perform this action.
 */
export async function upsertTranscription(
  serieId: number,
  questionId: number,
  transcription: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db, user } = await requireAdminAndDb();

    const { error } = await db
      .from('listening_transcriptions')
      .upsert(
        {
          serie_id: serieId,
          question_id: questionId,
          transcription: transcription.trim(),
          created_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'serie_id,question_id' }
      );

    if (error) {
      console.error('[upsertTranscription] DB Error:', error);
      return { success: false, error: error.message };
    }

    // Revalidate relevant paths to show updated data
    revalidatePath(`/admin/exams/listening`);
    revalidatePath(`/teacher/exams/listening`);
    revalidatePath(`/exam/listening/${serieId}`);

    return { success: true };
  } catch (err: any) {
    console.error('[upsertTranscription] Server Error:', err);
    return { success: false, error: err.message || 'Lỗi không xác định' };
  }
}

/**
 * Fetch all transcriptions for a specific listening serie.
 * Accessible by any authenticated user (Student/Teacher/Admin).
 */
export async function getTranscriptionsForSerie(
  serieId: number
): Promise<Record<number, string>> {
  try {
    // We use server client directly for read-only access if needed, 
    // or just require any logged-in user.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return {};

    const { data, error } = await supabase
      .from('listening_transcriptions')
      .select('question_id, transcription')
      .eq('serie_id', serieId);

    if (error) {
      console.error('[getTranscriptionsForSerie] Error:', error);
      return {};
    }

    // Convert array to map { questionId: transcription }
    const transcriptionMap: Record<number, string> = {};
    (data || []).forEach((item) => {
      transcriptionMap[item.question_id] = item.transcription;
    });

    return transcriptionMap;
  } catch (err) {
    console.error('[getTranscriptionsForSerie] Catch Error:', err);
    return {};
  }
}

/**
 * Delete a transcription.
 * Only Admins can perform this action.
 */
export async function deleteTranscription(
  serieId: number,
  questionId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { db } = await requireAdminAndDb();

    const { error } = await db
      .from('listening_transcriptions')
      .delete()
      .eq('serie_id', serieId)
      .eq('question_id', questionId);

    if (error) {
      console.error('[deleteTranscription] Error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath(`/admin/exams/listening`);
    revalidatePath(`/exam/listening/${serieId}`);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi xóa transcription' };
  }
}
