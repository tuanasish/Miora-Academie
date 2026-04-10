"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap, Headphones, BookOpen, PenLine, Mic,
  LogOut, ClipboardList, CheckCircle2,
  Calendar, AlertCircle, Loader2, FileText, ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────
type ExamType = "listening" | "reading" | "writing" | "speaking";

interface Assignment {
  id: string;
  exam_type: ExamType;
  exam_label: string | null;
  serie_id: number | null;
  combinaison_id: number | null;
  partie_id: number | null;
  due_date: string | null;
  note: string | null;
  assigned_at: string;
}

interface Submission {
  id: string;
  exam_type: ExamType;
  submitted_at: string;
  score: number | null;
  combinaison_id: number | null;
  serie_id: number | null;
  partie_id: number | null;
  word_counts: { t1: number; t2: number; t3: number } | null;
  time_spent_seconds: number | null;
}

// ─── Config ───────────────────────────────────────────────────────
const EXAM_META: Record<ExamType, {
  label: string; sublabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; border: string; href: string;
  detail: string;
}> = {
  listening: {
    label: "Compréhension de l'Oral", sublabel: "Compréhension orale",
    Icon: Headphones, color: "text-sky-600", bg: "bg-sky-100",
    border: "border-sky-200", href: "/exam/listening", detail: "35 min · 39 questions",
  },
  reading: {
    label: "Compréhension de l'Écrit", sublabel: "Compréhension écrite",
    Icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-100",
    border: "border-emerald-200", href: "/exam/reading", detail: "60 min · 29 questions",
  },
  writing: {
    label: "Expression Écrite", sublabel: "Expression écrite",
    Icon: PenLine, color: "text-violet-600", bg: "bg-violet-100",
    border: "border-violet-200", href: "/exam/writing", detail: "60 min · 3 tâches",
  },
  speaking: {
    label: "Expression Orale", sublabel: "Expression orale",
    Icon: Mic, color: "text-rose-600", bg: "bg-rose-100",
    border: "border-rose-200", href: "/exam/speaking", detail: "7 min · 2 tâches",
  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtTime(sec: number | null) {
  if (!sec) return null;
  return `${Math.floor(sec / 60)}m${sec % 60}s`;
}
function isOverdue(due: string | null) {
  if (!due) return false;
  return new Date(due) < new Date();
}

function buildExamHref(a: Assignment): string {
  const base = EXAM_META[a.exam_type].href;
  if (a.exam_type === "writing" && a.combinaison_id) return `${base}/${a.combinaison_id}`;
  if (a.exam_type === "speaking" && a.partie_id) return `${base}/${a.partie_id}`;
  if ((a.exam_type === "listening" || a.exam_type === "reading") && a.serie_id) return `${base}/${a.serie_id}`;
  return base;
}

function hasAssignedTarget(a: Assignment) {
  if (a.exam_type === "writing") return Boolean(a.combinaison_id);
  if (a.exam_type === "speaking") return Boolean(a.partie_id);
  return Boolean(a.serie_id);
}

// ─── Main ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserEmail(user.email ?? "");

    const [{ data: profile }, { data: assigns }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase.from("exam_assignments")
        .select("*")
        .eq("student_email", user.email ?? "")
        .order("assigned_at", { ascending: false }),
      supabase.from("exam_submissions")
        .select("id, exam_type, submitted_at, score, combinaison_id, serie_id, partie_id, word_counts, time_spent_seconds")
        .eq("student_email", user.email ?? "")
        .order("submitted_at", { ascending: false }),
    ]);

    setUserName(profile?.full_name ?? "");
    setAssignments(assigns ?? []);
    setSubmissions(subs ?? []);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    const timer = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Check if assignment already submitted
  const isSubmitted = (a: Assignment) => {
    return submissions.some((s) => {
      if (s.exam_type !== a.exam_type) return false;
      if (a.combinaison_id && s.combinaison_id === a.combinaison_id) return true;
      if (a.partie_id && s.partie_id === a.partie_id) return true;
      if (a.serie_id && s.serie_id === a.serie_id) return true;
      return false;
    });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  const pendingAssignments = assignments.filter((a) => !isSubmitted(a));
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Miora Académie</h1>
              <p className="text-xs text-slate-400">Plateforme d&apos;examen TCF</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              {userName && <p className="text-sm font-semibold text-slate-800">{userName}</p>}
              <p className="text-xs text-slate-400">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors border border-slate-200 rounded-lg px-3 py-1.5"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Bonjour{userName ? `, ${userName}` : ""} 👋
          </h2>
          <p className="text-slate-500 mt-1">Voici vos examens assignés et votre historique de soumission.</p>
        </div>

        {/* ── ASSIGNED EXAMS ── */}
        {assignments.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-slate-800 text-lg">Examens assignés</h3>
              {pendingAssignments.length > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingAssignments.length} en attente
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {assignments.map((a) => {
                const meta = EXAM_META[a.exam_type];
                const Icon = meta.Icon;
                const done = isSubmitted(a);
                const overdue = !done && isOverdue(a.due_date);
                const href = buildExamHref(a);
                const hasTarget = hasAssignedTarget(a);

                return (
                  <div
                    key={a.id}
                    className={`bg-white rounded-2xl border-2 p-5 transition-all ${
                      done ? "border-emerald-200 opacity-75" : overdue ? "border-red-200" : meta.border
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left info */}
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={`p-2.5 rounded-xl shrink-0 ${done ? "bg-emerald-100" : meta.bg}`}>
                          {done ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Icon className={`w-5 h-5 ${meta.color}`} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-xs font-bold uppercase tracking-wider ${done ? "text-emerald-600" : meta.color}`}>
                              {meta.sublabel}
                            </p>
                            {done && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                                ✓ Soumis
                              </span>
                            )}
                            {overdue && (
                              <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />En retard
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-slate-900 mt-0.5">{a.exam_label ?? meta.label}</p>
                          {a.note && (
                            <p className="text-sm text-slate-500 italic mt-0.5">{a.note}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span>Assigné le {fmtDate(a.assigned_at)}</span>
                            {a.due_date && (
                              <span className={`flex items-center gap-1 font-semibold ${overdue ? "text-red-500" : "text-orange-500"}`}>
                                <Calendar className="w-3 h-3" />
                                Date limite: {a.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      {!done && hasTarget && (
                        <Link
                          href={href}
                          className={`flex items-center gap-2 ${meta.color.replace("text-", "bg-").replace("600", "600")} bg-opacity-10 hover:bg-opacity-20 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shrink-0 border ${meta.border}`}
                          style={{ color: "inherit" }}
                        >
                          <span className={meta.color}>Commencer</span>
                          <ArrowRight className={`w-4 h-4 ${meta.color}`} />
                        </Link>
                      )}
                      {!done && !hasTarget && (
                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 shrink-0">
                          ID manquant
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── No assignments ── */}
        {assignments.length === 0 && (
          <section>
            <h3 className="font-bold text-slate-800 text-lg mb-4">Examens assignés</h3>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <ClipboardList className="w-9 h-9 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold text-slate-700">Aucun examen assigné pour le moment.</p>
              <p className="text-xs text-slate-400 mt-1">Contactez un administrateur pour recevoir une attribution.</p>
            </div>
          </section>
        )}

        {/* ── SUBMISSION HISTORY ── */}
        {submissions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800 text-lg">Historique des soumissions</h3>
              <span className="ml-1 bg-slate-100 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
                {submissions.length} soumissions
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {submissions.map((s) => {
                  const meta = EXAM_META[s.exam_type];
                  const Icon = meta.Icon;
                  const ref = s.combinaison_id ? `Combinaison ${s.combinaison_id}`
                    : s.partie_id ? `Partie ${s.partie_id}`
                    : s.serie_id ? `Série ${s.serie_id}` : null;

                  return (
                    <div key={s.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50">
                      <div className={`p-2 rounded-lg shrink-0 ${meta.bg}`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-800 text-sm">{meta.sublabel}</p>
                          {ref && <span className="text-xs text-slate-400">· {ref}</span>}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                          <span>{fmtDate(s.submitted_at)}</span>
                          {fmtTime(s.time_spent_seconds) && <span>⏱ {fmtTime(s.time_spent_seconds)}</span>}
                          {s.exam_type === "writing" && s.word_counts && (
                            <span>
                              {s.word_counts.t1 + s.word_counts.t2 + s.word_counts.t3} mots au total
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        {s.score !== null && (
                          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            {s.score}/50
                          </span>
                        )}
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {assignments.length === 0 && submissions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun examen assigné pour le moment. Contactez votre enseignant.</p>
          </div>
        )}
      </main>
    </div>
  );
}
