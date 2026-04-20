// ──────────────────────────────────────────────────────
// Suggestion Helpers — generate, apply, reject
// ──────────────────────────────────────────────────────

import type {
  Suggestion,
  WritingTaskKey,
  WritingReviewMarkupV2,
  WritingTasksSuggestions,
} from './writingReview';

// ── ID Generation ────────────────────────────────────

const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 8;

/** Generate a short unique suggestion ID (8 chars, alphanumeric). */
export function generateSuggestionId(): string {
  let id = '';
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return `sg_${id}`;
}

// ── Create Suggestion ────────────────────────────────

export function createSuggestion(
  type: Suggestion['type'],
  originalText: string,
  suggestedText: string,
): Suggestion {
  return {
    id: generateSuggestionId(),
    type,
    originalText,
    suggestedText,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

// ── HTML Manipulation ────────────────────────────────

/**
 * Data attributes used to mark suggestion spans in HTML.
 *
 * - `data-suggestion-id`:   unique ID linking delete+insert spans
 * - `data-suggestion-type`: 'delete' | 'insert'
 */

const SUGGESTION_DELETE_SELECTOR = 'span[data-suggestion-type="delete"]';
const SUGGESTION_INSERT_SELECTOR = 'span[data-suggestion-type="insert"]';

/**
 * Apply (accept) a single suggestion in the HTML.
 *
 * - For the **delete** span with matching ID → remove the span entirely (text disappears)
 * - For the **insert** span with matching ID → unwrap span, keep the text as normal content
 *
 * @returns Updated HTML string
 */
export function applySuggestionToHtml(html: string, suggestionId: string): string {
  // Remove delete spans (accept = original text goes away)
  let result = html.replace(
    new RegExp(
      `<span[^>]*data-suggestion-id="${escapeRegex(suggestionId)}"[^>]*data-suggestion-type="delete"[^>]*>([\\s\\S]*?)</span>`,
      'gi',
    ),
    '', // delete span removed entirely
  );

  // Unwrap insert spans (accept = suggested text becomes normal)
  result = result.replace(
    new RegExp(
      `<span[^>]*data-suggestion-id="${escapeRegex(suggestionId)}"[^>]*data-suggestion-type="insert"[^>]*>([\\s\\S]*?)</span>`,
      'gi',
    ),
    '$1', // keep inner text, remove span wrapper
  );

  // Also handle attribute order reversed (data-suggestion-type before data-suggestion-id)
  result = result.replace(
    new RegExp(
      `<span[^>]*data-suggestion-type="delete"[^>]*data-suggestion-id="${escapeRegex(suggestionId)}"[^>]*>([\\s\\S]*?)</span>`,
      'gi',
    ),
    '',
  );
  result = result.replace(
    new RegExp(
      `<span[^>]*data-suggestion-type="insert"[^>]*data-suggestion-id="${escapeRegex(suggestionId)}"[^>]*>([\\s\\S]*?)</span>`,
      'gi',
    ),
    '$1',
  );

  return result;
}

/**
 * Reject a single suggestion in the HTML.
 *
 * - For the **delete** span with matching ID → unwrap span, keep original text
 * - For the **insert** span with matching ID → remove the span entirely (suggested text goes away)
 *
 * @returns Updated HTML string
 */
export function rejectSuggestionFromHtml(html: string, suggestionId: string): string {
  // Unwrap delete spans (reject = original text stays)
  let result = html.replace(
    new RegExp(
      `<span[^>]*data-suggestion-id="${escapeRegex(suggestionId)}"[^>]*data-suggestion-type="delete"[^>]*>([\\s\\S]*?)</span>`,
      'gi',
    ),
    '$1', // keep inner text (original), remove span wrapper
  );

  // Remove insert spans (reject = suggested text goes away)
  result = result.replace(
    new RegExp(
      `<span[^>]*data-suggestion-id="${escapeRegex(suggestionId)}"[^>]*data-suggestion-type="insert"[^>]*>([\\s\\S]*?)</span>`,
      'gi',
    ),
    '', // remove entirely
  );

  // Handle reversed attribute order
  result = result.replace(
    new RegExp(
      `<span[^>]*data-suggestion-type="delete"[^>]*data-suggestion-id="${escapeRegex(suggestionId)}"[^>]*>([\\s\\S]*?)</span>`,
      'gi',
    ),
    '$1',
  );
  result = result.replace(
    new RegExp(
      `<span[^>]*data-suggestion-type="insert"[^>]*data-suggestion-id="${escapeRegex(suggestionId)}"[^>]*>([\\s\\S]*?)</span>`,
      'gi',
    ),
    '',
  );

  return result;
}

// ── Bulk Operations ──────────────────────────────────

/**
 * Apply or reject a single suggestion, updating both HTML and suggestion metadata.
 *
 * @returns Updated v2 markup (mutated in-place for convenience)
 */
export function respondToSuggestion(
  markup: WritingReviewMarkupV2,
  taskKey: WritingTaskKey,
  suggestionId: string,
  action: 'accept' | 'reject',
): WritingReviewMarkupV2 {
  if (!markup.suggestions) return markup;

  const suggestions = markup.suggestions[taskKey];
  const idx = suggestions.findIndex((s) => s.id === suggestionId);
  if (idx === -1) return markup;

  // Update suggestion status
  suggestions[idx] = {
    ...suggestions[idx],
    status: action === 'accept' ? 'accepted' : 'rejected',
  };

  // Update task HTML
  markup.tasks[taskKey] =
    action === 'accept'
      ? applySuggestionToHtml(markup.tasks[taskKey], suggestionId)
      : rejectSuggestionFromHtml(markup.tasks[taskKey], suggestionId);

  return markup;
}

/**
 * Apply or reject ALL pending suggestions for a task.
 */
export function respondToAllSuggestions(
  markup: WritingReviewMarkupV2,
  taskKey: WritingTaskKey,
  action: 'accept' | 'reject',
): WritingReviewMarkupV2 {
  if (!markup.suggestions) return markup;

  const pending = markup.suggestions[taskKey].filter((s) => s.status === 'pending');
  for (const suggestion of pending) {
    respondToSuggestion(markup, taskKey, suggestion.id, action);
  }

  return markup;
}

/**
 * Extract all suggestion IDs from an HTML string by scanning data-suggestion-id attributes.
 */
export function extractSuggestionIdsFromHtml(html: string): string[] {
  const ids = new Set<string>();
  const regex = /data-suggestion-id="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    ids.add(match[1]);
  }
  return Array.from(ids);
}

/**
 * Check if any suggestions in the markup are still pending.
 */
export function hasPendingSuggestions(suggestions: WritingTasksSuggestions): boolean {
  return (
    suggestions.t1.some((s) => s.status === 'pending') ||
    suggestions.t2.some((s) => s.status === 'pending') ||
    suggestions.t3.some((s) => s.status === 'pending')
  );
}

// ── Utils ────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
