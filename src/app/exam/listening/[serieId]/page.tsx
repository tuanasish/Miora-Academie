"use client";
import { useState, useEffect } from "react";
import {
  Headphones, ChevronLeft, ChevronRight, Clock, CheckCircle2, Send, Volume2, ArrowLeft,
} from "lucide-react";
import { useCountdown } from "@/hooks/useTimer";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  const [notFound, setNotFound] = useState(false);

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
    timer.seconds < 300 ? "text-red-600" : timer.seconds < 600 ? "text-orange-500" : "text-sky-600";

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500">Série {serieId} không tồn tại.</p>
      <Link href="/exam/listening" className="text-sky-600 hover:underline">← Quay lại danh sách</Link>
    </div>
  );

  if (submitted) {
    const correctCount = questions.filter((q2) => answers[q2.id] === q2.correctAnswerIndex).length;
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Série {serieId} — Terminée!</h2>
          <p className="text-slate-500 text-sm">Kết quả (tạm tính)</p>
          <div className="text-5xl font-bold text-sky-600">{correctCount}/{total}</div>
          <p className="text-sm text-slate-400">câu đúng</p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/exam/listening"
              className="flex items-center gap-2 text-sm text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" />Danh sách Séries
            </Link>
            {serieId < 40 && (
              <Link href={`/exam/listening/${serieId + 1}`}
                className="flex items-center gap-2 text-sm bg-sky-600 text-white rounded-xl px-4 py-2 hover:bg-sky-700">
                Série {serieId + 1}<ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/exam/listening"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />Danh sách
          </Link>
          <span className="text-slate-300">|</span>
          <Headphones className="w-4 h-4 text-sky-500" />
          <h1 className="font-bold text-slate-800">
            Compréhension Orale — <span className="text-sky-600">Série {serieId}</span>
          </h1>
        </div>
        <div className={`flex items-center gap-2 font-mono font-bold text-sm ${timerColor}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
          {timer.isExpired && <span className="text-xs font-sans animate-pulse ml-1">⏰ Hết giờ!</span>}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 shrink-0">
        <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT – Question grid */}
        <aside className="w-48 bg-white border-r border-slate-200 overflow-y-auto shrink-0">
          <div className="p-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {answered}/{total} đã trả lời
            </p>
          </div>
          <div className="p-2 grid grid-cols-5 gap-1">
            {questions.map((q2, idx) => (
              <button key={q2.id} onClick={() => setCurrentQ(idx)}
                className={`w-full aspect-square text-xs font-medium rounded-lg transition-all ${
                  currentQ === idx ? "bg-sky-600 text-white shadow"
                  : answers[q2.id] !== undefined ? "bg-sky-100 text-sky-700"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}>
                {idx + 1}
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER – Question */}
        <main className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto">
          {/* Tags */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full">
              Question {currentQ + 1} / {total}
            </span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
              {q.level}
            </span>
            <span className="text-xs bg-violet-100 text-violet-600 px-2.5 py-1 rounded-full">
              {q.points} pts
            </span>
          </div>

          {/* Audio */}
          {q.audioUrl && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-sky-600 shrink-0" />
              <audio controls className="flex-1 h-9" src={q.audioUrl} />
            </div>
          )}

          {/* Image */}
          {q.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 max-w-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.imageUrl} alt="Question" className="w-full object-cover" />
            </div>
          )}

          {/* Prompt */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-slate-800 leading-relaxed">{q.prompt}</p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-3 max-w-2xl">
            {q.options.filter(Boolean).map((opt, idx) => {
              const isSelected = answers[q.id] === idx;
              return (
                <button key={idx} onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                    isSelected
                      ? "border-sky-500 bg-sky-50 text-sky-900 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50/50"
                  }`}>
                  <span className={`inline-block w-6 h-6 rounded-full text-xs font-bold text-center leading-6 mr-3 ${
                    isSelected ? "bg-sky-500 text-white" : "bg-slate-100 text-slate-500"
                  }`}>
                    {["A","B","C","D"][idx]}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </main>

        {/* RIGHT – Nav */}
        <aside className="w-48 bg-white border-l border-slate-200 flex flex-col p-4 shrink-0">
          <div className="flex flex-col gap-2 mt-auto">
            <button onClick={() => setCurrentQ((c) => Math.max(0, c - 1))} disabled={currentQ === 0}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <ChevronLeft className="w-4 h-4" />Câu trước
            </button>
            <button onClick={() => setCurrentQ((c) => Math.min(total - 1, c + 1))} disabled={currentQ === total - 1}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              Câu sau<ChevronRight className="w-4 h-4" />
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button onClick={() => setSubmitted(true)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors">
              <Send className="w-4 h-4" />Nộp bài
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
