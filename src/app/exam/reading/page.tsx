"use client";
import { useState, useEffect } from "react";
import { BookOpen, ChevronLeft, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface TestMeta {
  testNumber: number;
  questionCount: number;
}

interface ExamData {
  data: {
    totalTests: number;
    tests: { testNumber: number; questions: unknown[] }[];
  };
}

export default function ReadingSeriesPage() {
  const [tests, setTests] = useState<TestMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/data/reading.json")
      .then((r) => r.json())
      .then((json: ExamData) => {
        setTests(json.data.tests.map((t) => ({ testNumber: t.testNumber, questionCount: t.questions.length })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch completed séries from Supabase
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("exam_submissions")
        .select("serie_id")
        .eq("student_email", user.email ?? "")
        .eq("exam_type", "reading")
        .then(({ data }) => {
          if (data) {
            setDone(new Set(data.map((d) => d.serie_id as number).filter(Boolean)));
          }
        });
    });
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f3efe6]">
      <div className="w-10 h-10 border-4 border-[#f05e23]/30 border-t-[#f05e23] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f3efe6]">
      <header className="bg-[#faf8f5] border-b border-[#e4ddd1] px-6 py-4 sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#3d3d3d] transition-colors">
            <ChevronLeft className="w-4 h-4" />Retour
          </Link>
          <span className="text-[#d7c9b8]">|</span>
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#f05e23]" />
              <h1 className="font-bold text-[#3d3d3d]">Compréhension de l&apos;Écrit</h1>
            </div>
            <p className="text-xs text-[#888] mt-0.5">{tests.length} Séries · 39 questions/série · 60 min/série</p>
          </div>
          <div className="ml-auto flex items-center gap-1 bg-[#ede8dd] rounded-xl p-1">
            <button className="px-4 py-1.5 rounded-lg bg-[#faf8f5] shadow-sm text-sm font-medium text-[#3d3d3d]">Toutes</button>
            <button className="px-4 py-1.5 rounded-lg text-sm text-[#888] hover:text-[#3d3d3d]">Terminées</button>
            <button className="px-4 py-1.5 rounded-lg text-sm text-[#888] hover:text-[#3d3d3d]">Non terminées</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((test) => {
            const isDone = done.has(test.testNumber);
            return (
              <Link key={test.testNumber} href={`/exam/reading/${test.testNumber}`}
                className={`group relative bg-[#faf8f5] rounded-2xl border-2 p-5 hover:shadow-lg transition-all duration-200 ${
                  isDone ? "border-emerald-200 hover:border-emerald-300" : "border-[#e4ddd1] hover:border-[#f05e23]/40"
                }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    isDone ? "bg-emerald-100 text-emerald-600" : "bg-[#f05e23]/10 text-[#f05e23] group-hover:bg-[#f05e23]/20 transition-colors"
                  }`}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : test.testNumber}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    isDone ? "bg-emerald-50 text-emerald-600" : "bg-[#ede8dd] text-[#888]"
                  }`}>
                    {isDone ? "Terminée ✓" : `${test.questionCount} questions`}
                  </span>
                </div>
                <h3 className="font-bold text-[#3d3d3d] mb-1">Série {test.testNumber}</h3>
                <p className="text-xs text-[#888]">39 questions · 60 min</p>
                <div className={`mt-4 flex items-center gap-2 text-sm font-semibold ${isDone ? "text-emerald-600" : "text-[#f05e23]"}`}>
                  <Play className="w-4 h-4 fill-current" />
                  {isDone ? "Refaire" : "Commencer"}
                </div>
                <div className="absolute inset-0 rounded-2xl bg-[#f05e23]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
