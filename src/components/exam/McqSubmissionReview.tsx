"use client";

import { indexToLetter } from "@/lib/exam/mcqAnswers";
import { Volume2 } from "lucide-react";

export interface McqReviewQuestion {
  id: number;
  orderIndex?: number;
  level: string;
  points: number;
  prompt: string;
  options: string[];
  correctAnswerIndex: number;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

export interface McqSubmissionReviewProps {
  questions: McqReviewQuestion[];
  /** Per question id: selected option index, or omit if unanswered */
  userAnswerByQuestionId: Record<number, number>;
  /** compact: badges only; full: four options with green/red fill */
  variant?: "compact" | "full";
  title?: string;
  /** Apply staggered animation delay on rows (exam score screen) */
  animateRows?: boolean;
  className?: string;
  titleClassName?: string;
}

const LABELS = ["A", "B", "C", "D"];

/** 39 câu / série: ~10 câu mỗi quý (1–10 → Q1, …, 31–39 → Q4). */
function quarterFromOrder(order: number): number {
  return Math.min(4, Math.max(1, Math.ceil(order / 10)));
}

function formatQuestionMeta(q: McqReviewQuestion, zeroBasedIndex: number): string {
  const order = q.orderIndex ?? zeroBasedIndex + 1;
  const quy = quarterFromOrder(order);
  return `Quý ${quy} · ${q.level} · ${q.points} điểm`;
}

export default function McqSubmissionReview({
  questions,
  userAnswerByQuestionId,
  variant = "full",
  title = "Correction",
  animateRows = false,
  className = "",
  titleClassName = "font-display font-bold text-[#3d3d3d] mb-3",
}: McqSubmissionReviewProps) {
  const sorted = [...questions].sort((a, b) => {
    const oa = a.orderIndex ?? a.id;
    const ob = b.orderIndex ?? b.id;
    if (oa !== ob) return oa - ob;
    return a.id - b.id;
  });

  return (
    <div className={className}>
      <h3 className={titleClassName}>
        {title} ({sorted.length} questions)
      </h3>
      <div className="space-y-4">
        {sorted.map((q2, idx) => {
          const userAns = userAnswerByQuestionId[q2.id];
          const isCorrect = userAns === q2.correctAnswerIndex;
          const notAnswered = userAns === undefined;
          const delayStyle = animateRows
            ? { animationDelay: `${Math.min(idx * 0.03, 0.5)}s` }
            : undefined;

          if (variant === "compact") {
            return (
              <div
                key={q2.id}
                className={`bg-[#faf8f5] rounded-xl border-2 p-3 sm:p-4 anim-fade-in ${
                  notAnswered ? "border-[#e4ddd1]" : isCorrect ? "border-emerald-200" : "border-red-200"
                }`}
                style={delayStyle}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      notAnswered
                        ? "bg-gray-100 text-gray-400"
                        : isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {notAnswered ? "—" : isCorrect ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#888] mb-1">
                      {formatQuestionMeta(q2, idx)}
                    </p>
                    <p className="text-sm text-[#3d3d3d] line-clamp-2">{q2.prompt}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {notAnswered ? (
                        <span className="text-xs text-gray-400 italic">Pas de réponse</span>
                      ) : (
                        !isCorrect && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                            Votre: {indexToLetter(userAns)} — {q2.options[userAns]}
                          </span>
                        )
                      )}
                      <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                        ✓ {indexToLetter(q2.correctAnswerIndex)} —{" "}
                        {q2.options[q2.correctAnswerIndex]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          // full: một cột cố định — đề, audio, ảnh, 2×2 đáp án cùng bề ngang, dễ theo dõi
          return (
            <div
              key={q2.id}
              className={`bg-[#faf8f5] rounded-xl border-2 p-4 sm:p-5 anim-fade-in ${
                notAnswered ? "border-[#e4ddd1]" : isCorrect ? "border-emerald-200" : "border-red-200"
              }`}
              style={delayStyle}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pb-3 mb-1 border-b border-[#e4ddd1]/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      notAnswered
                        ? "bg-gray-100 text-gray-400"
                        : isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {notAnswered ? "—" : isCorrect ? "✓" : "✗"}
                  </span>
                  <p className="text-[11px] sm:text-xs font-semibold text-[#888] tracking-wide">
                    {formatQuestionMeta(q2, idx)}
                  </p>
                </div>
                {notAnswered && (
                  <p className="text-[11px] sm:text-xs font-semibold text-red-700 flex items-center gap-2 shrink-0 w-full sm:w-auto sm:justify-end">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden />
                    Học viên đã bỏ trống câu này.
                  </p>
                )}
              </div>

              <div className="mx-auto w-full max-w-2xl space-y-3 pt-2">
                <p className="text-sm text-[#3d3d3d] leading-snug text-center">{q2.prompt}</p>

                {q2.audioUrl && (
                  <div
                    className="flex items-center gap-2.5 bg-[#fffaf6] border border-[#e4ddd1] rounded-lg p-2.5 w-full select-none"
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    <Volume2 className="w-4 h-4 text-[#f05e23] shrink-0" />
                    <audio
                      controls
                      controlsList="nodownload"
                      className="flex-1 h-8 min-w-0"
                      src={q2.audioUrl}
                      preload="none"
                    />
                  </div>
                )}

                {q2.imageUrl && (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={q2.imageUrl}
                      alt={`Question ${idx + 1}`}
                      className="block h-auto w-full max-h-[min(72vh,36rem)] sm:max-h-[min(78vh,40rem)] object-contain object-center"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {q2.options.map((opt, optIdx) => {
                    const isCorrectOpt = optIdx === q2.correctAnswerIndex;
                    const isUserPick = userAns === optIdx;
                    const showWrongPick = !notAnswered && !isCorrect && isUserPick && !isCorrectOpt;

                    let box =
                      "border-2 rounded-lg p-2 sm:p-2.5 text-left text-[13px] sm:text-sm flex gap-2 items-start transition-colors min-h-[3rem] ";
                    if (isCorrectOpt) {
                      box += "border-emerald-400 bg-emerald-50 text-emerald-900 font-medium ring-1 ring-emerald-200/80";
                    } else if (showWrongPick) {
                      box += "border-red-400 bg-red-50 text-red-900 ring-1 ring-red-200/80";
                    } else {
                      box += "border-[#e4ddd1] bg-white/80 text-[#5d5d5d]";
                    }

                    return (
                      <div key={optIdx} className={box}>
                        <span
                          className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold leading-6 text-center ${
                            isCorrectOpt
                              ? "bg-emerald-600 text-white"
                              : showWrongPick
                                ? "bg-red-600 text-white"
                                : "bg-[#ede8dd] text-[#888]"
                          }`}
                        >
                          {LABELS[optIdx]}
                        </span>
                        <div className="min-w-0 flex-1 leading-snug">{opt}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
