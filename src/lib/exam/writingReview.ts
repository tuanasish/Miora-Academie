export interface WritingReviewMarkup {
  version: 1;
  tasks: {
    t1: string;
    t2: string;
    t3: string;
  };
}

const WRITING_REVIEW_PREFIX = '__writing_review_v1__';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function plainTextToReviewHtml(text: string | null | undefined): string {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return '<p></p>';

  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

export function serializeWritingReviewMarkup(tasks: WritingReviewMarkup['tasks']): string {
  return `${WRITING_REVIEW_PREFIX}${JSON.stringify({
    version: 1,
    tasks,
  } satisfies WritingReviewMarkup)}`;
}

export function parseWritingReviewMarkup(notes: string | null | undefined): WritingReviewMarkup | null {
  if (!notes || !notes.startsWith(WRITING_REVIEW_PREFIX)) return null;

  try {
    const raw = JSON.parse(notes.slice(WRITING_REVIEW_PREFIX.length)) as Partial<WritingReviewMarkup>;
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
