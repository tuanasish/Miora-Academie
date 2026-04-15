"use client";

import { useMemo, useState } from "react";
import { X, Loader2, BookmarkPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FlashcardCreateModal(props: {
  open: boolean;
  onClose: () => void;
  context: {
    examType: "listening" | "reading";
    serieId: number;
  };
}) {
  const { open, onClose, context } = props;
  const [termFr, setTermFr] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSave = termFr.trim().length > 0 && meaningVi.trim().length > 0 && !saving;

  const title = useMemo(() => {
    const label = context.examType === "listening" ? "Compréhension Orale" : "Compréhension Écrite";
    return `${label} — Série ${context.serieId}`;
  }, [context.examType, context.serieId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
              <BookmarkPlus className="w-4 h-4 text-amber-700" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">Tạo flashcard từ vựng</p>
              <p className="text-xs text-slate-500 truncate">{title}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Từ tiếng Pháp</label>
              <input
                value={termFr}
                onChange={(e) => setTermFr(e.target.value)}
                placeholder="VD: accueillir"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nghĩa tiếng Việt</label>
              <input
                value={meaningVi}
                onChange={(e) => setMeaningVi(e.target.value)}
                placeholder="VD: đón tiếp"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}
          </div>

          <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={async () => {
                setSaving(true);
                setError(null);
                try {
                  const supabase = createClient();
                  const { data: auth } = await supabase.auth.getUser();
                  const studentId = auth.user?.id;
                  if (!studentId) throw new Error("Bạn cần đăng nhập lại để lưu flashcard.");

                  const { error: insertError } = await supabase.from("flashcards").insert({
                    student_id: studentId,
                    term_fr: termFr.trim(),
                    meaning_vi: meaningVi.trim(),
                    exam_type: context.examType,
                    serie_id: context.serieId,
                  });
                  if (insertError) throw new Error(insertError.message);

                  setTermFr("");
                  setMeaningVi("");
                  onClose();
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Không thể lưu flashcard lúc này.");
                } finally {
                  setSaving(false);
                }
              }}
              className="ml-auto inline-flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 text-sm font-semibold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
              Lưu flashcard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

