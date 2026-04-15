import { Resend } from "resend";

type ExamType = "listening" | "reading" | "writing" | "speaking";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@mioraacademie.com";
const FROM_EMAIL =
  process.env.FROM_EMAIL ?? "Miora Académie <notifications@mioraacademie.com>";

const EXAM_LABELS: Record<ExamType, string> = {
  listening: "Compréhension de l'oral",
  reading: "Compréhension de l'écrit",
  writing: "Expression écrite",
  speaking: "Expression orale",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes} min ${remaining} sec`;
}

function formatDeadline(dueDate: string | null | undefined) {
  if (!dueDate) return "—";
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

function cardHtml(title: string, body: string, ctaLabel?: string, ctaHref?: string) {
  return `<!DOCTYPE html>
<html lang="vi">
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:#0f172a;color:#ffffff;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:0.8;">Miora Académie</p>
                <h1 style="margin:0;font-size:22px;line-height:1.3;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                ${body}
                ${
                  ctaLabel && ctaHref
                    ? `<p style="margin:24px 0 0;"><a href="${ctaHref}" style="display:inline-block;background:#f05e23;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:12px;">${escapeHtml(
                        ctaLabel,
                      )}</a></p>`
                    : ""
                }
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendEmail(params: { to: string[]; subject: string; html: string }) {
  if (!resend || params.to.length === 0) return;
  const to = Array.from(new Set(params.to.filter(Boolean)));
  if (to.length === 0) return;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.warn(`[email] Gửi email thất bại (không ảnh hưởng chức năng chính): ${error.message}`);
    }
  } catch (err) {
    console.warn(`[email] Gửi email thất bại:`, err instanceof Error ? err.message : err);
  }
}

export function buildExamRef(params: {
  examType: ExamType;
  serieId?: number | null;
  combinaisonId?: number | null;
  partieId?: number | null;
  examLabel?: string | null;
}) {
  if (params.examLabel?.trim()) return params.examLabel.trim();
  if (params.examType === "writing") return `Combinaison ${params.combinaisonId ?? "—"}`;
  if (params.examType === "speaking") return `Partie ${params.partieId ?? "—"}`;
  return `Série ${params.serieId ?? "—"}`;
}

export async function sendTeacherLoginAlert(input: {
  teacherEmail: string;
  teacherName?: string | null;
}) {
  const teacherLabel = input.teacherName?.trim() || input.teacherEmail;
  const html = cardHtml(
    "Teacher login activity",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">Giáo viên <strong>${escapeHtml(
      teacherLabel,
    )}</strong> vừa đăng nhập vào hệ thống.</p>
     <p style="margin:0;color:#475569;font-size:14px;">Email: ${escapeHtml(input.teacherEmail)}</p>`,
    "Mở khu vực admin",
    `${APP_URL}/admin`,
  );

  await sendEmail({
    to: [ADMIN_EMAIL],
    subject: `[Miora] Teacher login alert · ${teacherLabel}`,
    html,
  });
}

export async function sendSubmissionEmails(input: {
  studentEmail: string;
  examType: ExamType;
  examRef: string;
  timeSpentSeconds?: number | null;
  wordCounts?: { t1: number; t2: number; t3: number } | null;
  teacherEmail?: string | null;
}) {
  const label = EXAM_LABELS[input.examType];
  const wordCounts =
    input.examType === "writing" && input.wordCounts
      ? `<ul style="margin:12px 0 0;padding-left:18px;color:#475569;font-size:14px;line-height:1.7;">
          <li>Tâche 1: ${input.wordCounts.t1} mots</li>
          <li>Tâche 2: ${input.wordCounts.t2} mots</li>
          <li>Tâche 3: ${input.wordCounts.t3} mots</li>
        </ul>`
      : "";
  const html = cardHtml(
    "Nouvelle soumission reçue",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
        Học viên <strong>${escapeHtml(input.studentEmail)}</strong> vừa nộp bài <strong>${escapeHtml(
          label,
        )}</strong>.
      </p>
      <p style="margin:0 0 8px;color:#475569;font-size:14px;">Bài: ${escapeHtml(
        input.examRef,
      )}</p>
      <p style="margin:0;color:#475569;font-size:14px;">Thời gian làm bài: ${escapeHtml(
        formatDuration(input.timeSpentSeconds),
      )}</p>
      ${wordCounts}`,
    "Xem bài nộp",
    `${APP_URL}/admin/submissions`,
  );

  const recipients = [ADMIN_EMAIL];
  if (input.teacherEmail) {
    recipients.push(input.teacherEmail);
  }

  await sendEmail({
    to: recipients,
    subject: `[Miora] Soumission reçue · ${input.studentEmail} · ${label}`,
    html,
  });
}

export async function sendAssignmentEmail(input: {
  studentEmail: string;
  examType: ExamType;
  examRef: string;
  dueDate?: string | null;
  note?: string | null;
  assignerName?: string | null;
}) {
  const html = cardHtml(
    "Bạn vừa được giao bài mới",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
        Bài <strong>${escapeHtml(input.examRef)}</strong> đã được giao cho bạn.
      </p>
      <p style="margin:0 0 8px;color:#475569;font-size:14px;">Loại bài: ${escapeHtml(
        EXAM_LABELS[input.examType],
      )}</p>
      <p style="margin:0 0 8px;color:#475569;font-size:14px;">Deadline: ${escapeHtml(
        formatDeadline(input.dueDate),
      )}</p>
      ${
        input.assignerName
          ? `<p style="margin:0 0 8px;color:#475569;font-size:14px;">Người giao: ${escapeHtml(
              input.assignerName,
            )}</p>`
          : ""
      }
      ${
        input.note
          ? `<p style="margin:0;color:#475569;font-size:14px;">Ghi chú: ${escapeHtml(input.note)}</p>`
          : ""
      }`,
    "Mở dashboard",
    `${APP_URL}/dashboard`,
  );

  await sendEmail({
    to: [input.studentEmail],
    subject: `[Miora] Bài mới được giao · ${input.examRef}`,
    html,
  });
}

export async function sendFeedbackEmail(input: {
  studentEmail: string;
  examType: ExamType;
  examRef: string;
  feedback?: string | null;
}) {
  const html = cardHtml(
    "Bài làm đã được chấm",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
        Bài <strong>${escapeHtml(input.examRef)}</strong> đã được giáo viên chấm và trả feedback.
      </p>
      <p style="margin:0 0 8px;color:#475569;font-size:14px;">Loại bài: ${escapeHtml(
        EXAM_LABELS[input.examType],
      )}</p>
      ${
        input.feedback
          ? `<p style="margin:0;color:#475569;font-size:14px;">Phản hồi: ${escapeHtml(
              input.feedback.slice(0, 280),
            )}</p>`
          : ""
      }`,
    "Xem feedback",
    `${APP_URL}/dashboard`,
  );

  await sendEmail({
    to: [input.studentEmail],
    subject: `[Miora] Bài đã được chấm · ${input.examRef}`,
    html,
  });
}

export async function sendDueSoonEmail(input: {
  studentEmail: string;
  examType: ExamType;
  examRef: string;
  dueDate?: string | null;
}) {
  const html = cardHtml(
    "Bài tập sắp đến hạn",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
        Bài <strong>${escapeHtml(input.examRef)}</strong> sẽ đến hạn trong vòng 24 giờ tới.
      </p>
      <p style="margin:0;color:#475569;font-size:14px;">Deadline: ${escapeHtml(
        formatDeadline(input.dueDate),
      )}</p>`,
    "Làm bài ngay",
    `${APP_URL}/dashboard`,
  );

  await sendEmail({
    to: [input.studentEmail],
    subject: `[Miora] Sắp đến hạn · ${input.examRef}`,
    html,
  });
}

export async function sendOverdueEmail(input: {
  studentEmail: string;
  examType: ExamType;
  examRef: string;
  dueDate?: string | null;
}) {
  const html = cardHtml(
    "Bài tập đã quá hạn",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
        Bài <strong>${escapeHtml(input.examRef)}</strong> đã quá hạn nhưng vẫn chưa được nộp.
      </p>
      <p style="margin:0;color:#475569;font-size:14px;">Deadline cũ: ${escapeHtml(
        formatDeadline(input.dueDate),
      )}</p>`,
    "Mở dashboard",
    `${APP_URL}/dashboard`,
  );

  await sendEmail({
    to: [input.studentEmail],
    subject: `[Miora] Bài quá hạn · ${input.examRef}`,
    html,
  });
}

export async function sendStreakWarningEmail(input: {
  studentEmail: string;
  currentStreak: number;
}) {
  const html = cardHtml(
    "Streak của bạn đang có nguy cơ mất",
    `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;">
        Bạn vẫn chưa có hoạt động học tập hợp lệ hôm nay.
      </p>
      <p style="margin:0;color:#475569;font-size:14px;">Streak hiện tại: <strong>${input.currentStreak}</strong> ngày liên tiếp.</p>`,
    "Tiếp tục học",
    `${APP_URL}/dashboard`,
  );

  await sendEmail({
    to: [input.studentEmail],
    subject: `[Miora] Cảnh báo mất streak hôm nay`,
    html,
  });
}
