"use client";
import { useState, useEffect, useCallback } from "react";
import {
  GraduationCap, Plus, Trash2, ShieldCheck, Headphones, BookOpen, PenLine, Mic,
  ClipboardList, Users, FileText, Search, Check, X, ChevronDown, Loader2, Calendar,
  Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────
type ExamType = "listening" | "reading" | "writing" | "speaking";
type Tab = "submissions" | "assignments" | "students";

interface Profile { id: string; email: string; full_name: string | null; role: string; created_at: string; }
interface Assignment {
  id: string; student_email: string; exam_type: ExamType;
  exam_label: string | null; serie_id: number | null;
  combinaison_id: number | null; partie_id: number | null;
  due_date: string | null; note: string | null; assigned_at: string;
}
interface Submission {
  id: string; student_email: string; exam_type: ExamType;
  submitted_at: string; score: number | null; time_spent_seconds: number | null;
  writing_task1: string | null; writing_task2: string | null; writing_task3: string | null;
  word_counts: { t1: number; t2: number; t3: number } | null;
  combinaison_id: number | null; serie_id: number | null; partie_id: number | null;
}

// Data options for assigning specific exams
interface ExamOption { value: string; label: string; examType: ExamType; serie_id?: number; combinaison_id?: number; partie_id?: number; }

const EXAM_ICONS: Record<ExamType, React.ComponentType<{ className?: string }>> = {
  listening: Headphones, reading: BookOpen, writing: PenLine, speaking: Mic,
};
const EXAM_COLORS: Record<ExamType, string> = {
  listening: "bg-blue-100 text-blue-700", reading: "bg-emerald-100 text-emerald-700",
  writing: "bg-violet-100 text-violet-700", speaking: "bg-rose-100 text-rose-700",
};
const EXAM_LABELS: Record<ExamType, string> = {
  listening: "Nghe", reading: "Đọc", writing: "Viết", speaking: "Nói",
};

function fmtTime(sec: number | null) {
  if (!sec) return "—";
  return `${Math.floor(sec / 60)}m${sec % 60}s`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Main component ───────────────────────────────────────────────
export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("submissions");
  const [students, setStudents] = useState<Profile[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [searchStudents, setSearchStudents] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState<ExamType | "all">("all");

  // Assignment form
  const [assignEmail, setAssignEmail] = useState("");
  const [assignType, setAssignType] = useState<ExamType>("writing");
  const [assignLabel, setAssignLabel] = useState("");
  const [assignSerieId, setAssignSerieId] = useState("");
  const [assignCombId, setAssignCombId] = useState("");
  const [assignPartieId, setAssignPartieId] = useState("");
  const [assignDue, setAssignDue] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  // New student
  const [newEmail, setNewEmail] = useState("");
  const [addingStudent, setAddingStudent] = useState(false);

  // Expandable submission
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: subs }, { data: assigns }, { data: { user } }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("exam_submissions").select("*").order("submitted_at", { ascending: false }),
      supabase.from("exam_assignments").select("*").order("assigned_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);
    setStudents((profiles || []).filter((p) => p.role === "student"));
    setSubmissions(subs || []);
    setAssignments(assigns || []);
    setAdminEmail(user?.email ?? "");
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  // ── Handlers ──
  const handleAssign = async () => {
    if (!assignEmail.trim() || !assignLabel.trim()) return;
    setAssigning(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("exam_assignments").insert([{
      student_email: assignEmail.trim(),
      exam_type: assignType,
      exam_label: assignLabel.trim(),
      serie_id: assignSerieId ? Number(assignSerieId) : null,
      combinaison_id: assignCombId ? Number(assignCombId) : null,
      partie_id: assignPartieId ? Number(assignPartieId) : null,
      due_date: assignDue || null,
      note: assignNote || null,
      assigned_by: user?.id,
    }]);
    setAssignEmail(""); setAssignLabel(""); setAssignSerieId("");
    setAssignCombId(""); setAssignPartieId(""); setAssignDue(""); setAssignNote("");
    await load();
    setAssigning(false);
  };

  const deleteAssignment = async (id: string) => {
    await supabase.from("exam_assignments").delete().eq("id", id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const addStudent = async () => {
    if (!newEmail.trim() || !newEmail.includes("@")) return;
    setAddingStudent(true);
    // Try to invite via admin API (if email doesn't exist, they register themselves)
    // For now, insert a placeholder profile — they'll complete via auth
    await supabase.from("profiles").upsert([{ email: newEmail.trim(), role: "student" }], { onConflict: "email" });
    setNewEmail("");
    await load();
    setAddingStudent(false);
  };

  const filteredSubmissions = submissionFilter === "all"
    ? submissions
    : submissions.filter((s) => s.exam_type === submissionFilter);

  const filteredStudents = students.filter((s) =>
    s.email.toLowerCase().includes(searchStudents.toLowerCase()) ||
    (s.full_name || "").toLowerCase().includes(searchStudents.toLowerCase())
  );

  // Group submissions by student
  const subsByStudent = filteredSubmissions.reduce<Record<string, Submission[]>>((acc, s) => {
    if (!acc[s.student_email]) acc[s.student_email] = [];
    acc[s.student_email].push(s);
    return acc;
  }, {});

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Miora Académie</h1>
              <p className="text-xs text-slate-400">Tableau de bord Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            {adminEmail}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {([
            { id: "submissions", label: "Bài nộp", Icon: FileText, count: submissions.length },
            { id: "assignments", label: "Phân công bài", Icon: ClipboardList, count: assignments.length },
            { id: "students", label: "Học viên", Icon: Users, count: students.length },
          ] as const).map(({ id, label, Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ══ TAB: SUBMISSIONS ══ */}
        {tab === "submissions" && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "listening", "reading", "writing", "speaking"] as const).map((f) => {
                const Icon = f !== "all" ? EXAM_ICONS[f] : null;
                return (
                  <button
                    key={f}
                    onClick={() => setSubmissionFilter(f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      submissionFilter === f
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {f === "all" ? "Tất cả" : EXAM_LABELS[f]}
                    <span className="text-[10px] opacity-70">
                      ({f === "all" ? submissions.length : submissions.filter((s) => s.exam_type === f).length})
                    </span>
                  </button>
                );
              })}
            </div>

            {Object.keys(subsByStudent).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                Chưa có bài nộp nào.
              </div>
            ) : (
              Object.entries(subsByStudent).map(([email, subs]) => (
                <div key={email} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {/* Student header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{email}</p>
                        <p className="text-xs text-slate-400">{subs.length} bài đã nộp</p>
                      </div>
                    </div>
                  </div>

                  {/* Submissions list */}
                  <div className="divide-y divide-slate-100">
                    {subs.map((sub) => {
                      const Icon = EXAM_ICONS[sub.exam_type];
                      const isExpanded = expandedSub === sub.id;
                      return (
                        <div key={sub.id}>
                          <div
                            className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 cursor-pointer"
                            onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${EXAM_COLORS[sub.exam_type]}`}>
                                <Icon className="w-3 h-3" />
                                {EXAM_LABELS[sub.exam_type]}
                              </span>
                              <span className="text-xs text-slate-500">
                                {sub.combinaison_id ? `Combinaison ${sub.combinaison_id}` :
                                 sub.serie_id ? `Série ${sub.serie_id}` :
                                 sub.partie_id ? `Partie ${sub.partie_id}` : "—"}
                              </span>
                              <span className="text-xs text-slate-400">{fmtDate(sub.submitted_at)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-slate-400">⏱ {fmtTime(sub.time_spent_seconds)}</span>
                              {sub.score !== null && (
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  {sub.score}/50
                                </span>
                              )}
                              <Eye className={`w-4 h-4 ${isExpanded ? "text-blue-500" : "text-slate-300"}`} />
                            </div>
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && sub.exam_type === "writing" && (
                            <div className="px-5 pb-5 bg-slate-50 border-t border-slate-100">
                              <div className="grid grid-cols-3 gap-3 mt-3">
                                {([
                                  { label: "Tâche 1", text: sub.writing_task1, wc: sub.word_counts?.t1, min: 60 },
                                  { label: "Tâche 2", text: sub.writing_task2, wc: sub.word_counts?.t2, min: 80 },
                                  { label: "Tâche 3", text: sub.writing_task3, wc: sub.word_counts?.t3, min: 120 },
                                ]).map(({ label, text, wc, min }) => (
                                  <div key={label} className="bg-white rounded-xl border border-slate-200 p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-bold text-slate-500">{label}</span>
                                      {wc !== undefined && (
                                        <span className={`text-xs font-bold ${(wc || 0) >= min ? "text-emerald-600" : "text-orange-500"}`}>
                                          {wc} / {min} mots
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-6 whitespace-pre-wrap">
                                      {text || <span className="italic text-slate-300">Trống</span>}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {isExpanded && sub.exam_type === "speaking" && (
                            <div className="px-5 pb-4 pt-3 bg-slate-50 border-t border-slate-100">
                              <p className="text-xs text-slate-500">
                                Partie {sub.partie_id} · Thời gian làm: {fmtTime(sub.time_spent_seconds)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══ TAB: ASSIGNMENTS ══ */}
        {tab === "assignments" && (
          <div className="grid grid-cols-[1fr_380px] gap-6">
            {/* Left: list */}
            <div className="space-y-3">
              <h2 className="font-bold text-slate-900">Bài đã phân công</h2>
              {assignments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                  Chưa có bài phân công nào.
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {assignments.map((a) => {
                      const Icon = EXAM_ICONS[a.exam_type];
                      return (
                        <div key={a.id} className="flex items-start justify-between px-5 py-4 hover:bg-slate-50">
                          <div className="flex items-start gap-3 min-w-0">
                            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${EXAM_COLORS[a.exam_type]}`}>
                              <Icon className="w-3 h-3" />
                              {EXAM_LABELS[a.exam_type]}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{a.student_email}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{a.exam_label}</p>
                              {a.note && <p className="text-xs text-slate-400 italic mt-0.5">{a.note}</p>}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-slate-400">
                                  Phân công: {fmtDate(a.assigned_at)}
                                </span>
                                {a.due_date && (
                                  <span className="text-[10px] text-orange-500 font-semibold flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3" />
                                    Hạn: {a.due_date}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteAssignment(a.id)}
                            className="text-slate-300 hover:text-red-500 transition-colors shrink-0 ml-3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: form */}
            <div className="sticky top-28">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500" />
                  Phân công bài mới
                </h3>

                {/* Email học viên */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Email học viên *</label>
                  <input
                    type="email"
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    placeholder="hocvien@gmail.com"
                    list="student-emails"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <datalist id="student-emails">
                    {students.map((s) => <option key={s.id} value={s.email} />)}
                  </datalist>
                </div>

                {/* Kỹ năng */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Kỹ năng *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["listening", "reading", "writing", "speaking"] as const).map((t) => {
                      const Icon = EXAM_ICONS[t];
                      return (
                        <button
                          key={t}
                          onClick={() => setAssignType(t)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                            assignType === t
                              ? `${EXAM_COLORS[t]} border-current`
                              : "border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {EXAM_LABELS[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tên bài */}
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Tên bài *</label>
                  <input
                    type="text"
                    value={assignLabel}
                    onChange={(e) => setAssignLabel(e.target.value)}
                    placeholder={
                      assignType === "listening" ? "Série 3" :
                      assignType === "reading" ? "Série 12" :
                      assignType === "writing" ? "Combinaison 5 - Mars 2026" :
                      "Partie 3 - Janvier 2025"
                    }
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                {/* ID bài (tùy kỹ năng) */}
                <div className="grid grid-cols-2 gap-2">
                  {(assignType === "listening" || assignType === "reading") && (
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Série ID</label>
                      <input
                        type="number" value={assignSerieId}
                        onChange={(e) => setAssignSerieId(e.target.value)}
                        placeholder="1–40"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  )}
                  {assignType === "writing" && (
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Combinaison ID</label>
                      <input
                        type="number" value={assignCombId}
                        onChange={(e) => setAssignCombId(e.target.value)}
                        placeholder="1–320"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  )}
                  {assignType === "speaking" && (
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-500 block mb-1">Partie ID</label>
                      <input
                        type="number" value={assignPartieId}
                        onChange={(e) => setAssignPartieId(e.target.value)}
                        placeholder="ID partie..."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                  )}
                </div>

                {/* Hạn nộp + ghi chú */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Hạn nộp</label>
                    <input
                      type="date" value={assignDue}
                      onChange={(e) => setAssignDue(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Ghi chú</label>
                    <input
                      type="text" value={assignNote}
                      onChange={(e) => setAssignNote(e.target.value)}
                      placeholder="Tùy chọn..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAssign}
                  disabled={assigning || !assignEmail.trim() || !assignLabel.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {assigning ? "Đang lưu..." : "Phân công"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: STUDENTS ══ */}
        {tab === "students" && (
          <div className="space-y-4">
            {/* Add + search */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchStudents}
                  onChange={(e) => setSearchStudents(e.target.value)}
                  placeholder="Tìm kiếm học viên..."
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                />
              </div>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStudent()}
                placeholder="Thêm email học viên mới..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              />
              <button
                onClick={addStudent}
                disabled={addingStudent}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
              >
                {addingStudent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Thêm
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_120px_80px] px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <span>Học viên</span>
                <span className="text-center">Bài được giao</span>
                <span className="text-center">Bài đã nộp</span>
                <span />
              </div>
              {filteredStudents.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">Không tìm thấy học viên.</div>
              ) : (
                filteredStudents.map((student) => {
                  const studentAssignments = assignments.filter((a) => a.student_email === student.email);
                  const studentSubmissions = submissions.filter((s) => s.student_email === student.email);
                  return (
                    <div
                      key={student.id}
                      className="grid grid-cols-[1fr_120px_120px_80px] px-5 py-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {student.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{student.email}</p>
                          {student.full_name && <p className="text-xs text-slate-400">{student.full_name}</p>}
                          <p className="text-xs text-slate-400">Thêm ngày {fmtDate(student.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        {studentAssignments.length > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 text-sm font-bold rounded-full">
                            {studentAssignments.length}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </div>
                      <div className="text-center">
                        {studentSubmissions.length > 0 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">
                            {studentSubmissions.length}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setTab("assignments"); setAssignEmail(student.email); }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Giao bài
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
