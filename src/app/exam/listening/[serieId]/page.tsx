"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Headphones, ChevronLeft, ChevronRight, Clock, Send, Volume2, ArrowLeft, Loader2, Flag,
} from "lucide-react";
import { useCountdown } from "@/hooks/useTimer";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitExam } from "@/lib/submitExam";
import SubmitConfirmModal from "@/components/exam/SubmitConfirmModal";
import ScoreReveal from "@/components/exam/ScoreReveal";

interface Question {
  id: number;
  orderIndex: number;
  level: string;
  points: number;
  prompt: string;
  audioUrl: string | null;
  imageUrl: string | null;
  options: string[];
  correctAnswerIndex: number;
}

interface ExamData {
  data: {
    tests: { testNumber: number; slug: string; questions: Question[] }[];
  };
}

const TOTAL_SECONDS = 35 * 60;

export default function ListeningSerieExamPage() {
  const params = useParams();
  const serieId = Number(params.serieId);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timer = useCountdown(TOTAL_SECONDS, true);

  useEffect(() => {
    fetch("/data/listening.json")
      .then((r) => r.json())
      .then((json: ExamData) => {
        const test = json.data.tests.find((t) => t.testNumber === serieId);
        if (!test) { setNotFound(true); setLoading(false); return; }
        setQuestions(test.questions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [serieId]);

  const q = questions[currentQ];
  const answered = Object.keys(answers).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;

  const timerColor =
    timer.seconds < 300 ? "text-red-600" : timer.seconds < 600 ? "text-orange-500" : "text-[#3d3d3d]";
  const timerWarning = timer.seconds < 300 && timer.seconds > 0;

  // Toggle flag
  const toggleFlag = useCallback(() => {
    if (!q) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ)) next.delete(currentQ);
      else next.add(currentQ);
      return next;
    });
  }, [q, currentQ]);

  // Keyboard navigation
  const goPrev = useCallback(() => setCurrentQ((c) => Math.max(0, c - 1)), []);
  const goNext = useCallback(() => setCurrentQ((c) => Math.min(total - 1, c + 1)), [total]);
  const selectAnswer = useCallback((idx: number) => {
    if (!q || idx >= q.options.length) return;
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
  }, [q]);

  useKeyboardNav({
    onSelectAnswer: selectAnswer,
    onPrev: goPrev,
    onNext: goNext,
    onFlag: toggleFlag,
    optionCount: q?.options.length ?? 4,
    enabled: !submitted && !loading && !showConfirmModal,
  });

  // Submit handler
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const correctCount = questions.filter((q2) => answers[q2.id] === q2.correctAnswerIndex).length;
    const elapsed = TOTAL_SECONDS - timer.seconds;
    const answersMap: Record<string, string> = {};
    for (const [qId, aIdx] of Object.entries(answers)) {
      answersMap[qId] = ["A", "B", "C", "D"][aIdx];
    }
    const result = await submitExam({
      exam_type: "listening", serie_id: serieId,
      student_email: user?.email ?? "anonymous", student_id: user?.id ?? "",
      answers: answersMap, score: correctCount, time_spent_seconds: elapsed,
    });
    setSubmitting(false);
    if (result.success) { setSubmitted(true); setShowConfirmModal(false); }
    else setSubmitError(result.error ?? "Erreur inconnue");
  };

  // Computed helpers
  const unansweredIndices = questions.map((_, i) => i).filter((i) => answers[questions[i]?.id] === undefined);
  const flaggedIndices = Array.from(flagged).sort((a, b) => a - b);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f3efe6]">
      <div className="w-10 h-10 border-4 border-[#f05e23]/30 border-t-[#f05e23] rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#f3efe6]">
      <p className="text-[#888]">La série {serieId} n&apos;existe pas.</p>
      <Link href="/exam/listening" className="text-[#f05e23] hover:underline">← Retour à la liste</Link>
    </div>
  );

  // ═══════════════════ SUBMITTED — Score Reveal ═══════════════════
  if (submitted) {
    const correctCount = questions.filter((q2) => answers[q2.id] === q2.correctAnswerIndex).length;
    return (
      <ScoreReveal serieId={serieId} correct={correctCount} total={total} examType="listening">
        {/* Correction list */}
        <div className="max-w-3xl mx-auto px-4 mt-6">
          <h3 className="font-display font-bold text-[#3d3d3d] mb-3">📋 Correction ({total} questions)</h3>
          <div className="space-y-2">
            {questions.map((q2, idx) => {
              const userAns = answers[q2.id];
              const isCorrect = userAns === q2.correctAnswerIndex;
              const notAnswered = userAns === undefined;
              return (
                <div key={q2.id}
                  className={`bg-[#faf8f5] rounded-xl border-2 p-3 sm:p-4 anim-fade-in ${
                    notAnswered ? 'border-[#e4ddd1]' : isCorrect ? 'border-emerald-200' : 'border-red-200'
                  }`}
                  style={{ animationDelay: `${Math.min(idx * 0.03, 0.5)}s` }}>
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      notAnswered ? 'bg-gray-100 text-gray-400'
                      : isCorrect ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {notAnswered ? '—' : isCorrect ? '✓' : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#888] mb-1">Q{idx + 1} · {q2.level} · {q2.points}pts</p>
                      <p className="text-sm text-[#3d3d3d] line-clamp-1">{q2.prompt}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {notAnswered ? (
                          <span className="text-xs text-gray-400 italic">Pas de réponse</span>
                        ) : !isCorrect && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">
                            Votre: {["A","B","C","D"][userAns]} — {q2.options[userAns]}
                          </span>
                        )}
                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                          ✓ {["A","B","C","D"][q2.correctAnswerIndex]} — {q2.options[q2.correctAnswerIndex]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScoreReveal>
    );
  }

  // ═══════════════════ ACTIVE EXAM ═══════════════════
  return (
    <div className="h-screen flex flex-col bg-[#f3efe6] overflow-hidden">
      {/* Submit Confirm Modal */}
      {showConfirmModal && (
        <SubmitConfirmModal
          total={total}
          answeredCount={answered}
          unansweredIndices={unansweredIndices}
          flaggedIndices={flaggedIndices}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirmModal(false)}
          onJumpTo={(idx) => setCurrentQ(idx)}
          submitting={submitting}
        />
      )}

      {/* Header */}
      <header className="bg-[#faf8f5] border-b border-[#e4ddd1] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/exam/listening"
            className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#3d3d3d] transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Liste</span>
          </Link>
          <span className="text-[#d7c9b8] hidden sm:inline">|</span>
          <Headphones className="w-4 h-4 text-[#f05e23] shrink-0" />
          <h1 className="font-display font-bold text-[#3d3d3d] truncate">
            <span className="hidden md:inline">Compréhension Orale — </span>Série {serieId}
          </h1>
        </div>
        {/* Timer */}
        <div className={`flex items-center gap-2 font-mono font-bold text-sm shrink-0 ${timerColor} ${timerWarning ? "anim-pulse-glow rounded-lg px-2 py-1" : ""}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
          {timer.isExpired && <span className="text-xs font-sans animate-pulse ml-1">⏰</span>}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#e4ddd1] shrink-0">
        <div className="h-full bg-[#f05e23] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT – Question grid (hidden on mobile) */}
        <aside className="hidden md:block w-48 bg-[#faf8f5] border-r border-[#e4ddd1] overflow-y-auto shrink-0">
          <div className="p-3 border-b border-[#e4ddd1]/50">
            <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">
              {answered}/{total} répondues
            </p>
          </div>
          <div className="p-2 grid grid-cols-5 gap-1">
            {questions.map((q2, idx) => (
              <button key={q2.id} onClick={() => setCurrentQ(idx)}
                className={`w-full aspect-square text-xs font-medium rounded-lg transition-all relative ${
                  currentQ === idx ? "bg-[#f05e23] text-white shadow"
                  : answers[q2.id] !== undefined ? "bg-[#f05e23]/15 text-[#d85118]"
                  : "bg-[#ede8dd] text-[#888] hover:bg-[#e4ddd1]"
                }`}>
                {idx + 1}
                {/* Flag indicator */}
                {flagged.has(idx) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#f05e23] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER – Question */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 gap-4 sm:gap-5 overflow-y-auto">
          {/* Tags row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs font-semibold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full">
              Q{currentQ + 1}/{total}
            </span>
            <span className="text-xs bg-[#ede8dd] text-[#888] px-2.5 py-1 rounded-full">
              {q.level}
            </span>
            <span className="text-xs bg-violet-100 text-violet-600 px-2.5 py-1 rounded-full">
              {q.points} pts
            </span>
            {/* Flag button */}
            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${
                flagged.has(currentQ)
                  ? "bg-[#f05e23]/15 text-[#f05e23] font-semibold flag-anim"
                  : "bg-[#ede8dd] text-[#888] hover:text-[#f05e23]"
              }`}
            >
              <Flag className="w-3 h-3" />
              {flagged.has(currentQ) ? "Marquée" : "Marquer"}
            </button>
            {/* Keyboard hint */}
            <span className="hidden lg:inline text-[10px] text-[#bbb] ml-auto">
              A/B/C/D · ←→ · F flag
            </span>
            {/* Mobile progress */}
            <span className="text-xs text-[#888] md:hidden ml-auto">{answered}/{total}</span>
          </div>

          {/* Audio */}
          {q.audioUrl && (
            <div className="bg-[#fffaf6] border border-[#e4ddd1] rounded-xl p-3 sm:p-4 flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-[#f05e23] shrink-0" />
              <audio controls className="flex-1 h-9" src={q.audioUrl} />
            </div>
          )}

          {/* Image */}
          {q.imageUrl && (
            <div className="shrink-0 w-full max-w-2xl rounded-xl overflow-hidden border border-[#e4ddd1] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.imageUrl}
                alt="Question"
                className="block w-full h-auto max-h-[min(85vh,1600px)] object-contain"
              />
            </div>
          )}

          {/* Prompt */}
          <div className="bg-[#faf8f5] rounded-xl border border-[#e4ddd1] p-4 sm:p-5">
            <p className="text-[#3d3d3d] leading-relaxed text-sm sm:text-base">{q.prompt}</p>
          </div>

          {/* Options — with bounce animation */}
          <div className="grid grid-cols-1 gap-2 sm:gap-3 max-w-2xl">
            {q.options.map((opt, idx) => {
              const isSelected = answers[q.id] === idx;
              return (
                <button key={idx} onClick={() => selectAnswer(idx)}
                  className={`option-btn w-full text-left p-3 sm:p-4 rounded-xl border-2 text-sm font-medium ${
                    isSelected
                      ? "border-[#f05e23] bg-[#fffaf6] text-[#3d3d3d] shadow-sm anim-bounce-select"
                      : "border-[#e4ddd1] bg-[#faf8f5] text-[#5d5d5d] hover:border-[#f05e23]/50 hover:bg-[#fffaf6]"
                  }`}>
                  <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold text-center leading-6 mr-3 ${
                    isSelected ? "bg-[#f05e23] text-white" : "bg-[#ede8dd] text-[#888]"
                  }`}>
                    {["A","B","C","D"][idx]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Mobile-only nav buttons */}
          <div className="flex items-center gap-2 md:hidden mt-2">
            <button onClick={goPrev} disabled={currentQ === 0}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-[#e4ddd1] text-sm text-[#5d5d5d] disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />Préc.
            </button>
            <button onClick={goNext} disabled={currentQ === total - 1}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-[#e4ddd1] text-sm text-[#5d5d5d] disabled:opacity-40">
              Suiv.<ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-[#f05e23] text-white text-sm font-semibold">
              <Send className="w-4 h-4" />OK
            </button>
          </div>
          {submitError && <p className="text-xs text-red-500 text-center md:hidden">{submitError}</p>}
        </main>

        {/* RIGHT – Nav (hidden on mobile) */}
        <aside className="hidden md:flex w-48 bg-[#faf8f5] border-l border-[#e4ddd1] flex-col p-4 shrink-0">
          <div className="flex flex-col gap-2 mt-auto">
            <button onClick={goPrev} disabled={currentQ === 0}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#e4ddd1] text-sm text-[#5d5d5d] hover:bg-[#f3efe6] disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />Question précédente
            </button>
            <button onClick={goNext} disabled={currentQ === total - 1}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#e4ddd1] text-sm text-[#5d5d5d] hover:bg-[#f3efe6] disabled:opacity-40 transition-colors">
              Question suivante<ChevronRight className="w-4 h-4" />
            </button>
            <div className="border-t border-[#e4ddd1] my-1" />
            {submitError && (
              <p className="text-xs text-red-500 text-center mb-1">{submitError}</p>
            )}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#f05e23] hover:bg-[#d85118] text-white text-sm font-semibold transition-colors">
              <Send className="w-4 h-4" />Soumettre
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
