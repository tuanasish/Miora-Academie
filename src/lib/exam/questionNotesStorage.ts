/**
 * Ghi chú từng câu khi làm bài (localStorage), cùng khóa với trang exam listening/reading.
 */
export function questionNoteStorageKey(
  examType: "listening" | "reading",
  serieId: number,
  questionId: number
): string {
  return `note:${examType}:${serieId}:${questionId}`;
}

export function loadQuestionNotesFromStorage(
  examType: "listening" | "reading",
  serieId: number
): Record<number, string> {
  if (typeof window === "undefined") return {};
  const next: Record<number, string> = {};
  const prefix = `note:${examType}:${serieId}:`;
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const qId = Number(key.slice(prefix.length));
      if (!Number.isInteger(qId)) continue;
      next[qId] = window.localStorage.getItem(key) ?? "";
    }
  } catch {
    return {};
  }
  return next;
}
