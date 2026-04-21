import type { WritingTaskKey } from '@/lib/exam/writingReview';

export type GeminiSuggestionType = 'replace' | 'insert' | 'delete' | 'replace-all';
export type GeminiSeverity = 'low' | 'medium' | 'high';

export interface GeminiWritingSuggestion {
  type: GeminiSuggestionType;
  originalText: string;
  suggestedText: string;
  reason: string;
  severity: GeminiSeverity;
}

interface GeminiCandidatePart {
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiCandidatePart[];
    };
  }>;
}

const DEFAULT_MODEL = process.env.GEMINI_WRITING_MODEL || 'gemini-2.5-pro';
const FALLBACK_MODELS = (process.env.GEMINI_WRITING_FALLBACK_MODELS || 'gemini-2.0-flash')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const MAX_SUGGESTIONS = 15;
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;

function taskLabel(taskKey: WritingTaskKey): string {
  if (taskKey === 't1') return 'Tache 1';
  if (taskKey === 't2') return 'Tache 2';
  return 'Tache 3';
}

function buildPrompt(taskKey: WritingTaskKey, topic: string, text: string): string {
  return [
    'You are a French writing correction assistant for TCF writing tasks.',
    `Target task: ${taskLabel(taskKey)}.`,
    `Task topic/prompt:\n"""\n${topic}\n"""\n`,
    'Return only meaningful corrections for grammar, spelling, word choice, phrasing, and style.',
    `Return at most ${MAX_SUGGESTIONS} suggestions.`,
    'Output STRICT JSON with this shape:',
    '{ "suggestions": [ { "type":"replace|insert|delete|replace-all", "originalText":"...", "suggestedText":"...", "reason":"...", "severity":"low|medium|high" } ] }',
    'Rules:',
    '- Keep originalText and suggestedText short and precise.',
    '- If the student text is mostly gibberish, off-topic, or severely incomplete relative to the topic, return a single suggestion with "type":"replace-all". In this case, "originalText" can be empty, and "suggestedText" should be a full, model response that perfectly answers the topic prompt.',
    '- For type=insert, originalText must be empty.',
    '- For type=delete, suggestedText must be empty.',
    '- For type=replace, both originalText and suggestedText must be non-empty.',
    '- Do not include markdown, explanation, or code fences.',
    '',
    'Student text:',
    text,
  ].join('\n');
}

function normalizeJsonText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith('```')) {
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();
  }
  return trimmed;
}

function isValidSuggestion(value: unknown): value is GeminiWritingSuggestion {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const validType = v.type === 'replace' || v.type === 'insert' || v.type === 'delete' || v.type === 'replace-all';
  const validSeverity = v.severity === 'low' || v.severity === 'medium' || v.severity === 'high';
  if (!validType || !validSeverity) return false;
  if (typeof v.originalText !== 'string' || typeof v.suggestedText !== 'string') return false;
  if (typeof v.reason !== 'string' || !v.reason.trim()) return false;

  if (v.type === 'replace') {
    return v.originalText.trim().length > 0 && v.suggestedText.trim().length > 0;
  }
  if (v.type === 'insert' || v.type === 'replace-all') {
    return v.suggestedText.trim().length > 0; // originalText can be empty
  }
  return v.originalText.trim().length > 0 && v.suggestedText.trim().length === 0;
}

function parseSuggestions(rawText: string): GeminiWritingSuggestion[] {
  const normalized = normalizeJsonText(rawText);
  const parsed = JSON.parse(normalized) as { suggestions?: unknown[] };
  const list = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

  const valid = list
    .filter(isValidSuggestion)
    .map((item) => ({
      type: item.type,
      originalText: item.originalText.trim(),
      suggestedText: item.suggestedText.trim(),
      reason: item.reason.trim(),
      severity: item.severity,
    }))
    .slice(0, MAX_SUGGESTIONS);

  return valid;
}

function isQuotaError(status: number, body: string): boolean {
  if (status !== 429) return false;
  const normalized = body.toLowerCase();
  return (
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit') ||
    normalized.includes('vượt quá hạn ngạch')
  );
}

async function callGeminiOnce(
  model: string,
  taskKey: WritingTaskKey,
  topic: string,
  text: string,
): Promise<GeminiWritingSuggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Thiếu GEMINI_API_KEY');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildPrompt(taskKey, topic, text) }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Gemini API lỗi ${response.status}: ${body}`);
    }

    const data = (await response.json()) as GeminiResponse;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    if (!rawText) return [];
    return parseSuggestions(rawText);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateGeminiWritingSuggestions(
  taskKey: WritingTaskKey,
  topic: string,
  text: string,
): Promise<GeminiWritingSuggestion[]> {
  const normalizedText = text.trim();
  if (!normalizedText) return [];

  const modelCandidates = [DEFAULT_MODEL, ...FALLBACK_MODELS];
  let lastError: unknown = null;

  for (const model of modelCandidates) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await callGeminiOnce(model, taskKey, topic, normalizedText);
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : '';
        const statusMatch = message.match(/Gemini API lỗi (\d+):/);
        const status = statusMatch ? Number(statusMatch[1]) : 0;
        const body = message.split(':').slice(1).join(':').trim();

        // If quota/rate-limit on current model, stop retrying this model and fallback.
        if (isQuotaError(status, body)) {
          break;
        }
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Không thể gọi Gemini');
}
