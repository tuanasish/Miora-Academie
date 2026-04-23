"use client";

import { useMemo, useState } from "react";
import { X, Loader2, BookmarkPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FlashcardCreateModal(props: {
  open?: boolean;
  onClose?: () => void;
  hideClose?: boolean;
  context: {
    examType: "listening" | "reading";
    serieId: number;
  };
}) {
  const { open = true, onClose, context, hideClose } = props;
  const [termFr, setTermFr] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSave = termFr.trim().length > 0 && meaningVi.trim().length > 0 && !saving;

  const title = useMemo(() => {
    const label = context.examType === "listening" ? "Compréhension Orale" : "Compréhension Écrite";
    return `${label} — Série ${context.serieId}`;
  }, [context.examType, context.serieId]);

  return (
    <div className="w-full bg-white shadow-sm border border-amber-200 rounded-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-amber-100 bg-[#faf8f5] flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center shadow-sm shrink-0">
          <BookmarkPlus className="w-5 h-5 text-amber-700" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-bold text-lg text-slate-800">Tạo Flashcard</h2>
          <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{title}</p>
        </div>
        {!hideClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-amber-100 text-amber-700 transition-colors"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-5 flex-1">
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Từ tiếng Pháp <span className="text-red-500">*</span>
          </label>
          <textarea
            value={termFr}
            onChange={(e) => setTermFr(e.target.value)}
            placeholder="VD: accueillir..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none transition-all placeholder:text-slate-400"
          />
        </div>
        
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Nghĩa tiếng Việt <span className="text-red-500">*</span>
          </label>
          <textarea
            value={meaningVi}
            onChange={(e) => setMeaningVi(e.target.value)}
            placeholder="VD: đón tiếp..."
            rows={3}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-none resize-none transition-all placeholder:text-slate-400"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center gap-2">
        {!hideClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            disabled={saving}
          >
            Hủy
          </button>
        )}
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
              if (onClose) onClose();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Không thể lưu flashcard lúc này.");
            } finally {
              setSaving(false);
            }
          }}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50 text-white px-5 py-2.5 text-sm font-bold shadow-sm shadow-amber-600/20 transition-all active:scale-95"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />}
          Lưu Flashcard
        </button>
      </div>
    </div>
  );
}

