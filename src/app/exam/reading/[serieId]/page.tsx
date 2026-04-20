"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { BookOpen, ChevronLeft, ChevronRight, Clock, Send, Flag, NotebookPen } from "lucide-react";
import { useCountdown } from "@/hooks/useTimer";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitExam } from "@/lib/submitExam";
import SubmitConfirmModal from "@/components/exam/SubmitConfirmModal";
import ScoreReveal from "@/components/exam/ScoreReveal";
import McqSubmissionReview from "@/components/exam/McqSubmissionReview";
import DeadlineNotice from "@/components/exam/DeadlineNotice";
import AssignmentNoteNotice from "@/components/exam/AssignmentNoteNotice";
import { useAssignmentDeadline } from "@/hooks/useAssignmentDeadline";

interface Question {
  id: number;
  orderIndex: number;
  level: string;
  points: number;
  prompt: string;
  imageUrl: string | null;
  options: string[];
  correctAnswerIndex: number;
}

interface ExamData {
  data: { tests: { testNumber: number; questions: Question[] }[] };
}

const TOTAL_SECONDS = 60 * 60;

export default function ReadingSerieExamPage() {
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
  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);
  const deadline = useAssignmentDeadline("reading", serieId);
  const [showNote, setShowNote] = useState(false);
  const [questionNotes, setQuestionNotes] = useState<Record<number, string>>({});

  const timer = useCountdown(TOTAL_SECONDS, true);

  useEffect(() => {
    fetch("/data/reading.json")
      .then((r) => r.json())
      .then((json: ExamData) => {
        const test = json.data.tests.find((t) => t.testNumber === serieId);
        if (!test) { setNotFound(true); setLoading(false); return; }
        setQuestions(test.questions);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [serieId]);

  // Load saved notes for this serie from localStorage
  useEffect(() => {
    if (!Number.isInteger(serieId) || serieId <= 0) return;
    if (typeof window === "undefined") return;

    const next: Record<number, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      const prefix = `note:reading:${serieId}:`;
      if (!key.startsWith(prefix)) continue;
      const qId = Number(key.slice(prefix.length));
      if (!Number.isInteger(qId)) continue;
      next[qId] = window.localStorage.getItem(key) ?? "";
    }
    setQuestionNotes(next);
  }, [serieId]);

  const q = questions[currentQ];
  const activeImageUrl = q?.imageUrl ?? null;
  const readingImageReady = activeImageUrl !== null && loadedImageUrl === activeImageUrl;

  /** Warm cache for câu liền kề (đổi câu thường tới trước/sau). */
  useEffect(() => {
    if (questions.length === 0) return;
    for (const offset of [1, 2, -1]) {
      const url = questions[currentQ + offset]?.imageUrl;
      if (!url) continue;
      const pre = new window.Image();
      pre.src = url;
    }
  }, [currentQ, questions]);

  const answered = Object.keys(answers).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  const timerColor = timer.seconds < 600 ? "text-red-600" : timer.seconds < 1200 ? "text-orange-500" : "text-[#3d3d3d]";
  const timerWarning = timer.seconds < 600 && timer.seconds > 0;

  const toggleFlag = useCallback(() => {
    if (!q) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ)) next.delete(currentQ);
      else next.add(currentQ);
      return next;
    });
  }, [q, currentQ]);

  const setNoteForQuestion = useCallback((questionId: number, value: string) => {
    setQuestionNotes((prev) => ({ ...prev, [questionId]: value }));
    if (typeof window !== "undefined") {
      try {
        const key = `note:reading:${serieId}:${questionId}`;
        if (!value.trim()) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, value);
      } catch {
        // ignore storage failures
      }
    }
  }, [serieId]);

  const goPrev = useCallback(() => setCurrentQ((c) => Math.max(0, c - 1)), []);
  const goNext = useCallback(() => setCurrentQ((c) => Math.min(total - 1, c + 1)), [total]);
  const selectAnswer = useCallback((idx: number) => {
    if (!q || idx >= q.options.length) return;
    setAnswers((prev) => ({ ...prev, [q.id]: idx }));
  }, [q]);

  useKeyboardNav({
    onSelectAnswer: selectAnswer, onPrev: goPrev, onNext: goNext, onFlag: toggleFlag,
    optionCount: q?.options.length ?? 4,
    enabled: !submitted && !loading && !showConfirmModal,
  });

  const handleSubmit = async () => {
    setSubmitting(true); setSubmitError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const totalScore = questions.reduce((sum, q2) => {
      return sum + (answers[q2.id] === q2.correctAnswerIndex ? (q2.points || 0) : 0);
    }, 0);
    const elapsed = TOTAL_SECONDS - timer.seconds;
    const answersMap: Record<string, string> = {};
    for (const [qId, aIdx] of Object.entries(answers)) {
      answersMap[qId] = ["A", "B", "C", "D"][aIdx];
    }
    const result = await submitExam({
      exam_type: "reading", serie_id: serieId,
      student_email: user?.email ?? "anonymous", student_id: user?.id ?? "",
      answers: answersMap, score: totalScore, time_spent_seconds: elapsed,
    });
    setSubmitting(false);
    if (result.success) { setSubmitted(true); setShowConfirmModal(false); }
    else setSubmitError(result.error ?? "Erreur inconnue");
  };

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
      <Link href="/exam/reading" className="text-[#f05e23] hover:underline">← Retour à la liste</Link>
    </div>
  );

  // ═══════════════════ SUBMITTED — Score Reveal ═══════════════════
  if (submitted) {
    const correctCount = questions.filter((q2) => answers[q2.id] === q2.correctAnswerIndex).length;
    const tcfScore = questions.reduce((sum, q2) => sum + (answers[q2.id] === q2.correctAnswerIndex ? (q2.points || 0) : 0), 0);
    return (
      <ScoreReveal serieId={serieId} correct={correctCount} total={total} tcfScore={tcfScore} examType="reading">
        <div className="max-w-3xl mx-auto px-4 mt-6 pb-8">
          <McqSubmissionReview
            questions={questions}
            userAnswerByQuestionId={answers}
            questionNotesById={questionNotes}
            variant="full"
            title="📋 Correction"
            animateRows
          />
        </div>
      </ScoreReveal>
    );
  }

  // ═══════════════════ ACTIVE EXAM ═══════════════════
  return (
    <div className="h-screen flex flex-col bg-[#f3efe6] overflow-hidden">
      {showConfirmModal && (
        <SubmitConfirmModal
          total={total} answeredCount={answered}
          unansweredIndices={unansweredIndices} flaggedIndices={flaggedIndices}
          onConfirm={handleSubmit} onCancel={() => setShowConfirmModal(false)}
          onJumpTo={(idx) => setCurrentQ(idx)} submitting={submitting}
        />
      )}

      <header className="bg-[#faf8f5] border-b border-[#e4ddd1] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/exam/reading" className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#3d3d3d] transition-colors shrink-0">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline">Liste</span>
          </Link>
          <span className="text-[#d7c9b8] hidden sm:inline">|</span>
          <BookOpen className="w-4 h-4 text-[#f05e23] shrink-0" />
          <h1 className="font-display font-bold text-[#3d3d3d] truncate">
            <span className="hidden md:inline">Compréhension Écrite — </span>Série {serieId}
          </h1>
          <AssignmentNoteNotice note={deadline.note} />
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold text-sm shrink-0 ${timerColor} ${timerWarning ? "anim-pulse-glow rounded-lg px-2 py-1" : ""}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
          {timer.isExpired && <span className="text-xs font-sans animate-pulse ml-1">⏰</span>}
        </div>
      </header>

      <div className="h-1.5 bg-[#e4ddd1] shrink-0">
        <div className="h-full bg-[#f05e23] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
        <aside className="hidden md:block w-48 bg-[#faf8f5] border-r border-[#e4ddd1] overflow-y-auto shrink-0">
          <div className="p-3 border-b border-[#e4ddd1]/50">
            <p className="text-xs font-semibold text-[#888] uppercase tracking-wider">{answered}/{total} répondues</p>
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
                {flagged.has(idx) && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#f05e23] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER */}
        <main className="flex-1 flex flex-col p-4 sm:p-6 gap-4 sm:gap-5 overflow-y-auto">
          <DeadlineNotice dueDateLabel={deadline.formattedDueDate} isOverdue={deadline.isOverdue} />

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
              Q{currentQ + 1}/{total}
            </span>
            <span className="text-xs bg-[#ede8dd] text-[#888] px-2.5 py-1 rounded-full">{q.level}</span>
            <span className="text-xs bg-violet-100 text-violet-600 px-2.5 py-1 rounded-full">{q.points} pts</span>
            <button onClick={toggleFlag}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${
                flagged.has(currentQ)
                  ? "bg-[#f05e23]/15 text-[#f05e23] font-semibold flag-anim"
                  : "bg-[#ede8dd] text-[#888] hover:text-[#f05e23]"
              }`}>
              <Flag className="w-3 h-3" />
              {flagged.has(currentQ) ? "Marquée" : "Marquer"}
            </button>
            <button
              type="button"
              onClick={() => setShowNote((v) => !v)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-all ${
                showNote
                  ? "bg-amber-100 text-amber-800 font-semibold"
                  : (questionNotes[q?.id ?? -1]?.trim()
                      ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                      : "bg-[#ede8dd] text-[#888] hover:text-amber-700")
              }`}
              disabled={!q}
            >
              <NotebookPen className="w-3 h-3" />
              Ghi chú
            </button>
            <span className="hidden lg:inline text-[10px] text-[#bbb] ml-auto">
              A/B/C/D · ←→ · F flag
            </span>
            <span className="text-xs text-[#888] md:hidden ml-auto">{answered}/{total}</span>
          </div>

          {q.imageUrl && (
            <div className="relative shrink-0 w-max max-w-full min-h-[120px] min-w-[8rem] rounded-xl overflow-hidden">
              {!readingImageReady && (
                <div
                  className="absolute inset-0 z-[1] animate-pulse bg-[#ede8dd]"
                  aria-hidden
                />
              )}
              <Image
                src={q.imageUrl}
                alt="Document de lecture"
                width={960}
                height={1280}
                priority
                quality={85}
                sizes="(max-width: 768px) min(100vw, 42rem), 560px"
                fetchPriority="high"
                className={`relative z-[2] block h-auto w-auto max-w-full max-h-[min(85vh,1600px)] object-contain transition-opacity duration-200 ${
                  readingImageReady ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setLoadedImageUrl(activeImageUrl)}
              />
            </div>
          )}

          <div className="bg-[#faf8f5] rounded-xl border border-[#e4ddd1] p-4 sm:p-5">
            <p className="text-[#3d3d3d] leading-relaxed text-sm sm:text-base">{q.prompt}</p>
          </div>

          {showNote && q && (
            <div className="bg-amber-50 rounded-xl border border-amber-200 p-3 sm:p-4">
              <label className="block text-xs font-semibold text-amber-800 mb-1">
                Ghi chú cho câu {currentQ + 1}
              </label>
              <textarea
                value={questionNotes[q.id] ?? ""}
                onChange={(e) => setNoteForQuestion(q.id, e.target.value)}
                placeholder="Nhập ghi chú của bạn cho câu này..."
                rows={3}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-950 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none transition resize-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl items-stretch">
            {q.options.map((opt, idx) => {
              const isSelected = answers[q.id] === idx;
              return (
                <button key={idx} onClick={() => selectAnswer(idx)}
                  className={`option-btn flex h-full min-h-[3rem] w-full items-start gap-2.5 text-left p-3 sm:p-4 rounded-xl border-2 text-sm font-medium ${
                    isSelected
                      ? "border-[#f05e23] bg-[#fffaf6] text-[#3d3d3d] shadow-sm anim-bounce-select"
                      : "border-[#e4ddd1] bg-[#faf8f5] text-[#5d5d5d] hover:border-[#f05e23]/50 hover:bg-[#fffaf6]"
                  }`}>
                  <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-bold leading-6 text-center ${
                    isSelected ? "bg-[#f05e23] text-white" : "bg-[#ede8dd] text-[#888]"
                  }`}>
                    {["A","B","C","D"][idx]}
                  </span>
                  <span className="min-w-0 flex-1 leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile nav */}
          <div className="flex items-center gap-2 md:hidden mt-2">
            <button onClick={goPrev} disabled={currentQ === 0}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-[#e4ddd1] text-sm text-[#5d5d5d] disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" />Préc.
            </button>
            <button onClick={goNext} disabled={currentQ === total - 1}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-[#e4ddd1] text-sm text-[#5d5d5d] disabled:opacity-40">
              Suiv.<ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setShowConfirmModal(true)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-[#f05e23] text-white text-sm font-semibold">
              <Send className="w-4 h-4" />OK
            </button>
          </div>
          {submitError && <p className="text-xs text-red-500 text-center md:hidden">{submitError}</p>}
        </main>

        {/* RIGHT */}
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
            {submitError && <p className="text-xs text-red-500 text-center mb-1">{submitError}</p>}
            <button onClick={() => setShowConfirmModal(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#f05e23] hover:bg-[#d85118] text-white text-sm font-semibold transition-colors">
              <Send className="w-4 h-4" />Soumettre
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
