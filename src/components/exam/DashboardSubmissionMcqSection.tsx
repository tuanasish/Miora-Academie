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
    <div className="pb-24">
      <McqSubmissionReview
        {...reviewProps}
        questionNotesById={notes}
      />
      <FloatingFlashcardDock onOpenCreate={() => setFlashOpen(true)} returnPathOverride={pathname ?? undefined} />
      <FlashcardCreateModal
        open={flashOpen}
        onClose={() => setFlashOpen(false)}
        context={{ examType, serieId }}
      />
    </div>
  );
}
