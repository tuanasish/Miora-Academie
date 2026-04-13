'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteSubmissionsMatching } from '@/app/actions/submission.actions';
import { Trash2, Loader2 } from 'lucide-react';

export interface BulkDeleteSubmissionsButtonProps {
  examType: string;
  studentEmail: string;
  from: string;
  to: string;
  /** Số bản ghi đang hiển thị (ước lượng tối đa theo limit) */
  listCount: number;
  canBulk: boolean;
}

export function BulkDeleteSubmissionsButton({
  examType,
  studentEmail,
  from,
  to,
  listCount,
  canBulk,
}: BulkDeleteSubmissionsButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading || !canBulk}
      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
      onClick={async () => {
        if (!canBulk) {
          alert('Chọn ít nhất học viên hoặc khoảng ngày (từ/đến) để xóa hàng loạt.');
          return;
        }
        if (
          !window.confirm(
            `Xóa mọi bài nộp trong DB khớp bộ lọc hiện tại (đang hiển thị ${listCount} bản ghi; có thể còn bản ghi khác cùng điều kiện)? Hành động không thể hoàn tác.`,
          )
        ) {
          return;
        }
        if (window.prompt('Gõ chính xác XÓA để xác nhận') !== 'XÓA') return;
        setLoading(true);
        try {
          const { deleted } = await deleteSubmissionsMatching({
            student_email: studentEmail || null,
            submitted_from: from || null,
            submitted_to: to || null,
            exam_type: examType === 'all' ? null : examType,
          });
          alert(`Đã xóa ${deleted} bài nộp.`);
          router.refresh();
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Lỗi';
          if (msg === 'FILTER_REQUIRED') {
            alert('Cần ít nhất học viên hoặc khoảng ngày.');
          } else {
            alert(msg);
          }
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Xóa tất cả theo bộ lọc
    </button>
  );
}
