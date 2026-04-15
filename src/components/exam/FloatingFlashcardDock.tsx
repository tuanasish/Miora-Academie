"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkPlus, Library } from "lucide-react";

function safeReturnTo(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

/**
 * Nút nhỏ cố định góc phải: tạo flashcard + link xem flashcards (có returnTo để quay lại trang đang xem).
 */
export function FloatingFlashcardDock({
  onOpenCreate,
  returnPathOverride,
}: {
  onOpenCreate: () => void;
  /** Ví dụ `/dashboard/submissions/uuid` — mặc định lấy pathname hiện tại */
  returnPathOverride?: string;
}) {
  const pathname = usePathname();
  const returnTo = useMemo(() => {
    const raw = returnPathOverride ?? pathname ?? "";
    const safe = safeReturnTo(raw);
    return safe ? encodeURIComponent(safe) : "";
  }, [pathname, returnPathOverride]);

  const flashcardsHref = returnTo
    ? `/dashboard/flashcards?returnTo=${returnTo}`
    : "/dashboard/flashcards";

  return (
    <div
      className="fixed bottom-5 right-3 sm:right-5 z-40 flex flex-col gap-2 items-end"
      aria-label="Flashcards"
    >
      <button
        type="button"
        onClick={onOpenCreate}
        title="Tạo flashcard"
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg shadow-amber-900/20 ring-2 ring-white/80 transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <BookmarkPlus className="h-5 w-5" strokeWidth={2.25} />
      </button>
      <Link
        href={flashcardsHref}
        title="Xem flashcards"
        className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 bg-[#fffaf6] text-amber-900 shadow-md transition hover:bg-amber-50"
      >
        <Library className="h-4 w-4" strokeWidth={2} />
      </Link>
    </div>
  );
}
