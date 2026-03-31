import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@mioraacademie.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "Miora Académie <notifications@mioraacademie.com>";

const EXAM_LABELS: Record<string, string> = {
  listening: "Compréhension de l'oral (Nghe)",
  reading:   "Compréhension des écrits (Đọc)",
  writing:   "Expression écrite (Viết)",
  speaking:  "Expression orale (Nói)",
};

const EXAM_COLORS: Record<string, string> = {
  listening: "#3b82f6",
  reading:   "#10b981",
  writing:   "#7c3aed",
  speaking:  "#e11d48",
};

function buildHtml(data: {
  student_email: string;
  exam_type: string;
  exam_ref: string;
  time_spent: string;
  word_counts?: { t1: number; t2: number; t3: number } | null;
  submitted_at: string;
}) {
  const color = EXAM_COLORS[data.exam_type] ?? "#3b82f6";
  const label = EXAM_LABELS[data.exam_type] ?? data.exam_type;

  const wordCountRows =
    data.exam_type === "writing" && data.word_counts
      ? `
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">Tâche 1</td>
          <td style="padding:8px 0;font-weight:600;color:#1e293b;font-size:13px;">${data.word_counts.t1} mots</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">Tâche 2</td>
          <td style="padding:8px 0;font-weight:600;color:#1e293b;font-size:13px;">${data.word_counts.t2} mots</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:13px;">Tâche 3</td>
          <td style="padding:8px 0;font-weight:600;color:#1e293b;font-size:13px;">${data.word_counts.t3} mots</td>
        </tr>
      `
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:${color};border-radius:16px 16px 0 0;padding:32px 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                    Miora Académie
                  </p>
                  <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
                    📬 Nouvelle soumission reçue
                  </h1>
                </td>
                <td align="right" valign="top">
                  <span style="background:rgba(255,255,255,0.2);color:#ffffff;font-size:11px;font-weight:700;padding:6px 14px;border-radius:20px;letter-spacing:0.5px;">
                    ${label}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:32px 36px;">

            <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
              Un(e) étudiant(e) vient de soumettre un exercice sur la plateforme.
              Veuillez consulter les détails ci-dessous.
            </p>

            <!-- Info card -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:4px 20px;margin-bottom:24px;">
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#64748b;font-size:13px;">Étudiant(e)</td>
                      <td style="font-weight:700;color:#0f172a;font-size:14px;text-align:right;">
                        ${data.student_email}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#64748b;font-size:13px;">Exercice</td>
                      <td style="font-weight:600;color:#1e293b;font-size:13px;text-align:right;">
                        ${data.exam_ref}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid #f1f5f9;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#64748b;font-size:13px;">Durée</td>
                      <td style="font-weight:600;color:#1e293b;font-size:13px;text-align:right;">
                        ${data.time_spent}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#64748b;font-size:13px;">Soumis le</td>
                      <td style="font-weight:600;color:#1e293b;font-size:13px;text-align:right;">
                        ${data.submitted_at}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${wordCountRows ? `<tr><td style="padding:0 0 14px;"><table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f5f9;">${wordCountRows}</table></td></tr>` : ""}
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding:8px 0 24px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin"
                    style="display:inline-block;background:${color};color:#ffffff;font-weight:700;font-size:14px;
                    text-decoration:none;padding:13px 32px;border-radius:12px;letter-spacing:0.3px;">
                    🔍 Voir dans le Dashboard
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Miora Académie · Système de notifications automatiques<br>
              <span style="color:#cbd5e1;">Cet email a été envoyé automatiquement, merci de ne pas y répondre.</span>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      student_email,
      exam_type,
      exam_ref,          // "Combinaison 5 · Mars 2026" / "Partie 3 · Janvier 2025"
      time_spent_seconds,
      word_counts,
    } = body;

    if (!student_email || !exam_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const minutes = Math.floor((time_spent_seconds ?? 0) / 60);
    const seconds = (time_spent_seconds ?? 0) % 60;
    const timeStr = time_spent_seconds ? `${minutes} min ${seconds} sec` : "—";

    const submittedAt = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const html = buildHtml({
      student_email,
      exam_type,
      exam_ref: exam_ref ?? "—",
      time_spent: timeStr,
      word_counts: word_counts ?? null,
      submitted_at: submittedAt,
    });

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL],
      subject: `📬 [Miora] Nouvelle soumission — ${EXAM_LABELS[exam_type] ?? exam_type} · ${student_email}`,
      html,
    });

    if (error) {
      console.error("[notify-submission] Resend error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("[notify-submission] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
