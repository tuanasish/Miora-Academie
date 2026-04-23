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
      className="fixed top-1/2 -translate-y-1/2 right-0 z-40 flex flex-col items-center gap-3 bg-white border-y border-l border-amber-200 rounded-l-2xl shadow-[-8px_0_25px_-5px_rgba(217,119,6,0.15)] py-4 px-2"
      aria-label="Flashcards"
    >
      <div className="vertical-text text-amber-800 font-bold text-xs uppercase tracking-widest mb-1" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        Flashcards
      </div>
      
      <div className="w-10 h-[1px] bg-amber-100 my-1"></div>

      <button
        type="button"
        onClick={onOpenCreate}
        title="Tạo flashcard"
        className="pointer-events-auto group relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition-all hover:bg-amber-600 hover:text-white hover:shadow-lg hover:shadow-amber-900/20"
      >
        <BookmarkPlus className="h-5 w-5" strokeWidth={2.25} />
        {/* Tooltip */}
        <span className="absolute right-full mr-3 whitespace-nowrap rounded bg-amber-800 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
          Tạo thẻ mới
          <span className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-4 border-transparent border-l-amber-800"></span>
        </span>
      </button>

      <Link
        href={flashcardsHref}
        title="Xem thư viện flashcards"
        className="pointer-events-auto group relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition-all hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-900/20"
      >
        <Library className="h-5 w-5" strokeWidth={2.25} />
        {/* Tooltip */}
        <span className="absolute right-full mr-3 whitespace-nowrap rounded bg-emerald-700 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
          Thư viện
          <span className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-4 border-transparent border-l-emerald-700"></span>
        </span>
      </Link>
    </div>
  );
}
