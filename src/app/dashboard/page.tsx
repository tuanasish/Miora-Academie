"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap, Headphones, BookOpen, PenLine, Mic,
  LogOut, ClipboardList, CheckCircle2, Play,
  Calendar, AlertCircle, Loader2, FileText, ArrowRight,
  TrendingUp, Clock, Award, ChevronRight, Sparkles,
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
  admin_score: number | null;
  admin_feedback: string | null;
  graded_at: string | null;
}

// ─── Config ───────────────────────────────────────────────────────
const EXAM_META: Record<ExamType, {
  label: string; sublabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; border: string; href: string;
  detail: string; tagCls: string; accent: string;
}> = {
  listening: {
    label: "Compréhension de l'Oral", sublabel: "Compréhension orale",
    Icon: Headphones, color: "text-sky-600", bg: "bg-sky-50",
    border: "border-sky-200", href: "/exam/listening", detail: "35 min · 39 questions",
    tagCls: "bg-sky-100 text-sky-700", accent: "from-sky-500 to-sky-600",
  },
  reading: {
    label: "Compréhension de l'Écrit", sublabel: "Compréhension écrite",
    Icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50",
    border: "border-emerald-200", href: "/exam/reading", detail: "60 min · 29 questions",
    tagCls: "bg-emerald-100 text-emerald-700", accent: "from-emerald-500 to-emerald-600",
  },
  writing: {
    label: "Expression Écrite", sublabel: "Expression écrite",
    Icon: PenLine, color: "text-violet-600", bg: "bg-violet-50",
    border: "border-violet-200", href: "/exam/writing", detail: "60 min · 3 tâches",
    tagCls: "bg-violet-100 text-violet-700", accent: "from-violet-500 to-violet-600",
  },
  speaking: {
    label: "Expression Orale", sublabel: "Expression orale",
    Icon: Mic, color: "text-rose-600", bg: "bg-rose-50",
    border: "border-rose-200", href: "/exam/speaking", detail: "7 min · 2 tâches",
    tagCls: "bg-rose-100 text-rose-700", accent: "from-rose-500 to-rose-600",
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
  const [userRole, setUserRole] = useState<"admin" | "student">("student");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setUserEmail(user.email ?? "");

    const [{ data: profile }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
      supabase.from("exam_submissions")
        .select("id, exam_type, submitted_at, score, combinaison_id, serie_id, partie_id, word_counts, time_spent_seconds, admin_score, admin_feedback, graded_at")
        .eq("student_email", user.email ?? "")
        .order("submitted_at", { ascending: false }),
    ]);

    const role = (profile?.role as "admin" | "student") ?? "student";
    setUserRole(role);
    setUserName(profile?.full_name ?? "");
    setSubmissions(subs ?? []);

    if (role === "admin") {
      const { data: allAssigns } = await supabase
        .from("exam_assignments")
        .select("*")
        .order("assigned_at", { ascending: false });
      setAssignments(allAssigns ?? []);
    } else {
      const { data: myAssigns } = await supabase
        .from("exam_assignments")
        .select("*")
        .eq("student_email", user.email ?? "")
        .order("assigned_at", { ascending: false });
      setAssignments(myAssigns ?? []);
    }

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
    <div className="h-screen flex items-center justify-center bg-[#f3efe6]">
      <Loader2 className="w-8 h-8 text-[#f05e23] animate-spin" />
    </div>
  );

  const pendingAssignments = assignments.filter((a) => !isSubmitted(a));
  const completedCount = submissions.length;
  const avgScore = submissions.filter(s => s.score !== null).length > 0
    ? Math.round(submissions.filter(s => s.score !== null).reduce((acc, s) => acc + (s.score ?? 0), 0) / submissions.filter(s => s.score !== null).length)
    : null;
  const totalTime = submissions.reduce((acc, s) => acc + (s.time_spent_seconds ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#f3efe6]">
      {/* ══════════ HEADER ══════════ */}
      <header className="bg-[#faf8f5] border-b border-[#e4ddd1] sticky top-0 z-10 shadow-[0_1px_8px_rgba(0,0,0,0.05)]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#f05e23] to-[#d85118] p-2.5 rounded-xl shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-[#3d3d3d] leading-tight">Miora Académie</h1>
              <p className="text-[10px] text-[#aaa] tracking-wide uppercase">Préparation TCF</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {userRole === "admin" && (
              <Link href="/admin" className="text-xs font-semibold text-[#f05e23] bg-[#f05e23]/10 px-3 py-1.5 rounded-lg hover:bg-[#f05e23]/20 transition-colors">
                🔧 Admin
              </Link>
            )}
            <div className="text-right hidden sm:block">
              {userName && <p className="text-sm font-semibold text-[#3d3d3d]">{userName}</p>}
              <p className="text-[11px] text-[#aaa]">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[#bbb] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 pb-12 space-y-8">

        {/* ══════════ HERO / WELCOME ══════════ */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#faf8f5] to-[#f3efe6] rounded-3xl border border-[#e4ddd1] p-8 sm:p-10">
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#f05e23]/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-violet-400/5 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#f05e23]" />
                <span className="text-xs font-semibold text-[#f05e23] uppercase tracking-wider">Tableau de bord</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-[#3d3d3d]">
                Bonjour{userName ? `, ${userName.split(" ")[0]}` : ""} 👋
              </h2>
              <p className="text-[#888] mt-2 text-sm leading-relaxed max-w-lg">
                {pendingAssignments.length > 0
                  ? `Vous avez ${pendingAssignments.length} examen${pendingAssignments.length > 1 ? "s" : ""} en attente. Bonne préparation !`
                  : "Tous vos examens sont à jour. Continuez votre préparation !"
                }
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3 shrink-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e4ddd1]/50 px-4 py-3 text-center min-w-[80px] shadow-sm">
                <div className="text-2xl font-display font-extrabold text-[#f05e23]">{completedCount}</div>
                <div className="text-[10px] text-[#888] font-medium uppercase tracking-wide mt-0.5">Soumis</div>
              </div>
              {avgScore !== null && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e4ddd1]/50 px-4 py-3 text-center min-w-[80px] shadow-sm">
                  <div className="text-2xl font-display font-extrabold text-emerald-600">{avgScore}</div>
                  <div className="text-[10px] text-[#888] font-medium uppercase tracking-wide mt-0.5">Score moy.</div>
                </div>
              )}
              {totalTime > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#e4ddd1]/50 px-4 py-3 text-center min-w-[80px] shadow-sm">
                  <div className="text-2xl font-display font-extrabold text-violet-600">{Math.round(totalTime / 60)}</div>
                  <div className="text-[10px] text-[#888] font-medium uppercase tracking-wide mt-0.5">Min total</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ EXAM MODULES GRID ══════════ */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap className="w-5 h-5 text-[#f05e23]" />
            <h3 className="font-display font-bold text-[#3d3d3d] text-lg">Épreuves TCF</h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.entries(EXAM_META) as [ExamType, typeof EXAM_META[ExamType]][]).map(([type, meta]) => {
              const Icon = meta.Icon;
              const typeSubmissions = submissions.filter(s => s.exam_type === type);
              const count = typeSubmissions.length;
              return (
                <Link
                  key={type}
                  href={meta.href}
                  className="group relative bg-[#faf8f5] rounded-2xl border border-[#e4ddd1] p-5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${meta.bg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-5 h-5 ${meta.color}`} />
                  </div>
                  <h4 className="font-display font-bold text-[#3d3d3d] text-sm leading-tight">{meta.label}</h4>
                  <p className="text-[11px] text-[#aaa] mt-1.5">{meta.detail}</p>

                  {/* Submission count */}
                  {count > 0 && (
                    <div className="mt-3 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span className="text-[11px] text-emerald-600 font-medium">{count} soumission{count > 1 ? "s" : ""}</span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#f05e23] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-3 h-3 fill-current" />
                    Commencer
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ══════════ TWO-COLUMN LAYOUT ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT: Assignments (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            {/* ── ASSIGNED EXAMS ── */}
            {assignments.length > 0 ? (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-[#f05e23]" />
                    <h3 className="font-display font-bold text-[#3d3d3d] text-lg">Examens assignés</h3>
                  </div>
                  {pendingAssignments.length > 0 && (
                    <span className="bg-[#f05e23] text-white text-[11px] font-bold px-2.5 py-1 rounded-full animate-pulse">
                      {pendingAssignments.length} en attente
                    </span>
                  )}
                </div>

                <div className="space-y-3">
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
                        className={`bg-[#faf8f5] rounded-2xl border p-4 sm:p-5 transition-all ${
                          done ? "border-emerald-200/80 opacity-70" : overdue ? "border-red-300 bg-red-50/20" : "border-[#e4ddd1] hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`p-2.5 rounded-xl shrink-0 ${done ? "bg-emerald-100" : meta.bg}`}>
                              {done ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Icon className={`w-5 h-5 ${meta.color}`} />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${done ? "bg-emerald-100 text-emerald-700" : meta.tagCls}`}>
                                  {meta.sublabel}
                                </span>
                                {done && (
                                  <span className="text-[11px] text-emerald-600 font-semibold">✓ Soumis</span>
                                )}
                                {overdue && (
                                  <span className="text-[11px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                    <AlertCircle className="w-3 h-3" />En retard
                                  </span>
                                )}
                              </div>
                              <p className="font-display font-bold text-[#3d3d3d] mt-1 text-sm">{a.exam_label ?? meta.label}</p>
                              {a.note && (
                                <p className="text-xs text-[#888] italic mt-0.5 line-clamp-1">📝 {a.note}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2 text-[11px] text-[#aaa]">
                                <span>Assigné le {fmtDate(a.assigned_at)}</span>
                                {a.due_date && (
                                  <span className={`flex items-center gap-1 font-semibold ${overdue ? "text-red-500" : "text-[#f05e23]"}`}>
                                    <Calendar className="w-3 h-3" />
                                    {a.due_date}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* CTA */}
                          {!done && hasTarget && (
                            <Link
                              href={href}
                              className="flex items-center gap-1.5 bg-[#f05e23] hover:bg-[#d85118] font-semibold text-xs text-white px-4 py-2.5 rounded-xl transition-all shrink-0 shadow-sm hover:shadow-md"
                            >
                              Commencer <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          {!done && !hasTarget && (
                            <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 shrink-0">
                              ID manquant
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : userRole !== "admin" ? (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="w-5 h-5 text-[#f05e23]" />
                  <h3 className="font-display font-bold text-[#3d3d3d] text-lg">Examens assignés</h3>
                </div>
                <div className="bg-[#faf8f5] rounded-2xl border border-[#e4ddd1] p-10 text-center">
                  <ClipboardList className="w-10 h-10 mx-auto text-[#d7c9b8] mb-3" />
                  <p className="text-sm font-display font-semibold text-[#3d3d3d]">Aucun examen assigné pour le moment.</p>
                  <p className="text-xs text-[#aaa] mt-1">Contactez un administrateur pour recevoir une attribution.</p>
                </div>
              </section>
            ) : null}
          </div>

          {/* RIGHT: Submission history (2 cols) */}
          <div className="lg:col-span-2">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#f05e23]" />
                  <h3 className="font-display font-bold text-[#3d3d3d] text-lg">Historique</h3>
                </div>
                {submissions.length > 0 && (
                  <span className="text-[11px] text-[#aaa] font-medium">{submissions.length} résultat{submissions.length > 1 ? "s" : ""}</span>
                )}
              </div>

              {submissions.length > 0 ? (
                <div className="bg-[#faf8f5] rounded-2xl border border-[#e4ddd1] overflow-hidden divide-y divide-[#e4ddd1]/40">
                  {submissions.slice(0, 10).map((s) => {
                    const meta = EXAM_META[s.exam_type];
                    const Icon = meta.Icon;
                    const ref = s.combinaison_id ? `Comb. ${s.combinaison_id}`
                      : s.partie_id ? `P. ${s.partie_id}`
                      : s.serie_id ? `S. ${s.serie_id}` : null;
                    const maxScore = s.exam_type === 'listening' ? 39 : s.exam_type === 'reading' ? 29 : 25;

                    return (
                      <div key={s.id} className="px-4 py-3.5 hover:bg-[#f3efe6]/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg shrink-0 ${meta.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-[#3d3d3d] text-xs">{meta.sublabel}</p>
                              {ref && <span className="text-[10px] text-[#bbb]">· {ref}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#bbb]">
                              <span>{fmtDate(s.submitted_at)}</span>
                              {fmtTime(s.time_spent_seconds) && <span>⏱ {fmtTime(s.time_spent_seconds)}</span>}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {s.admin_score !== null && s.admin_score !== undefined ? (
                              <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                                {s.admin_score}/{maxScore}
                              </span>
                            ) : s.score !== null ? (
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                {s.score}/{maxScore}
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                                ⏳ En attente
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Admin feedback */}
                        {s.admin_feedback && (
                          <div className="mt-2 ml-9 bg-violet-50/80 rounded-lg px-3 py-2">
                            <p className="text-[10px] text-violet-500 font-bold uppercase mb-0.5">💬 Professeur</p>
                            <p className="text-[11px] text-violet-800 leading-relaxed line-clamp-2">{s.admin_feedback}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {submissions.length > 10 && (
                    <div className="px-4 py-3 text-center">
                      <span className="text-xs text-[#aaa]">+ {submissions.length - 10} autres résultats</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#faf8f5] rounded-2xl border border-[#e4ddd1] p-8 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto text-[#d7c9b8] mb-2" />
                  <p className="text-xs text-[#aaa]">Vos résultats apparaîtront ici</p>
                </div>
              )}
            </section>

            {/* Quick stats cards */}
            {submissions.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="bg-[#faf8f5] rounded-xl border border-[#e4ddd1] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] text-[#aaa] font-semibold uppercase tracking-wide">Meilleur</span>
                  </div>
                  <p className="font-display font-extrabold text-[#3d3d3d] text-xl">
                    {Math.max(...submissions.filter(s => s.score !== null).map(s => s.score ?? 0))}
                  </p>
                  <p className="text-[10px] text-[#bbb] mt-0.5">score max</p>
                </div>
                <div className="bg-[#faf8f5] rounded-xl border border-[#e4ddd1] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-sky-500" />
                    <span className="text-[10px] text-[#aaa] font-semibold uppercase tracking-wide">Temps</span>
                  </div>
                  <p className="font-display font-extrabold text-[#3d3d3d] text-xl">
                    {totalTime > 3600 ? `${Math.floor(totalTime / 3600)}h${Math.round((totalTime % 3600) / 60)}` : `${Math.round(totalTime / 60)}m`}
                  </p>
                  <p className="text-[10px] text-[#bbb] mt-0.5">temps total</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Empty state */}
        {assignments.length === 0 && submissions.length === 0 && userRole !== "admin" && (
          <div className="text-center py-16 text-[#aaa]">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-display font-semibold text-[#3d3d3d]">Bienvenue sur Miora Académie</p>
            <p className="text-xs mt-1">Contactez votre enseignant pour recevoir vos premiers examens.</p>
          </div>
        )}
      </main>
    </div>
  );
}
