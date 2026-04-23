"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import McqSubmissionReview, { type McqSubmissionReviewProps } from "@/components/exam/McqSubmissionReview";
import { FloatingFlashcardDock } from "@/components/exam/FloatingFlashcardDock";
import { FlashcardCreateModal } from "@/components/flashcards/FlashcardCreateModal";
import { loadQuestionNotesFromStorage } from "@/lib/exam/questionNotesStorage";

type Props = Omit<McqSubmissionReviewProps, "questionNotesById"> & {
  examType: "listening" | "reading";
  serieId: number;
};

/**
 * Trang xem lại bài từ dashboard: ghi chú từ localStorage + dock flashcard nổi.
 */
export default function DashboardSubmissionMcqSection({
  examType,
  serieId,
  ...reviewProps
}: Props) {
  const pathname = usePathname();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [flashOpen, setFlashOpen] = useState(false);

  useEffect(() => {
    setNotes(loadQuestionNotesFromStorage(examType, serieId));
  }, [examType, serieId]);

  return (
    <>
      {/* Layout 2 cột: Bài thi (trái) + Flashcard widget (phải) */}
      <div className="xl:grid xl:grid-cols-[1fr_340px] xl:gap-8 pb-24">
        {/* Cột trái: Bài thi MCQ */}
        <div className="min-w-0">
          <McqSubmissionReview
            {...reviewProps}
            questionNotesById={notes}
          />
        </div>

        {/* Cột phải: Flashcard widget (chỉ hiện trên xl) */}
        <div className="hidden xl:block">
          <div className="sticky top-[120px]">
            <FlashcardCreateModal
              open={true}
              onClose={() => {}}
              hideClose={true}
              context={{ examType, serieId }}
            />
            
            {/* Link chuyển thư viện flashcard */}
            <div className="mt-4 text-center">
               <a href="/dashboard/flashcards" className="inline-flex items-center justify-center gap-2 text-sm text-amber-700 hover:text-amber-800 font-semibold hover:underline">
                 Đi tới Thư viện Flashcards →
               </a>
            </div>
          </div>
        </div>
      </div>

      {/* Nút nổi cho màn hình nhỏ */}
      <div className="xl:hidden">
        <FloatingFlashcardDock onOpenCreate={() => setFlashOpen(true)} returnPathOverride={pathname ?? undefined} />
        {flashOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setFlashOpen(false)} />
            <div className="relative z-10 w-full max-w-sm">
              <FlashcardCreateModal
                open={true}
                onClose={() => setFlashOpen(false)}
                context={{ examType, serieId }}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
