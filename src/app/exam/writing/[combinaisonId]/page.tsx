"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  PenLine, ChevronLeft, Clock, Hash, Timer, Send, AlignLeft, CheckCircle2, Loader2,
} from "lucide-react";
import { useCountdown } from "@/hooks/useTimer";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { submitExam } from "@/lib/submitExam";
import DeadlineNotice from "@/components/exam/DeadlineNotice";
import AssignmentNoteNotice from "@/components/exam/AssignmentNoteNotice";
import { useAssignmentDeadline } from "@/hooks/useAssignmentDeadline";

const frenchKeys = [
  "à","â","ç","é","è","ê","ë","î","ï","ô","ù","û","ü","œ","æ",
  "À","Â","Ç","É","È","Ê","Ë","Î","Ï","Ô","Ù","Û","Ü","Œ","Æ",
];

interface WritingItem {
  id: number;
  titre: string;
  monthName: string;
  tache1Sujet: string;
  tache2Sujet: string;
  tache3Titre: string;
  tache3Document1: { contenu: string } | string | null;
  tache3Document2: { contenu: string } | string | null;
}

interface WritingData {
  data: { items: WritingItem[] };
}

const TASK_WORD_RANGES = [
  { min: 60, max: 120 },
  { min: 120, max: 150 },
  { min: 120, max: 180 },
] as const;

type WordRangeStatus = "low" | "ok" | "high";

function getWordRangeStatus(count: number, min: number, max: number): WordRangeStatus {
  if (count < min) return "low";
  if (count > max) return "high";
  return "ok";
}

function getDoc(v: { contenu: string } | string | null): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.contenu || "";
}

export default function WritingExamPage() {
  const params = useParams();
  const combinaisonId = Number(params.combinaisonId);

  const [item, setItem] = useState<WritingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(0);
  const [texts, setTexts] = useState(["", "", ""]);
  const [taskTimes, setTaskTimes] = useState([0, 0, 0]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const deadline = useAssignmentDeadline("writing", combinaisonId);

  const globalTimer = useCountdown(60 * 60, true);

  /** Mốc bắt đầu đoạn đang chạy của task hiện tại (giây thực). null = tạm dừng cho đến khi gõ lại (task cũ). */
  const sessionStartMsRef = useRef<number | null>(null);
  const [, setTick] = useState(0);

  const flushSessionIntoTaskTimes = useCallback((taskIndex: number) => {
    if (sessionStartMsRef.current == null) return;
    const add = Math.floor((Date.now() - sessionStartMsRef.current) / 1000);
    sessionStartMsRef.current = null;
    if (add <= 0) return;
    setTaskTimes((prev) => {
      const next = [...prev];
      next[taskIndex] += add;
      return next;
    });
  }, []);

  /** Giây hiển thị: thời gian đã cộng dồn + đoạn đang chạy (1 giây thật = +1, không gắn với từ/ký tự). */
  const secondsForTask = useCallback(
    (taskIndex: number) => {
      const base = taskTimes[taskIndex];
      if (taskIndex !== activeTask) return base;
      if (sessionStartMsRef.current == null) return base;
      return base + Math.floor((Date.now() - sessionStartMsRef.current) / 1000);
    },
    [taskTimes, activeTask],
  );

  const formatChrono = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

  useEffect(() => {
    fetch("/data/writing.json")
      .then((r) => r.json())
      .then((json: WritingData) => {
        const found = json.data.items.find((x) => x.id === combinaisonId);
        setItem(found || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [combinaisonId]);

  /** Bắt đầu bài: tâche hiện tại tự đếm theo thời gian thực. */
  useEffect(() => {
    if (!item || submitted) return;
    sessionStartMsRef.current = Date.now();
  }, [combinaisonId, submitted, item]);

  /** Re-render mỗi giây khi đang làm bài để đồng hồ chạy mượt. */
  useEffect(() => {
    if (!item || submitted) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [item, submitted]);

  const tasks = item
    ? [
        {
          id: 0,
          label: "Tâche 1",
          prompt: item.tache1Sujet,
          minWords: TASK_WORD_RANGES[0].min,
          maxWords: TASK_WORD_RANGES[0].max,
        },
        {
          id: 1,
          label: "Tâche 2",
          prompt: item.tache2Sujet,
          minWords: TASK_WORD_RANGES[1].min,
          maxWords: TASK_WORD_RANGES[1].max,
        },
        {
          id: 2,
          label: "Tâche 3",
          prompt: item.tache3Titre,
          doc1: getDoc(item.tache3Document1),
          doc2: getDoc(item.tache3Document2),
          minWords: TASK_WORD_RANGES[2].min,
          maxWords: TASK_WORD_RANGES[2].max,
        },
      ]
    : [];

  const handleTaskSwitch = (idx: number) => {
    if (idx === activeTask) return;

    flushSessionIntoTaskTimes(activeTask);

    const alreadyWorkedOnDestination = taskTimes[idx] > 0 || texts[idx].trim().length > 0;
    if (alreadyWorkedOnDestination) {
      sessionStartMsRef.current = null;
    } else {
      sessionStartMsRef.current = Date.now();
    }

    setActiveTask(idx);
  };

  const wordCount = (text: string) =>
    text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  /** Quay lại task cũ: đồng hừ đếm khi gõ/sửa lại. */
  const resumeSessionIfPaused = () => {
    if (sessionStartMsRef.current === null) {
      sessionStartMsRef.current = Date.now();
    }
  };

  const insertChar = (char: string) => {
    const taskIndex = activeTask;
    resumeSessionIfPaused();
    setTexts((prev) => {
      const n = [...prev];
      n[taskIndex] = (n[taskIndex] ?? "") + char;
      return n;
    });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  if (!item) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <p className="text-slate-500">La combinaison n&apos;existe pas.</p>
      <Link href="/exam/writing" className="text-violet-600 hover:underline">← Retour</Link>
    </div>
  );

  if (submitted) {
    const wc = texts.map(wordCount);
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center space-y-5">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-2xl font-bold text-slate-900">Soumission envoyée!</h2>
          <p className="text-slate-500 text-sm">{item.titre} — {item.monthName}</p>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-left">
            {["Tâche 1", "Tâche 2", "Tâche 3"].map((t, i) => {
              const status = getWordRangeStatus(wc[i], TASK_WORD_RANGES[i].min, TASK_WORD_RANGES[i].max);
              return (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-600">{t}</span>
                  <span
                    className={`font-bold ${
                      status === "ok" ? "text-emerald-600" : status === "high" ? "text-red-600" : "text-orange-500"
                    }`}
                  >
                    {wc[i]} mots ({TASK_WORD_RANGES[i].min}-{TASK_WORD_RANGES[i].max})
                  </span>
                </div>
              );
            })}
          </div>
          <Link href="/exam/writing" className="block text-violet-600 hover:underline text-sm">← Choisir une autre combinaison</Link>
        </div>
      </div>
    );
  }

  const task = tasks[activeTask];
  const wc = wordCount(texts[activeTask]);
  const minWords = task?.minWords || 60;
  const maxWords = task?.maxWords || 120;
  const wordRangeStatus = getWordRangeStatus(wc, minWords, maxWords);
  const timerColor = globalTimer.seconds < 300
    ? "bg-red-50 border-red-300 text-red-700"
    : globalTimer.seconds < 600
    ? "bg-orange-50 border-orange-200 text-orange-600"
    : "bg-violet-50 border-violet-200 text-violet-700";

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/exam/writing" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 shrink-0 transition-colors">
            <ChevronLeft className="w-4 h-4" />Liste
          </Link>
          <span className="text-slate-300 shrink-0">|</span>
          <PenLine className="w-4 h-4 text-violet-500 shrink-0" />
          <h1 className="font-bold text-slate-800 truncate">
            Expression Écrite — <span className="text-violet-600">{item.titre}</span>
            <span className="text-slate-400 font-normal ml-2 text-sm">{item.monthName}</span>
          </h1>
          <AssignmentNoteNotice note={deadline.note} />
        </div>
        <div className={`flex items-center gap-2 border font-mono font-bold px-4 py-1.5 rounded-full text-sm shrink-0 ${timerColor}`}>
          <Clock className="w-4 h-4" />
          {globalTimer.formatted}
          {globalTimer.isExpired && <span className="text-xs font-sans font-normal animate-pulse">Temps écoulé!</span>}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT Nav */}
        <aside className="w-48 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tâches</p>
          </div>
          <div className="flex flex-col p-3 gap-2">
            {tasks.map((t, idx) => {
              const thisTime = secondsForTask(idx);
              const mins = String(Math.floor(thisTime / 60)).padStart(2, "0");
              const secs = String(thisTime % 60).padStart(2, "0");
              const wc2 = wordCount(texts[idx]);
              return (
                <button
                  key={t.id}
                  onClick={() => handleTaskSwitch(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    activeTask === idx ? "bg-violet-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="font-semibold">{t.label}</div>
                  <div className={`text-xs mt-0.5 font-mono ${activeTask === idx ? "text-violet-200" : "text-slate-400"}`}>
                    ⏱ {mins}:{secs} · {wc2} mots
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-auto p-3 space-y-2">
            {submitError && (
              <p className="text-xs text-red-500 text-center">{submitError}</p>
            )}
            <button
              onClick={async () => {
                setSubmitting(true);
                setSubmitError(null);
                const finalTimes = [...taskTimes];
                if (sessionStartMsRef.current != null) {
                  finalTimes[activeTask] += Math.floor(
                    (Date.now() - sessionStartMsRef.current) / 1000,
                  );
                }
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                const wc = texts.map((t) => t.trim() === "" ? 0 : t.trim().split(/\s+/).length);
                const elapsed = 60 * 60 - globalTimer.seconds;
                const result = await submitExam({
                  exam_type: "writing",
                  combinaison_id: combinaisonId,
                  student_email: user?.email ?? "anonymous",
                  student_id: user?.id ?? "",
                  writing_task1: texts[0],
                  writing_task2: texts[1],
                  writing_task3: texts[2],
                  word_counts: { t1: wc[0], t2: wc[1], t3: wc[2] },
                  task_times: { t1: finalTimes[0], t2: finalTimes[1], t3: finalTimes[2] },
                  time_spent_seconds: elapsed,
                });
                setSubmitting(false);
                if (result.success) setSubmitted(true);
                else setSubmitError("Erreur d'enregistrement: " + result.error);
              }}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? "Enregistrement..." : "Soumettre"}
            </button>
          </div>
        </aside>

        {/* CENTER — min-h-0 + overflow-y-auto so Tâche 3 (long docs) can scroll to the textarea */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto px-3 md:px-6">
          {/* Prompt area */}
          <div className="shrink-0 pt-3">
            <div className="max-w-[980px] w-full mx-auto space-y-3">
              <DeadlineNotice dueDateLabel={deadline.formattedDueDate} isOverdue={deadline.isOverdue} />

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlignLeft className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                    Sujet — {task?.label}
                  </span>
                  <span className="ml-auto text-xs text-amber-600 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">
                    objectif {minWords}-{maxWords} mots
                  </span>
                </div>
                <p className="text-lg md:text-xl text-slate-900 leading-8 md:leading-9 font-semibold select-text cursor-text selection:bg-amber-200 selection:text-slate-900">
                  {activeTask === 2 ? (
                    <span className="font-bold text-slate-900">{task?.prompt}</span>
                  ) : (
                    task?.prompt
                  )}
                </p>
                {/* Task 3 documents */}
                {activeTask === 2 && tasks[2] && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {tasks[2].doc1 && (
                      <div className="bg-white border border-amber-200 rounded-xl p-4 text-base md:text-lg font-medium text-slate-800 leading-8 select-text cursor-text selection:bg-emerald-100 selection:text-slate-900">
                        <p className="text-base md:text-lg font-extrabold text-emerald-700 mb-2">Document POUR</p>
                        {tasks[2].doc1}
                      </div>
                    )}
                    {tasks[2].doc2 && (
                      <div className="bg-white border border-amber-200 rounded-xl p-4 text-base md:text-lg font-medium text-slate-800 leading-8 select-text cursor-text selection:bg-rose-100 selection:text-slate-900">
                        <p className="text-base md:text-lg font-extrabold text-red-600 mb-2">Document CONTRE</p>
                        {tasks[2].doc2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Text area — min height so it stays usable after long prompts; main scrolls if needed */}
          <div className="shrink-0 py-3 pb-8">
            <div className="max-w-[980px] w-full mx-auto">
              <textarea
                className="w-full min-h-[min(52vh,560px)] resize-y border border-slate-200 rounded-xl p-5 text-slate-900 text-base md:text-lg font-medium leading-8 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 selection:bg-violet-200 selection:text-slate-900"
                placeholder="Commencez à écrire ici..."
                value={texts[activeTask]}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  const taskIndex = activeTask;
                  resumeSessionIfPaused();
                  setTexts((prev) => {
                    const n = [...prev];
                    n[taskIndex] = nextValue;
                    return n;
                  });
                }}
              />
            </div>
          </div>
        </main>

        {/* RIGHT Panel */}
        <aside className="w-[340px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Stopwatch (auto: chỉ chạy khi gõ) */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Timer className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chrono de tâche</span>
            </div>
            <div className="text-2xl font-mono font-bold text-violet-700 text-center bg-violet-50 rounded-xl py-2">
              {formatChrono(secondsForTask(activeTask))}
            </div>
            <p className="mt-2 text-xs text-slate-400 text-center">
              Đếm thời gian thực (1 giây = 1 giây) · Task mới tự chạy · Quay lại task cũ: giữ thời gian đã lưu, gõ
              tiếp thì cộng thêm.
            </p>
          </div>

          {/* Word count */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de mots</span>
            </div>
            <div
              className={`text-3xl font-bold text-center ${
                wordRangeStatus === "ok"
                  ? "text-emerald-600"
                  : wordRangeStatus === "high"
                  ? "text-red-600"
                  : "text-orange-500"
              }`}
            >
              {wc}
            </div>
            <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  wordRangeStatus === "ok"
                    ? "bg-emerald-500"
                    : wordRangeStatus === "high"
                    ? "bg-red-500"
                    : "bg-orange-400"
                }`}
                style={{ width: `${Math.min(100, (wc / maxWords) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-center text-slate-400 mt-1">objectif: {minWords}-{maxWords} mots</p>
          </div>

          {/* French keyboard */}
          <div className="p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Clavier français</p>
            <div className="grid grid-cols-6 gap-2">
              {frenchKeys.map((char) => (
                <button
                  key={char}
                  onClick={() => insertChar(char)}
                  className="bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-700 font-medium text-sm py-2 rounded-lg transition-colors"
                >
                  {char}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
