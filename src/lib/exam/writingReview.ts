// ──────────────────────────────────────────────────────
// Writing Review Markup — v1 (editing only) & v2 (editing + suggesting)
// ──────────────────────────────────────────────────────

/** A single teacher suggestion on a student's writing task. */
export interface Suggestion {
  /** Unique identifier (nanoid) */
  id: string;
  /** Type of change */
  type: 'replace' | 'insert' | 'delete';
  /** Original text that was changed (empty string if `insert`) */
  originalText: string;
  /** Teacher-suggested replacement (empty string if `delete`) */
  suggestedText: string;
  /** Current resolution status */
  status: 'pending' | 'accepted' | 'rejected';
  /** ISO 8601 timestamp */
  createdAt: string;
}

export type ReviewMode = 'editing' | 'suggesting';
export type WritingTaskKey = 't1' | 't2' | 't3';

/** Task-level HTML content map. */
export interface WritingTasksHtml {
  t1: string;
  t2: string;
  t3: string;
}

/** Task-level suggestions map. */
export interface WritingTasksSuggestions {
  t1: Suggestion[];
  t2: Suggestion[];
  t3: Suggestion[];
}

// ── v1 (legacy, editing only) ────────────────────────
export interface WritingReviewMarkupV1 {
  version: 1;
  tasks: WritingTasksHtml;
}

// ── v2 (editing + suggesting) ────────────────────────
export interface WritingReviewMarkupV2 {
  version: 2;
  mode: ReviewMode;
  tasks: WritingTasksHtml;
  /** Present only when mode === 'suggesting' */
  suggestions?: WritingTasksSuggestions;
}

/** Union type returned by `parseWritingReviewMarkup`. */
export type WritingReviewMarkup = WritingReviewMarkupV1 | WritingReviewMarkupV2;

// ── Constants ────────────────────────────────────────
const WRITING_REVIEW_PREFIX = '__writing_review_v1__';
const WRITING_REVIEW_V2_PREFIX = '__writing_review_v2__';

// ── HTML helpers ─────────────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Convert raw student plain-text into safe HTML paragraphs
 * suitable for the TipTap editor initial content.
 */
export function plainTextToReviewHtml(text: string | null | undefined): string {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return '<p></p>';

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

// ──────────────────────────────────────────────────────
// Serialize
// ──────────────────────────────────────────────────────

/** Serialize v1 (editing-only) markup — kept for backward compat. */
export function serializeWritingReviewMarkupV1(tasks: WritingTasksHtml): string {
  return `${WRITING_REVIEW_PREFIX}${JSON.stringify({
    version: 1,
    tasks,
  } satisfies WritingReviewMarkupV1)}`;
}

/** Serialize v2 markup (supports both editing and suggesting). */
export function serializeWritingReviewMarkupV2(
  mode: ReviewMode,
  tasks: WritingTasksHtml,
  suggestions?: WritingTasksSuggestions,
): string {
  const payload: WritingReviewMarkupV2 = {
    version: 2,
    mode,
    tasks,
    ...(mode === 'suggesting' && suggestions ? { suggestions } : {}),
  };
  return `${WRITING_REVIEW_V2_PREFIX}${JSON.stringify(payload)}`;
}

/**
 * Smart serializer: picks v1 or v2 automatically.
 *
 * - If mode is 'editing' and there are no suggestions → v1 (smaller payload, backward compat).
 * - Otherwise → v2.
 */
export function serializeWritingReviewMarkup(
  tasks: WritingTasksHtml,
  mode: ReviewMode = 'editing',
  suggestions?: WritingTasksSuggestions,
): string {
  const hasSuggestions =
    suggestions &&
    (suggestions.t1.length > 0 || suggestions.t2.length > 0 || suggestions.t3.length > 0);

  if (mode === 'editing' && !hasSuggestions) {
    return serializeWritingReviewMarkupV1(tasks);
  }

  return serializeWritingReviewMarkupV2(mode, tasks, suggestions);
}

// ──────────────────────────────────────────────────────
// Parse
// ──────────────────────────────────────────────────────

/**
 * Parse a serialized review markup string (supports both v1 and v2).
 * Returns `null` if the string is not a recognised review markup.
 */
export function parseWritingReviewMarkup(
  notes: string | null | undefined,
): WritingReviewMarkup | null {
  if (!notes) return null;

  // ── Try v2 first (more specific prefix) ──
  if (notes.startsWith(WRITING_REVIEW_V2_PREFIX)) {
    try {
      const raw = JSON.parse(notes.slice(WRITING_REVIEW_V2_PREFIX.length)) as Partial<WritingReviewMarkupV2>;
      if (raw.version !== 2 || !raw.tasks) return null;

      const mode: ReviewMode = raw.mode === 'suggesting' ? 'suggesting' : 'editing';

      const result: WritingReviewMarkupV2 = {
        version: 2,
        mode,
        tasks: {
          t1: typeof raw.tasks.t1 === 'string' ? raw.tasks.t1 : '<p></p>',
          t2: typeof raw.tasks.t2 === 'string' ? raw.tasks.t2 : '<p></p>',
          t3: typeof raw.tasks.t3 === 'string' ? raw.tasks.t3 : '<p></p>',
        },
      };

      if (mode === 'suggesting' && raw.suggestions) {
        result.suggestions = {
          t1: Array.isArray(raw.suggestions.t1) ? raw.suggestions.t1 : [],
          t2: Array.isArray(raw.suggestions.t2) ? raw.suggestions.t2 : [],
          t3: Array.isArray(raw.suggestions.t3) ? raw.suggestions.t3 : [],
        };
      }

      return result;
    } catch {
      return null;
    }
  }

  // ── Try v1 (legacy) ──
  if (notes.startsWith(WRITING_REVIEW_PREFIX)) {
    try {
      const raw = JSON.parse(notes.slice(WRITING_REVIEW_PREFIX.length)) as Partial<WritingReviewMarkupV1>;
      if (raw.version !== 1 || !raw.tasks) return null;

      return {
        version: 1,
        tasks: {
          t1: typeof raw.tasks.t1 === 'string' ? raw.tasks.t1 : '<p></p>',
          t2: typeof raw.tasks.t2 === 'string' ? raw.tasks.t2 : '<p></p>',
          t3: typeof raw.tasks.t3 === 'string' ? raw.tasks.t3 : '<p></p>',
        },
      };
    } catch {
      return null;
    }
  }

  return null;
}

// ──────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────

/** Type guard: check if markup is v2. */
export function isV2Markup(markup: WritingReviewMarkup): markup is WritingReviewMarkupV2 {
  return markup.version === 2;
}

/** Get the review mode (defaults to 'editing' for v1). */
export function getReviewMode(markup: WritingReviewMarkup): ReviewMode {
  return isV2Markup(markup) ? markup.mode : 'editing';
}

/** Get suggestions for a specific task (empty array if v1 or no suggestions). */
export function getSuggestionsForTask(
  markup: WritingReviewMarkup,
  taskKey: WritingTaskKey,
): Suggestion[] {
  if (!isV2Markup(markup) || !markup.suggestions) return [];
  return markup.suggestions[taskKey] ?? [];
}

/** Count total pending suggestions across all tasks. */
export function countPendingSuggestions(markup: WritingReviewMarkup): number {
  if (!isV2Markup(markup) || !markup.suggestions) return 0;
  return (
    markup.suggestions.t1.filter((s) => s.status === 'pending').length +
    markup.suggestions.t2.filter((s) => s.status === 'pending').length +
    markup.suggestions.t3.filter((s) => s.status === 'pending').length
  );
}
