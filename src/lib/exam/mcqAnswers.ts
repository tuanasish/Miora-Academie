/** Map stored letter (A–D) to option index. */
export function letterToIndex(letter: string | undefined | null): number | undefined {
  if (letter == null || typeof letter !== "string") return undefined;
  const u = letter.trim().toUpperCase();
  if (u === "A") return 0;
  if (u === "B") return 1;
  if (u === "C") return 2;
  if (u === "D") return 3;
  return undefined;
}

const LABELS = ["A", "B", "C", "D"] as const;

export function indexToLetter(idx: number): string {
  return LABELS[idx] ?? "?";
}

/** Convert DB `answers` (question id string → letter) to question id → index. */
export function storedAnswersToIndices(
  answers: Record<string, string> | null | undefined,
): Record<number, number> {
  const out: Record<number, number> = {};
  if (!answers) return out;
  for (const [k, v] of Object.entries(answers)) {
    const id = Number(k);
    if (!Number.isFinite(id)) continue;
    const idx = letterToIndex(v);
    if (idx !== undefined) out[id] = idx;
  }
  return out;
}
