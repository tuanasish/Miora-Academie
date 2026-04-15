"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trash2, Loader2, BookOpen, ArrowLeft, ChevronLeft, ChevronRight, Shuffle, Plus, Pencil, Check, X, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

type ExamType = "listening" | "reading" | "writing" | "speaking" | null;

interface FlashcardRow {
  id: string;
  term_fr: string;
  meaning_vi: string;
  exam_type: ExamType;
  serie_id: number | null;
  question_id: number | null;
  created_at: string;
}

function examLabel(examType: ExamType) {
  if (examType === "listening") return "Nghe";
  if (examType === "reading") return "Đọc";
  if (examType === "writing") return "Viết";
  if (examType === "speaking") return "Nói";
  return "—";
}

function safeInternalPath(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

/** Nút quay lại trang xem đáp án khi mở flashcards từ correction (query `returnTo`). */
function CorrectionBackButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const back = safeInternalPath(searchParams.get("returnTo"));
  if (!back) return null;
  return (
    <button
      type="button"
      onClick={() => {
        try {
          router.push(back);
        } catch {
          if (typeof window !== "undefined") window.location.href = back;
        }
      }}
      className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900 border border-amber-300 bg-amber-50 rounded-xl px-4 py-2.5 hover:bg-amber-100 transition-colors"
    >
      <ClipboardList className="w-4 h-4 shrink-0" />
      Quay lại xem đáp án
    </button>
  );
}

export default function FlashcardsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<FlashcardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mode, setMode] = useState<"study" | "list">("study");
  const [activeIndex, setActiveIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTermFr, setNewTermFr] = useState("");
  const [newMeaningVi, setNewMeaningVi] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTermFr, setEditTermFr] = useState("");
  const [editMeaningVi, setEditMeaningVi] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const total = rows.length;
  const deck = useMemo(() => {
    if (!shuffled) return rows;
    const copy = [...rows];
    // Fisher–Yates
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [rows, shuffled]);

  const activeCard = deck[activeIndex] ?? null;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const { data, error: qErr } = await supabase
          .from("flashcards")
          .select("id, term_fr, meaning_vi, exam_type, serie_id, question_id, created_at")
          .order("created_at", { ascending: false })
          .limit(500);
        if (qErr) throw new Error(qErr.message);
        if (!cancelled) setRows((data ?? []) as FlashcardRow[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không thể tải flashcards.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Keep study indices sane when deck changes
  useEffect(() => {
    if (deck.length === 0) return;
    setActiveIndex((idx) => Math.max(0, Math.min(idx, deck.length - 1)));
  }, [deck.length]);

  // Auto switch to list mode when empty
  useEffect(() => {
    if (!loading && !error && rows.length === 0) setMode("list");
  }, [loading, error, rows.length]);

  return (
    <div className="min-h-screen bg-[#f3efe6] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Suspense fallback={null}>
            <CorrectionBackButton />
          </Suspense>
          <button
            type="button"
            onClick={() => {
              try {
                router.push("/dashboard");
              } catch {
                if (typeof window !== "undefined") window.location.href = "/dashboard";
              }
            }}
            className="inline-flex items-center gap-2 text-sm text-[#5d5d5d] border border-[#e4ddd1] rounded-xl px-4 py-2.5 hover:bg-[#faf8f5] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <div className="ml-auto text-sm text-[#888]">
            {total} flashcard
          </div>
        </div>

        <div className="bg-[#faf8f5] border border-[#e4ddd1] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-[#3d3d3d]">Flashcards từ vựng</h1>
              <p className="text-sm text-[#888]">Lưu từ tiếng Pháp và nghĩa tiếng Việt để xem lại sau.</p>
            </div>
            <div className="ml-auto flex items-center gap-1 bg-[#ede8dd] rounded-xl p-1">
              <button
                type="button"
                onClick={() => setMode("study")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  mode === "study" ? "bg-white shadow text-[#3d3d3d]" : "text-[#888] hover:text-[#3d3d3d]"
                }`}
              >
                Ôn tập
              </button>
              <button
                type="button"
                onClick={() => setMode("list")}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  mode === "list" ? "bg-white shadow text-[#3d3d3d]" : "text-[#888] hover:text-[#3d3d3d]"
                }`}
              >
                Danh sách
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-[#888]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Đang tải...
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[#888] py-10 text-center">
              Chưa có flashcard nào. Hãy tạo flashcard sau khi nộp bài nghe/đọc.
            </p>
          ) : (
            <>
              {mode === "study" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-sm text-[#888]">
                      Thẻ {activeIndex + 1}/{deck.length}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("list");
                        setAdding(true);
                        setEditingId(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e4ddd1] bg-white px-3 py-2 text-xs font-semibold text-[#5d5d5d] hover:bg-[#f3efe6]"
                      title="Thêm flashcard"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShuffled((v) => !v);
                        setActiveIndex(0);
                        setFlipped(false);
                      }}
                      className={`ml-auto inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                        shuffled
                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                          : "border-[#e4ddd1] bg-white text-[#5d5d5d] hover:bg-[#f3efe6]"
                      }`}
                      title="Trộn thẻ"
                    >
                      <Shuffle className="w-4 h-4" />
                      Trộn
                    </button>
                  </div>

                  <div
                    className="mx-auto w-full max-w-2xl"
                    style={{ perspective: "1200px" }}
                  >
                    <button
                      type="button"
                      onClick={() => setFlipped((v) => !v)}
                      className="w-full text-left"
                      aria-label="Lật thẻ"
                    >
                      <div
                        className="relative w-full h-[240px] sm:h-[280px] rounded-3xl border border-[#e4ddd1] bg-white shadow-sm transition-transform duration-500"
                        style={{
                          transformStyle: "preserve-3d",
                          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                        }}
                      >
                        {/* Front */}
                        <div
                          className="absolute inset-0 p-6 sm:p-8 flex flex-col"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#ede8dd] text-[#888]">
                              {examLabel(activeCard?.exam_type ?? null)}
                              {activeCard?.serie_id ? ` · Série ${activeCard.serie_id}` : ""}
                            </span>
                            <span className="ml-auto text-xs text-[#aaa]">Bấm để lật</span>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <p className="text-center text-3xl sm:text-4xl font-display font-extrabold text-[#3d3d3d] break-words">
                              {activeCard?.term_fr}
                            </p>
                          </div>
                        </div>

                        {/* Back */}
                        <div
                          className="absolute inset-0 p-6 sm:p-8 flex flex-col"
                          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Nghĩa tiếng Việt
                            </span>
                            <span className="ml-auto text-xs text-[#aaa]">Bấm để lật</span>
                          </div>
                          <div className="flex-1 flex items-center justify-center">
                            <p className="text-center text-xl sm:text-2xl font-semibold text-[#3d3d3d] break-words leading-relaxed">
                              {activeCard?.meaning_vi}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveIndex((i) => Math.max(0, i - 1));
                        setFlipped(false);
                      }}
                      disabled={activeIndex === 0}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e4ddd1] bg-white px-4 py-2.5 text-sm font-semibold text-[#5d5d5d] hover:bg-[#f3efe6] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipped((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#f05e23] hover:bg-[#d85118] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Lật thẻ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveIndex((i) => Math.min(deck.length - 1, i + 1));
                        setFlipped(false);
                      }}
                      disabled={activeIndex >= deck.length - 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e4ddd1] bg-white px-4 py-2.5 text-sm font-semibold text-[#5d5d5d] hover:bg-[#f3efe6] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAdding((v) => !v);
                        setEditingId(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-sm font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm flashcard
                    </button>
                    {adding && (
                      <span className="text-xs text-[#888]">Nhập Pháp + Việt rồi bấm “Lưu”.</span>
                    )}
                  </div>

                  {adding && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-amber-900 mb-1">Từ tiếng Pháp</label>
                          <input
                            value={newTermFr}
                            onChange={(e) => setNewTermFr(e.target.value)}
                            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                            placeholder="VD: accueillir"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-amber-900 mb-1">Nghĩa tiếng Việt</label>
                          <input
                            value={newMeaningVi}
                            onChange={(e) => setNewMeaningVi(e.target.value)}
                            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-300"
                            placeholder="VD: đón tiếp"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setAdding(false);
                            setNewTermFr("");
                            setNewMeaningVi("");
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#e4ddd1] bg-white px-3 py-2 text-xs font-semibold text-[#5d5d5d] hover:bg-[#f3efe6]"
                          disabled={savingNew}
                        >
                          <X className="w-4 h-4" />
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const term = newTermFr.trim();
                            const meaning = newMeaningVi.trim();
                            if (!term || !meaning) return;
                            setSavingNew(true);
                            try {
                              const supabase = createClient();
                              const { data: auth } = await supabase.auth.getUser();
                              const studentId = auth.user?.id;
                              if (!studentId) throw new Error("Bạn cần đăng nhập lại để lưu flashcard.");

                              const { data, error: insErr } = await supabase
                                .from("flashcards")
                                .insert({
                                  student_id: studentId,
                                  term_fr: term,
                                  meaning_vi: meaning,
                                  exam_type: null,
                                  serie_id: null,
                                  question_id: null,
                                })
                                .select("id, term_fr, meaning_vi, exam_type, serie_id, question_id, created_at")
                                .maybeSingle();
                              if (insErr) throw new Error(insErr.message);

                              if (data) setRows((prev) => [data as FlashcardRow, ...prev]);
                              setNewTermFr("");
                              setNewMeaningVi("");
                              setAdding(false);
                            } catch (e) {
                              alert(e instanceof Error ? e.message : "Không thể lưu flashcard.");
                            } finally {
                              setSavingNew(false);
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={savingNew || !newTermFr.trim() || !newMeaningVi.trim()}
                        >
                          {savingNew ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Lưu
                        </button>
                      </div>
                    </div>
                  )}

                  {rows.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-[#e4ddd1] bg-white px-5 py-4 flex items-start gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {editingId === r.id ? (
                            <input
                              value={editTermFr}
                              onChange={(e) => setEditTermFr(e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-[#3d3d3d] outline-none focus:ring-2 focus:ring-amber-300"
                            />
                          ) : (
                            <p className="font-semibold text-[#3d3d3d]">{r.term_fr}</p>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#ede8dd] text-[#888]">
                            {examLabel(r.exam_type)}{r.serie_id ? ` · Série ${r.serie_id}` : ""}
                          </span>
                        </div>
                        {editingId === r.id ? (
                          <input
                            value={editMeaningVi}
                            onChange={(e) => setEditMeaningVi(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-[#5d5d5d] outline-none focus:ring-2 focus:ring-amber-300"
                          />
                        ) : (
                          <p className="mt-1 text-sm text-[#5d5d5d]">{r.meaning_vi}</p>
                        )}
                      </div>
                      {editingId === r.id ? (
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditTermFr("");
                              setEditMeaningVi("");
                            }}
                            disabled={savingEdit}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#e4ddd1] bg-white px-3 py-2 text-xs font-semibold text-[#5d5d5d] hover:bg-[#f3efe6] disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const term = editTermFr.trim();
                              const meaning = editMeaningVi.trim();
                              if (!term || !meaning) return;
                              setSavingEdit(true);
                              try {
                                const supabase = createClient();
                                const { error: upErr } = await supabase
                                  .from("flashcards")
                                  .update({ term_fr: term, meaning_vi: meaning })
                                  .eq("id", r.id);
                                if (upErr) throw new Error(upErr.message);
                                setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, term_fr: term, meaning_vi: meaning } : x)));
                                setEditingId(null);
                                setEditTermFr("");
                                setEditMeaningVi("");
                              } catch (e) {
                                alert(e instanceof Error ? e.message : "Không thể cập nhật flashcard.");
                              } finally {
                                setSavingEdit(false);
                              }
                            }}
                            disabled={savingEdit || !editTermFr.trim() || !editMeaningVi.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
                          >
                            {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Lưu
                          </button>
                        </div>
                      ) : (
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAdding(false);
                              setEditingId(r.id);
                              setEditTermFr(r.term_fr);
                              setEditMeaningVi(r.meaning_vi);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            title="Sửa"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Sửa
                          </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setDeletingId(r.id);
                          try {
                            const supabase = createClient();
                            const { error: delErr } = await supabase.from("flashcards").delete().eq("id", r.id);
                            if (delErr) throw new Error(delErr.message);
                            setRows((prev) => prev.filter((x) => x.id !== r.id));
                          } catch (e) {
                            alert(e instanceof Error ? e.message : "Không thể xóa flashcard.");
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                        disabled={deletingId === r.id}
                        className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        title="Xóa"
                      >
                        {deletingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Xóa
                      </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
