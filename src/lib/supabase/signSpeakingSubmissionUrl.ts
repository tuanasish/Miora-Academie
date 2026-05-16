import { createClient } from '@supabase/supabase-js';
import { createSpeakingPlaybackUrl } from '@/lib/storage/r2';

const BUCKET = 'speaking-submissions';

/** Trích path trong bucket từ URL public Supabase Storage; null nếu không khớp bucket này. */
export function speakingSubmissionsPathFromUrl(storedUrl: string): string | null {
  try {
    const u = new URL(storedUrl);
    const prefix = `/storage/v1/object/public/${BUCKET}/`;
    const pos = u.pathname.indexOf(prefix);
    if (pos === -1) return null;
    const path = u.pathname.slice(pos + prefix.length);
    if (!path) return null;
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

/**
 * Tạo signed URL để trình duyệt phát/tải file (bucket private hoặc cần token).
 * Không có service role thì trả về URL gốc (bucket public vẫn hoạt động).
 */
export async function signSpeakingSubmissionUrl(
  storedUrl: string | null | undefined,
  expiresSec = 7200,
): Promise<string | null | undefined> {
  if (!storedUrl) return storedUrl;
  const objectPath = speakingSubmissionsPathFromUrl(storedUrl);
  if (!objectPath) return storedUrl;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return storedUrl;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, expiresSec);

  if (error || !data?.signedUrl) return storedUrl;
  return data.signedUrl;
}

type RowWithSpeaking = {
  exam_type: string;
  speaking_task1_video_url?: string | null;
  speaking_task2_video_url?: string | null;
  speaking_task1_storage_path?: string | null;
  speaking_task2_storage_path?: string | null;
};

export async function submissionWithSpeakingPlaybackUrls<T extends RowWithSpeaking>(row: T): Promise<T> {
  if (row.exam_type !== 'speaking') return row;

  async function signR2First(storagePath: string | null | undefined, legacyUrl: string | null | undefined) {
    if (storagePath) {
      try {
        return await createSpeakingPlaybackUrl(storagePath);
      } catch (error) {
        console.error('[signSpeakingSubmissionUrl] R2 signed URL failed:', error);
      }
    }
    return signSpeakingSubmissionUrl(legacyUrl);
  }

  const [u1, u2] = await Promise.all([
    signR2First(row.speaking_task1_storage_path, row.speaking_task1_video_url),
    signR2First(row.speaking_task2_storage_path, row.speaking_task2_video_url),
  ]);

  return {
    ...row,
    speaking_task1_video_url: u1 ?? row.speaking_task1_video_url,
    speaking_task2_video_url: u2 ?? row.speaking_task2_video_url,
  };
}
