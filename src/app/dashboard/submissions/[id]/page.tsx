import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Headphones } from "lucide-react";

import McqSubmissionReview from "@/components/exam/McqSubmissionReview";
import { getSubmissionIfOwner } from "@/app/actions/submission.actions";
import { getMcqQuestionsForSerie } from "@/lib/exam/loadMcqExamData";
import { storedAnswersToIndices } from "@/lib/exam/mcqAnswers";

interface PageProps {
  params: Promise<{ id: string }>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardSubmissionReviewPage({ params }: PageProps) {
  const { id } = await params;
  const sub = await getSubmissionIfOwner(id);
  if (!sub) notFound();

  if (sub.exam_type !== "listening" && sub.exam_type !== "reading") {
    return (
      <div className="min-h-screen bg-[#f3efe6] px-4 py-10">
        <div className="max-w-lg mx-auto bg-[#faf8f5] rounded-2xl border border-[#e4ddd1] p-8 text-center">
          <p className="text-sm text-[#3d3d3d] mb-4">
            Chế độ xem từng câu trắc nghiệm chỉ áp dụng cho bài Nghe / Đọc.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#f05e23] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Về dashboard
          </Link>
        </div>
      </div>
    );
  }

  const serieId = sub.serie_id;
  if (serieId == null) notFound();

  const questions = await getMcqQuestionsForSerie(sub.exam_type, serieId);
  if (!questions || questions.length === 0) notFound();

  const userAnswerByQuestionId = storedAnswersToIndices(sub.answers);
  const maxScore = sub.exam_type === "listening" ? 39 : 29;
  const MetaIcon = sub.exam_type === "listening" ? Headphones : BookOpen;
  const metaColor = sub.exam_type === "listening" ? "text-sky-600" : "text-emerald-600";

  return (
    <div className="min-h-screen bg-[#f3efe6] pb-12">
      <div className="bg-[#faf8f5] border-b border-[#e4ddd1] px-4 py-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-[#f05e23] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <MetaIcon className={`w-8 h-8 ${metaColor}`} />
            <div>
              <h1 className="font-display font-bold text-xl text-[#3d3d3d]">
                Xem lại bài làm — Série {serieId}
              </h1>
              <p className="text-xs text-[#888] mt-0.5">
                {sub.exam_type === "listening" ? "Compréhension orale" : "Compréhension écrite"} ·{" "}
                {fmtDate(sub.submitted_at)}
              </p>
            </div>
            {sub.score !== null && sub.score !== undefined && (
              <span className="ml-auto text-sm font-bold text-[#f05e23] bg-white/80 px-3 py-1 rounded-full border border-[#e4ddd1]">
                {sub.score}/{maxScore}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 mt-8">
        <McqSubmissionReview
          questions={questions}
          userAnswerByQuestionId={userAnswerByQuestionId}
          variant="full"
          title="Correction"
          animateRows={false}
        />
      </div>
    </div>
  );
}
