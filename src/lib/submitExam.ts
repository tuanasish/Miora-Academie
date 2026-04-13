export type ExamType = "listening" | "reading" | "writing" | "speaking";

interface BasePayload {
  exam_type: ExamType;
  student_email: string;
  student_id: string;
  time_spent_seconds?: number;
}

export interface WritingPayload extends BasePayload {
  exam_type: "writing";
  combinaison_id: number;
  writing_task1: string;
  writing_task2: string;
  writing_task3: string;
  word_counts: { t1: number; t2: number; t3: number };
  task_times: { t1: number; t2: number; t3: number };
}

export interface SpeakingPayload extends BasePayload {
  exam_type: "speaking";
  partie_id: number;
  speaking_task1_video_url?: string;
  speaking_task2_video_url?: string;
}

export interface ListeningPayload extends BasePayload {
  exam_type: "listening";
  serie_id: number;
  answers: Record<string, string>;
  score?: number;
}

export interface ReadingPayload extends BasePayload {
  exam_type: "reading";
  serie_id: number;
  answers: Record<string, string>;
  score?: number;
}

export type SubmitPayload =
  | WritingPayload
  | SpeakingPayload
  | ListeningPayload
  | ReadingPayload;

export async function submitExam(
  payload: SubmitPayload,
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch("/api/exam/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) {
    return { success: false, error: body?.error ?? "SUBMIT_FAILED" };
  }

  return { success: true };
}
