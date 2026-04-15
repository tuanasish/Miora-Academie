'use client';

interface AssignmentNoteNoticeProps {
  note: string | null | undefined;
}

export default function AssignmentNoteNotice({ note }: AssignmentNoteNoticeProps) {
  const normalized = note?.trim();
  if (!normalized) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5">
      <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap break-words">
        {normalized}
      </p>
    </div>
  );
}
