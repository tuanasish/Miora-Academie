"use client";
import { useState, useEffect } from "react";
import { Headphones, ChevronLeft, Play, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";

interface TestMeta {
  testNumber: number;
  slug: string;
  questionCount: number;
}

interface ExamData {
  data: {
    totalTests: number;
    tests: { testNumber: number; slug: string; questions: unknown[] }[];
  };
}

export default function ListeningSeriesPage() {
  const [tests, setTests] = useState<TestMeta[]>([]);
  const [loading, setLoading] = useState(true);
  // Track done series (per session, resets on refresh — will persist via Supabase later)
  const [done] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/data/listening.json")
      .then((r) => r.json())
      .then((json: ExamData) => {
        const meta = json.data.tests.map((t) => ({
          testNumber: t.testNumber,
          slug: t.slug,
          questionCount: t.questions.length,
        }));
        setTests(meta);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <span className="text-slate-300">|</span>
          <div>
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-sky-500" />
              <h1 className="font-bold text-slate-900">Compréhension de l&apos;Oral</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {tests.length} Séries · 39 questions/série · 35 min/série
            </p>
          </div>

          {/* Filter tabs  */}
          <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <button className="px-4 py-1.5 rounded-lg bg-white shadow-sm text-sm font-medium text-slate-800">
              Toutes
            </button>
            <button className="px-4 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-700">
              Terminées
            </button>
            <button className="px-4 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-700">
              Non terminées
            </button>
          </div>
        </div>
      </header>

      {/* Series grid */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => {
            const isDone = done.has(test.testNumber);
            return (
              <Link
                key={test.testNumber}
                href={`/exam/listening/${test.testNumber}`}
                className={`group relative bg-white rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 ${
                  isDone
                    ? "border-emerald-200 hover:border-emerald-300"
                    : "border-slate-200 hover:border-sky-300"
                }`}
              >
                {/* Status badge */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isDone
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-sky-100 text-sky-600 group-hover:bg-sky-200 transition-colors"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : test.testNumber}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      isDone
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    {isDone ? "Terminée ✓" : `${test.questionCount} questions`}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 mb-1">Série {test.testNumber}</h3>
                <p className="text-xs text-slate-400">39 questions · 35 min</p>

                {/* Play CTA */}
                <div
                  className={`mt-4 flex items-center gap-2 text-sm font-semibold ${
                    isDone ? "text-emerald-600" : "text-sky-600"
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isDone ? "Refaire" : "Commencer"}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-2xl bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
