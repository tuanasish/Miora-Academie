'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteSubmission } from '@/app/actions/submission.actions';
import { Trash2, Loader2 } from 'lucide-react';

export function DeleteSubmissionButton({
  id,
  redirectTo,
  className,
}: {
  id: string;
  /** Sau khi xóa, chuyển hướng (ví dụ `/admin/submissions`) thay vì chỉ refresh. */
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      className={
        className ??
        'inline-flex items-center gap-1 text-xs font-semibold text-red-500 transition-colors hover:text-red-700 disabled:opacity-50'
      }
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Xóa bài nộp này? Hành động không thể hoàn tác.')) return;
        setLoading(true);
        try {
          await deleteSubmission(id);
          if (redirectTo) router.push(redirectTo);
          else router.refresh();
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Lỗi xóa bài nộp');
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      Xóa
    </button>
  );
}
