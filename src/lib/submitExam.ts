import { createClient } from "@/lib/supabase/client";

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

// ── Build a human-readable reference for email ──────────────────
function buildExamRef(payload: SubmitPayload): string {
  switch (payload.exam_type) {
    case "writing":  return `Combinaison ${payload.combinaison_id}`;
    case "speaking": return `Partie ${payload.partie_id}`;
    case "listening":
    case "reading":  return `Série ${payload.serie_id}`;
    default:         return "—";
  }
}

// ── Send notification email (fire-and-forget, non-blocking) ─────
async function notifyAdmin(payload: SubmitPayload): Promise<void> {
  try {
    await fetch("/api/notify-submission", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_email: payload.student_email,
        exam_type: payload.exam_type,
        exam_ref: buildExamRef(payload),
        time_spent_seconds: payload.time_spent_seconds ?? null,
        word_counts: payload.exam_type === "writing" ? payload.word_counts : null,
      }),
    });
  } catch (err) {
    // Email failure should never block the student
    console.warn("[notifyAdmin] email failed silently:", err);
  }
}

// ── Main submit function ─────────────────────────────────────────
export async function submitExam(
  payload: SubmitPayload,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.from("exam_submissions").insert([payload]);

  if (error) {
    console.error("[submitExam] error:", error.message);
    return { success: false, error: error.message };
  }

  // Notify admin — runs in background, does not block UI
  notifyAdmin(payload);

  return { success: true };
}
