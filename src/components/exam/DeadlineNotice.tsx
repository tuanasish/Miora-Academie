import { AlertTriangle } from 'lucide-react';

export default function DeadlineNotice({
  dueDateLabel,
  isOverdue,
}: {
  dueDateLabel: string | null;
  isOverdue: boolean;
}) {
  if (!isOverdue || !dueDateLabel) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="flex items-start gap-2 text-sm text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>
          Bài này đã quá hạn từ <span className="font-semibold">{dueDateLabel}</span>. Bạn vẫn có thể tiếp tục làm và nộp bài.
        </span>
      </p>
    </div>
  );
}
