"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GraduationCap, Headphones, BookOpen, PenLine, Mic,
  LogOut, ClipboardList, CheckCircle2, Play,
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
  admin_score: number | null;
  admin_feedback: string | null;
  graded_at: string | null;
}

// ─── Config ───────────────────────────────────────────────────────
const EXAM_META: Record<ExamType, {
  label: string; sublabel: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string; bg: string; border: string; href: string;
  detail: string; tagCls: string;
}> = {
  listening: {
    label: "Compréhension de l'Oral", sublabel: "Compréhension orale",
    Icon: Headphones, color: "text-[#f05e23]", bg: "bg-[#f05e23]/10",
    border: "border-[#e4ddd1]", href: "/exam/listening", detail: "35 min · 39 questions",
    tagCls: "bg-sky-100 text-sky-700",
  },
  reading: {
    label: "Compréhension de l'Écrit", sublabel: "Compréhension écrite",
    Icon: BookOpen, color: "text-[#f05e23]", bg: "bg-[#f05e23]/10",
    border: "border-[#e4ddd1]", href: "/exam/reading", detail: "60 min · 29 questions",
    tagCls: "bg-emerald-100 text-emerald-700",
  },
  writing: {
    label: "Expression Écrite", sublabel: "Expression écrite",
    Icon: PenLine, color: "text-[#f05e23]", bg: "bg-[#f05e23]/10",
    border: "border-[#e4ddd1]", href: "/exam/writing", detail: "60 min · 3 tâches",
    tagCls: "bg-violet-100 text-violet-700",
  },
  speaking: {
    label: "Expression Orale", sublabel: "Expression orale",
    Icon: Mic, color: "text-[#f05e23]", bg: "bg-[#f05e23]/10",
    border: "border-[#e4ddd1]", href: "/exam/speaking", detail: "7 min · 2 tâches",
    tagCls: "bg-rose-100 text-rose-700",
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

    // Admin: fetch ALL assignments to see everything
    // Student: only fetch their own
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
    <div className="h-screen flex items-center justify-center bg-[#f3efe6]">
      <Loader2 className="w-8 h-8 text-[#f05e23] animate-spin" />
    </div>
  );

  const pendingAssignments = assignments.filter((a) => !isSubmitted(a));
  return (
    <div className="min-h-screen bg-[#f3efe6]">
      {/* Header */}
      <header className="bg-[#f3efe6] border-b border-[#e4ddd1] px-6 py-4 sticky top-0 z-10 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#f05e23] p-2 rounded-xl">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-[#3d3d3d]">Miora Académie</h1>
              <p className="text-xs text-[#888]">Plateforme d&apos;examen TCF</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              {userName && <p className="text-sm font-semibold text-[#3d3d3d]">{userName}</p>}
              <p className="text-xs text-[#888]">{userEmail}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-[#5d5d5d] hover:text-red-600 transition-colors border border-[#e4ddd1] rounded-lg px-3 py-1.5"
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
          <h2 className="text-2xl font-bold text-[#3d3d3d]">
            Bonjour{userName ? `, ${userName}` : ""} 👋
          </h2>
          <p className="text-[#888] mt-1">
            {userRole === "admin"
              ? "Accédez à toutes les épreuves et consultez les attributions."
              : "Voici vos examens assignés et votre historique de soumission."
            }
          </p>
        </div>

        {/* ── ADMIN: Quick Access to All Exams ── */}
        {userRole === "admin" && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-[#f05e23]" />
              <h3 className="font-bold text-[#3d3d3d] text-lg">Accès direct aux épreuves</h3>
              <span className="ml-1 bg-[#f05e23]/10 text-[#f05e23] text-xs font-bold px-2 py-0.5 rounded-full">Admin</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.entries(EXAM_META) as [ExamType, typeof EXAM_META[ExamType]][]).map(([type, meta]) => {
                const Icon = meta.Icon;
                return (
                  <Link
                    key={type}
                    href={meta.href}
                    className={`group relative bg-[#faf8f5] rounded-2xl border-2 ${meta.border} p-5 hover:shadow-lg hover:border-[#f05e23]/30 transition-all duration-200`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${meta.bg} group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <h4 className="font-bold text-[#3d3d3d] text-sm">{meta.label}</h4>
                    <p className="text-xs text-[#888] mt-1">{meta.detail}</p>
                    <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${meta.color}`}>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Voir toutes les séries
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-[#f05e23]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── ASSIGNED EXAMS ── */}
        {assignments.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-[#f05e23]" />
              <h3 className="font-bold text-[#3d3d3d] text-lg">Examens assignés</h3>
              {pendingAssignments.length > 0 && (
                <span className="ml-1 bg-[#f05e23]/10 text-[#f05e23] text-xs font-bold px-2 py-0.5 rounded-full">
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
                    className={`bg-[#faf8f5] rounded-2xl border-2 p-5 transition-all ${
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
                          <p className="font-bold text-[#3d3d3d] mt-0.5">{a.exam_label ?? meta.label}</p>
                          {a.note && (
                            <p className="text-sm text-[#888] italic mt-0.5">{a.note}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-[#888]">
                            <span>Assigné le {fmtDate(a.assigned_at)}</span>
                            {a.due_date && (
                              <span className={`flex items-center gap-1 font-semibold ${overdue ? "text-red-500" : "text-[#f05e23]"}`}>
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
                          className="flex items-center gap-2 bg-[#f05e23] hover:bg-[#d85118] font-semibold text-sm text-white px-4 py-2.5 rounded-xl transition-all shrink-0"
                        >
                          <span>Commencer</span>
                          <ArrowRight className="w-4 h-4" />
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
        {assignments.length === 0 && userRole !== "admin" && (
          <section>
            <h3 className="font-bold text-[#3d3d3d] text-lg mb-4">Examens assignés</h3>
            <div className="bg-[#faf8f5] rounded-2xl border border-[#e4ddd1] p-8 text-center">
              <ClipboardList className="w-9 h-9 mx-auto text-[#d7c9b8] mb-3" />
              <p className="text-sm font-semibold text-[#3d3d3d]">Aucun examen assigné pour le moment.</p>
              <p className="text-xs text-[#888] mt-1">Contactez un administrateur pour recevoir une attribution.</p>
            </div>
          </section>
        )}

        {/* ── SUBMISSION HISTORY ── */}
        {submissions.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#f05e23]" />
              <h3 className="font-bold text-[#3d3d3d] text-lg">Historique des soumissions</h3>
              <span className="ml-1 bg-[#f05e23]/10 text-[#f05e23] text-xs font-bold px-2 py-0.5 rounded-full">
                {submissions.length} soumissions
              </span>
            </div>

            <div className="bg-[#faf8f5] rounded-2xl border border-[#e4ddd1] overflow-hidden">
              <div className="divide-y divide-[#e4ddd1]/50">
                {submissions.map((s) => {
                  const meta = EXAM_META[s.exam_type];
                  const Icon = meta.Icon;
                  const ref = s.combinaison_id ? `Combinaison ${s.combinaison_id}`
                    : s.partie_id ? `Partie ${s.partie_id}`
                    : s.serie_id ? `Série ${s.serie_id}` : null;
                  const maxScore = s.exam_type === 'listening' ? 39 : s.exam_type === 'reading' ? 29 : 25;

                  return (
                    <div key={s.id} className="px-5 py-4 hover:bg-[#f3efe6]/60">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg shrink-0 ${meta.bg}`}>
                          <Icon className={`w-4 h-4 ${meta.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-[#3d3d3d] text-sm">{meta.sublabel}</p>
                            {ref && <span className="text-xs text-[#888]">· {ref}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-[#888]">
                            <span>{fmtDate(s.submitted_at)}</span>
                            {fmtTime(s.time_spent_seconds) && <span>⏱ {fmtTime(s.time_spent_seconds)}</span>}
                            {s.exam_type === "writing" && s.word_counts && (
                              <span>
                                {s.word_counts.t1 + s.word_counts.t2 + s.word_counts.t3} mots au total
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {/* Admin score (graded) */}
                          {s.admin_score !== null && s.admin_score !== undefined ? (
                            <span className="text-sm font-bold text-violet-700 bg-violet-50 px-3 py-1 rounded-full">
                              {s.admin_score}/{maxScore}
                            </span>
                          ) : s.score !== null ? (
                            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                              {s.score}/{maxScore}
                            </span>
                          ) : (
                            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                              ⏳ En attente
                            </span>
                          )}
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        </div>
                      </div>
                      {/* Admin feedback */}
                      {s.admin_feedback && (
                        <div className="mt-2 ml-12 bg-violet-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] text-violet-500 font-bold uppercase mb-0.5">💬 Commentaire du professeur</p>
                          <p className="text-xs text-violet-800 leading-relaxed">{s.admin_feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Empty state */}
        {assignments.length === 0 && submissions.length === 0 && userRole !== "admin" && (
          <div className="text-center py-12 text-[#888]">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun examen assigné pour le moment. Contactez votre enseignant.</p>
          </div>
        )}
      </main>
    </div>
  );
}
